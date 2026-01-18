import React, { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Volume2, Loader2 } from "lucide-react";
import useTextToSpeech from "../../hooks/useTextToSpeech";

const ChatHistory = ({ conversation }) => {
  const messagesEndRef = useRef(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  // Use the hook
  const { speak, stop, isSupported } = useTextToSpeech('kn');

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation]);

  // PLAY FUNCTION - NO NONSENSE
  const playKannadaVoice = (text) => {
    if (!text || !isSupported) return;
    
    // Stop any current speech
    stop();
    setIsSpeaking(true);
    
    // SPEAK IMMEDIATELY
    const utterance = speak(text);
    
    if (utterance) {
      utterance.onend = () => {
        setIsSpeaking(false);
      };
      
      utterance.onerror = () => {
        setIsSpeaking(false);
      };
    } else {
      setIsSpeaking(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      {conversation.length === 0 && (
        <div className="text-center py-20 text-gray-500 dark:text-gray-400">
          <p className="text-lg">ಕನ್ನಡದಲ್ಲಿ ಮಾತನಾಡಿ</p>
          <p className="text-sm mt-2">Start your voice conversation</p>
          <p className="text-xs mt-4 text-gray-400">
            ಬೆಳೆಗಳು, ಬೆಲೆಗಳು ಮತ್ತು ಕೃಷಿ ಬಗ್ಗೆ ಕೇಳಿ
          </p>
          {!isSupported && (
            <p className="text-xs text-red-500 mt-2">
              ⚠️ Voice playback not supported in this browser
            </p>
          )}
        </div>
      )}

      {conversation.map((message, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className={`flex ${
            message.role === "user" ? "justify-end" : "justify-start"
          }`}
        >
          <div
            className={`max-w-[80%] p-3 rounded-xl shadow-md ${
              message.role === "user"
                ? "bg-emerald-500 text-white rounded-br-none"
                : "bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-tl-none"
            }`}
          >
            <p className="text-sm whitespace-pre-wrap">{message.text}</p>

            {/* 🎧 Play Button - SIMPLE */}
            {message.role === "assistant" && isSupported && (
              <button
                onClick={() => playKannadaVoice(message.text)}
                disabled={isSpeaking}
                className="mt-2 text-xs flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-800 transition disabled:opacity-50"
              >
                {isSpeaking ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    🔊 Playing...
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3 h-3" />
                    🔊 ಕೇಳಿ
                  </>
                )}
              </button>
            )}
          </div>
        </motion.div>
      ))}

      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatHistory;
