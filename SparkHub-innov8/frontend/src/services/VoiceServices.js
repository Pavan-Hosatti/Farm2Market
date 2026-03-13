/**
 * Enhanced Voice Input Service with Fallback Layers
 * Handles voice recognition with graceful degradation
 * Supports: Kannada, English, offline mode, slow internet recovery
 */

class VoiceInputService {
  constructor() {
    this.recognition = null;
    this.isSupported = this.checkBrowserSupport();
    this.isListening = false;
    this.fallbackMode = false;
    this.languageMap = {
      'kn': 'kn-IN',    // Kannada
      'en': 'en-US',    // English
      'hi': 'hi-IN',    // Hindi
      'ta': 'ta-IN',    // Tamil
      'ml': 'ml-IN',    // Malayalam
    };
  }

  checkBrowserSupport() {
    return !!(
      window.SpeechRecognition ||
      window.webkitSpeechRecognition ||
      window.mozSpeechRecognition ||
      window.msSpeechRecognition
    );
  }

  initialize(language = 'kn') {
    if (!this.isSupported) {
      console.warn('⚠️ Speech Recognition not supported - using fallback mode');
      this.fallbackMode = true;
      return false;
    }

    try {
      const SpeechRecognition = 
        window.SpeechRecognition ||
        window.webkitSpeechRecognition ||
        window.mozSpeechRecognition ||
        window.msSpeechRecognition;

      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = this.languageMap[language] || 'kn-IN';

      console.log(`✅ Voice Recognition initialized for: ${language}`);
      return true;
    } catch (error) {
      console.error('❌ Voice Recognition init failed:', error);
      this.fallbackMode = true;
      return false;
    }
  }

  start(onResultCallback, language = 'kn') {
    if (this.fallbackMode || !this.isSupported) {
      console.log('🔄 Fallback mode: Voice unavailable, showing text input');
      return false;
    }

    try {
      this.initialize(language);
      this.isListening = true;

      this.recognition.onstart = () => {
        console.log('🎤 Listening started...');
      };

      this.recognition.onresult = (event) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final += transcript + ' ';
          } else {
            interim += transcript;
          }
        }

        if (onResultCallback) {
          onResultCallback({
            interim,
            final: final.trim(),
            isFinal: event.results[event.results.length - 1].isFinal
          });
        }
      };

      this.recognition.onerror = (event) => {
        console.error('❌ Voice recognition error:', event.error);
        // Fallback: Stay visible but show error message
        if (onResultCallback) {
          onResultCallback({
            error: event.error,
            interim: '',
            final: ''
          });
        }
      };

      this.recognition.onend = () => {
        console.log('🛑 Listening stopped');
        this.isListening = false;
      };

      this.recognition.start();
      return true;
    } catch (error) {
      console.error('❌ Failed to start voice recognition:', error);
      this.fallbackMode = true;
      return false;
    }
  }

  stop() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (error) {
        console.error('Error stopping recognition:', error);
      }
    }
  }

  abort() {
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch (error) {
        console.error('Error aborting recognition:', error);
      }
    }
  }

  setLanguage(language) {
    if (this.recognition && this.languageMap[language]) {
      this.recognition.lang = this.languageMap[language];
      console.log(`✅ Language changed to: ${language}`);
    }
  }

  getStatus() {
    return {
      isSupported: this.isSupported,
      fallbackMode: this.fallbackMode,
      isListening: this.isListening,
      availableLanguages: Object.keys(this.languageMap)
    };
  }
}

/**
 * Text-to-Speech Service with Fallback
 * Speaks responses in selected language with graceful degradation
 */
class TextToSpeechService {
  constructor() {
    this.isSupported = !!(window.speechSynthesis);
    this.isSpeaking = false;
    this.fallbackMode = !this.isSupported;
    this.languageMap = {
      'kn': 'kn-IN',    // Kannada
      'en': 'en-US',    // English
      'hi': 'hi-IN',    // Hindi
      'ta': 'ta-IN',    // Tamil
      'ml': 'ml-IN',    // Malayalam
    };
  }

  speak(text, language = 'kn', onComplete = null) {
    if (this.fallbackMode || !this.isSupported) {
      console.log('🔄 TTS Fallback: Voice output unavailable, text displayed instead');
      if (onComplete) onComplete();
      return false;
    }

    try {
      // Cancel any ongoing speech
      if (this.isSpeaking) {
        window.speechSynthesis.cancel();
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = this.languageMap[language] || 'kn-IN';
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;

      utterance.onstart = () => {
        this.isSpeaking = true;
        console.log('🔊 Speaking started');
      };

      utterance.onend = () => {
        this.isSpeaking = false;
        console.log('🔊 Speaking finished');
        if (onComplete) onComplete();
      };

      utterance.onerror = (event) => {
        console.error('❌ TTS error:', event.error);
        this.isSpeaking = false;
        this.fallbackMode = true;
        if (onComplete) onComplete();
      };

      window.speechSynthesis.speak(utterance);
      return true;
    } catch (error) {
      console.error('❌ TTS failed:', error);
      this.fallbackMode = true;
      if (onComplete) onComplete();
      return false;
    }
  }

  stop() {
    if (this.isSupported && this.isSpeaking) {
      window.speechSynthesis.cancel();
      this.isSpeaking = false;
    }
  }

  getStatus() {
    return {
      isSupported: this.isSupported,
      fallbackMode: this.fallbackMode,
      isSpeaking: this.isSpeaking,
      availableLanguages: Object.keys(this.languageMap)
    };
  }
}

/**
 * Auto-Fill Service
 * Extracts intent from voice input and auto-fills form fields
 */
class AutoFillService {
  constructor() {
    this.intentPatterns = {
      nameIntents: {
        kn: ['ಹೆಸರು', 'ನಾನೆ', 'ನನ್ನ ಹೆಸರು'],
        en: ['name', 'my name', 'i am', 'call me']
      },
      locationIntents: {
        kn: ['ಸ್ಥಳ', 'ನಾನು', 'ನಿವಾಸ', 'ರಾಜ್ಯ'],
        en: ['location', 'from', 'place', 'city', 'state']
      },
      descriptionIntents: {
        kn: ['ವಿವರಣೆ', 'ಬಗ್ಗೆ', 'ನಾನು', 'ಮಾಡುತ್ತೇವೆ'],
        en: ['description', 'about', 'do', 'grow', 'produce']
      },
      phoneIntents: {
        kn: ['ಫೋನ್', 'ಸಂಖ್ಯೆ', 'ಸಂಪರ್ಕ'],
        en: ['phone', 'number', 'contact', 'reach']
      }
    };
  }

  extractIntent(text, language = 'en') {
    const lower = text.toLowerCase();
    
    // Check each intent pattern
    for (const [fieldType, patterns] of Object.entries(this.intentPatterns)) {
      const fieldPatterns = patterns[language] || patterns['en'];
      if (fieldPatterns.some(pattern => lower.includes(pattern))) {
        return {
          field: fieldType.replace('Intents', ''),
          confidence: 0.85,
          rawText: text
        };
      }
    }

    return null;
  }

  extractValue(text, fieldType) {
    // Extract phone numbers
    if (fieldType === 'phone') {
      const phoneMatch = text.match(/\d{10}|\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/);
      if (phoneMatch) return phoneMatch[0];
    }

    // Extract location (simplified - would improve with NLP)
    if (fieldType === 'location') {
      const words = text.split(' ');
      if (words.length > 0) return words[words.length - 1];
    }

    // For name/description, return the whole text
    if (fieldType === 'name' || fieldType === 'description') {
      return text;
    }

    return null;
  }
}

// Export singletons
export const voiceInputService = new VoiceInputService();
export const textToSpeechService = new TextToSpeechService();
export const autoFillService = new AutoFillService();
