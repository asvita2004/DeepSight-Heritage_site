# backend_api.py

import os
import torch
import requests
import re
import json
import subprocess
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from bs4 import BeautifulSoup
from langgraph.graph import StateGraph, END
from langchain.vectorstores import FAISS
from langchain.embeddings import HuggingFaceEmbeddings
from langchain.schema import Document
from langchain.llms import HuggingFacePipeline
from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline
from peft import PeftModel
from huggingface_hub import login
from langdetect import detect
from deep_translator import GoogleTranslator
import spacy
from difflib import get_close_matches

subprocess.run(["python", "-m", "spacy", "download", "en_core_web_sm"])
nlp = spacy.load("en_core_web_sm")

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

class QueryInput(BaseModel):
    query: str

HUGGINGFACE_LORA_REPO = "Asvita/heritage-lora"
BASE_MODEL_ID = "microsoft/phi-2"
SCRAPE_URL = "https://www.southtourism.in/tamil-nadu-monuments-timings.php"
TIME_KEYWORDS = ["timing", "open", "close", "hours", "opening", "closing", "visiting", "when", "available", "schedule"]
DISTANCE_KEYWORDS = ["how far", "distance", "near", "km", "minutes", "how long", "away", "travel time", "reach", "from here"]
IMAGE_KEYWORDS = ["image", "picture", "photo", "see", "look like", "show me", "view", "visual"]

llm = None
vectorstore = None
rag_docs = None
graph = None

def load_fine_tuned_model():
    tokenizer = AutoTokenizer.from_pretrained(HUGGINGFACE_LORA_REPO, trust_remote_code=True)
    base_model = AutoModelForCausalLM.from_pretrained(
        BASE_MODEL_ID,
        trust_remote_code=True,
        torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
        device_map="auto" if torch.cuda.is_available() else None
    )
    model = PeftModel.from_pretrained(base_model, HUGGINGFACE_LORA_REPO)
    model = model.merge_and_unload()
    pipe = pipeline(
        "text-generation",
        model=model,
        tokenizer=tokenizer,
        max_new_tokens=512,
        do_sample=True,
        temperature=0.3,
        top_p=0.85,
        pad_token_id=tokenizer.eos_token_id
    )
    return HuggingFacePipeline(pipeline=pipe)

def scrape_timings():
    headers = {"User-Agent": "Mozilla/5.0"}
    try:
        response = requests.get(SCRAPE_URL, headers=headers)
        response.raise_for_status()
    except Exception:
        return []
    soup = BeautifulSoup(response.content, "html.parser")
    docs = []
    current_city = ""
    for tag in soup.find_all(["h2", "h3", "table"]):
        if tag.name == "h2" and tag.text.strip() and tag.text.strip()[0].isdigit():
            current_city = tag.text.strip().split(".", 1)[-1].strip()
        elif tag.name == "table":
            rows = tag.find_all("tr")
            if not rows or len(rows) < 2:
                continue
            headers = [th.get_text(strip=True).lower() for th in rows[0].find_all(["td", "th"])]
            for row in rows[1:]:
                cells = row.find_all("td")
                if not cells or len(cells) < len(headers):
                    continue
                data = {headers[i]: cells[i].get_text(strip=True) for i in range(len(headers))}
                monument_name = data.get("place", "Unknown")
                text = (
                    f"{monument_name} in {current_city} - Visiting Hours: {data.get('timing', 'N/A')}, "
                    f"Entrance Fee: {data.get('entrance fee', 'N/A')}, "
                    f"Camera Fee: {data.get('camera fee', 'N/A')}, "
                    f"Video Camera Fee: {data.get('video camera', 'N/A')}"
                )
                docs.append(Document(page_content=text, metadata={"name": monument_name, "location": current_city}))
    return docs

def build_faiss_index(documents):
    embedding_model = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
    return FAISS.from_documents(documents, embedding_model)

def get_image_links(query, num_images=4):
    api_key = os.getenv("SERPAPI_KEY")
    if not api_key:
        return []
    url = f"https://serpapi.com/search.json?q={query}&tbm=isch&ijn=0&api_key={api_key}"
    try:
        response = requests.get(url)
        data = response.json()
        return [img["original"] for img in data.get("images_results", [])[:num_images]]
    except Exception:
        return []

def classify_query(query):
    query = query.lower()
    if any(k in query for k in TIME_KEYWORDS):
        return "time"
    elif any(k in query for k in DISTANCE_KEYWORDS):
        return "distance"
    return "general"

def wants_images(query):
    return any(k in query.lower() for k in IMAGE_KEYWORDS)

def extract_place_name(query):
    doc = nlp(query)
    for ent in doc.ents:
        if ent.label_ in ["GPE", "LOC", "FAC"]:
            return ent.text
    for chunk in doc.noun_chunks:
        if len(chunk.text.split()) <= 3:
            return chunk.text
    return None

def extract_origin_destination(query):
    query_lc = query.lower()
    known_places = [doc.metadata["name"].lower() for doc in rag_docs]
    matches = get_close_matches(query_lc, known_places, n=5, cutoff=0.5)
    places_in_query = [place for place in known_places if place in query_lc]
    places_in_query = list(dict.fromkeys(places_in_query))
    if len(places_in_query) >= 2:
        return places_in_query[0].title(), places_in_query[1].title()
    patterns = [
        r'how.*?to\s+reach\s+(.+?)\s+from\s+(.+)',
        r'distance\s+between\s+(.+?)\s+and\s+(.+)',
        r'(.+?)\s+to\s+(.+?)\s+distance',
        r'how\s+far\s+is\s+(.+?)\s+to\s+(.+)',
        r'(.+?)\s+to\s+(.+)'
    ]
    for pattern in patterns:
        match = re.search(pattern, query_lc)
        if match:
            group1, group2 = match.group(2).strip(), match.group(1).strip()
            return group1.title(), group2.title()
    return None, None

def generate_map_link(place):
    return f"https://www.google.com/maps/search/{place.replace(' ', '+')}"

def generate_direction_link(origin, destination):
    return f"https://www.google.com/maps/dir/{origin.replace(' ', '+')}/{destination.replace(' ', '+')}"

def classify_node(state):
    original_query = state["query"]
    try:
        detected_lang = detect(original_query)
    except Exception:
        detected_lang = "en"
    translated_query = original_query if detected_lang == "en" else GoogleTranslator(source='auto', target='en').translate(original_query)
    state.update({
        "query": translated_query,
        "original_language": detected_lang,
        "route": classify_query(translated_query),
        "needs_images": wants_images(translated_query)
    })
    return state

def rag_node(state):
    query = state['query']
    results = vectorstore.similarity_search(query, k=3)
    if not results:
        state['route'] = 'general'
        return state
    content = results[0].page_content
    parts = [p.strip() for p in content.split(",")]
    for p in parts:
        if any(k in p.lower() for k in TIME_KEYWORDS):
            place = content.split(" in ")[0]
            state['response'] = f"{place} - {p}"
            state.pop("route", None)
            return state
    state['route'] = 'general'
    return state

def distance_node(state):
    query = state["query"]
    origin, destination = extract_origin_destination(query)
    original_lang = state.get("original_language", "en")
    if origin and destination:
        map_link = generate_direction_link(origin, destination)
        base_text = f"Here is the direction map from {origin} to {destination}:"
    else:
        place = extract_place_name(query)
        if place:
            map_link = generate_map_link(place)
            base_text = "Here is the Google Maps link:"
        else:
            state["response"] = "Sorry, I couldn't find the place."
            return state
    translated_text = GoogleTranslator(source='en', target=original_lang).translate(base_text) if original_lang != "en" else base_text
    state["response"] = f"{translated_text} {map_link}"
    return state

def infer_instruction(query):
    q = query.lower()
    if any(x in q for x in ["when", "built", "origin", "history"]):
        return "Provide historical information about a heritage site."
    if any(x in q for x in ["architecture", "features", "style", "design"]):
        return "Describe architectural features of a heritage site."
    if any(x in q for x in ["significance", "religious", "culture", "spiritual"]):
        return "Explain the religious and cultural significance of a heritage site."
    if any(x in q for x in ["near", "around", "close to"]):
        return "List nearby heritage sites worth visiting."
    if any(x in q for x in ["travel", "how to reach", "when to visit"]):
        return "Provide travel tips for visiting a heritage site."
    if any(x in q for x in ["famous", "must visit", "top"]):
        return "Suggest popular or must-visit heritage sites."
    return "Provide historical information about a heritage site."

def llm_node(state):
    query = state.get("query", "")
    instruction = infer_instruction(query)
    prompt = f"Instruction: {instruction}\nInput: {query}\nResponse:"
    outputs = llm.pipeline(prompt)
    generated_text = outputs[0].get("generated_text", "") if isinstance(outputs, list) else str(outputs)
    if generated_text.startswith(prompt):
        generated_text = generated_text[len(prompt):].strip()
    text_part = generated_text
    image_links = get_image_links(extract_place_name(query) or query) if state.get("needs_images") else []
    original_lang = state.get("original_language", "en")
    translated_text = GoogleTranslator(source='en', target=original_lang).translate(text_part) if original_lang != "en" else text_part
    image_md = "\n\n".join([f"![Image]({url})" for url in image_links])
    state["response"] = translated_text + ("\n\n" + image_md if image_md else "")
    return state

def build_langgraph():
    graph_builder = StateGraph(dict)
    graph_builder.add_node("classify", classify_node)
    graph_builder.add_node("rag", rag_node)
    graph_builder.add_node("distance", distance_node)
    graph_builder.add_node("llm", llm_node)
    graph_builder.set_entry_point("classify")
    graph_builder.add_conditional_edges("classify", lambda s: s["route"], {
        "time": "rag",
        "distance": "distance",
        "general": "llm"
    })
    graph_builder.add_conditional_edges("rag", lambda s: s.get("route"), {
        "general": "llm",
        None: END
    })
    graph_builder.add_edge("rag", END)
    graph_builder.add_edge("distance", END)
    graph_builder.add_edge("llm", END)
    return graph_builder.compile()

@app.on_event("startup")
async def startup_event():
    global llm, rag_docs, vectorstore, graph
    HF_TOKEN = os.getenv("HF_TOKEN")
    login(token=HF_TOKEN)
    llm = load_fine_tuned_model()
    rag_docs = scrape_timings()
    vectorstore = build_faiss_index(rag_docs)
    graph = build_langgraph()

@app.post("/query")
async def query_handler(data: QueryInput):
    inputs = {"query": data.query}
    result = graph.invoke(inputs)
    return {"response": result.get("response", "Sorry, I couldn't generate a response.")}
