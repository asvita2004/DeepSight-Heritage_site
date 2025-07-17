
import React, { useState, useEffect, useRef } from 'react';
import { Globe, ChevronDown } from 'lucide-react';
import './Tour.css';

const LanguageDropdown = ({ onLanguageChange, currentLanguage }) => {
  const [selectedLanguage, setSelectedLanguage] = useState(currentLanguage || 'en');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const supportedLanguages = [
    { code: 'en', name: 'English' },
    { code: 'ta', name: 'Tamil' },
    { code: 'fr', name: 'French' },
    { code: 'hi', name: 'Hindi' },
    { code: 'te', name: 'Telugu' },
    { code: 'de', name: 'German' },
    { code: 'es', name: 'Spanish' }
  ];

  useEffect(() => {
    setSelectedLanguage(currentLanguage || 'en');
  }, [currentLanguage]);

  const handleLanguageSelect = (languageCode) => {
    setSelectedLanguage(languageCode);
    setIsDropdownOpen(false);
    if (onLanguageChange) {
      onLanguageChange(languageCode);
    }
  };

  const selectedLanguageName = supportedLanguages.find(lang => lang.code === selectedLanguage)?.name || 'English';

  return (
    <div className="relative">
      <div className="relative">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center space-x-2 px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <Globe className="w-4 h-4 text-blue-600" />
          <span>{selectedLanguageName}</span>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isDropdownOpen ? 'transform rotate-180' : ''}`} />
        </button>

        {isDropdownOpen && (
          <div className="absolute z-50 w-48 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
            {supportedLanguages.map((language) => (
              <button
                key={language.code}
                onClick={() => handleLanguageSelect(language.code)}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-blue-50 focus:outline-none focus:bg-blue-50 ${
                  selectedLanguage === language.code ? 'bg-blue-100 text-blue-800' : 'text-gray-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{language.name}</span>
                  <span className="text-xs text-gray-500 uppercase font-mono">{language.code}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const Tour = ({ isActive, onComplete, language = 'en' }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(language);
  const tooltipRef = useRef(null);

  const translations = {
    en: {
      welcome: 'Welcome to DeepSight!',
      welcomeDesc: 'Let\'s take a quick tour of the heritage explorer features.',
      userProfile: 'User Profile',
      userProfileDesc: 'Click here to view your session ID, change language, or clear chat history.',
      searchInput: 'Search Input',
      searchInputDesc: 'Type your questions about Tamil Nadu heritage here. Ask anything about temples, history, culture, or places!',
      voiceButton: 'Voice Search',
      voiceButtonDesc: 'Click to start voice recording. Speak your question and it will be transcribed automatically.',
      cameraButton: 'Camera Search',
      cameraButtonDesc: 'Use camera to search for heritage sites or monuments (feature coming soon).',
      searchButton: 'Search Button',
      searchButtonDesc: 'Click to submit your query and get detailed information about Tamil Nadu heritage.',
      next: 'Next',
      prev: 'Previous',
      skip: 'Skip Tour',
      finish: 'Finish Tour',
      gotIt: 'Got it!'
    },
    ta: {
      welcome: 'DeepSight-ல் உங்களை வரவேற்கிறோம்!',
      welcomeDesc: 'பாரம்பரிய ஆய்வாளர் அம்சங்களின் விரைவான சுற்றுப்பயணத்தை மேற்கொள்வோம்.',
      userProfile: 'பயனர் சுயவிவரம்',
      userProfileDesc: 'உங்கள் அமர்வு ID ஐப் பார்க்க, மொழியை மாற்ற அல்லது அரட்டை வரலாற்றை அழிக்க இங்கே கிளிக் செய்யவும்.',
      searchInput: 'தேடல் உள்ளீடு',
      searchInputDesc: 'தமிழ்நாட்டின் பாரம்பரியத்தைப் பற்றிய உங்கள் கேள்விகளை இங்கே தட்டச்சு செய்யவும். கோவில்கள், வரலாறு, கலாச்சாரம் அல்லது இடங்களைப் பற்றி எதையும் கேளுங்கள்!',
      voiceButton: 'குரல் தேடல்',
      voiceButtonDesc: 'குரல் பதிவைத் தொடங்க கிளிக் செய்யவும். உங்கள் கேள்வியைப் பேசுங்கள், அது தானாகவே எழுத்தில் மாறும்.',
      cameraButton: 'கேமரா தேடல்',
      cameraButtonDesc: 'பாரம்பரிய தளங்கள் அல்லது நினைவுச்சின்னங்களைத் தேடக் கேமராவைப் பயன்படுத்தவும் (அம்சம் விரைவில் வரும்).',
      searchButton: 'தேடல் பொத்தான்',
      searchButtonDesc: 'உங்கள் வினவலைச் சமர்ப்பித்து தமிழ்நாட்டின் பாரம்பரியத்தைப் பற்றிய விரிவான தகவல்களைப் பெற கிளிக் செய்யவும்.',
      next: 'அடுத்து',
      prev: 'முந்தைய',
      skip: 'சுற்றுப்பயணத்தைத் தவிர்க்கவும்',
      finish: 'சுற்றுப்பயணத்தை முடிக்கவும்',
      gotIt: 'புரிந்தது!'
    },
    fr: {
      welcome: 'Bienvenue sur DeepSight !',
      welcomeDesc: 'Faisons un tour rapide des fonctionnalités de l\'explorateur du patrimoine.',
      userProfile: 'Profil Utilisateur',
      userProfileDesc: 'Cliquez ici pour voir votre ID de session, changer de langue ou effacer l\'historique du chat.',
      searchInput: 'Champ de Recherche',
      searchInputDesc: 'Tapez vos questions sur le patrimoine du Tamil Nadu ici. Demandez tout sur les temples, l\'histoire, la culture ou les lieux !',
      voiceButton: 'Recherche Vocale',
      voiceButtonDesc: 'Cliquez pour commencer l\'enregistrement vocal. Parlez votre question et elle sera transcrite automatiquement.',
      cameraButton: 'Recherche par Caméra',
      cameraButtonDesc: 'Utilisez la caméra pour rechercher des sites patrimoniaux ou des monuments (fonctionnalité bientôt disponible).',
      searchButton: 'Bouton de Recherche',
      searchButtonDesc: 'Cliquez pour soumettre votre requête et obtenir des informations détaillées sur le patrimoine du Tamil Nadu.',
      next: 'Suivant',
      prev: 'Précédent',
      skip: 'Ignorer la Visite',
      finish: 'Terminer la Visite',
      gotIt: 'Compris !'
    },
    hi: {
      welcome: 'DeepSight में आपका स्वागत है!',
      welcomeDesc: 'आइए हेरिटेज एक्सप्लोरर सुविधाओं का एक त्वरित दौरा करते हैं।',
      userProfile: 'उपयोगकर्ता प्रोफ़ाइल',
      userProfileDesc: 'अपना सत्र ID देखने, भाषा बदलने या चैट इतिहास साफ़ करने के लिए यहाँ क्लिक करें।',
      searchInput: 'खोज इनपुट',
      searchInputDesc: 'तमिलनाडु की विरासत के बारे में अपने प्रश्न यहाँ टाइप करें। मंदिरों, इतिहास, संस्कृति या स्थानों के बारे में कुछ भी पूछें!',
      voiceButton: 'वॉयस सर्च',
      voiceButtonDesc: 'वॉयस रिकॉर्डिंग शुरू करने के लिए क्लिक करें। अपना प्रश्न बोलें और यह स्वचालित रूप से ट्रांसक्राइब हो जाएगा।',
      cameraButton: 'कैमरा सर्च',
      cameraButtonDesc: 'विरासत स्थलों या स्मारकों की खोज के लिए कैमरा का उपयोग करें (सुविधा जल्द आ रही है)।',
      searchButton: 'खोज बटन',
      searchButtonDesc: 'अपनी क्वेरी सबमिट करने और तमिलनाडु की विरासत के बारे में विस्तृत जानकारी पाने के लिए क्लिक करें।',
      next: 'अगला',
      prev: 'पिछला',
      skip: 'दौरा छोड़ें',
      finish: 'दौरा समाप्त करें',
      gotIt: 'समझ गया!'
    },
    te: {
      welcome: 'DeepSight కు స్వాగతం!',
      welcomeDesc: 'వారసత్వ అన్వేషకుడు లక్షణాల యొక్క త్వరిత పర్యటనను చేద్దాం.',
      userProfile: 'వినియోగదారు ప్రొఫైల్',
      userProfileDesc: 'మీ సెషన్ ID చూడడానికి, భాష మార్చడానికి లేదా చాట్ చరిత్రను క్లియర్ చేయడానికి ఇక్కడ క్లిక్ చేయండి.',
      searchInput: 'శోధన ఇన్‌పుట్',
      searchInputDesc: 'తమిళనాడు వారసత్వం గురించి మీ ప్రశ్నలను ఇక్కడ టైప్ చేయండి. దేవాలయాలు, చరిత్ర, సంస్కృతి లేదా ప్రదేశాల గురించి ఏదైనా అడగండి!',
      voiceButton: 'వాయిస్ శోధన',
      voiceButtonDesc: 'వాయిస్ రికార్డింగ్ ప్రారంభించడానికి క్లిక్ చేయండి. మీ ప్రశ్నను మాట్లాడండి మరియు అది స్వయంచాలకంగా లిఖించబడుతుంది.',
      cameraButton: 'కెమేరా శోధన',
      cameraButtonDesc: 'వారసత్వ స్థలాలు లేదా స్మారక చిహ్నాలను వెతకడానికి కెమేరాను ఉపయోగించండి (ఫీచర్ త్వరలో వస్తుంది).',
      searchButton: 'శోధన బటన్',
      searchButtonDesc: 'మీ ప్రశ్నను సమర్పించడానికి మరియు తమిళనాడు వారసత్వం గురించి వివరణాత్మక సమాచారాన్ని పొందడానికి క్లిక్ చేయండి.',
      next: 'తదుపరి',
      prev: 'మునుపటి',
      skip: 'పర్యటనను దాటవేయి',
      finish: 'పర్యటనను ముగించు',
      gotIt: 'అర్థమైంది!'
    },
    de: {
      welcome: 'Willkommen bei DeepSight!',
      welcomeDesc: 'Machen wir eine kurze Tour durch die Heritage Explorer-Funktionen.',
      userProfile: 'Benutzerprofil',
      userProfileDesc: 'Klicken Sie hier, um Ihre Sitzungs-ID anzuzeigen, die Sprache zu ändern oder den Chat-Verlauf zu löschen.',
      searchInput: 'Sucheingabe',
      searchInputDesc: 'Geben Sie hier Ihre Fragen zum Erbe von Tamil Nadu ein. Fragen Sie alles über Tempel, Geschichte, Kultur oder Orte!',
      voiceButton: 'Sprachsuche',
      voiceButtonDesc: 'Klicken Sie, um die Sprachaufzeichnung zu starten. Sprechen Sie Ihre Frage und sie wird automatisch transkribiert.',
      cameraButton: 'Kamerasuche',
      cameraButtonDesc: 'Verwenden Sie die Kamera, um nach Kulturerbestätten oder Denkmälern zu suchen (Funktion kommt bald).',
      searchButton: 'Suchschaltfläche',
      searchButtonDesc: 'Klicken Sie, um Ihre Anfrage zu senden und detaillierte Informationen über das Erbe von Tamil Nadu zu erhalten.',
      next: 'Weiter',
      prev: 'Zurück',
      skip: 'Tour überspringen',
      finish: 'Tour beenden',
      gotIt: 'Verstanden!'
    },
    es: {
      welcome: '¡Bienvenido a DeepSight!',
      welcomeDesc: 'Hagamos un recorrido rápido por las funciones del explorador de patrimonio.',
      userProfile: 'Perfil de Usuario',
      userProfileDesc: 'Haga clic aquí para ver su ID de sesión, cambiar idioma o borrar el historial de chat.',
      searchInput: 'Campo de Búsqueda',
      searchInputDesc: 'Escriba sus preguntas sobre el patrimonio de Tamil Nadu aquí. ¡Pregunte cualquier cosa sobre templos, historia, cultura o lugares!',
      voiceButton: 'Búsqueda por Voz',
      voiceButtonDesc: 'Haga clic para iniciar la grabación de voz. Hable su pregunta y será transcrita automáticamente.',
      cameraButton: 'Búsqueda por Cámara',
      cameraButtonDesc: 'Use la cámara para buscar sitios patrimoniales o monumentos (función próximamente).',
      searchButton: 'Botón de Búsqueda',
      searchButtonDesc: 'Haga clic para enviar su consulta y obtener información detallada sobre el patrimonio de Tamil Nadu.',
      next: 'Siguiente',
      prev: 'Anterior',
      skip: 'Saltar Tour',
      finish: 'Finalizar Tour',
      gotIt: '¡Entendido!'
    }
  };

  const handleLanguageChange = (languageCode) => {
    setCurrentLanguage(languageCode);
  };

  const t = translations[currentLanguage] || translations.en;

  const tourSteps = [
    {
      target: '.welcome-section',
      title: t.welcome,
      content: t.welcomeDesc,
      position: 'center'
    },
    {
      target: '.user-profile .user-icon',
      title: t.userProfile,
      content: t.userProfileDesc,
      position: 'bottom-left'
    },
    {
      target: '.search-input',
      title: t.searchInput,
      content: t.searchInputDesc,
      position: 'top'
    },
    {
      target: '.voice-btn',
      title: t.voiceButton,
      content: t.voiceButtonDesc,
      position: 'top'
    },
    {
      target: '.camera-btn',
      title: t.cameraButton,
      content: t.cameraButtonDesc,
      position: 'top'
    },
    {
      target: '.search-submit',
      title: t.searchButton,
      content: t.searchButtonDesc,
      position: 'top'
    }
  ];

  useEffect(() => {
    setCurrentLanguage(language);
  }, [language]);

  useEffect(() => {
    if (isActive) {
      setIsVisible(true);
      setCurrentStep(0);
      document.body.classList.add('tour-active');
    } else {
      setIsVisible(false);
      document.body.classList.remove('tour-active');
    }

    return () => {
      document.body.classList.remove('tour-active');
    };
  }, [isActive]);

  useEffect(() => {
    if (isVisible) {
      updateTooltipPosition();
    }
  }, [currentStep, isVisible]);

  const updateTooltipPosition = () => {
    const step = tourSteps[currentStep];
    if (!step) return;

    const targetElement = document.querySelector(step.target);
    const tooltip = tooltipRef.current;

    if (!targetElement || !tooltip) return;

    const targetRect = targetElement.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    
    let top, left;

    if (step.position === 'center') {
      top = window.innerHeight / 2 - tooltipRect.height / 2;
      left = window.innerWidth / 2 - tooltipRect.width / 2;
    } else {
      switch (step.position) {
        case 'top':
          top = targetRect.top - tooltipRect.height - 15;
          left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
          break;
        case 'bottom':
          top = targetRect.bottom + 15;
          left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
          break;
        case 'bottom-left':
          top = targetRect.bottom + 15;
          left = targetRect.left;
          break;
        case 'left':
          top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2);
          left = targetRect.left - tooltipRect.width - 15;
          break;
        case 'right':
          top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2);
          left = targetRect.right + 15;
          break;
        default:
          top = targetRect.bottom + 15;
          left = targetRect.left;
      }
    }

    if (left < 10) left = 10;
    if (left + tooltipRect.width > window.innerWidth - 10) {
      left = window.innerWidth - tooltipRect.width - 10;
    }
    if (top < 10) top = 10;
    if (top + tooltipRect.height > window.innerHeight - 10) {
      top = window.innerHeight - tooltipRect.height - 10;
    }

    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${left}px`;

    highlightElement(targetElement);
  };

  const highlightElement = (element) => {
    document.querySelectorAll('.tour-highlight').forEach(el => {
      el.classList.remove('tour-highlight');
    });

    if (element) {
      element.classList.add('tour-highlight');
    }
  };

  const nextStep = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTour();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipTour = () => {
    completeTour();
  };

  const completeTour = () => {
    document.querySelectorAll('.tour-highlight').forEach(el => {
      el.classList.remove('tour-highlight');
    });
    
    setIsVisible(false);
    document.body.classList.remove('tour-active');
    
    window.tourCompleted = true;
    
    if (onComplete) {
      onComplete();
    }
  };

  if (!isVisible) return null;

  const currentStepData = tourSteps[currentStep];
  const isLastStep = currentStep === tourSteps.length - 1;
  const isFirstStep = currentStep === 0;

  return (
    <>
      <div className="tour-overlay" />
      
      <div 
        ref={tooltipRef}
        className={`tour-tooltip ${currentStepData.position}`}
      >
        <div className="tour-header">
          <h3 className="tour-title">{currentStepData.title}</h3>
          <div className="tour-header-controls flex items-center space-x-2">
            <LanguageDropdown 
              currentLanguage={currentLanguage}
              onLanguageChange={handleLanguageChange}
            />
            <button className="tour-close" onClick={skipTour}>×</button>
          </div>
        </div>
        
        <div className="tour-content">
          <p>{currentStepData.content}</p>
        </div>
        
        <div className="tour-footer">
          <div className="tour-progress">
            <span className="tour-step-counter">
              {currentStep + 1} / {tourSteps.length}
            </span>
            <div className="tour-progress-bar">
              <div 
                className="tour-progress-fill"
                style={{ width: `${((currentStep + 1) / tourSteps.length) * 100}%` }}
              />
            </div>
          </div>
          
          <div className="tour-actions">
            {!isFirstStep && (
              <button className="tour-btn tour-btn-secondary" onClick={prevStep}>
                {t.prev}
              </button>
            )}
            
            <button className="tour-btn tour-btn-skip" onClick={skipTour}>
              {t.skip}
            </button>
            
            <button className="tour-btn tour-btn-primary" onClick={nextStep}>
              {isLastStep ? t.finish : t.next}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Tour;