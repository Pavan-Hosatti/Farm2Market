import { useEffect, useState, useCallback, useRef } from 'react';

const useTextToSpeech = (langCode) => {
    const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    const isSupported = !!synth;
    
    const voicesReadyRef = useRef(false);
    const voicesCacheRef = useRef([]);
    const kannadaVoiceRef = useRef(null);

    // Function to load voices and FIND REAL KANNADA VOICE
    const loadVoices = useCallback(() => {
        if (!synth) return;
        
        const voices = synth.getVoices();
        if (voices.length > 0) {
            console.log("✅ Voices loaded:", voices.length);
            voicesCacheRef.current = voices;
            voicesReadyRef.current = true;
            
            // Debug: Log ALL voices
            console.log("🎙️ ALL VOICES:");
            voices.forEach((v, i) => {
                console.log(`${i+1}. ${v.name} - ${v.lang} (Local: ${v.localService})`);
            });
            
            if (langCode === 'kn') {
                // CRITICAL FIX: Don't auto-select English voice
                // Clear any previous selection
                kannadaVoiceRef.current = null;
                
                // Strategy 1: Look for EXACT Kannada voice
                const exactKannada = voices.find(v => 
                    v.lang.toLowerCase().startsWith('kn') || 
                    v.name.toLowerCase().includes('kannada')
                );
                
                // Strategy 2: Look for ANY Indian language voice (NOT English)
                const indianVoice = voices.find(v => {
                    const lang = v.lang.toLowerCase();
                    const name = v.name.toLowerCase();
                    
                    // Accept Indian regional languages BUT NOT English
                    const isIndianLang = (
                        lang.includes('hi-') || // Hindi
                        lang.includes('ta-') || // Tamil
                        lang.includes('te-') || // Telugu
                        lang.includes('ml-') || // Malayalam
                        lang.includes('mr-') || // Marathi
                        lang.includes('gu-') || // Gujarati
                        lang.includes('bn-') || // Bengali
                        lang.includes('pa-')    // Punjabi
                    ) && !name.includes('english'); // EXCLUDE English voices
                    
                    return isIndianLang;
                });
                
                // Strategy 3: Any NON-English voice
                const nonEnglishVoice = voices.find(v => 
                    !v.name.toLowerCase().includes('english') && 
                    !v.name.toLowerCase().includes('en-') &&
                    !v.name.toLowerCase().includes('microsoft david') &&
                    !v.name.toLowerCase().includes('microsoft zira') &&
                    !v.name.toLowerCase().includes('microsoft mark')
                );
                
                // Set priority
                kannadaVoiceRef.current = exactKannada || indianVoice || nonEnglishVoice || null;
                
                console.log("🎯 Selected voice:", kannadaVoiceRef.current?.name || "NONE - Using system default");
                console.log("🎯 Voice language:", kannadaVoiceRef.current?.lang || "System default");
                
                // If we found a voice but it's English, REJECT IT
                if (kannadaVoiceRef.current && 
                    kannadaVoiceRef.current.name.toLowerCase().includes('english')) {
                    console.log("❌ Rejecting English voice for Kannada");
                    kannadaVoiceRef.current = null;
                }
            }
        }
    }, [synth, langCode]);

    // Initialize
    useEffect(() => {
        if (!isSupported) {
            console.log("❌ TTS not supported");
            return;
        }
        
        console.log("🚀 Initializing TTS...");
        
        // Try immediate load
        loadVoices();
        
        // Setup voice change listener
        if (synth.onvoiceschanged !== undefined) {
            synth.onvoiceschanged = loadVoices;
        }
        
        // Force reload after a delay
        const timeoutId = setTimeout(loadVoices, 500);
        
        return () => {
            clearTimeout(timeoutId);
        };
    }, [isSupported, synth, loadVoices]);

    // SPEAK FUNCTION - FORCE KANNADA LANGUAGE
    const speak = useCallback((text) => {
        if (!isSupported || !text) {
            console.log("Can't speak: No support or text");
            return null;
        }
        
        console.log("🔊 Speaking Kannada:", text.substring(0, 30) + "...");
        
        // STOP any current speech immediately
        if (synth.speaking) {
            synth.cancel();
        }
        
        // Create utterance
        const utterance = new SpeechSynthesisUtterance(text);
        
        // CRITICAL: Force Kannada language code
        // Try different Kannada language codes
        const languageCodes = ['kn-IN', 'kn', 'kn-KN', 'kn-x-kannada'];
        
        for (const code of languageCodes) {
            try {
                utterance.lang = code;
                console.log("🗣️ Setting language code:", code);
                break;
            } catch (e) {
                continue;
            }
        }
        
        // IMPORTANT: DO NOT use English voice for Kannada
        if (kannadaVoiceRef.current && 
            !kannadaVoiceRef.current.name.toLowerCase().includes('english') &&
            !kannadaVoiceRef.current.name.toLowerCase().includes('ravi')) {
            
            utterance.voice = kannadaVoiceRef.current;
            console.log("🎤 Using non-English voice:", kannadaVoiceRef.current.name);
        } else {
            console.log("🎤 Letting browser choose voice (avoiding English)");
            // Don't set voice - let browser choose based on language code
        }
        
        // Optimal settings
        utterance.rate = 0.85;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        
        // Event handlers
        utterance.onstart = () => {
            console.log("▶️ Started speaking");
        };
        
        utterance.onend = () => {
            console.log("✅ Finished speaking");
        };
        
        utterance.onerror = (event) => {
            console.error("❌ Speech error:", event.error);
        };
        
        // SPEAK NOW
        synth.speak(utterance);
        
        return utterance;
        
    }, [isSupported, synth]);

    // Stop function
    const stop = useCallback(() => {
        if (synth && synth.speaking) {
            synth.cancel();
            console.log("⏹️ Speech stopped");
        }
    }, [synth]);

    // Test ALL voices function
    const testVoices = useCallback(() => {
        if (!synth || voicesCacheRef.current.length === 0) {
            console.log("No voices available to test");
            return;
        }
        
        console.log("🎧 Testing ALL voices...");
        
        voicesCacheRef.current.forEach((voice, index) => {
            setTimeout(() => {
                console.log(`Testing: ${voice.name} (${voice.lang})`);
                
                const testText = `ನಾನು ${voice.name} ಸ್ವರ. ಕನ್ನಡದಲ್ಲಿ ಮಾತನಾಡುತ್ತಿದ್ದೇನೆ.`;
                
                const utterance = new SpeechSynthesisUtterance(testText);
                utterance.voice = voice;
                utterance.lang = voice.lang; // Use voice's own language
                utterance.rate = 0.85;
                
                synth.speak(utterance);
            }, index * 4000);
        });
    }, [synth]);

    return { 
        speak, 
        stop, 
        testVoices,
        isSupported 
    };
};

export default useTextToSpeech;
