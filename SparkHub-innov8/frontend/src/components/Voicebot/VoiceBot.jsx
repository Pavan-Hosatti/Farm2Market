import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Loader2, Volume2, X, MessageCircle, Upload, Video, User, Edit2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ChatHistory from './ChatHistory';
import useVoiceController from '../../hooks/useVoiceController';

const API_BASE_URL = import.meta.env.VITE_API_URL;

// ✅ PROFILE QUESTIONS CONFIGURATION
const profileQuestions = [
  {
    id: 'farmName',
    question: 'ನಿಮ್ಮ ಫಾರ್ಮ್ ಅಥವಾ ವ್ಯವಹಾರದ ಹೆಸರೇನು?',
    field: 'farmName',
    type: 'text',
    example: 'ಉದಾಹರಣೆ: ಶ್ರೀ ಜಗನ್ನಾಥ ಫಾರ್ಮ್, ಗ್ರೀನ್ ಅರ್ಥ್ ಆರ್ಗಾನಿಕ್ಸ್'
  },
  {
    id: 'location',
    question: 'ನಿಮ್ಮ ಸ್ಥಳ (ನಗರ, ರಾಜ್ಯ) ಏನು?',
    field: 'location',
    type: 'text',
    example: 'ಉದಾಹರಣೆ: ಬೆಂಗಳೂರು, ಕರ್ನಾಟಕ'
  },
  {
    id: 'description',
    question: 'ನಿಮ್ಮ ಫಾರ್ಮ್ ಬಗ್ಗೆ ಸಂಕ್ಷಿಪ್ತ ವಿವರಣೆ ನೀಡಿ.',
    field: 'description',
    type: 'textarea',
    example: 'ನಾವು ಆರ್ಗಾನಿಕ್ ರೀತಿಯಲ್ಲಿ ತರಕಾರಿಗಳನ್ನು ಬೆಳೆಸುತ್ತೇವೆ...'
  },
  {
    id: 'phoneNumber',
    question: 'ನಿಮ್ಮ ಫೋನ್ ನಂಬರ್ ಏನು?',
    field: 'phoneNumber',
    type: 'phone',
    example: 'ಉದಾಹರಣೆ: 9876543210'
  },
  {
    id: 'farmSize',
    question: 'ನಿಮ್ಮ ಫಾರ್ಮ್ ಗಾತ್ರ ಎಷ್ಟು?',
    field: 'farmSize',
    type: 'nested',
    example: 'ಉದಾಹರಣೆ: 10 ಎಕರೆ ಅಥವಾ 5 ಹೆಕ್ಟೇರ್'
  },
  {
    id: 'farmingType',
    question: 'ನೀವು ಯಾವ ರೀತಿಯ ಬೇಸಾಯ ಮಾಡುತ್ತೀರಿ?',
    field: 'farmingType',
    type: 'select',
    options: ['organic', 'conventional', 'mixed', 'hydroponic'],
    kannadaOptions: {
      'organic': ['ಆರ್ಗಾನಿಕ್', 'ಸಾವಯವ', 'ನೈಸರ್ಗಿಕ'],
      'conventional': ['ಸಾಂಪ್ರದಾಯಿಕ', 'ಸಾಮಾನ್ಯ', 'ರಾಸಾಯನಿಕ'],
      'mixed': ['ಮಿಶ್ರ', 'ಕೆಲವು ಆರ್ಗಾನಿಕ್ ಕೆಲವು ಸಾಂಪ್ರದಾಯಿಕ'],
      'hydroponic': ['ಹೈಡ್ರೋಪೋನಿಕ್', 'ನೀರಿನಲ್ಲಿ ಬೆಳೆ']
    },
    example: 'ಉದಾಹರಣೆ: ಆರ್ಗಾನಿಕ್, ಸಾಂಪ್ರದಾಯಿಕ, ಮಿಶ್ರ'
  },
  {
    id: 'primaryCrops',
    question: 'ನಿಮ್ಮ ಪ್ರಾಥಮಿಕ ಬೆಳೆಗಳು ಯಾವುವು?',
    field: 'primaryCrops',
    type: 'array',
    example: 'ಉದಾಹರಣೆ: ಟೊಮೇಟೊ, ಆಲೂಗಡ್ಡೆ, ಈರುಳ್ಳಿ, ಕ್ಯಾರೆಟ್'
  },
  {
    id: 'expertise',
    question: 'ನಿಮ್ಮ ಬೇಸಾಯ ಪರಿಣತಿ ಯಾವುದು?',
    field: 'expertise',
    type: 'array',
    example: 'ಉದಾಹರಣೆ: ಆರ್ಗಾನಿಕ್ ಬೇಸಾಯ, ನೀರಾವರಿ ನಿರ್ವಹಣೆ, ಸಸ್ಯ ರಕ್ಷಣೆ'
  }
];

// ✅ ENHANCED CLIENT-SIDE INTENT DETECTOR
const detectLocalIntent = (userText, uploadState, isProfileActive) => {
  if (!userText || typeof userText !== 'string') return null;

  let text = userText.normalize('NFKC').toLowerCase();
  text = text.replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();

  console.log('🔍 Client-side intent detection for:', text);
  console.log('📊 Current upload state:', uploadState.step);

  // ✅ PROFILE QUESTIONING INTENTS
  if (isProfileActive) {
    const profileIntents = [
      { 
        keywords: ['ಹೌದು', 'ಸರಿ', 'yes', 'ok', 'ಸರಿಯಾಗಿದೆ'], 
        action: { type: 'CONFIRM_PROFILE_ANSWER', params: {} }, 
        response: 'ಉತ್ತರ ಸ್ವೀಕರಿಸಲಾಗಿದೆ'
      },
      { 
        keywords: ['ಮುಂದೆ', 'next', 'ಮುಂದಿನ ಪ್ರಶ್ನೆ', 'ಮುಂದುವರಿಸಿ'], 
        action: { type: 'NEXT_PROFILE_QUESTION', params: {} }, 
        response: 'ಮುಂದಿನ ಪ್ರಶ್ನೆಗೆ ಹೋಗುತ್ತಿದೆ'
      },
      { 
        keywords: ['ಹಿಂದೆ', 'back', 'ಹಿಂದಿನ ಪ್ರಶ್ನೆ', 'ಹಿಂದಕ್ಕೆ'], 
        action: { type: 'PREV_PROFILE_QUESTION', params: {} }, 
        response: 'ಹಿಂದಿನ ಪ್ರಶ್ನೆಗೆ ಹೋಗುತ್ತಿದೆ'
      },
      { 
        keywords: ['ರದ್ದು', 'cancel', 'ನಿಲ್ಲಿಸು', 'stop'], 
        action: { type: 'CANCEL_PROFILE', params: {} }, 
        response: 'ಪ್ರೊಫೈಲ್ ಪೂರ್ಣಗೊಳಿಸುವಿಕೆ ರದ್ದುಗೊಳಿಸಲಾಗಿದೆ'
      }
    ];

    for (const intent of profileIntents) {
      for (const kw of intent.keywords) {
        const normalized = kw.normalize('NFKC').toLowerCase()
          .replace(/[^\p{L}\p{N}\s]/gu, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        
        if (text.includes(normalized) && normalized.length > 1) {
          console.log('✅ Profile intent matched:', normalized);
          return intent;
        }
      }
    }
  }

  // ✅ FORM FILLING MODE INTENTS
  if (uploadState.step === 'COLLECTING_INFO' || uploadState.isFormActive) {
    const formIntents = [
      // Crop types
      { 
        keywords: ['ಟೊಮೇಟೊ', 'tomato', 'ಟೊಮೆಟೋ', 'ಟೊಮೇಟೋ'], 
        action: { type: 'SET_CROP_TYPE', params: { value: 'tomato' } }, 
        response: 'ಟೊಮೇಟೊ ಆಯ್ಕೆ ಮಾಡಲಾಗಿದೆ'
      },
      { 
        keywords: ['ಆಲೂಗಡ್ಡೆ', 'potato', 'ಆಲುಗಡ್ಡೆ', 'ಆಲೂ'], 
        action: { type: 'SET_CROP_TYPE', params: { value: 'potato' } }, 
        response: 'ಆಲೂಗಡ್ಡೆ ಆಯ್ಕೆ ಮಾಡಲಾಗಿದೆ'
      },
      { 
        keywords: ['ಈರುಳ್ಳಿ', 'onion', 'ಈರಳ್ಳಿ', 'ಈರುಳಿ'], 
        action: { type: 'SET_CROP_TYPE', params: { value: 'onion' } }, 
        response: 'ಈರುಳ್ಳಿ ಆಯ್ಕೆ ಮಾಡಲಾಗಿದೆ'
      },
      { 
        keywords: ['ಕ್ಯಾರೆಟ್', 'carrot', 'ಕ್ಯಾರೆಟ', 'ಕ್ಯಾರೇಟ್'], 
        action: { type: 'SET_CROP_TYPE', params: { value: 'carrot' } }, 
        response: 'ಕ್ಯಾರೆಟ್ ಆಯ್ಕೆ ಮಾಡಲಾಗಿದೆ'
      },

      // Quantities
      { 
        keywords: ['೧೦ ಕೆಜಿ', '10 kg', '10 kilo', 'ಹತ್ತು ಕೆಜಿ'], 
        action: { type: 'SET_QUANTITY', params: { value: '10' } }, 
        response: '10 ಕೆಜಿ ಗುರುತಿಸಲಾಗಿದೆ'
      },
      { 
        keywords: ['೫೦ ಕೆಜಿ', '50 kg', '50 kilo', 'ಐವತ್ತು ಕೆಜಿ'], 
        action: { type: 'SET_QUANTITY', params: { value: '50' } }, 
        response: '50 ಕೆಜಿ ಗುರುತಿಸಲಾಗಿದೆ'
      },
      { 
        keywords: ['೧೦೦ ಕೆಜಿ', '100 kg', '100 kilo', 'ನೂರು ಕೆಜಿ'], 
        action: { type: 'SET_QUANTITY', params: { value: '100' } }, 
        response: '100 ಕೆಜಿ ಗುರುತಿಸಲಾಗಿದೆ'
      },
      { 
        keywords: ['೨೦೦ ಕೆಜಿ', '200 kg', '200 kilo', 'ಎರಡು ನೂರು ಕೆಜಿ'], 
        action: { type: 'SET_QUANTITY', params: { value: '200' } }, 
        response: '200 ಕೆಜಿ ಗುರುತಿಸಲಾಗಿದೆ'
      },

      // Prices
      { 
        keywords: ['೨೦ ರೂಪಾಯಿ', '20 rupees', '20 rs', 'ಇಪ್ಪತ್ತು ರೂಪಾಯಿ'], 
        action: { type: 'SET_PRICE', params: { value: '20' } }, 
        response: '20 ರೂಪಾಯಿ ಪ್ರತಿ ಕೆಜಿ'
      },
      { 
        keywords: ['೩೦ ರೂಪಾಯಿ', '30 rupees', '30 rs', 'ಮೂವತ್ತು ರೂಪಾಯಿ'], 
        action: { type: 'SET_PRICE', params: { value: '30' } }, 
        response: '30 ರೂಪಾಯಿ ಪ್ರತಿ ಕೆಜಿ'
      },
      { 
        keywords: ['೫೦ ರೂಪಾಯಿ', '50 rupees', '50 rs', 'ಐವತ್ತು ರೂಪಾಯಿ'], 
        action: { type: 'SET_PRICE', params: { value: '50' } }, 
        response: '50 ರೂಪಾಯಿ ಪ್ರತಿ ಕೆಜಿ'
      },
      { 
        keywords: ['೧೦೦ ರೂಪಾಯಿ', '100 rupees', '100 rs', 'ನೂರು ರೂಪಾಯಿ'], 
        action: { type: 'SET_PRICE', params: { value: '100' } }, 
        response: '100 ರೂಪಾಯಿ ಪ್ರತಿ ಕೆಜಿ'
      },

      // Locations
      { 
        keywords: ['ಬೆಂಗಳೂರು', 'bangalore', 'bengaluru', 'ಬೆಂಗಳೂರಿನಲ್ಲಿ'], 
        action: { type: 'SET_LOCATION', params: { value: 'ಬೆಂಗಳೂರು' } }, 
        response: 'ಬೆಂಗಳೂರು ಸ್ಥಳ ಗುರುತಿಸಲಾಗಿದೆ'
      },
      { 
        keywords: ['ಮೈಸೂರು', 'mysore', 'mysuru', 'ಮೈಸೂರಿನಲ್ಲಿ'], 
        action: { type: 'SET_LOCATION', params: { value: 'ಮೈಸೂರು' } }, 
        response: 'ಮೈಸೂರು ಸ್ಥಳ ಗುರುತಿಸಲಾಗಿದೆ'
      },
      { 
        keywords: ['ಹಾಸನ', 'hasan', 'hassan', 'ಹಾಸನದಲ್ಲಿ'], 
        action: { type: 'SET_LOCATION', params: { value: 'ಹಾಸನ' } }, 
        response: 'ಹಾಸನ ಸ್ಥಳ ಗುರುತಿಸಲಾಗಿದೆ'
      },

      // Confirmations
      { 
        keywords: ['ಸರಿ', 'ಹೌದು', 'yes', 'confirm', 'ಸಲ್ಲಿಸು'], 
        action: { type: 'FINAL_CONFIRM', params: {} }, 
        response: 'ಸಲ್ಲಿಸುತ್ತಿದ್ದೇನೆ'
      }
    ];

    for (const intent of formIntents) {
      for (const kw of intent.keywords) {
        const normalized = kw.normalize('NFKC').toLowerCase()
          .replace(/[^\p{L}\p{N}\s]/gu, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        
        if (text.includes(normalized) && normalized.length > 1) {
          console.log('✅ Form intent matched:', normalized);
          return intent;
        }
      }
    }
  }

  // ✅ GENERAL NAVIGATION INTENTS (with profile enhancements)
  const generalIntents = [
    { 
      keywords: ['ಮಾರುಕಟ್ಟೆ', 'marketplace', 'market', 'ಮಾರ್ಕೆಟ್'], 
      action: { type: 'NAVIGATE', params: { route: '/marketplace' } }, 
      response: 'ಮಾರುಕಟ್ಟೆಗೆ ತೆಗೆದುಕೊಂಡು ಹೋಗುತ್ತಿದ್ದೇನೆ'
    },
    { 
      keywords: ['ಪ್ರೊಫೈಲ್', 'ಪ್ರೋಫೈಲ್', 'profile'], 
      action: { type: 'NAVIGATE', params: { route: '/profile' } }, 
      response: 'ನಿಮ್ಮ ಪ್ರೊಫೈಲ್ ತೋರಿಸುತ್ತಿದ್ದೇನೆ'
    },
    { 
      keywords: ['ಡ್ಯಾಶ್', 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್', 'dashboard', 'dash'], 
      action: { type: 'NAVIGATE', params: { route: '/farmer-dashboard' } }, 
      response: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಹೋಗುತ್ತಿದ್ದೇನೆ'
    },
    { 
      keywords: ['ಸೆಟ್ಟಿಂಗ್ಸ್', 'settings'], 
      action: { type: 'NAVIGATE', params: { route: '/settings' } }, 
      response: 'ಸೆಟ್ಟಿಂಗ್ಸ್ ತೆರೆಯಲಾಗುತ್ತಿದೆ'
    },
    { 
      keywords: ['ai ಗ್ರೇಡರ್', 'ai-grader', 'grader', 'ಗ್ರೇಡರ್'], 
      action: { type: 'NAVIGATE', params: { route: '/ai-grader' } }, 
      response: 'AI ಗ್ರೇಡರ್ ತೆರೆಯಲಾಗುತ್ತಿದೆ'
    },
    { 
      keywords: [
        'ವೀಡಿಯೋ ಅಪ್ಲೋಡ್', 'ವಿಡಿಯೋ ಅಪ್ಲೋಡ್', 'ವೀಡಿಯೋ ಅಪ್ಲೊಡ್', 'ವಿಡಿಯೋ ಅಪ್ಲೊಡ್',
        'ವೀಡಿಯೋ', 'ವಿಡಿಯೋ', 'ವೀಡಿಯೋ ಮಾಡಿ', 'ವಿಡಿಯೋ ಮಾಡಿ',
        'ಅಪ್ಲೋಡ್', 'upload video', 'video upload', 'upload', 'video'
      ], 
      action: { type: 'UPLOAD_VIDEO', params: {} }, 
      response: 'ದಯವಿಟ್ಟು ಅಪ್ಲೋಡ್ ಮಾಡಲು ವೀಡಿಯೋವನ್ನು ಆರಿಸಿ'
    },
    { 
      keywords: ['ಪ್ರೊಫೈಲ್ ಪೂರ್ಣಗೊಳಿಸು', 'ಪ್ರೊಫೈಲ್ ಭರ್ತಿ ಮಾಡು', 'ಪ್ರೊಫೈಲ್ ತುಂಬಿಸು', 'complete profile'], 
      action: { type: 'COMPLETE_PROFILE', params: {} }, 
      response: 'ನಿಮ್ಮ ಪ್ರೊಫೈಲ್ ಅನ್ನು ಪೂರ್ಣಗೊಳಿಸಲು ಪ್ರಾರಂಭಿಸುತ್ತಿದ್ದೇನೆ'
    },
    { 
      keywords: ['ಪ್ರೊಫೈಲ್ ಸಂಪಾದಿಸು', 'edit profile', 'ಪ್ರೊಫೈಲ್ ಬದಲಾಯಿಸು'], 
      action: { type: 'EDIT_PROFILE', params: {} }, 
      response: 'ಪ್ರೊಫೈಲ್ ಸಂಪಾದನೆಗೆ ತೆಗೆದುಕೊಂಡು ಹೋಗುತ್ತಿದ್ದೇನೆ'
    },
    { 
      keywords: ['ಹೌದು', 'yes', 'ok', 'confirm', 'ಸರಿ'], 
      action: { type: 'CONFIRM_UPLOAD', params: {} }, 
      response: 'ಸರಿಯಾಗಿದೆ, ಮುಂದುವರೆಯುತ್ತಿದ್ದೇನೆ'
    },
    { 
      keywords: ['ಇಲ್ಲ', 'no', 'cancel', 'ರದ್ದು'], 
      action: { type: 'CANCEL', params: {} }, 
      response: 'ರದ್ದೆಯಾಯಿತು'
    },
    { 
      keywords: ['ಗ್ರೇಡ್', 'generate grade', 'grade'], 
      action: { type: 'FINAL_CONFIRM', params: {} }, 
      response: 'ಗ್ರೇಡ್ ಉತ್ಪಾದನೆಯನ್ನು ಪ್ರಾರಂಭಿಸುತ್ತಿದ್ದೇನೆ'
    },
    { 
      keywords: ['ಲಾಗ್ ಔಟ್', 'logout', 'log out'], 
      action: { type: 'LOGOUT', params: {} }, 
      response: 'ನಿಮ್ಮನ್ನು ಲಾಗ್ಔಟ್ ಮಾಡುತ್ತಿದ್ದೇನೆ'
    }
  ];

  for (const intent of generalIntents) {
    for (const kw of intent.keywords) {
      const normalized = kw.normalize('NFKC').toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      if (text === normalized || 
          text.includes(normalized) && normalized.length > 2 ||
          new RegExp(`\\b${normalized}\\b`).test(text)) {
        console.log('✅ General intent matched:', normalized);
        return intent;
      }
    }
  }

  return null;
};

const VoiceBot = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversation, setConversation] = useState([]);
  const [error, setError] = useState(null);
  const [sessionId] = useState(`session_${Date.now()}`);
  const [showTextPreview, setShowTextPreview] = useState('');
  
  // ✅ PROFILE STATE MANAGEMENT
  const [currentPage, setCurrentPage] = useState('');
  const [isProfileActive, setIsProfileActive] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1);
  const [profileAnswers, setProfileAnswers] = useState({});
  const [profileData, setProfileData] = useState(null);
  
  const { 
    executeAction, 
    uploadState, 
    setUploadState,
    autoFillField,
    askNextQuestion 
  } = useVoiceController();
  
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);
  const textPreviewTimeoutRef = useRef(null);

  // ✅ EXTRACT ANSWER FROM KANNADA TEXT
  const extractAnswerByType = (kannadaText, question) => {
    if (!kannadaText) return '';
    
    const text = kannadaText.toLowerCase();
    console.log('🔍 Extracting answer for:', question.id, 'Text:', text);
    
    switch (question.type) {
      case 'phone':
        // Extract numbers from Kannada text
        const numbers = text.match(/\d+/g);
        return numbers ? numbers.join('') : '';
        
      case 'select':
        // Map Kannada words to English options
        if (question.kannadaOptions) {
          for (const [key, kannadaWords] of Object.entries(question.kannadaOptions)) {
            if (kannadaWords.some(word => text.includes(word))) {
              console.log('✅ Selected option:', key);
              return key;
            }
          }
        }
        return 'conventional';
        
      case 'array':
        // Split by commas or Kannada conjunctions
        const splitPattern = /,|ಮತ್ತು|ಅಥವಾ|ಹಾಗೂ/;
        const items = text.split(splitPattern).map(item => item.trim()).filter(item => item);
        console.log('✅ Extracted array:', items);
        return items;
        
      case 'nested':
        // Extract farm size and unit
        const sizeMatch = text.match(/(\d+)\s*(ಎಕರೆ|ಹೆಕ್ಟೇರ್|ಏಕರ|hectare|acre)/i);
        if (sizeMatch) {
          const unit = sizeMatch[2].includes('ಹೆಕ್ಟೇರ್') || sizeMatch[2].includes('hectare') 
            ? 'hectares' 
            : 'acres';
          console.log('✅ Extracted farm size:', sizeMatch[1], unit);
          return {
            value: sizeMatch[1],
            unit: unit
          };
        }
        return { value: '', unit: 'acres' };
        
      default:
        // For text and textarea fields
        console.log('✅ Returning text as-is:', kannadaText);
        return kannadaText;
    }
  };

  // ✅ AUTO-FILL PROFILE FORM
  const autoFillProfileForm = (answers) => {
    console.log('🤖 Auto-filling profile form with:', answers);
    
    // First, ensure we're in edit mode
    const editButton = document.querySelector('[data-profile-edit="true"]');
    if (editButton && !document.querySelector('form')) {
      editButton.click();
      
      // Wait for form to appear
      setTimeout(() => fillFormFields(answers), 1000);
    } else if (document.querySelector('form')) {
      // Already in edit mode
      fillFormFields(answers);
    } else {
      console.error('❌ Cannot find profile edit form');
      const errorMessage = {
        role: 'assistant',
        text: 'ಪ್ರೊಫೈಲ್ ಸಂಪಾದನೆ ಫಾರ್ಮ್ ಕಂಡುಬಂದಿಲ್ಲ. ದಯವಿಟ್ಟು ಮ್ಯಾನ್ಯುವಲ್ ಆಗಿ ಸಂಪಾದಿಸಿ.',
        timestamp: Date.now()
      };
      setConversation(prev => [...prev, errorMessage]);
      speakText(errorMessage.text);
    }
  };

  const fillFormFields = (answers) => {
    console.log('🔧 Filling form fields...');
    
    // Field mapping from question IDs to form field names
    const fieldMapping = {
      farmName: 'farmName',
      location: 'location',
      description: 'description',
      phoneNumber: 'phoneNumber',
      whatsappNumber: 'whatsappNumber',
      farmingType: 'farmingType',
      primaryCrops: 'primaryCrops',
      expertise: 'expertise'
    };
    
    let filledCount = 0;
    
    // Fill each field
    Object.entries(answers).forEach(([questionId, value]) => {
      const fieldName = fieldMapping[questionId];
      if (!fieldName) return;
      
      if (questionId === 'farmSize' && typeof value === 'object') {
        // Handle farmSize specially
        const sizeInputs = document.querySelectorAll('input[name*="farmSize"]');
        const unitSelect = document.querySelector('select[name*="unit"]');
        
        if (sizeInputs.length > 0 && value.value) {
          sizeInputs[0].value = value.value;
          sizeInputs[0].dispatchEvent(new Event('input', { bubbles: true }));
          filledCount++;
        }
        if (unitSelect && value.unit) {
          unitSelect.value = value.unit;
          unitSelect.dispatchEvent(new Event('change', { bubbles: true }));
          filledCount++;
        }
      } else {
        const input = document.querySelector(`[name="${fieldName}"]`) || 
                      document.querySelector(`input[name*="${fieldName}"]`) ||
                      document.querySelector(`textarea[name*="${fieldName}"]`);
        
        if (input) {
          if (Array.isArray(value)) {
            input.value = value.join(', ');
          } else {
            input.value = value;
          }
          
          // Trigger change events
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
          filledCount++;
          console.log(`✅ Filled ${fieldName}:`, value);
        }
      }
    });
    
    // Show success message
    const successMessage = {
      role: 'assistant',
      text: `ನಿಮ್ಮ ಪ್ರೊಫೈಲ್ ಫಾರ್ಮ್ನ ${filledCount} ಫೀಲ್ಡ್‌ಗಳನ್ನು ಸ್ವಯಂಚಾಲಿತವಾಗಿ ತುಂಬಿಸಲಾಗಿದೆ. ನಿಮಗೆ ಬೇಕಾದರೆ ಮಾರ್ಪಾಡು ಮಾಡಿ ಮತ್ತು ಸಲ್ಲಿಸಿ.`,
      timestamp: Date.now()
    };
    
    setConversation(prev => [...prev, successMessage]);
    speakText(successMessage.text);
    
    // Reset profile questioning state
    setIsProfileActive(false);
    setCurrentQuestionIndex(-1);
    setProfileAnswers({});
  };

  // ✅ PROFILE QUESTIONING LOGIC
  const startProfileQuestioning = () => {
    console.log('🎯 Starting profile questioning...');
    setIsProfileActive(true);
    setCurrentQuestionIndex(-1);
    setProfileAnswers({});
    
    const welcomeMessage = {
      role: 'assistant',
      text: 'ನಿಮ್ಮ ಪ್ರೊಫೈಲ್ ಅನ್ನು ಪೂರ್ಣಗೊಳಿಸೋಣ. ಪ್ರತಿ ಪ್ರಶ್ನೆಗೆ ಉತ್ತರಿಸಿ, ಅಥವಾ "ರದ್ದು" ಎಂದು ಹೇಳಿ ಪ್ರಕ್ರಿಯೆಯನ್ನು ನಿಲ್ಲಿಸಿ.',
      timestamp: Date.now()
    };
    
    setConversation(prev => [...prev, welcomeMessage]);
    speakText(welcomeMessage.text);
    
    // Start asking questions after 2 seconds
    setTimeout(() => askNextProfileQuestion(), 2000);
  };

  const askNextProfileQuestion = () => {
    if (!isProfileActive) return;
    
    if (currentQuestionIndex < profileQuestions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      
      const question = profileQuestions[nextIndex];
      const questionMessage = {
        role: 'assistant',
        text: `ಪ್ರಶ್ನೆ ${nextIndex + 1}/${profileQuestions.length}: ${question.question} ${question.example ? `(${question.example})` : ''}`,
        timestamp: Date.now(),
        isProfileQuestion: true,
        questionId: question.id
      };
      
      setConversation(prev => [...prev, questionMessage]);
      speakText(questionMessage.text);
    } else {
      // All questions asked, summarize and auto-fill
      summarizeAndConfirmProfile();
    }
  };

  const processProfileAnswer = (answerText, questionId) => {
    console.log('📝 Processing profile answer for:', questionId, 'Answer:', answerText);
    
    const question = profileQuestions.find(q => q.id === questionId);
    if (!question) return;
    
    // Extract and format answer
    const processedAnswer = extractAnswerByType(answerText, question);
    
    // Save answer
    setProfileAnswers(prev => ({
      ...prev,
      [questionId]: processedAnswer
    }));
    
    // Show confirmation
    const confirmationMessage = {
      role: 'assistant',
      text: 'ಉತ್ತರ ಸ್ವೀಕರಿಸಲಾಗಿದೆ. ಮುಂದಿನ ಪ್ರಶ್ನೆಗೆ ಹೋಗುತ್ತಿದೆ...',
      timestamp: Date.now()
    };
    
    setConversation(prev => [...prev, confirmationMessage]);
    speakText(confirmationMessage.text);
    
    // Ask next question after a delay
    setTimeout(() => askNextProfileQuestion(), 1500);
  };

  const summarizeAndConfirmProfile = () => {
    console.log('📋 Summarizing profile answers:', profileAnswers);
    
    // Create summary
    let summary = 'ನೀವು ನೀಡಿದ ಉತ್ತರಗಳ ಸಾರಾಂಶ:\n';
    Object.entries(profileAnswers).forEach(([questionId, answer]) => {
      const question = profileQuestions.find(q => q.id === questionId);
      if (question && answer) {
        const displayAnswer = Array.isArray(answer) ? answer.join(', ') : 
                             (typeof answer === 'object' ? `${answer.value} ${answer.unit}` : answer);
        summary += `• ${question.question}: ${displayAnswer}\n`;
      }
    });
    
    const summaryMessage = {
      role: 'assistant',
      text: `${summary}\n\nಈಗ ನಾನು ನಿಮ್ಮ ಪ್ರೊಫೈಲ್ ಫಾರ್ಮ್ ಅನ್ನು ಸ್ವಯಂಚಾಲಿತವಾಗಿ ತುಂಬಿಸುತ್ತೇನೆ. ದಯವಿಟ್ಟು ಸ್ವಲ್ಪ ಸಮಯ ನಿರೀಕ್ಷಿಸಿ...`,
      timestamp: Date.now()
    };
    
    setConversation(prev => [...prev, summaryMessage]);
    speakText(summaryMessage.text);
    
    // Auto-fill the form after speaking
    setTimeout(() => autoFillProfileForm(profileAnswers), 3000);
  };

  // ✅ PAGE STATE DETECTION
  useEffect(() => {
    const detectPageState = () => {
      const path = window.location.pathname;
      setCurrentPage(path);
      
      if (path === '/profile') {
        // Check if we're on profile page
        const hasProfileElements = document.querySelector('[data-profile-edit="true"]') || 
                                   document.querySelector('.profile-container') ||
                                   document.title.includes('Profile');
        
        if (hasProfileElements && !isProfileActive) {
          // Check if profile is incomplete
          const incompleteIndicator = document.querySelector('.profile-incomplete') ||
                                     document.querySelector('form') ||
                                     (document.querySelector('.profile-stats') && 
                                      document.querySelector('.profile-stats').textContent.includes('0%'));
          
          if (incompleteIndicator) {
            console.log('🎯 Detected incomplete profile on profile page');
            // Don't auto-start, but set state
            setIsProfileActive(false);
          }
        }
      }
    };
    
    // Initial detection
    detectPageState();
    
    // Listen for URL changes
    const observer = new MutationObserver(detectPageState);
    observer.observe(document.body, { childList: true, subtree: true });
    
    // Listen for hash changes
    window.addEventListener('hashchange', detectPageState);
    
    return () => {
      observer.disconnect();
      window.removeEventListener('hashchange', detectPageState);
    };
  }, [isProfileActive]);

  // ✅ MAIN EFFECT FOR SPEECH RECOGNITION
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('Speech recognition not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'kn-IN';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      console.log('🎤 Speech recognition started');
      setIsListening(true);
      setError(null);
      setShowTextPreview('');
    };

    recognition.onresult = async (event) => {
      if (event.results[0].isFinal) {
        const transcript = event.results[0][0].transcript;
        const confidence = event.results[0][0].confidence;
        
        console.log('📝 Final transcript:', transcript);
        console.log('📊 Confidence:', confidence);
        
        setIsListening(false);
        setShowTextPreview('');
        await processUserInput(transcript);
      } else {
        const interim = event.results[0][0].transcript;
        setShowTextPreview(interim);
      }
    };

    recognition.onerror = (event) => {
      console.error('❌ Speech recognition error:', event.error);
      setIsListening(false);
      setShowTextPreview('');
      
      if (event.error === 'no-speech') {
        setError('ಮಾತು ಕಂಡುಬಂದಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ');
      } else if (event.error === 'not-allowed') {
        setError('ಮೈಕ್ರೊಫೋನ್ ಪ್ರವೇಶ ನಿರಾಕರಿಸಲಾಗಿದೆ. ದಯವಿಟ್ಟು ಅನುಮತಿಗಳನ್ನು ಸಕ್ರಿಯಗೊಳಿಸಿ');
      } else {
        setError('ಮಾತಿನ ಗುರುತಿಸುವಿಕೆ ದೋಷ: ' + event.error);
      }
    };

    recognition.onend = () => {
      console.log('🛑 Speech recognition ended');
      setIsListening(false);
      if (!showTextPreview) {
        setShowTextPreview('');
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
      if (textPreviewTimeoutRef.current) {
        clearTimeout(textPreviewTimeoutRef.current);
      }
    };
  }, [t]);

  // ✅ SPEECH SYNTHESIS
  const speakText = useCallback((text) => {
    try {
      if (synthRef.current) {
        synthRef.current.cancel();
      }

      const speakWithVoice = () => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'kn-IN';
        utterance.rate = 0.85;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        const voices = synthRef.current.getVoices();
        const kannadaVoice = voices.find(voice => 
          voice.lang === 'kn-IN' || 
          voice.lang === 'kn' ||
          voice.name.toLowerCase().includes('kannada')
        );
        
        if (kannadaVoice) {
          utterance.voice = kannadaVoice;
        }

        utterance.onstart = () => console.log('🔊 Speaking:', text);
        utterance.onerror = (event) => console.error('❌ Speech synthesis error:', event.error);

        synthRef.current.speak(utterance);
      };

      if (synthRef.current.getVoices().length === 0) {
        synthRef.current.onvoiceschanged = speakWithVoice;
      } else {
        speakWithVoice();
      }
    } catch (err) {
      console.error('Speech synthesis error:', err);
    }
  }, []);

  // ✅ GRADE RESULT HANDLER
  useEffect(() => {
    const handleGradeResult = (event) => {
      const grade = event.detail;
      console.log('🎯 Grade result received:', grade);
      
      const gradeMessage = {
        role: 'assistant',
        text: `🎉 ಅಭಿನಂದನೆಗಳು! ನಿಮ್ಮ ಬೆಳೆಗೆ ಗ್ರೇಡ್ ${grade.grade} ಸಿಕ್ಕಿದೆ! ಗುಣಮಟ್ಟ ಸ್ಕೋರ್: ${grade.qualityScore}%  ಮಾರುಕಟ್ಟೆ ವಿಭಾಗಕ್ಕೆ ಹೋಗಿ`,
        timestamp: Date.now(),
        gradeData: grade
      };
      
      setConversation(prev => [...prev, gradeMessage]);
      speakText(gradeMessage.text);
    };
    
    window.addEventListener('gradeResultReceived', handleGradeResult);
    
    return () => {
      window.removeEventListener('gradeResultReceived', handleGradeResult);
    };
  }, [speakText]);

  // ✅ PROCESS USER INPUT
  const processUserInput = async (userText) => {
    setIsProcessing(true);
    setError(null);

    // Add user message to conversation
    const userMessage = {
      role: 'user',
      text: userText,
      timestamp: Date.now(),
      isVoice: true
    };

    setConversation(prev => [...prev, userMessage]);

    try {
      console.log('🚀 Processing:', userText);
      console.log('📊 Profile active:', isProfileActive);
      console.log('📊 Current question index:', currentQuestionIndex);

      // ✅ CHECK IF PROCESSING PROFILE QUESTION ANSWER
      if (isProfileActive && currentQuestionIndex >= 0) {
        const lastAssistantMessage = conversation.filter(msg => msg.role === 'assistant').pop();
        if (lastAssistantMessage && lastAssistantMessage.isProfileQuestion) {
          console.log('🎯 Processing profile question answer');
          processProfileAnswer(userText, lastAssistantMessage.questionId);
          setIsProcessing(false);
          return;
        }
      }

      // ✅ Check for automation commands
      if (userText.includes('ಸ್ವಯಂಚಾಲಿತ') || userText.includes('auto')) {
        const aiMessage = {
          role: 'assistant',
          text: 'ಸ್ವಯಂಚಾಲಿತ ಮೋಡ್ ಪ್ರಾರಂಭಿಸಲಾಗುತ್ತಿದೆ...',
          timestamp: Date.now()
        };
        setConversation(prev => [...prev, aiMessage]);
        speakText(aiMessage.text);
        
        setTimeout(() => {
          executeAction({ type: 'UPLOAD_VIDEO' }, speakText);
        }, 1000);
        
        setIsProcessing(false);
        return;
      }

      // ✅ Try local intent detection first (with profile context)
      const localIntent = detectLocalIntent(userText, uploadState, isProfileActive);
      
      if (localIntent) {
        console.log('🎯 Local intent detected!', localIntent.action);
        
        const aiMessage = {
          role: 'assistant',
          text: localIntent.response,
          timestamp: Date.now()
        };

        setConversation(prev => [...prev, aiMessage]);

        // Handle profile-specific intents
        switch (localIntent.action.type) {
          case 'COMPLETE_PROFILE':
            startProfileQuestioning();
            break;
            
          case 'EDIT_PROFILE':
            // Navigate to profile and start editing
            if (window.location.pathname !== '/profile') {
              window.location.href = '/profile';
              setTimeout(startProfileQuestioning, 2000);
            } else {
              startProfileQuestioning();
            }
            break;
            
          case 'CANCEL_PROFILE':
            setIsProfileActive(false);
            setCurrentQuestionIndex(-1);
            setProfileAnswers({});
            speakText('ಪ್ರೊಫೈಲ್ ಪೂರ್ಣಗೊಳಿಸುವಿಕೆ ರದ್ದುಗೊಳಿಸಲಾಗಿದೆ');
            break;
            
          default:
            executeAction(localIntent.action, speakText, userText);
        }
        
        setIsProcessing(false);
        return;
      }

      // ✅ Fallback to backend API
      console.log('💬 No local intent, calling backend API...');
      
      const history = conversation.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      }));

      const token = localStorage.getItem('token') || localStorage.getItem('authToken') || null;
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(`${API_BASE_URL}/voice/query`, {
        method: 'POST',
        headers,
        credentials: 'include',
        signal: controller.signal,
        body: JSON.stringify({
          text: userText,
          sessionId: sessionId,
          conversationHistory: history,
          currentPage: currentPage,
          isProfileActive: isProfileActive
        })
      });

      clearTimeout(timeoutId);
      
      const data = await response.json();
      console.log('📦 Response:', data);

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to process query');
      }

      if (data.success) {
        const aiMessage = {
          role: 'assistant',
          text: data.data.aiText || '',
          timestamp: Date.now()
        };

        setConversation(prev => [...prev, aiMessage]);

        if (data.data.action) {
          console.log('🎯 Executing backend action:', data.data.action);
          executeAction(data.data.action, speakText, userText);
        } else {
          speakText(aiMessage.text);
        }
      }
    } catch (err) {
      console.error('❌ Error:', err);
      
      let errorMsg = 'ಕ್ಷಮಿಸಿ, ನಾನು ಅರ್ಥಮಾಡಿಕೊಳ್ಳಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೊಮ್ಮೆ ಪ್ರಯತ್ನಿಸಿ';
      
      if (err.name === 'AbortError') {
        errorMsg = 'ಸರ್ವರ್ ಪ್ರತಿಕ್ರಿಯಿಸುತ್ತಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೊಮ್ಮೆ ಪ್ರಯತ್ನಿಸಿ';
      }
      
      const errorMessage = {
        role: 'assistant',
        text: errorMsg,
        timestamp: Date.now()
      };
      
      setConversation(prev => [...prev, errorMessage]);
      speakText(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  // ✅ HANDLE LISTENING
  const handleStartListening = () => {
    if (!recognitionRef.current) {
      setError('Speech recognition not available');
      return;
    }

    try {
      setError(null);
      setShowTextPreview('');
      recognitionRef.current.start();
    } catch (err) {
      console.error('Error starting recognition:', err);
      setError('ಮಾತಿನ ಗುರುತಿಸುವಿಕೆ ಪ್ರಾರಂಭಿಸಲು ವಿಫಲವಾಗಿದೆ');
    }
  };

  const handleStopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setShowTextPreview('');
  };

  // ✅ CLEAR CONVERSATION
  const handleClearConversation = () => {
    setConversation([]);
    setIsProfileActive(false);
    setCurrentQuestionIndex(-1);
    setProfileAnswers({});
    if (synthRef.current) {
      synthRef.current.cancel();
    }
  };

  // ✅ QUICK COMMANDS
  const quickCommands = [
    { 
      text: 'ವೀಡಿಯೋ ಅಪ್ಲೋಡ್ ಮಾಡಿ', 
      label: 'Upload Video', 
      icon: '📹',
      automation: true 
    },
    { 
      text: 'ಪ್ರೊಫೈಲ್ ಪೂರ್ಣಗೊಳಿಸು',
      label: 'Complete Profile', 
      icon: '👤',
      onClick: () => {
        if (window.location.pathname !== '/profile') {
          window.location.href = '/profile';
          setTimeout(() => {
            const welcomeMessage = {
              role: 'assistant',
              text: 'ಪ್ರೊಫೈಲ್ ಪುಟಕ್ಕೆ ತೆಗೆದುಕೊಂಡು ಹೋಗಲಾಗಿದೆ. ಪ್ರೊಫೈಲ್ ಪೂರ್ಣಗೊಳಿಸಲು ಪ್ರಾರಂಭಿಸುತ್ತಿದ್ದೇನೆ...',
              timestamp: Date.now()
            };
            setConversation(prev => [...prev, welcomeMessage]);
            speakText(welcomeMessage.text);
            setTimeout(startProfileQuestioning, 2000);
          }, 1000);
        } else {
          startProfileQuestioning();
        }
      }
    },
    { 
      text: 'ಮಾರುಕಟ್ಟೆ ತೆರೆಯಿರಿ', 
      label: 'Marketplace', 
      icon: '🛒',
      onClick: () => processUserInput('ಮಾರುಕಟ್ಟೆ ತೆರೆಯಿರಿ')
    },
    { 
      text: 'ಪ್ರೊಫೈಲ್ ತೋರಿಸು', 
      label: 'Profile', 
      icon: '👤',
      onClick: () => processUserInput('ಪ್ರೊಫೈಲ್ ತೋರಿಸು')
    },
    { 
      text: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್', 
      label: 'Dashboard', 
      icon: '📊',
      onClick: () => processUserInput('ಡ್ಯಾಶ್‌ಬೋರ್ಡ್')
    }
  ];

  return (
    <>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 p-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-full shadow-2xl hover:shadow-emerald-500/50 transition-all duration-300"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-24 right-6 z-40 w-[400px] h-[600px] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-emerald-200 dark:border-emerald-700 overflow-hidden flex flex-col"
          >
            <div className="bg-gradient-to-r from-emerald-500 to-green-600 p-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-5 h-5" />
                  <h3 className="font-bold text-lg">{t('Voice Assistant')}</h3>
                  {isProfileActive && (
                    <span className="px-2 py-1 bg-white/20 rounded-full text-xs flex items-center gap-1">
                      <User className="w-3 h-3" />
                      <span>ಪ್ರೊಫೈಲ್</span>
                    </span>
                  )}
                </div>
                {conversation.length > 0 && (
                  <button
                    onClick={handleClearConversation}
                    className="text-sm px-3 py-1 bg-white/20 rounded-full hover:bg-white/30 transition"
                  >
                    {t('Clear')}
                  </button>
                )}
              </div>
              
              {/* ✅ STATUS DISPLAY */}
              <div className="mt-1">
                {isProfileActive && (
                  <div className="text-xs bg-blue-50 dark:bg-blue-900/30 rounded px-2 py-1 flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-blue-700 dark:text-blue-300">
                      ಪ್ರಶ್ನೆ {currentQuestionIndex + 1}/{profileQuestions.length}
                    </span>
                  </div>
                )}
                {uploadState.step !== 'IDLE' && !isProfileActive && (
                  <div className="text-xs bg-blue-50 dark:bg-blue-900/30 rounded px-2 py-1 flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-blue-700 dark:text-blue-300">
                      {uploadState.automationStep === 1 && '📤 ಪುಟಕ್ಕೆ ಹೋಗುತ್ತಿದೆ...'}
                      {uploadState.automationStep === 2 && '📁 ವೀಡಿಯೋ ಆಯ್ಕೆಗಾಗಿ ಕಾಯಲಾಗುತ್ತಿದೆ...'}
                      {uploadState.automationStep === 3 && '✅ ವೀಡಿಯೋ ಆಯ್ಕೆಯಾಗಿದೆ'}
                      {uploadState.automationStep >= 4 && uploadState.automationStep <= 10 && '🤖 ಸ್ವಯಂಚಾಲಿತ ಫಾರ್ಮ್ ತುಂಬಿಸಲಾಗುತ್ತಿದೆ...'}
                      {uploadState.automationStep === 11 && '📤 ಸಲ್ಲಿಸಲಾಗುತ್ತಿದೆ...'}
                      {uploadState.automationStep === 12 && '🎉 ಪೂರ್ಣಗೊಂಡಿದೆ! ಗ್ರೇಡ್ ಪಡೆದುಕೊಳ್ಳಿ'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* ✅ TEXT PREVIEW AREA */}
            {showTextPreview && (
              <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border-y border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                    ನೀವು ಹೇಳಿದ್ದು: "{showTextPreview}"
                  </span>
                </div>
              </div>
            )}

            {/* ✅ QUICK COMMANDS */}
            <div className="px-4 py-2 bg-gray-50 dark:bg-slate-700 border-b border-gray-200 dark:border-slate-600">
              <div className="flex flex-wrap gap-2">
                {quickCommands.map((cmd, index) => (
                  <button
                    key={index}
                    onClick={cmd.onClick || (() => processUserInput(cmd.text))}
                    className="px-3 py-1 text-xs bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 rounded-full hover:bg-emerald-200 dark:hover:bg-emerald-800 transition flex items-center gap-1"
                    disabled={isProcessing || isListening}
                  >
                    <span>{cmd.icon}</span>
                    <span>{cmd.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* ✅ CHAT HISTORY */}
            <div className="flex-1 overflow-y-auto">
              <ChatHistory 
                conversation={conversation}
                onPlayAudio={speakText}
                isProfileActive={isProfileActive}
                currentQuestionIndex={currentQuestionIndex}
                totalQuestions={profileQuestions.length}
              />
            </div>

            {/* ✅ ERROR DISPLAY */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-4 py-2 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm"
              >
                {error}
              </motion.div>
            )}

            {/* ✅ CONTROLS */}
            <div className="p-4 bg-gray-50 dark:bg-slate-900 border-t border-gray-200 dark:border-slate-700">
              <div className="flex items-center justify-center gap-4">
                <motion.button
                  onClick={isListening ? handleStopListening : handleStartListening}
                  disabled={isProcessing}
                  className={`relative p-6 rounded-full transition-all duration-300 ${
                    isListening
                      ? 'bg-red-500 hover:bg-red-600'
                      : 'bg-emerald-500 hover:bg-emerald-600'
                  } text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed`}
                  whileHover={{ scale: isProcessing ? 1 : 1.1 }}
                  whileTap={{ scale: isProcessing ? 1 : 0.95 }}
                >
                  {isListening && (
                    <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping top-0 left-0"></span>
                  )}
                  {isProcessing ? (
                    <Loader2 className="w-8 h-8 animate-spin relative z-10" />
                  ) : isListening ? (
                    <MicOff className="w-8 h-8 relative z-10" />
                  ) : (
                    <Mic className="w-8 h-8 relative z-10" />
                  )}
                </motion.button>
              </div>

              <div className="text-center mt-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  {isProcessing
                    ? 'ಪ್ರೊಸೆಸ್ ಆಗುತ್ತಿದೆ...'
                    : isListening
                    ? 'ಕೇಳುತ್ತಿದ್ದೇನೆ... ಮಾತನಾಡಿ'
                    : isProfileActive && currentQuestionIndex >= 0
                    ? profileQuestions[currentQuestionIndex]?.question
                    : uploadState.step === 'COLLECTING_INFO'
                    ? `${uploadState.currentQuestion === 'cropType' ? 'ಬೆಳೆ ಪ್ರಕಾರ?' : 
                        uploadState.currentQuestion === 'quantity' ? 'ಪ್ರಮಾಣ?' :
                        uploadState.currentQuestion === 'price' ? 'ಬೆಲೆ?' :
                        uploadState.currentQuestion === 'location' ? 'ಸ್ಥಳ?' :
                        'ಉತ್ತರ ನೀಡಿ'}`
                    : 'ಮಾತನಾಡಲು ಮೈಕ್ರೊಫೋನ್ ಒತ್ತಿ'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {isProfileActive && currentQuestionIndex >= 0
                    ? profileQuestions[currentQuestionIndex]?.example || 'ಉತ್ತರ ನೀಡಿ'
                    : uploadState.step === 'COLLECTING_INFO' 
                    ? 'ಉದಾಹರಣೆ: "ಆಲೂಗಡ್ಡೆ", "೫೦ ಕೆಜಿ", "೩೦ ರೂಪಾಯಿ", "ಬೆಂಗಳೂರು"'
                    : 'ಹೇಳಿ: "ವೀಡಿಯೋ ಅಪ್ಲೋಡ್", "ಮಾರುಕಟ್ಟೆ", "ಪ್ರೊಫೈಲ್ ಪೂರ್ಣಗೊಳಿಸು"'}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default VoiceBot;
