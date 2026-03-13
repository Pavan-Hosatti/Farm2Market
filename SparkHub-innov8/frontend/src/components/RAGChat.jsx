/**
 * Phase 4: RAG Chat - Retrieval-Augmented Generation
 * Text & Voice Q&A grounded in project documents with citations
 * Multilingual support (Kannada priority, fallback to English)
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Mic, MicOff, Globe, MessageSquare, RefreshCw, FileText,
  Volume2, Copy, ThumbsUp, ThumbsDown, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function RAGChat({ projectId, projectDocuments = [] }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'system',
      content: 'Ask me anything about this project! I can answer in English or Kannada (ಕನ್ನಡ).'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('en'); // en, kn
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // Mock RAG responses with citations
  const mockRAGResponses = {
    'timeline': {
      en: {
        text: 'Based on the project documents, the timeline is 8 weeks with a 2-week buffer for QA. The project phases are: Week 1-2 (Planning), Week 3-5 (Development), Week 6-7 (Testing), Week 8 (Deployment).',
        citations: ['Project_Brief_v3.pdf (page 2)', 'Project_Schedule.docx'],
        confidence: 0.95
      },
      kn: {
        text: 'ಪ್ರಾಜೆಕ್ಟ್ ದಸ್ತಾವೇಜುಗಳ ಪ್ರಕಾರ, ಸಮಯ ಮಿತಿ 8 ವಾರಗಳು QA ಗಾಗಿ 2-ವಾರದ ಬಾಫರ್ ಸಹ. ಪ್ರಾಜೆಕ್ಟ್ ಹಂತಗಳು: 1-2 ವಾರ (ಯೋಜನೆ), 3-5 ವಾರ (ಅಭಿವೃದ್ಧಿ), 6-7 ವಾರ (ಪರೀಕ್ಷೆ), 8 ವಾರ (ನಿಸ್ತಾರಣ).',
        citations: ['Project_Brief_v3.pdf (ಸುಪುಟ 2)', 'Project_Schedule.docx'],
        confidence: 0.92
      }
    },
    'budget': {
      en: {
        text: 'The project budget is $15,000 - $30,000. Payment schedule: 30% upfront (start), 50% at mid-point (Week 4), 20% on completion. No additional costs beyond the quoted amount.',
        citations: ['Budget_Breakdown.xlsx', 'Agreement_Terms.pdf'],
        confidence: 0.98
      },
      kn: {
        text: 'ಪ್ರಾಜೆಕ್ಟ್ ಬಜೆಟ್ $15,000 - $30,000. ಪಾವತಿ ವೇಳಾಪಟ್ಟಿ: 30% ಅದ್ವಾನ (ಆರಂಭ), 50% ಮಧ್ಯದಲ್ಲಿ (4 ವಾರ), 20% ಪೂರ್ಣತೆಯಲ್ಲಿ.',
        citations: ['Budget_Breakdown.xlsx', 'Agreement_Terms.pdf'],
        confidence: 0.97
      }
    },
    'requirements': {
      en: {
        text: 'Key requirements include: React.js frontend, Node.js backend, PostgreSQL database, AWS hosting, and OAuth integration for user authentication. All code must follow REST API standards and include comprehensive error handling.',
        citations: ['Technical_Spec.pdf (page 3-4)', 'API_Requirements.md'],
        confidence: 0.94
      },
      kn: {
        text: 'ಮುಖ್ಯ ಅವಶ್ಯಕತೆಗಳು: React.js ಫ್ರಂಟ್‍ಎಂಡ್, Node.js ಬ್ಯಾಕ್‍ಎಂಡ್, PostgreSQL ಡೇಟಾಬೇಸ್, AWS ಹೋಸ್ಟಿಂಗ್, ಮತ್ತು OAuth ಇಂಟಿಗ್ರೇಶನ್.',
        citations: ['Technical_Spec.pdf (ಸುಪುಟ 3-4)', 'API_Requirements.md'],
        confidence: 0.91
      }
    },
    'default': {
      en: {
        text: 'I don\'t have specific information about that in the project documents. Could you ask about budget, timeline, technical requirements, or other details mentioned in the uploaded files?',
        citations: [],
        confidence: 0.5
      },
      kn: {
        text: 'ನಾನು ಅದರ ಬಗ್ಗೆ ಪ್ರಾಜೆಕ್ಟ್ ದಸ್ತಾವೇಜುಗಳಲ್ಲಿ ನಿರ್ದಿಷ್ಟ ಮಾಹಿತಿ ಹೊಂದಿಲ್ಲ. ಬಜೆಟ್, ಸಮಯ ಮಿತಿ, ತಾಂತ್ರಿಕ ಅವಶ್ಯಕತೆಗಳ ಬಗ್ಗೆ ಕೇಳಬಹುದೇ?',
        citations: [],
        confidence: 0.48
      }
    }
  };

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize Web Speech API
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = currentLanguage === 'kn' ? 'kn-IN' : 'en-US';

      recognitionRef.current.onstart = () => setIsListening(true);
      recognitionRef.current.onend = () => setIsListening(false);

      recognitionRef.current.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          setInput(transcript);
          // Auto-submit voice input
          setTimeout(() => handleSendMessage(transcript), 500);
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        toast.error(`Voice input error: ${event.error}`);
        setIsListening(false);
      };
    }
  }, [currentLanguage]);

  // Mock RAG search and response generation
  const searchKnowledgeBase = (query) => {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('timeline') || lowerQuery.includes('duration') || lowerQuery.includes('ಸಮಯ')) {
      return mockRAGResponses.timeline;
    }
    if (lowerQuery.includes('budget') || lowerQuery.includes('cost') || lowerQuery.includes('price') || lowerQuery.includes('ಬಜೆಟ')) {
      return mockRAGResponses.budget;
    }
    if (lowerQuery.includes('requirement') || lowerQuery.includes('skill') || lowerQuery.includes('tech') || lowerQuery.includes('ಅವಶ್ಯಕತೆ')) {
      return mockRAGResponses.requirements;
    }
    
    return mockRAGResponses.default;
  };

  const handleSendMessage = async (messageText = null) => {
    const queryText = messageText || input;
    if (!queryText.trim()) return;

    // Add user message
    const userMessage = {
      id: messages.length + 1,
      type: 'user',
      content: queryText,
      language: currentLanguage
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Simulate RAG processing (search + generate)
    setTimeout(() => {
      const response = searchKnowledgeBase(queryText);
      const ragResponse = response[currentLanguage] || response.en;

      const assistantMessage = {
        id: messages.length + 2,
        type: 'assistant',
        content: ragResponse.text,
        citations: ragResponse.citations,
        confidence: ragResponse.confidence,
        language: currentLanguage,
        canSpeak: true
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);

      // Auto-speak response if voice mode
      if (currentLanguage === 'kn' || currentLanguage === 'en') {
        speakResponse(ragResponse.text);
      }
    }, 1200);
  };

  const speakResponse = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = currentLanguage === 'kn' ? 'kn-IN' : 'en-US';
      utterance.rate = 0.95;
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      
      try {
        window.speechSynthesis.cancel(); // Stop any ongoing speech
        window.speechSynthesis.speak(utterance);
      } catch (error) {
        console.error('Speech synthesis error:', error);
      }
    }
  };

  const startVoiceInput = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        toast.error('Voice input not available');
      }
    } else {
      toast.error('Voice input not supported in this browser');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg border border-gray-700/50 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-b border-gray-700 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-5 h-5 text-purple-400" />
          <div>
            <p className="text-white font-semibold">Project Knowledge Assistant</p>
            <p className="text-gray-400 text-xs">Ask about budget, timeline, requirements...</p>
          </div>
        </div>

        {/* Language Selector */}
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentLanguage('en')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
              currentLanguage === 'en'
                ? 'bg-purple-500/20 border border-purple-500 text-purple-300'
                : 'bg-gray-700/50 border border-gray-600 text-gray-400 hover:border-purple-500/50'
            }`}
          >
            English
          </button>
          <button
            onClick={() => setCurrentLanguage('kn')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
              currentLanguage === 'kn'
                ? 'bg-purple-500/20 border border-purple-500 text-purple-300'
                : 'bg-gray-700/50 border border-gray-600 text-gray-400 hover:border-purple-500/50'
            }`}
          >
            ಕನ್ನಡ
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-3 rounded-lg ${
                  msg.type === 'user'
                    ? 'bg-purple-500/20 border border-purple-500/30 text-white'
                    : msg.type === 'system'
                    ? 'bg-blue-500/10 border border-blue-500/30 text-blue-300 italic'
                    : 'bg-gray-800/50 border border-gray-700 text-gray-100'
                }`}
              >
                <p className="text-sm leading-relaxed">{msg.content}</p>

                {/* Citations (RAG) */}
                {msg.citations && msg.citations.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-3 pt-3 border-t border-gray-700/50 space-y-2"
                  >
                    <p className="text-xs font-semibold text-gray-400">📚 Sources:</p>
                    {msg.citations.map((citation, idx) => (
                      <div key={idx} className="text-xs text-gray-400 p-2 bg-gray-900/50 rounded border border-gray-700/30 flex items-start gap-2">
                        <FileText className="w-3 h-3 flex-shrink-0 mt-0.5" />
                        <span>{citation}</span>
                      </div>
                    ))}
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      🎯 Confidence: {Math.round(msg.confidence * 100)}%
                    </p>
                  </motion.div>
                )}

                {/* Message Actions */}
                {msg.type === 'assistant' && (
                  <div className="mt-3 flex gap-2 flex-wrap">
                    <button
                      onClick={() => speakResponse(msg.content)}
                      className="px-2 py-1 bg-gray-700/50 hover:bg-gray-700 text-gray-300 text-xs rounded transition-colors flex items-center gap-1"
                    >
                      <Volume2 className={`w-3 h-3 ${isSpeaking ? 'animate-pulse' : ''}`} />
                      {isSpeaking ? 'Playing...' : 'Speak'}
                    </button>
                    <button
                      onClick={() => copyToClipboard(msg.content)}
                      className="px-2 py-1 bg-gray-700/50 hover:bg-gray-700 text-gray-300 text-xs rounded transition-colors flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      Copy
                    </button>
                    <button className="px-2 py-1 bg-gray-700/50 hover:bg-gray-700 text-gray-300 text-xs rounded transition-colors">
                      <ThumbsUp className="w-3 h-3" />
                    </button>
                    <button className="px-2 py-1 bg-gray-700/50 hover:bg-gray-700 text-gray-300 text-xs rounded transition-colors">
                      <ThumbsDown className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}

          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-gray-800/50 border border-gray-700 text-gray-400 px-4 py-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="animate-spin">⏳</div>
                  <p className="text-sm">Searching project documents...</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-gray-800/50 border-t border-gray-700 p-4 space-y-3">
        {/* Info Banner */}
        {projectDocuments.length === 0 && (
          <div className="flex gap-2 p-2 bg-amber-500/10 border border-amber-500/30 rounded text-xs text-amber-300">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <p>Upload project documents to enable knowledge base search</p>
          </div>
        )}

        {/* Input Field */}
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder={currentLanguage === 'kn' ? 'ಪ್ರಾಜೆಕ್ಟ್ ಬಗ್ಗೆ ಕೇಳಿ...' : 'Ask about the project...'}
            disabled={isLoading || projectDocuments.length === 0}
            className="flex-1 px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-400 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          />

          {/* Voice Button */}
          <button
            onClick={isListening ? () => recognitionRef.current?.stop() : startVoiceInput}
            disabled={isLoading || projectDocuments.length === 0}
            className={`px-3 py-2.5 rounded-lg border transition-all ${
              isListening
                ? 'bg-red-500/20 border-red-500/50 text-red-300 animate-pulse'
                : 'bg-gray-700 border-gray-600 text-gray-300 hover:border-purple-500/50'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            title={currentLanguage === 'kn' ? 'ಧ್ವನಿ ಇನ್‍ಪುಟ್' : 'Voice input'}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Send Button */}
          <button
            onClick={() => handleSendMessage()}
            disabled={isLoading || !input.trim() || projectDocuments.length === 0}
            className="px-4 py-2.5 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 flex-wrap">
          {['What is the timeline?', 'How much budget?', 'What are the requirements?'].map((action) => (
            <button
              key={action}
              onClick={() => handleSendMessage(action)}
              disabled={isLoading}
              className="text-xs px-3 py-1.5 bg-gray-700/50 border border-gray-600 text-gray-300 rounded hover:border-purple-500/50 hover:text-purple-300 transition-colors disabled:opacity-50"
            >
              {action}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
