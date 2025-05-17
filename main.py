# DeepSight : Tamil Nadu Heritage Explorer – Streamlit Frontend

import streamlit as st
import time, os, uuid, hashlib, platform, tempfile
from base64 import b64encode
from typing import Optional, Tuple, List

from streamlit_mic_recorder import mic_recorder
from faster_whisper import WhisperModel
import spacy
from spacy.lang.en.stop_words import STOP_WORDS
from deep_translator import GoogleTranslator
from langdetect import detect
from supabase import create_client, Client
import requests

# ───────────── Splash Screen ─────────────
if "show_splash" not in st.session_state:
    st.session_state.show_splash = True
    st.rerun()

if st.session_state.show_splash:
    with open("b79670153773801.6337d5eced5ab.png", "rb") as img_file:
        img_b64 = b64encode(img_file.read()).decode()
    with open("indian-279735.mp3", "rb") as music_file:
        music_b64 = b64encode(music_file.read()).decode()

    st.markdown(
        f"""
        <style>
            .splash-container {{
                position:fixed;inset:0;
                background:url('data:image/png;base64,{img_b64}') center/cover no-repeat;
                z-index:9999;display:flex;align-items:center;justify-content:center;
            }}
        </style>
        <div class='splash-container'></div>
        <audio autoplay>
            <source src="data:audio/mp3;base64,{music_b64}" type="audio/mp3">
        </audio>
        """,
        unsafe_allow_html=True,
    )
    time.sleep(5)
    st.session_state.show_splash = False
    st.rerun()

# ───────────── Background Styling ─────────────
with open("AdobeStock_866311958_Preview.jpeg", "rb") as bg_file:
    bg_b64 = b64encode(bg_file.read()).decode()

st.markdown(
    f"""
    <style>
        .stApp {{
            background:url("data:image/png;base64,{bg_b64}") center/cover fixed;
            color:#FFF8DC;
        }}
        h1, h2, h3, h4, h5, h6 {{
            color:#592741 !important;
            text-shadow:1px 1px 4px rgba(0,0,0,.7);
        }}
        .stRadio > div {{flex-direction:row !important;gap:1.5rem;}}
        .stButton > button {{
            background:#592741 !important;color:#FFF8DC !important;
            font-weight:bold;border:none;border-radius:10px;
            padding:.6em 1.2em;box-shadow:2px 2px 6px rgba(0,0,0,.3);
        }}
        .stTextInput input {{
            background:rgba(255,255,255,.85) !important;color:#000 !important;
            border:2px solid #592741 !important;border-radius:10px !important;
        }}
        div[data-testid="stAudio"] {{display:none !important;}}
        label,.stRadio label {{font-size:1.15em !important;font-weight:bold;color:#FFFFFF !important;}}
    </style>
    """,
    unsafe_allow_html=True,
)

# ───────────── Supabase Config ─────────────
SUPABASE_URL = "https://kaizyyqozvilngtjbern.supabase.co"  # 🔁 Replace with your URL
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthaXp5eXFvenZpbG5ndGpiZXJuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzM3NDYxOCwiZXhwIjoyMDYyOTUwNjE4fQ.FsdJo4RAbKTbCKpMb03k-G_8DtNUE356wEQjkp5sfR0"                # 🔁 Replace with your key
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ───────────── NLP & Whisper Load ─────────────
nlp = spacy.load("en_core_web_sm")

@st.cache_resource(show_spinner=True)
def load_whisper() -> WhisperModel:
    return WhisperModel("base", device="cpu", compute_type="int8")

whisper_model = load_whisper()

# ───────────── Session Defaults ─────────────
for k, v in {
    "audio_bytes": None,
    "transcript": "",
    "translated": "",
    "input_mode": "Text",
}.items():
    st.session_state.setdefault(k, v)

QUESTION_WORDS = {"what", "how", "when", "where", "why", "which", "who", "whom", "whose"}

# ───────────── Helper Functions ─────────────
def extract_keywords(text: str) -> List[str]:
    doc = nlp(text)
    kws = set()
    for ent in doc.ents:
        if ent.label_ in ("GPE", "ORG", "PERSON", "LOC", "FAC", "EVENT") and ent.text.lower() not in QUESTION_WORDS:
            kws.add(ent.text.strip())
    for chunk in doc.noun_chunks:
        t = chunk.text.strip()
        if len(t) > 2 and t.lower() not in QUESTION_WORDS and t.lower() not in STOP_WORDS:
            kws.add(t)
    return sorted(kws) or [text]

def get_device_id() -> str:
    return hashlib.sha256((platform.platform() + platform.node()).encode()).hexdigest()

def log_search(kws: List[str]) -> str:
    device = get_device_id()
    joined = ", ".join(kws)
    tbl = supabase.table("search_logs")
    prev = tbl.select("*").eq("device_id", device).execute().data
    if prev:
        tbl.update({"history": prev[0]["history"] + ", " + joined}).eq("device_id", device).execute()
        return "✅ Search history updated."
    tbl.insert({"uuid": str(uuid.uuid4()), "device_id": device, "history": joined}).execute()
    return "🆕 New user created and search logged."

def translate(text: str) -> str:
    try:
        return GoogleTranslator(source="auto", target="en").translate(text)
    except Exception:
        return text

def detect_language(text: str) -> str:
    try:
        return detect(text)
    except Exception:
        return "unknown"

def transcribe_bytes(raw: bytes) -> str:
    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
        tmp.write(raw)
        tmp_path = tmp.name
    segments, _ = whisper_model.transcribe(tmp_path, vad_filter=True, beam_size=5)
    os.remove(tmp_path)
    return "".join(s.text for s in segments).strip()

def call_rag_api(query: str, origin: Optional[str] = None, destination: Optional[str] = None) -> Tuple[str, Optional[str]]:
    if not query.strip():
        return "❗ Query is empty. Cannot call backend.", None

    # ⚠️ RAG backend URL is loaded from Streamlit secrets for better security and flexibility
    api_url = st.secrets.get("RAG_API_URL")
    if not api_url:
        return "❌ RAG_API_URL not set in Streamlit secrets.", None

    payload = {
        "query": query.strip(),
        "origin": origin.strip() if origin else None,
        "destination": destination.strip() if destination else None,
    }
    headers = {"Content-Type": "application/json"}

    try:
        response = requests.post(api_url, json=payload, headers=headers, timeout=10)
        response.raise_for_status()
        data = response.json()
        return data.get("answer", "No answer found."), data.get("image_url")
    except requests.exceptions.HTTPError as e:
        return f"❌ RAG API returned HTTP {response.status_code}: {response.text}", None
    except Exception as e:
        return f"❌ Error calling RAG API: {e}", None

# ───────────── UI Logic ─────────────
st.markdown("<h1>DeepSight : Tamil Nadu Heritage Explorer</h1>", unsafe_allow_html=True)

st.session_state.input_mode = st.radio(
    "Choose input mode:", ("Text", "Voice"),
    index=0 if st.session_state.input_mode == "Text" else 1,
)

with st.expander("Optional: distance / route inputs"):
    col1, col2 = st.columns(2)
    origin_input = col1.text_input("Origin (for distance queries)", "")
    dest_input = col2.text_input("Destination", "")

if st.session_state.input_mode == "Text":
    st.session_state.transcript = st.text_input("How Can I Help You ?", value=st.session_state.transcript)
else:
    st.markdown("Click **Start**, speak, then click **Stop** to transcribe.")
    rec = mic_recorder(
        start_prompt="🎙️ Start Recording",
        stop_prompt="⏹️ Stop",
        format="wav",
        just_once=False,
        key="recorder",
    )
    if rec and rec.get("bytes"):
        st.session_state.audio_bytes = rec["bytes"]
        with st.spinner("Transcribing..."):
            st.session_state.transcript = transcribe_bytes(rec["bytes"])
        if st.session_state.transcript:
            with st.spinner("Translating to English..."):
                st.session_state.translated = translate(st.session_state.transcript)
            lang = detect_language(st.session_state.transcript)
            st.success("📝 Transcribed and Translated:")
            st.info(f"**Detected Language:** {lang}")
            st.info(f"**Original Text:** {st.session_state.transcript}")
            st.info(f"**Translated English:** {st.session_state.translated}")

if st.button("Process"):
    text = st.session_state.transcript.strip()
    if not text:
        st.warning("Nothing to process — please enter or record text.")
        st.stop()

    eng = st.session_state.translated or translate(text)
    kws = extract_keywords(eng)
    st.info(f"**Extracted Keywords:** {', '.join(kws)}")
    st.success(log_search(kws))

    with st.spinner("Querying RAG API..."):
        answer, img_url = call_rag_api(eng, origin_input, dest_input)

    st.markdown("### Answer from RAG API:")
    st.write(answer)

    if img_url:
        st.markdown("### Related Image:")
        st.image(img_url, use_column_width=True)

    with st.container():
        recs = supabase.table("search_logs").select("*").limit(10).execute()
        st.markdown("### Recent Searches:")
        if recs.data:
            for r in recs.data:
                st.write(f"- {r['history']}")


