// NEW FILE: src/utils/kannadaTTS.js

/**
 * High-quality Kannada TTS using Google's TTS API
 * This produces natural-sounding Kannada speech
 */
class KannadaTTS {
  constructor() {
    this.isSupported = typeof window !== 'undefined';
    this.audioContext = null;
  }

  /**
   * Speak Kannada text using Google's TTS
   * @param {string} text - Kannada text to speak
   * @param {object} options - TTS options
   */
  async speak(text, options = {}) {
    if (!this.isSupported || !text) return null;

    const {
      rate = 1.0,
      pitch = 1.0,
      volume = 1.0,
      language = 'kn',
      onStart = null,
      onEnd = null,
      onError = null
    } = options;

    try {
      // Method 1: Direct Google TTS URL (most reliable)
      const ttsUrl = this.buildGoogleTTSUrl(text, language, rate);
      
      console.log("🔊 Playing natural Kannada TTS...");
      
      if (onStart) onStart();
      
      // Create and play audio
      const audio = new Audio(ttsUrl);
      audio.volume = volume;
      
      // Set up event listeners
      audio.addEventListener('ended', () => {
        console.log("✅ TTS playback finished");
        if (onEnd) onEnd();
      });
      
      audio.addEventListener('error', (error) => {
        console.error("❌ TTS playback error:", error);
        if (onError) onError(error);
      });
      
      // Play the audio
      await audio.play();
      
      return audio;
      
    } catch (error) {
      console.error("TTS failed:", error);
      
      // Fallback to browser's speech synthesis
      return this.fallbackToBrowserTTS(text, options);
    }
  }

  /**
   * Build Google TTS URL
   */
  buildGoogleTTSUrl(text, language, rate) {
    // Clean the text
    const cleanText = encodeURIComponent(text);
    
    // Google TTS parameters
    const params = new URLSearchParams({
      ie: 'UTF-8',
      tl: language, // 'kn' for Kannada
      q: cleanText,
      client: 'tw-ob',
      ttsspeed: rate.toString(),
      total: '1',
      idx: '0',
      textlen: text.length.toString(),
    });
    
    // Return the TTS URL
    return `https://translate.google.com/translate_tts?${params.toString()}`;
  }

  /**
   * Alternative: Use Google Cloud TTS (if you have API key)
   */
  async speakWithGoogleCloud(text, apiKey) {
    if (!apiKey) return this.speak(text);
    
    try {
      const response = await fetch(
        `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            input: { text: text },
            voice: {
              languageCode: 'kn-IN',
              name: 'kn-IN-Standard-A', // Kannada female voice
              ssmlGender: 'FEMALE'
            },
            audioConfig: {
              audioEncoding: 'MP3',
              speakingRate: 0.9,
              pitch: 0,
              volumeGainDb: 0
            }
          })
        }
      );
      
      const data = await response.json();
      const audioContent = data.audioContent;
      
      // Play the audio
      const audio = new Audio(`data:audio/mp3;base64,${audioContent}`);
      await audio.play();
      
      return audio;
    } catch (error) {
      console.error("Google Cloud TTS failed:", error);
      return this.speak(text);
    }
  }

  /**
   * Fallback to browser's speech synthesis
   */
  fallbackToBrowserTTS(text, options) {
    if (!window.speechSynthesis) {
      throw new Error("Speech synthesis not supported");
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'kn-IN';
    utterance.rate = options.rate || 0.9;
    utterance.pitch = options.pitch || 1.0;
    
    // Try to find a better voice
    const voices = window.speechSynthesis.getVoices();
    
    // Prefer female voices for Kannada
    const femaleVoice = voices.find(v => 
      v.name.includes('Female') || 
      v.name.includes('Zira') ||
      v.name.includes('Lila')
    );
    
    if (femaleVoice) utterance.voice = femaleVoice;
    
    window.speechSynthesis.speak(utterance);
    
    return utterance;
  }

  /**
   * Stop any ongoing speech
   */
  stop() {
    // Stop all audio elements
    const audioElements = document.querySelectorAll('audio');
    audioElements.forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
    
    // Stop speech synthesis
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    
    console.log("⏹️ All speech stopped");
  }
}

// Export singleton instance
export const kannadaTTS = new KannadaTTS();
