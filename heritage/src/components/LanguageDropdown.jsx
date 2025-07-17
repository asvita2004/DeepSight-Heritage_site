

import React, { useState, useEffect } from 'react';
import { ChevronDown, Globe, Loader2, Settings } from 'lucide-react';

const LanguageDropdown = () => {
  const [languages, setLanguages] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [translatedText, setTranslatedText] = useState('Please follow the steps carefully.');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [apiEndpoint, setApiEndpoint] = useState('https://libretranslate.com/translate');
  const [showSettings, setShowSettings] = useState(false);

  const originalText = 'Please follow the steps carefully.';

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

  useEffect(() => {
    setLanguages(libreTranslateLanguages);
    setIsLoading(false);
  }, []);

  const translateText = async (targetLanguage) => {
    if (targetLanguage === 'en') {
      setTranslatedText(originalText);
      return;
    }

    try {
      setIsTranslating(true);
      setError('');

      let currentEndpoint = apiEndpoint;
      let fallbackAttempted = false;

      const attemptTranslation = async (endpoint) => {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            q: originalText,
            source: 'en',
            target: targetLanguage,
            format: 'text',
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }

        return data.translatedText || originalText;
      };

      try {
        const translatedResult = await attemptTranslation(currentEndpoint);
        setTranslatedText(translatedResult);
        
        if (currentEndpoint === 'https://libretranslate.com/translate') {
          setApiEndpoint('https://libretranslate.com/translate');
        }
      } catch (primaryError) {
        if (currentEndpoint === 'https://libretranslate.com/translate') {
          try {
            console.log('Online API failed, trying local fallback...');
            const translatedResult = await attemptTranslation('http://127.0.0.1:5000/translate');
            setTranslatedText(translatedResult);
            setApiEndpoint('http://127.0.0.1:5000/translate');
            setError('Switched to local API (online service unavailable)');
            fallbackAttempted = true;
          } catch (fallbackError) {
            throw new Error(`Both online and local APIs failed. Online: ${primaryError.message}, Local: ${fallbackError.message}`);
          }
        } else {
          throw primaryError;
        }
      }

    } catch (err) {
      setError(`Translation failed: ${err.message}`);
      console.error('Translation error:', err);
      setTranslatedText(originalText);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleLanguageSelect = (languageCode) => {
    setSelectedLanguage(languageCode);
    setIsDropdownOpen(false);
    translateText(languageCode);
  };

  const handleApiEndpointChange = (newEndpoint) => {
    setApiEndpoint(newEndpoint);
    setShowSettings(false);
    if (selectedLanguage !== 'en') {
      translateText(selectedLanguage);
    }
  };

  const selectedLanguageName = languages.find(lang => lang.code === selectedLanguage)?.name || 'English';

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="flex items-center justify-center space-x-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading languages...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <Globe className="w-6 h-6 mr-2 text-blue-600" />
            Language Translator
          </h2>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
        <p className="text-gray-600">Select a language to translate the instructions</p>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
          <h3 className="text-sm font-medium text-gray-700 mb-3">API Settings</h3>
          <div className="space-y-2">
            <button
              onClick={() => handleApiEndpointChange('https://libretranslate.com/translate')}
              className={`w-full p-2 text-left text-sm rounded ${
                apiEndpoint === 'https://libretranslate.com/translate'
                  ? 'bg-blue-100 text-blue-800 border border-blue-300'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Online: libretranslate.com
            </button>
            <button
              onClick={() => handleApiEndpointChange('http://127.0.0.1:5000/translate')}
              className={`w-full p-2 text-left text-sm rounded ${
                apiEndpoint === 'http://127.0.0.1:5000/translate'
                  ? 'bg-blue-100 text-blue-800 border border-blue-300'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Local: 127.0.0.1:5000
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Current: {apiEndpoint}
          </p>
        </div>
      )}

      {/* Language Dropdown */}
      <div className="relative mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Choose Language
        </label>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="w-full px-4 py-3 text-left bg-white border border-gray-300 rounded-lg shadow-sm hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-gray-900">{selectedLanguageName}</span>
            <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isDropdownOpen ? 'transform rotate-180' : ''}`} />
          </div>
        </button>

        {/* Dropdown Menu */}
        {isDropdownOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={() => handleLanguageSelect(language.code)}
                className={`w-full px-4 py-2 text-left hover:bg-blue-50 focus:outline-none focus:bg-blue-50 ${
                  selectedLanguage === language.code ? 'bg-blue-100 text-blue-800' : 'text-gray-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{language.name}</span>
                  <span className="text-xs text-gray-500 uppercase font-mono">{language.code}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Translated Text Display */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Instructions:</h3>
        <div className="min-h-[60px] flex items-center">
          {isTranslating ? (
            <div className="flex items-center space-x-2 text-gray-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Translating...</span>
            </div>
          ) : (
            <p className="text-gray-700 text-lg leading-relaxed">{translatedText}</p>
          )}
        </div>
        {selectedLanguage !== 'en' && !isTranslating && (
          <p className="text-sm text-gray-500 mt-2 italic">
            Original: "{originalText}"
          </p>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className={`mt-4 p-3 rounded-lg ${
          error.includes('Switched to local API') 
            ? 'bg-yellow-50 border border-yellow-200' 
            : 'bg-red-50 border border-red-200'
        }`}>
          <p className={`text-sm ${
            error.includes('Switched to local API') 
              ? 'text-yellow-700' 
              : 'text-red-700'
          }`}>
            {error}
          </p>
        </div>
      )}

      {/* Language Info */}
      <div className="mt-4 text-center">
        <p className="text-sm text-gray-500">
          Selected: <span className="font-medium">{selectedLanguageName}</span> 
          <span className="ml-2 px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs uppercase font-mono">
            {selectedLanguage}
          </span>
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Powered by LibreTranslate
        </p>
      </div>
    </div>
  );
};

export default LanguageDropdown;