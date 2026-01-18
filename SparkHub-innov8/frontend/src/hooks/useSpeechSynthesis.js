// src/hooks/useSpeechSynthesis.js
import { useState, useEffect, useRef } from 'react';

export const useSpeechSynthesis = () => {
  const [voices, setVoices] = useState([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const synthRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
      
      const updateVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        setVoices(availableVoices);
        
        // Log for debugging
        console.log('Voices loaded:', availableVoices.map(v => ({
          name: v.name,
          lang: v.lang,
          localService: v.localService
        })));
      };
      
      window.speechSynthesis.onvoiceschanged = updateVoices;
      updateVoices(); // Initial load
    }
    
    return () => {
      if (synthRef.current && synthRef.current.speaking) {
        synthRef.current.cancel();
      }
    };
  }, []);

  const speak = (text, language = 'kn-IN') => {
    if (!synthRef.current || !text) return;
    
    // Cancel any current speech
    if (synthRef.current.speaking) {
      synthRef.current.cancel();
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    utterance.rate = 0.85;
    utterance.pitch = 1.0;
    
    // Find best voice for the language
    const voice = voices.find(v => v.lang.includes(language.split('-')[0])) || 
                  voices.find(v => v.lang.includes('IN')) || 
                  voices[0];
    
    if (voice) utterance.voice = voice;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    synthRef.current.speak(utterance);
  };
  
  const stop = () => {
    if (synthRef.current && synthRef.current.speaking) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  };
  
  return { speak, stop, isSpeaking, voices };
};
