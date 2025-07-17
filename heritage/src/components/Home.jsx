



import React, { useState, useEffect, useRef } from 'react';
import SidebarImageOverlay from './SidebarImageOverlay';
import './style.css';
import CanvasCursorComponent from './CanvasCursorComponent';
import RightSidebar from './RightSidebar';
import Tour from './Tour';

// LibreTranslate supported languages
const libreTranslateLanguages = [
  { code: 'en', name: 'English' },
  { code: 'ar', name: 'Arabic' },
  { code: 'az', name: 'Azerbaijani' },
  { code: 'zh', name: 'Chinese' },
  { code: 'cs', name: 'Czech' },
  { code: 'nl', name: 'Dutch' },
  { code: 'eo', name: 'Esperanto' },
  { code: 'fi', name: 'Finnish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'el', name: 'Greek' },
  { code: 'he', name: 'Hebrew' },
  { code: 'hi', name: 'Hindi' },
  { code: 'hu', name: 'Hungarian' },
  { code: 'id', name: 'Indonesian' },
  { code: 'ga', name: 'Irish' },
  { code: 'it', name: 'Italian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'fa', name: 'Persian' },
  { code: 'pl', name: 'Polish' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'sk', name: 'Slovak' },
  { code: 'es', name: 'Spanish' },
  { code: 'sv', name: 'Swedish' },
  { code: 'tr', name: 'Turkish' },
  { code: 'uk', name: 'Ukrainian' },
];

// Default English text for translation
const defaultTexts = {
  welcome: 'DeepSight: TamilNadu Heritage Explorer',
  experience: 'Experience the Beauty of Heritage',
  searchPlaceholder: 'Ask Anything...',
  userId: 'User ID',
  language: 'Language',
  startTour: 'Start Tour',
  clearChat: 'Clear Chat',
};

// localStorage utility functions
const saveConversationToStorage = (conversations) => {
  const userConvo = conversations.map(msg => ({
    query: msg.type === 'user' ? msg.content : '',
    response: msg.type === 'bot' ? msg.content : '',
    timeStamp: msg.timestamp,
    type: msg.type
  })).filter(item => item.query || item.response);

  // Keep only last 20 conversations
  const limitedConvo = userConvo.slice(-20);
  localStorage.setItem('userConvo', JSON.stringify(limitedConvo));
};

const loadConversationFromStorage = () => {
  try {
    const stored = localStorage.getItem('userConvo');
    if (stored) {
      const userConvo = JSON.parse(stored);
      return userConvo.map((item, index) => ({
        id: Date.now() + index,
        type: item.type,
        content: item.query || item.response,
        timestamp: item.timeStamp
      }));
    }
  } catch (error) {
    console.error('Error loading conversations:', error);
  }
  return [];
};

const API_BASE = import.meta.env.VITE_API_ENDPOINT;
const TRANSLATE_API = 'http://127.0.0.1:5000/translate';
const defaultResponse = "Hi there! 😊\nHow can I assist you today?";

// Google Maps Component
const GoogleMapsEmbed = ({ url }) => {
  const getEmbedUrl = (googleMapsUrl) => {
    try {
      // Handle different Google Maps URL formats
      if (googleMapsUrl.includes('/dir/')) {
        // Direction URLs
        const match = googleMapsUrl.match(/\/dir\/([^/]+)\/([^/?]+)/);
        if (match) {
          const origin = encodeURIComponent(match[1]);
          const destination = encodeURIComponent(match[2]);
          return `https://www.google.com/maps/embed/v1/directions?key=AIzaSyAOVYRIgupAurZup5y1PRh8Ismb1A3lLao&origin=${origin}&destination=${destination}&mode=driving`;
        }
      } else if (googleMapsUrl.includes('/@')) {
        // Location URLs with coordinates
        const coordMatch = googleMapsUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
        if (coordMatch) {
          const lat = coordMatch[1];
          const lng = coordMatch[2];
          return `https://www.google.com/maps/embed/v1/view?key=AIzaSyAOVYRIgupAurZup5y1PRh8Ismb1A3lLao&center=${lat},${lng}&zoom=15`;
        }
      } else if (googleMapsUrl.includes('/place/')) {
        // Place URLs
        const placeMatch = googleMapsUrl.match(/\/place\/([^/@]+)/);
        if (placeMatch) {
          const place = encodeURIComponent(placeMatch[1]);
          return `https://www.google.com/maps/embed/v1/place?key=AIzaSyAOVYRIgupAurZup5y1PRh8Ismb1A3lLao&q=${place}`;
        }
      }
      
      // Fallback: Try to extract query parameters or use the URL as is
      return googleMapsUrl.replace('www.google.com/maps', 'www.google.com/maps/embed');
    } catch (error) {
      console.error('Error processing Google Maps URL:', error);
      return null;
    }
  };

  const embedUrl = getEmbedUrl(url);

  if (!embedUrl) {
    return (
      <div className="map-fallback">
        <a href={url} target="_blank" rel="noopener noreferrer" className="map-link">
          🗺️ Open in Google Maps
        </a>
      </div>
    );
  }

  return (
    <div className="google-maps-container">
      <iframe
        src={embedUrl}
        width="100%"
        height="300"
        style={{ border: 0, borderRadius: '12px' }}
        allowFullScreen=""
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title="Google Maps"
        onError={() => {
          // Fallback if iframe fails to load
          const container = document.querySelector('.google-maps-container');
          if (container) {
            container.innerHTML = `
              <div class="map-fallback">
                <a href="${url}" target="_blank" rel="noopener noreferrer" class="map-link">
                  🗺️ Open in Google Maps
                </a>
              </div>
            `;
          }
        }}
      />
      <div className="map-actions">
        <a href={url} target="_blank" rel="noopener noreferrer" className="map-link-small">
          Open in Google Maps →
        </a>
      </div>
    </div>
  );
};

// Image Modal Component
const ImageModal = ({ image, isOpen, onClose, images, currentIndex, onNavigate }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
        onNavigate(currentIndex - 1);
      } else if (e.key === 'ArrowRight' && currentIndex < images.length - 1) {
        onNavigate(currentIndex + 1);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, images.length, onClose, onNavigate]);

  if (!isOpen || !image) return null;

  return (
    <div className="image-modal-overlay" onClick={onClose}>
      <div className="image-modal-container" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        
        {images.length > 1 && (
          <>
            <button 
              className="modal-nav prev" 
              onClick={() => onNavigate(currentIndex - 1)}
              disabled={currentIndex === 0}
            >
              ‹
            </button>
            <button 
              className="modal-nav next" 
              onClick={() => onNavigate(currentIndex + 1)}
              disabled={currentIndex === images.length - 1}
            >
              ›
            </button>
          </>
        )}
        
        <img 
          src={image} 
          alt="Preview" 
          className="modal-image"
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
        
        {images.length > 1 && (
          <div className="modal-counter">
            {currentIndex + 1} / {images.length}
          </div>
        )}
      </div>
    </div>
  );
};

// Image Collage Component
const ImageCollage = ({ images, onImageClick }) => {
  if (!images || images.length === 0) return null;

  const handleImageError = (e) => {
    e.target.style.display = 'none';
  };

  const renderCollage = () => {
    const imageCount = images.length;
    
    if (imageCount === 1) {
      return (
        <div className="collage-single">
          <img 
            src={images[0]} 
            alt="Heritage"
            onClick={() => onImageClick(images[0], 0)}
            onError={handleImageError}
          />
        </div>
      );
    }
    
    if (imageCount === 2) {
      return (
        <div className="collage-double">
          {images.map((img, index) => (
            <img 
              key={index}
              src={img} 
              alt="Heritage"
              onClick={() => onImageClick(img, index)}
              onError={handleImageError}
            />
          ))}
        </div>
      );
    }
    
    if (imageCount === 3) {
      return (
        <div className="collage-triple">
          <div className="collage-main">
            <img 
              src={images[0]} 
              alt="Heritage"
              onClick={() => onImageClick(images[0], 0)}
              onError={handleImageError}
            />
          </div>
          <div className="collage-side">
            {images.slice(1, 3).map((img, index) => (
              <img 
                key={index + 1}
                src={img} 
                alt="Heritage"
                onClick={() => onImageClick(img, index + 1)}
                onError={handleImageError}
              />
            ))}
          </div>
        </div>
      );
    }
    
    if (imageCount >= 4) {
      return (
        <div className="collage-quad">
          <div className="collage-main">
            <img 
              src={images[0]} 
              alt="Heritage"
              onClick={() => onImageClick(images[0], 0)}
              onError={handleImageError}
            />
          </div>
          <div className="collage-grid">
            {images.slice(1, 4).map((img, index) => (
              <img 
                key={index + 1}
                src={img} 
                alt="Heritage"
                onClick={() => onImageClick(img, index + 1)}
                onError={handleImageError}
              />
            ))}
            {imageCount > 4 && (
              <div 
                className="collage-more"
                onClick={() => onImageClick(images[3], 3)}
              >
                <img 
                  src={images[3]} 
                  alt="Heritage"
                  onError={handleImageError}
                />
                <div className="more-overlay">+{imageCount - 4}</div>
              </div>
            )}
          </div>
        </div>
      );
    }
  };

  return (
    <div className="image-collage">
      {renderCollage()}
    </div>
  );
};

// Message Content Component
const MessageContent = ({ content, onImageClick }) => {
  const parseContent = (text) => {
    const imageRegex = /!\[Image\]\((https?:\/\/[^\s\)]+)\)/g;
    const googleMapsRegex = /(https:\/\/www\.google\.com\/maps\/[^\s]+)/g;
    
    const images = [];
    const maps = [];
    let match;
    
    // Extract images
    while ((match = imageRegex.exec(text)) !== null) {
      images.push(match[1]);
    }
    
    // Extract Google Maps URLs
    while ((match = googleMapsRegex.exec(text)) !== null) {
      maps.push(match[1]);
    }
    
    // Remove images and maps from text
    let textWithoutImagesAndMaps = text
      .replace(imageRegex, '')
      .replace(googleMapsRegex, '')
      .trim();
    
    return { text: textWithoutImagesAndMaps, images, maps };
  };

  const { text, images, maps } = parseContent(content);

  return (
    <div className="message-content-wrapper">
      {text && (
        <div className="message-text">
          {text}
        </div>
      )}
      {maps.length > 0 && (
        <div className="maps-container">
          {maps.map((mapUrl, index) => (
            <GoogleMapsEmbed key={index} url={mapUrl} />
          ))}
        </div>
      )}
      {images.length > 0 && (
        <ImageCollage 
          images={images} 
          onImageClick={onImageClick}
        />
      )}
    </div>
  );
};

// Info Modal Component for Hotels, Restaurants, Currency
const InfoModal = ({ isOpen, onClose, title, items, type }) => {
  if (!isOpen) return null;

  const renderContent = () => {
    if (type === 'currency') {
      return (
        <div className="currency-info">
          <div className="currency-rate">
            <h3>💱 Currency Information</h3>
            <p>{items}</p>
          </div>
        </div>
      );
    }

    if (type === 'hotels' || type === 'restaurants') {
      return (
        <div className="links-list">
          <h3>{type === 'hotels' ? '🏨 Hotels Nearby' : '🍽️ Restaurants Nearby'}</h3>
          {items && items.length > 0 ? (
            <ul>
              {items.map((link, index) => (
                <li key={index}>
                  <a href={link} target="_blank" rel="noopener noreferrer">
                    {type === 'hotels' ? `Hotel Option ${index + 1}` : `Restaurant Option ${index + 1}`}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p>No {type} information available.</p>
          )}
        </div>
      );
    }
  };

  return (
    <div className="info-modal-overlay" onClick={onClose}>
      <div className="info-modal-container" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        <div className="info-modal-content">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

// Enhanced Message Content Component with Action Buttons
const EnhancedMessageContent = ({ content, responseData, onImageClick, onInfoClick, messageId, onSpeak, speakingMessageId }) => {
  const parseContent = (text) => {
    const imageRegex = /!\[Image\]\((https?:\/\/[^\s\)]+)\)/g;
    const googleMapsRegex = /(https:\/\/www\.google\.com\/maps\/[^\s]+)/g;
    
    const images = [];
    const maps = [];
    let match;
    
    // Extract images
    while ((match = imageRegex.exec(text)) !== null) {
      images.push(match[1]);
    }
    
    // Extract Google Maps URLs
    while ((match = googleMapsRegex.exec(text)) !== null) {
      maps.push(match[1]);
    }
    
    // Remove images and maps from text
    let textWithoutImagesAndMaps = text
      .replace(imageRegex, '')
      .replace(googleMapsRegex, '')
      .trim();
    
    return { text: textWithoutImagesAndMaps, images, maps };
  };

  // Check if we have structured response data
  const hasStructuredData = responseData && (
    responseData.hotels?.length > 0 || 
    responseData.restaurants?.length > 0 || 
    responseData.currency_note
  );

  // Use structured data if available, otherwise parse content
  let displayData;
  if (responseData) {
    displayData = {
      text: responseData.response || content,
      images: responseData.images || [],
      maps: responseData.map_link ? [responseData.map_link] : []
    };
  } else {
    displayData = parseContent(content);
  }

  const { text, images, maps } = displayData;

  return (
    <div className="message-content-wrapper">
      {/* Title from structured data */}
      {responseData && responseData.nouns && responseData.nouns.length > 0 && (
        <div className="message-title">
          <h3>{responseData.nouns[0]}</h3>
        </div>
      )}
      
      {text && (
        <div className="message-text">
          {text}
        </div>
      )}
      
      {maps.length > 0 && (
        <div className="maps-container">
          {maps.map((mapUrl, index) => (
            <GoogleMapsEmbed key={index} url={mapUrl} />
          ))}
        </div>
      )}
      
      {images.length > 0 && (
        <ImageCollage 
          images={images} 
          onImageClick={onImageClick}
        />
      )}

      {/* Speaker Button */}
      <div className="message-actions">
        <button 
          className={`speaker-btn ${speakingMessageId === messageId ? 'speaking' : ''}`}
          onClick={() => onSpeak(messageId, content, responseData)}
          title={speakingMessageId === messageId ? "Stop Reading" : "Read Aloud"}
        >
          {speakingMessageId === messageId ? '🔇' : '🔊'}
        </button>
      </div>

      {/* Action Buttons for structured data */}
      {hasStructuredData && (
        <div className="action-buttons">
          {responseData.hotels && responseData.hotels.length > 0 && (
            <button 
              className="action-btn hotels-btn"
              onClick={() => onInfoClick('hotels', responseData.hotels, 'Hotels')}
            >
              🏨 Hotels
            </button>
          )}
          
          {responseData.restaurants && responseData.restaurants.length > 0 && (
            <button 
              className="action-btn restaurants-btn"
              onClick={() => onInfoClick('restaurants', responseData.restaurants, 'Restaurants')}
            >
              🍽️ Restaurants
            </button>
          )}
          
          {responseData.currency_note && (
            <button 
              className="action-btn currency-btn"
              onClick={() => onInfoClick('currency', responseData.currency_note, 'Currency')}
            >
              💱 Currency
            </button>
          )}
        </div>
      )}
    </div>
  );
};
const Home = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [language, setLanguage] = useState('en');
  const [searchInput, setSearchInput] = useState('');
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
//   const [conversations, setConversations] = useState([]);
  const [conversations, setConversations] = useState(loadConversationFromStorage());
  const [isLoading, setIsLoading] = useState(false);
  const [modalImage, setModalImage] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalImages, setModalImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [translatedTexts, setTranslatedTexts] = useState(defaultTexts);
  const [isTranslating, setIsTranslating] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef(null);

  const [speakingMessageId, setSpeakingMessageId] = useState(null);
  const [speechSynthesis, setSpeechSynthesis] = useState(null);


  useEffect(() => {
    // Initialize speech synthesis
    if ('speechSynthesis' in window) {
      setSpeechSynthesis(window.speechSynthesis);
    }
    
    // Cleanup function to stop any ongoing speech when component unmounts
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const getSpeechLanguage = (langCode) => {
  const langMap = {
    'ar': 'ar-SA',
    'az': 'az-AZ', 
    'zh': 'zh-CN',
    'cs': 'cs-CZ',
    'nl': 'nl-NL',
    'eo': 'en-US', // Esperanto fallback to English
    'fi': 'fi-FI',
    'fr': 'fr-FR',
    'de': 'de-DE',
    'el': 'el-GR',
    'he': 'he-IL',
    'hi': 'hi-IN',
    'hu': 'hu-HU',
    'id': 'id-ID',
    'ga': 'en-IE', // Irish fallback to English-Ireland
    'it': 'it-IT',
    'ja': 'ja-JP',
    'ko': 'ko-KR',
    'fa': 'fa-IR',
    'pl': 'pl-PL',
    'pt': 'pt-PT',
    'ru': 'ru-RU',
    'sk': 'sk-SK',
    'es': 'es-ES',
    'sv': 'sv-SE',
    'tr': 'tr-TR',
    'uk': 'uk-UA',
    'en': 'en-US'
  };
  return langMap[langCode] || 'en-US';
};

const handleSpeakMessage = (messageId, content, responseData) => {
  // Stop any ongoing speech
  if (speechSynthesis) {
    speechSynthesis.cancel();
  }

  // If already speaking this message, stop it
  if (speakingMessageId === messageId) {
    setSpeakingMessageId(null);
    return;
  }

  // Extract text content (remove markdown images and maps)
  let textToSpeak = content;
  if (responseData) {
    textToSpeak = responseData.response || content;
  }
  
  // Clean up the text (remove image markdown and map URLs)
  textToSpeak = textToSpeak
    .replace(/!\[Image\]\([^)]+\)/g, '') // Remove image markdown
    .replace(/https:\/\/www\.google\.com\/maps\/[^\s]+/g, '') // Remove map URLs
    .trim();

  if (!textToSpeak) return;

  const utterance = new SpeechSynthesisUtterance(textToSpeak);
  utterance.lang = getSpeechLanguage(language);
  utterance.rate = 0.9;
  utterance.pitch = 1;
  utterance.volume = 1;

  utterance.onstart = () => {
    setSpeakingMessageId(messageId);
  };

  utterance.onend = () => {
    setSpeakingMessageId(null);
  };

  utterance.onerror = (event) => {
    console.error('Speech synthesis error:', event.error);
    setSpeakingMessageId(null);
  };

  speechSynthesis.speak(utterance);
};


  const [infoModal, setInfoModal] = useState({
  isOpen: false,
  type: '',
  title: '',
  items: null
});



// Add this function after your existing functions in the Home component:

const handleInfoClick = (type, items, title) => {
  setInfoModal({
    isOpen: true,
    type,
    title,
    items
  });
};

const closeInfoModal = () => {
  setInfoModal({
    isOpen: false,
    type: '',
    title: '',
    items: null
  });
};

const generateSuggestions = (responseData, translatedTexts) => {
  if (!responseData || responseData.category !== 'general') {
    return [];
  }

  const baseSuggestions = [
    { text: 'Do you want directions?', icon: '🗺️', query: 'directions' },
    { text: 'Do you want timing information?', icon: '⏰', query: 'timing' },
    { text: 'Do you want more images?', icon: '📸', query: 'images' },
    { text: 'Tell me about nearby places', icon: '📍', query: 'nearby places' },
    { text: 'What is the history?', icon: '📜', query: 'history' }
  ];

  // If we have nouns from the response, make suggestions more specific
  if (responseData.nouns && responseData.nouns.length > 0) {
    const placeName = responseData.nouns[0];
    return baseSuggestions.map(suggestion => ({
      ...suggestion,
      text: suggestion.text.includes('?') 
        ? suggestion.text.replace('?', ` for ${placeName}?`)
        : `${suggestion.text} of ${placeName}`,
      query: `${suggestion.query} ${placeName}`
    }));
  }

  return baseSuggestions;
};

const handleSuggestionClick = (suggestionQuery) => {
  setSearchInput(suggestionQuery);
  setShowSuggestions(false);
  handleSearchSubmit(suggestionQuery);
};

  
  // Tour state
  const [isTourActive, setIsTourActive] = useState(false);

  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Translation function
const translateText = async (text, targetLanguage) => {
  if (targetLanguage === 'en' || !text.trim()) return text; // No translation needed for English or empty text
  
  try {
    const response = await fetch('http://127.0.0.1:5000/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: text,
        source: 'en',
        target: targetLanguage,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.translatedText || text;
  } catch (error) {
    console.error('Translation error:', error);
    return text; // Return original text if translation fails
  }
};

  // Translate all UI texts
const translateUITexts = async (targetLanguage) => {
  if (targetLanguage === 'en') {
    setTranslatedTexts(defaultTexts);
    return;
  }

  setIsTranslating(true);
  try {
    const translatedTexts = {};
    
    // Translate each UI text
    for (const key in defaultTexts) {
      translatedTexts[key] = await translateText(defaultTexts[key], targetLanguage);
    }
    
    setTranslatedTexts(translatedTexts);

    // Translate existing conversations
    if (conversations.length > 0) {
      const translatedConversations = await Promise.all(
        conversations.map(async (conversation) => {
          if (conversation.type === 'bot') {
            // Extract text content without images and maps for translation
            let textToTranslate = conversation.content;
            if (conversation.responseData && conversation.responseData.response) {
              textToTranslate = conversation.responseData.response;
            }
            
            // Clean up text for translation
            textToTranslate = textToTranslate
              .replace(/!\[Image\]\([^)]+\)/g, '') // Remove image markdown
              .replace(/https:\/\/www\.google\.com\/maps\/[^\s]+/g, '') // Remove map URLs
              .trim();

            const translatedContent = await translateText(textToTranslate, targetLanguage);
            
            // Reconstruct the content with images and maps
            let fullTranslatedContent = translatedContent;
            
            // Re-add images and maps from original content
            if (conversation.responseData) {
              if (conversation.responseData.images && conversation.responseData.images.length > 0) {
                conversation.responseData.images.forEach(img => {
                  fullTranslatedContent += `\n![Image](${img})`;
                });
              }
              if (conversation.responseData.map_link) {
                fullTranslatedContent += `\n${conversation.responseData.map_link}`;
              }
            } else {
              // Extract and re-add images and maps from original content
              const imageRegex = /!\[Image\]\((https?:\/\/[^\s)]+)\)/g;
              const mapRegex = /(https:\/\/www\.google\.com\/maps\/[^\s]+)/g;
              
              let match;
              while ((match = imageRegex.exec(conversation.content)) !== null) {
                fullTranslatedContent += `\n![Image](${match[1]})`;
              }
              
              while ((match = mapRegex.exec(conversation.content)) !== null) {
                fullTranslatedContent += `\n${match[1]}`;
              }
            }

            return {
              ...conversation,
              content: fullTranslatedContent
            };
          }
          return conversation; // Don't translate user messages
        })
      );
      
      setConversations(translatedConversations);
    }
  } catch (error) {
    console.error('UI translation error:', error);
    setTranslatedTexts(defaultTexts); // Fallback to English
  } finally {
    setIsTranslating(false);
  }
};



  // Save conversations to localStorage whenever they change
    useEffect(() => {
    if (conversations.length > 0) {
        saveConversationToStorage(conversations);
    }
    }, [conversations]);


  // Handle language change
  const handleLanguageChange = async (newLanguage) => {
    setLanguage(newLanguage);
    await translateUITexts(newLanguage);
    
    // Update speech recognition language
    const speechLang = newLanguage === 'zh' ? 'zh-CN' : `${newLanguage}-${newLanguage.toUpperCase()}`;
    if (recognitionRef.current) {
      recognitionRef.current.lang = speechLang;
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.user-profile')) {
        setIsUserDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleUserDropdown = (e) => {
    e.stopPropagation();
    setIsUserDropdownOpen(!isUserDropdownOpen);
  };

  useEffect(() => {
    const newSessionId = `SID-${Math.random().toString(36).substr(2, 9)}`;
    setSessionId(newSessionId);
    
    // Check if user is new (hasn't completed tour)
    if (!window.tourCompleted) {
      // Start tour after a short delay for better UX
      setTimeout(() => {
        setIsTourActive(true);
      }, 1000);
    }
  }, []);

useEffect(() => {
  const container = suggestionsRef.current;
  if (!container) return;
  
  const scrollWrapper = container.querySelector('.suggestions-scroll-wrapper');
  if (!scrollWrapper) return;

  // Check if scrolling is needed and add scroll indicators
  const checkScroll = () => {
    const hasScroll = scrollWrapper.scrollWidth > scrollWrapper.clientWidth;
    container.classList.toggle('has-scroll', hasScroll);
  };

  // Mouse wheel horizontal scrolling
  const handleWheel = (e) => {
    // Only prevent default and scroll horizontally if there's overflow
    if (scrollWrapper.scrollWidth > scrollWrapper.clientWidth) {
      e.preventDefault();
      
      // Scroll horizontally with mouse wheel
      const scrollAmount = e.deltaY * 0.8; // Adjust scroll sensitivity
      scrollWrapper.scrollLeft += scrollAmount;
    }
  };

  checkScroll();
  scrollWrapper.addEventListener('wheel', handleWheel, { passive: false });
  window.addEventListener('resize', checkScroll);
  
  return () => {
    scrollWrapper.removeEventListener('wheel', handleWheel);
    window.removeEventListener('resize', checkScroll);
  };
}, [showSuggestions, suggestions]);

// Optional: Add touch/swipe and drag support
useEffect(() => {
  const scrollWrapper = suggestionsRef.current?.querySelector('.suggestions-scroll-wrapper');
  if (!scrollWrapper) return;

  let isDown = false;
  let startX;
  let scrollLeft;

  const handleMouseDown = (e) => {
    isDown = true;
    startX = e.pageX - scrollWrapper.offsetLeft;
    scrollLeft = scrollWrapper.scrollLeft;
    scrollWrapper.style.cursor = 'grabbing';
  };

  const handleMouseLeave = () => {
    isDown = false;
    scrollWrapper.style.cursor = 'grab';
  };

  const handleMouseUp = () => {
    isDown = false;
    scrollWrapper.style.cursor = 'grab';
  };

  const handleMouseMove = (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - scrollWrapper.offsetLeft;
    const walk = (x - startX) * 2; // Scroll speed multiplier
    scrollWrapper.scrollLeft = scrollLeft - walk;
  };

  // Touch events for mobile
  const handleTouchStart = (e) => {
    startX = e.touches[0].pageX - scrollWrapper.offsetLeft;
    scrollLeft = scrollWrapper.scrollLeft;
  };

  const handleTouchMove = (e) => {
    if (!startX) return;
    const x = e.touches[0].pageX - scrollWrapper.offsetLeft;
    const walk = (x - startX) * 1.5;
    scrollWrapper.scrollLeft = scrollLeft - walk;
  };

  const handleTouchEnd = () => {
    startX = null;
  };

  // Add event listeners
  scrollWrapper.addEventListener('mousedown', handleMouseDown);
  scrollWrapper.addEventListener('mouseleave', handleMouseLeave);
  scrollWrapper.addEventListener('mouseup', handleMouseUp);
  scrollWrapper.addEventListener('mousemove', handleMouseMove);
  scrollWrapper.addEventListener('touchstart', handleTouchStart);
  scrollWrapper.addEventListener('touchmove', handleTouchMove);
  scrollWrapper.addEventListener('touchend', handleTouchEnd);

  return () => {
    scrollWrapper.removeEventListener('mousedown', handleMouseDown);
    scrollWrapper.removeEventListener('mouseleave', handleMouseLeave);
    scrollWrapper.removeEventListener('mouseup', handleMouseUp);
    scrollWrapper.removeEventListener('mousemove', handleMouseMove);
    scrollWrapper.removeEventListener('touchstart', handleTouchStart);
    scrollWrapper.removeEventListener('touchmove', handleTouchMove);
    scrollWrapper.removeEventListener('touchend', handleTouchEnd);
  };
}, [showSuggestions]);





  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('SpeechRecognition not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    const speechLang = language === 'zh' ? 'zh-CN' : `${language}-${language.toUpperCase()}`;
    recognition.lang = speechLang;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      console.log('🎙️ Transcription:', transcript);
      setSearchInput(transcript);
      handleSearchSubmit(transcript);
    };

    recognition.onerror = (event) => {
      console.error('❌ Speech recognition error:', event.error);
    };

    recognition.onend = () => {
      setIsRecording(false);
      console.log('🔇 Voice recognition stopped.');
    };

    recognitionRef.current = recognition;
  }, [language]);

  useEffect(() => {
    scrollToBottom();
  }, [conversations]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleMicClick = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition not supported.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      setSearchInput('');
      recognitionRef.current.start();
      console.log('🎤 Voice recognition started...');
      setIsRecording(true);
    }
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const imageDataUrl = e.target.result;
          setUploadedImage(imageDataUrl);
          
          // Create a message with the uploaded image
          const userMessage = {
            id: Date.now(),
            type: 'user',
            content: `![Uploaded Image](${file.name})\nWhat can you tell me about this image?`,
            timestamp: new Date().toLocaleTimeString()
          };
          
          setConversations(prev => [...prev, userMessage]);
          
          // Process the image (you can modify this part based on your API requirements)
          handleImageSearch(file, imageDataUrl);
        };
        reader.readAsDataURL(file);
      } else {
        alert('Please select a valid image file.');
      }
    }
    
    // Reset the file input
    event.target.value = '';
  };

  const handleImageSearch = async (imageFile, imageDataUrl) => {
    setIsLoading(true);
    
    try {
      // Create FormData for image upload
      console.log('imageDataUrl:', imageDataUrl);
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('query', 'Analyze this heritage image');
      
      // You can modify this API call based on your backend requirements
      const res = await fetch(`${API_BASE}/query`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      let responseText = data?.response || "I can see your uploaded image! This appears to be a heritage-related image. Could you tell me more about what specific information you'd like to know about it?";
      
      // Translate response if not in English
      if (language !== 'en') {
        responseText = await translateText(responseText, language);
      }

      const botResponse = {
        id: Date.now() + 1,
        type: 'bot',
        content: responseText,
        timestamp: new Date().toLocaleTimeString()
      };

      setConversations(prev => [...prev, botResponse]);
    } catch (err) {
      console.error('Image search error:', err);
      let errorText = "I can see your uploaded image! However, I'm having trouble analyzing it right now. Could you describe what you'd like to know about this heritage image?";
      
      // Translate error message if not in English
      if (language !== 'en') {
        errorText = await translateText(errorText, language);
      }

      const errorResponse = {
        id: Date.now() + 1,
        type: 'bot',
        content: errorText,
        timestamp: new Date().toLocaleTimeString()
      };
      setConversations(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCameraClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };


const handleSearchSubmit = async (input = searchInput) => {
  if (!input.trim()) return;

  const userMessage = {
    id: Date.now(),
    type: 'user',
    content: input,
    timestamp: new Date().toLocaleTimeString()
  };

  setConversations(prev => [...prev, userMessage]);
  setSearchInput('');
  setIsLoading(true);

  try {
    const res = await fetch(`${API_BASE}/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: input }),
    });

    const data = await res.json();
    let responseText = data?.response || defaultResponse;
    
    // Translate response if not in English
    if (language !== 'en') {
      responseText = await translateText(responseText, language);
    }

    const botResponse = {
      id: Date.now() + 1,
      type: 'bot',
      content: responseText,
      timestamp: new Date().toLocaleTimeString(),
      responseData: data // Store the full response data for structured display
    };

    setConversations(prev => [...prev, botResponse]);

    // Generate suggestions if category is 'general'
    if (data && data.category === 'general') {
      const newSuggestions = generateSuggestions(data, translatedTexts);
      setSuggestions(newSuggestions);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  } catch (err) {
    console.error('API error:', err);
    let errorText = defaultResponse;
    
    // Translate error message if not in English
    if (language !== 'en') {
      errorText = await translateText(errorText, language);
    }

    const errorResponse = {
      id: Date.now() + 1,
      type: 'bot',
      content: errorText,
      timestamp: new Date().toLocaleTimeString()
    };
    setConversations(prev => [...prev, errorResponse]);
  } finally {
    setIsLoading(false);
  }
};


    const clearConversations = () => {
    setConversations([]);
    setUploadedImage(null);
    localStorage.removeItem('userConvo');
    };

  const handleImageClick = (image, index) => {
  // Find the current message that contains this image
  const currentMessage = conversations.find(msg => {
    if (msg.type === 'bot' && msg.responseData && msg.responseData.images) {
      return msg.responseData.images.includes(image);
    }
    // Fallback to parsing content for backward compatibility
    return msg.content.includes(image) && msg.type === 'bot';
  });
  
  if (currentMessage) {
    let images = [];
    
    // If we have structured response data, use those images
    if (currentMessage.responseData && currentMessage.responseData.images) {
      images = currentMessage.responseData.images;
    } else {
      // Fallback to parsing content
      const imageRegex = /!\[Image\]\((https?:\/\/[^\s)]+)\)/g;
      let match;
      
      while ((match = imageRegex.exec(currentMessage.content)) !== null) {
        images.push(match[1]);
      }
    }
    
    setModalImages(images);
    setCurrentImageIndex(index);
    setModalImage(image);
    setIsModalOpen(true);
  }
};

  const closeModal = () => {
    setIsModalOpen(false);
    setModalImage(null);
    setModalImages([]);
    setCurrentImageIndex(0);
  };

  const navigateImage = (newIndex) => {
    if (newIndex >= 0 && newIndex < modalImages.length) {
      setCurrentImageIndex(newIndex);
      setModalImage(modalImages[newIndex]);
    }
  };

  // Tour handlers
  const startTour = () => {
    setIsTourActive(true);
  };

  const handleTourComplete = () => {
    setIsTourActive(false);
    console.log('Tour completed!');
  };

  return (
    <div className="home-page-wrapper">
      {/* Canvas Cursor Effect Background */}
      {/* <div className="canvas-cursor-background">
        <CanvasCursorComponent />
      </div> */}
      
      <div className="background"><CanvasCursorComponent /></div>
      
      <SidebarImageOverlay />
      
      <RightSidebar />

      <div className="home-content">
        <div className={`user-profile ${isUserDropdownOpen ? 'active' : ''}`}>
          <div className="user-icon" title="User Profile" onClick={toggleUserDropdown}>👤</div>
          <div className="user-dropdown">
            <div className="session-id">
              {translatedTexts.userId}: <strong>{sessionId}</strong>
            </div>
            <div className="language-select">
              <label htmlFor="language">{translatedTexts.language}:</label>
              <select
                id="language"
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                disabled={isTranslating}
              >
                {libreTranslateLanguages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
              {isTranslating && <div className="translation-loading">Translating...</div>}
            </div>
            <button className="clear-btn" onClick={clearConversations}>
              {translatedTexts.clearChat}
            </button>
            <button className="tour-btn" onClick={startTour}>
              {translatedTexts.startTour}
            </button>
          </div>
        </div>

        {conversations.length === 0 && (
          <div className="welcome-section">
            <div className="title">
              <h1>{translatedTexts.welcome}</h1>
              <div className="subtitle">{translatedTexts.experience}</div>
            </div>
          </div>
        )}
        
        {conversations.length > 0 && (
          <div className="conversation-area">
            {conversations.map((message) => (
              <div 
                key={message.id} 
                className={`message-container ${message.type === 'user' ? 'user-message' : 'bot-message'}`}
              >
                <div className="message-bubble">
                  {message.type === 'bot' ? (
                    <EnhancedMessageContent 
                      content={message.content}
                      responseData={message.responseData}
                      messageId={message.id}
                      onImageClick={handleImageClick}
                      onInfoClick={handleInfoClick}
                      onSpeak={handleSpeakMessage}
                      speakingMessageId={speakingMessageId}
                    />
                  ) : (
                    <MessageContent 
                      content={message.content}
                      onImageClick={handleImageClick}
                    />
                  )}
                  <div className="message-timestamp">
                    {message.timestamp}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="message-container bot-message">
                <div className="message-bubble loading">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}

        {showSuggestions && suggestions.length > 0 && (
        <div className="suggestions-container" ref={suggestionsRef}>
          <div className="suggestions-scroll-wrapper">
            {suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                className="suggestion-btn"
                onClick={() => handleSuggestionClick(suggestion.query)}
                disabled={isLoading}
              >
                <span className="suggestion-icon">{suggestion.icon}</span>
                <span className="suggestion-text">{suggestion.text}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      
        <div className="search-container-fixed">
          <div className="search-box">
            <input
              type="text"
              className="search-input"
              placeholder={translatedTexts.searchPlaceholder}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
              disabled={isLoading}
            />
            <div className="search-buttons">
              <button
                className="search-btn voice-btn"
                onClick={handleMicClick}
                title={isRecording ? "Stop Recording" : "Start Recording"}
                disabled={isLoading}
              >
                {isRecording ? '🔴' : '🎤'}
              </button>
              <button 
                className="search-btn camera-btn" 
                title="Upload Image"
                onClick={handleCameraClick}
                disabled={isLoading}
              >
                📷
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                style={{ display: 'none' }}
              />
              <button
                className="search-btn search-submit"
                title="Search"
                onClick={() => handleSearchSubmit()}
                disabled={isLoading || !searchInput.trim()}
              >
                🔍
              </button>
            </div>
          </div>
        </div>
      </div>

      <ImageModal
        image={modalImage}
        isOpen={isModalOpen}
        onClose={closeModal}
        images={modalImages}
        currentIndex={currentImageIndex}
        onNavigate={navigateImage}
      />

      <InfoModal
      isOpen={infoModal.isOpen}
      onClose={closeInfoModal}
      title={infoModal.title}
      items={infoModal.items}
      type={infoModal.type}
    />

    

      {/* Tour Component */}
      <Tour
        isActive={isTourActive}
        onComplete={handleTourComplete}
        language={language}
      />
    </div>
  );
};

export default Home;
