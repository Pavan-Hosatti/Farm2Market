// services/voiceService.js - ENHANCED WITH FORM FILLING INTENTS
require('dotenv').config();
const axios = require('axios');
const CropListing = require('../models/CropListing');
const Bid = require('../models/Bid');
const Farmer = require('../models/Farmer');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY not found in environment');
  console.warn('⚠️ Voice service will use fallback responses only');
} else {
  console.log('✅ API Key loaded:', GEMINI_API_KEY.substring(0, 10) + '...');
}

console.log('✅ API Key loaded:', GEMINI_API_KEY.substring(0, 10) + '...');

let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 6000;
const requestCount = { count: 0, resetTime: Date.now() + 60000 };
const MAX_REQUESTS_PER_MINUTE = 10;

// Enhanced system prompt for form filling
const INTENT_SYSTEM_PROMPT = `You are a helpful Kannada voice assistant for Farm2Market.

RULES:
1. ALWAYS respond in Kannada (ಕನ್ನಡ) 
2. Keep responses SHORT (1-2 sentences max)
3. Be friendly and conversational
4. Answer any questions naturally - farming, weather, crops, prices, general topics
5. If user asks about their crops/data, use the farmer context provided
6. NEVER say "I can't do that" or "I'm an AI" - just answer naturally
7. You are a helpful assistant who can discuss anything

Examples:
User: "ಹೇಗಿದ್ದೀರಿ?"
Response: "ನಾನು ಚೆನ್ನಾಗಿದ್ದೇನೆ! ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?"

User: "ಇಂದು ಹವಾಮಾನ ಹೇಗಿದೆ?"
Response: "ಇಂದು ಸುಮಾರು ಉತ್ತಮ ಹವಾಮಾನವಿದೆ. ಬೆಳೆಗಳಿಗೆ ಒಳ್ಳೆಯ ದಿನ!"

User: "ಟೊಮೇಟೋ ಬೆಲೆ ಎಷ್ಟು?"
Response: "ಟೊಮೇಟೋ ಬೆಲೆ ಈಗ ಸುಮಾರು 30-40 ರೂಪಾಯಿ ಪ್ರತಿ ಕೆಜಿ ಇದೆ"

User: "ನನ್ನ ಬೆಳೆಗಳು ಹೇಗಿವೆ?"
Response: "ನಿಮ್ಮ ಬೆಳೆಗಳು ಚೆನ್ನಾಗಿವೆ!"`;


   
             // ✅ SMART FALLBACK RESPONSES (when Gemini quota is exhausted)
function getSmartFallback(userText) {
  const text = userText.toLowerCase();
  
  // Greetings
  if (text.includes('ನಮಸ್ಕಾರ') || text.includes('ಹಲೋ') || text.includes('ಹಾಯ್')) {
    return 'ನಮಸ್ಕಾರ! ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?';
  }
  
  // How are you
  if (text.includes('ಹೇಗಿದ್ದೀರಿ') || text.includes('ಹೇಗಿದ್ದೀಯ')) {
    return 'ನಾನು ಚೆನ್ನಾಗಿದ್ದೇನೆ! ಧನ್ಯವಾದಗಳು. ನೀವು ಹೇಗಿದ್ದೀರಿ?';
  }
  
  // Weather
  if (text.includes('ಹವಾಮಾನ') || text.includes('weather')) {
    return 'ಹವಾಮಾನದ ಬಗ್ಗೆ ನಿಖರ ಮಾಹಿತಿಗಾಗಿ, ದಯವಿಟ್ಟು ಹವಾಮಾನ ಅಪ್ಲಿಕೇಶನ್ ಪರಿಶೀಲಿಸಿ.';
  }
  
  // Prices
  if (text.includes('ಬೆಲೆ') || text.includes('price')) {
    return 'ಬೆಲೆಗಳನ್ನು ನೋಡಲು "ಮಾರುಕಟ್ಟೆ ತೆರೆಯಿರಿ" ಎಂದು ಹೇಳಿ.';
  }
  
  // Marketplace
  if (text.includes('ಮಾರುಕಟ್ಟೆ') || text.includes('market')) {
    return 'ಮಾರುಕಟ್ಟೆಗೆ ಹೋಗಲು "ಮಾರುಕಟ್ಟೆ ತೆರೆಯಿರಿ" ಎಂದು ಹೇಳಿ.';
  }
  
  // Help
  if (text.includes('ಸಹಾಯ') || text.includes('help')) {
    return 'ನಾನು ನಿಮಗೆ ಮಾರುಕಟ್ಟೆ, ಪ್ರೊಫೈಲ್, ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ಮತ್ತು ವೀಡಿಯೋ ಅಪ್ಲೋಡ್‌ನಲ್ಲಿ ಸಹಾಯ ಮಾಡಬಲ್ಲೆ. ಏನು ಬೇಕು?';
  }
  
  // Crops
  if (text.includes('ಬೆಳೆ') || text.includes('crop')) {
    return 'ನಿಮ್ಮ ಬೆಳೆಗಳನ್ನು ನೋಡಲು "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ತೆರೆಯಿರಿ" ಎಂದು ಹೇಳಿ.';
  }
  
  // Thank you
  if (text.includes('ಧನ್ಯವಾದ') || text.includes('thanks')) {
    return 'ನಿಮಗೆ ಸ್ವಾಗತ! ಇನ್ನೇನಾದರೂ ಸಹಾಯ ಬೇಕೇ?';
  }
  
  // Default
  return 'ಕ್ಷಮಿಸಿ, ನಾನು ಅದನ್ನು ಅರ್ಥಮಾಡಿಕೊಳ್ಳಲಿಲ್ಲ. ದಯವಿಟ್ಟು "ಮಾರುಕಟ್ಟೆ ತೆರೆಯಿರಿ", "ಪ್ರೊಫೈಲ್ ತೆರೆಯಿರಿ", ಅಥವಾ "ವೀಡಿಯೋ ಅಪ್ಲೋಡ್ ಮಾಡಿ" ಎಂದು ಪ್ರಯತ್ನಿಸಿ.';
}



class VoiceService {
  async getFarmerContext(userId) {
    try {
      if (!userId || userId === 'anonymous') {
        return { success: false, context: null };
      }

      const farmer = await Farmer.findById(userId).select('name').lean();
      if (!farmer) return { success: false, context: null };
      
      const crops = await CropListing.find({ farmerId: userId })
        .sort({ createdAt: -1 })
        .limit(20)
        .select('crop quantityKg pricePerKg status')
        .lean();
      
      const cropIds = crops.map(c => c._id);
      const bids = await Bid.find({ cropListingId: { $in: cropIds } })
        .sort({ bidAmount: -1 })
        .limit(20)
        .select('bidAmount bidStatus')
        .lean();

      const totalCrops = crops.length;
      const activeCrops = crops.filter(c => c.status === 'active').length;
      const soldCrops = crops.filter(c => c.status === 'sold').length;
      const totalBids = bids.length;
      const wonBids = bids.filter(b => b.bidStatus === 'won').length;
      const totalRevenue = bids.filter(b => b.bidStatus === 'won').reduce((sum, b) => sum + b.bidAmount, 0);

      let context = '';
      if (totalCrops > 0) {
        context = `ರೈತ: ${farmer.name}, ಬೆಳೆಗಳು: ${totalCrops}, ಮಾರಾಟಕ್ಕಿರುವವು: ${activeCrops}, ಮಾರಾಟವಾದವು: ${soldCrops}, ಬಿಡ್‌ಗಳು: ${totalBids}, ಆದಾಯ: ₹${totalRevenue}`;
      }

      return { success: true, context: context || null };
    } catch (error) {
      console.error('❌ Context error:', error);
      return { success: false, context: null };
    }
  }

  // ✅ ENHANCED: Comprehensive local intent detector with form filling support
  detectIntent(userText) {
  if (!userText || typeof userText !== 'string') return null;

  // Normalize text - preserve Kannada characters
  let text = userText.normalize('NFKC').toLowerCase();
  text = text.replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();

  const DEBUG_INTENT = process.env.VOICE_INTENT_DEBUG === 'true';
  if (DEBUG_INTENT) console.log('🔍 detectIntent input:', JSON.stringify(text));

  // ✅ STRICTER INTENTS - Only exact phrases trigger actions
  const intents = [
    // ===== NAVIGATION COMMANDS (require full phrases) =====
    { 
      keywords: [
        'ಮಾರುಕಟ್ಟೆ ತೆರೆಯಿರಿ', 'ಮಾರುಕಟ್ಟೆಗೆ ಹೋಗು', 'ಮಾರುಕಟ್ಟೆ ತೋರಿಸು',
        'open marketplace', 'go to marketplace', 'show marketplace'
      ], 
      action: { type: 'NAVIGATE', params: { route: '/marketplace' } }, 
      response: 'ಮಾರುಕಟ್ಟೆಗೆ ತೆಗೆದುಕೊಂಡು ಹೋಗುತ್ತಿದ್ದೇನೆ',
      confidence: 0.95
    },
    { 
      keywords: [
        'ಪ್ರೊಫೈಲ್ ತೆರೆಯಿರಿ', 'ನನ್ನ ಪ್ರೊಫೈಲ್ ತೋರಿಸು', 'ಪ್ರೊಫೈಲ್‌ಗೆ ಹೋಗು',
        'open profile', 'show my profile', 'go to profile'
      ], 
      action: { type: 'NAVIGATE', params: { route: '/profile' } }, 
      response: 'ನಿಮ್ಮ ಪ್ರೊಫೈಲ್ ತೋರಿಸುತ್ತಿದ್ದೇನೆ',
      confidence: 0.95
    },



            // ===== PROFILE AUTOMATION =====
{ 
  keywords: [
    'ಪ್ರೊಫೈಲ್ ಪೂರ್ಣಗೊಳಿಸು', 'complete profile', 'ಪ್ರೊಫೈಲ್ ಭರ್ತಿ',
    'fill profile', 'setup profile', 'ಪ್ರೊಫೈಲ್ ಸೆಟಪ್'
  ], 
  action: { type: 'START_PROFILE_SETUP', params: {} }, 
  response: 'ಪ್ರೊಫೈಲ್ ಸೆಟಪ್ ಪ್ರಾರಂಭಿಸುತ್ತಿದ್ದೇನೆ. ನಿಮ್ಮ ಫಾರ್ಮ್ ಹೆಸರು ಏನು?',
  confidence: 0.95
},

{ 
  keywords: [
    'ಪ್ರೊಫೈಲ್ ಎಡಿಟ್', 'edit profile', 'ಪ್ರೊಫೈಲ್ ಬದಲಾಯಿಸು',
    'update profile', 'change profile', 'ಪ್ರೊಫೈಲ್ ಅಪ್ಡೇಟ್'
  ], 
  action: { type: 'START_PROFILE_EDIT', params: {} }, 
  response: 'ಪ್ರೊಫೈಲ್ ಎಡಿಟ್ ಮಾಡಲು ತೆಗೆದುಕೊಂಡು ಹೋಗುತ್ತಿದ್ದೇನೆ',
  confidence: 0.95
},

// Profile field updates
{ 
  keywords: ['SET_FARM_NAME'], 
  action: { type: 'SET_PROFILE_FIELD', params: { field: 'farmName' } }, 
  response: 'ಫಾರ್ಮ್ ಹೆಸರು ಗುರುತಿಸಲಾಗಿದೆ',
  confidence: 0.95
},

{ 
  keywords: ['SET_LOCATION'], 
  action: { type: 'SET_PROFILE_FIELD', params: { field: 'location' } }, 
  response: 'ಸ್ಥಳ ಗುರುತಿಸಲಾಗಿದೆ',
  confidence: 0.95
},    



    { 
      keywords: [
        'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ತೆರೆಯಿರಿ', 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಹೋಗು', 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ತೋರಿಸು',
        'open dashboard', 'go to dashboard', 'show dashboard'
      ], 
      action: { type: 'NAVIGATE', params: { route: '/farmer-dashboard' } }, 
      response: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಹೋಗುತ್ತಿದ್ದೇನೆ',
      confidence: 0.95
    },
    { 
      keywords: [
        'ಸೆಟ್ಟಿಂಗ್ಸ್ ತೆರೆಯಿರಿ', 'ಸೆಟ್ಟಿಂಗ್ಸ್‌ಗೆ ಹೋಗು',
        'open settings', 'go to settings'
      ], 
      action: { type: 'NAVIGATE', params: { route: '/settings' } }, 
      response: 'ಸೆಟ್ಟಿಂಗ್ಸ್ ತೆರೆಯಲಾಗುತ್ತಿದೆ',
      confidence: 0.95
    },
    { 
      keywords: [
        'ai ಗ್ರೇಡರ್ ತೆರೆಯಿರಿ', 'ಗ್ರೇಡರ್ ತೆರೆಯಿರಿ', 'ai ಗ್ರೇಡರ್‌ಗೆ ಹೋಗು',
        'open ai grader', 'open grader', 'go to ai grader'
      ], 
      action: { type: 'NAVIGATE', params: { route: '/ai-grader' } }, 
      response: 'AI ಗ್ರೇಡರ್ ತೆರೆಯಲಾಗುತ್ತಿದೆ',
      confidence: 0.95
    },

    // ===== VIDEO UPLOAD =====
    { 
      keywords: [
        'ವೀಡಿಯೋ ಅಪ್ಲೋಡ್ ಮಾಡಿ', 'ವೀಡಿಯೋ ಅಪ್ಲೋಡ್',
        'upload video', 'video upload'
      ], 
      action: { type: 'UPLOAD_VIDEO', params: {} }, 
      response: 'ದಯವಿಟ್ಟು ಅಪ್ಲೋಡ್ ಮಾಡಲು ವೀಡಿಯೋವನ್ನು ಆರಿಸಿ',
      confidence: 0.95
    },

    // ===== LOGOUT =====
    { 
      keywords: [
        'ಲಾಗ್ ಔಟ್ ಮಾಡಿ', 'ಲಾಗ್ ಔಟ್',
        'logout', 'log out', 'sign out'
      ], 
      action: { type: 'LOGOUT', params: {} }, 
      response: 'ನಿಮ್ಮನ್ನು ಲಾಗ್ಔಟ್ ಮಾಡುತ್ತಿದ್ದೇನೆ',
      confidence: 0.95
    }
  ];

  // ✅ STRICT MATCHING: Only exact or very close matches
  for (const intent of intents) {
    for (const rawKw of intent.keywords) {
      const kw = rawKw.normalize('NFKC').toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      if (DEBUG_INTENT) console.log('Checking keyword:', kw);
      
      // Strategy 1: Exact match
      if (text === kw) {
        if (DEBUG_INTENT) console.log('✅ Exact match:', kw);
        return { 
          action: intent.action, 
          response: intent.response, 
          confidence: intent.confidence || 0.95
        };
      }

      // Strategy 2: Word boundary match (only for longer phrases)
      if (kw.length > 4) {
        const regexWordBoundary = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'u');
        if (regexWordBoundary.test(text)) {
          if (DEBUG_INTENT) console.log('✅ Word boundary match:', kw);
          return { 
            action: intent.action, 
            response: intent.response, 
            confidence: (intent.confidence || 0.95) - 0.03
          };
        }
      }
    }
  }

  // ✅ NO MATCH - Return null to allow Gemini to handle
  if (DEBUG_INTENT) console.log('❌ No intent matched - will use Gemini');
  return null;
}

  // Helper: Levenshtein distance
  levenshteinDistance(str1, str2) {
    const track = Array(str2.length + 1).fill(null).map(() =>
      Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) track[0][i] = i;
    for (let j = 0; j <= str2.length; j++) track[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        track[j][i] = Math.min(
          track[j][i - 1] + 1,
          track[j - 1][i] + 1,
          track[j - 1][i - 1] + indicator
        );
      }
    }
    
    return track[str2.length][str1.length];
  }

 async processWithGemini(text, conversationHistory = [], farmerContext = null) {
  try {
    const now = Date.now();
    
    // Rate limiting
    if (now > requestCount.resetTime) {
      requestCount.count = 0;
      requestCount.resetTime = now + 60000;
    }
    
    if (requestCount.count >= MAX_REQUESTS_PER_MINUTE) {
      const waitTime = requestCount.resetTime - now;
      console.log(`⏳ Rate limit hit. Waiting ${Math.ceil(waitTime/1000)}s...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      requestCount.count = 0;
      requestCount.resetTime = Date.now() + 60000;
    }
    
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    lastRequestTime = Date.now();
    requestCount.count++;

    let systemPrompt = INTENT_SYSTEM_PROMPT;

    if (farmerContext) {
      systemPrompt += `\n\nFARMER'S DATA:\n${farmerContext}\n\nUse this when they ask about their data.`;
    }

    const messages = [
      { role: 'user', parts: [{ text: systemPrompt }] },
      { role: 'model', parts: [{ text: 'ಅರ್ಥವಾಯಿತು. ನಾನು ಕನ್ನಡದಲ್ಲಿ ಸಹಾಯ ಮಾಡುತ್ತೇನೆ.' }] }
    ];

    const limitedHistory = conversationHistory.slice(-10);
    for (const msg of limitedHistory) {
      messages.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.parts ? msg.parts[0].text : msg.content }]
      });
    }

    messages.push({ role: 'user', parts: [{ text: text }] });

    const modelsToTry = [
      { url: 'https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash-exp:generateContent', name: 'gemini-2.0-flash-exp' },
      { url: 'https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent', name: 'gemini-2.0-flash' },
      { url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', name: 'gemini-2.0-flash (beta)' }
    ];

    let lastError = null;

    for (const model of modelsToTry) {
      try {
        console.log(`🔄 Trying Gemini: ${model.name}`);
        
        const response = await axios.post(
          `${model.url}?key=${GEMINI_API_KEY}`,
          { contents: messages.map(msg => ({ role: msg.role, parts: msg.parts })) },
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: 30000
          }
        );

        const responseText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (responseText) {
          console.log(`✅ Gemini SUCCESS with ${model.name}!`);
          return { 
            success: true, 
            text: responseText.trim(),
            action: null
          };
        }

      } catch (error) {
        console.log(`❌ ${model.name} failed:`, error.response?.data?.error?.message || error.message);
        lastError = error;
        continue;
      }
    }

    // ✅ ALL models failed - return friendly message instead of throwing
    console.log('⚠️ All Gemini models failed');
    return {
      success: false,
      text: 'ಕ್ಷಮಿಸಿ, ನಾನು ಈಗ ಅರ್ಥಮಾಡಿಕೊಳ್ಳಲು ಸಾಧ್ಯವಾಗುತ್ತಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೊಮ್ಮೆ ಪ್ರಯತ್ನಿಸಿ.',
      action: null,
      error: lastError?.message || 'All Gemini models unavailable'
    };

  } catch (error) {
    console.error('❌ Gemini error:', error.response?.data || error.message);
    
    return {
      success: false,
      text: 'ತಾಂತ್ರಿಕ ದೋಷ ಸಂಭವಿಸಿದೆ. ದಯವಿಟ್ಟು ಮತ್ತೊಮ್ಮೆ ಪ್ರಯತ್ನಿಸಿ.',
      action: null,
      error: error.message
    };
  }
}

  // ✅ ENHANCED MAIN PROCESSING with form filling support
async processTextQuery(userText, conversationHistory = [], userId = null) {
  try {
    console.log('🎤 Processing:', userText);

    // ✅ STEP 1: Try local intent detection with HIGH threshold
    const localIntent = this.detectIntent(userText);
    
    if (localIntent && localIntent.confidence >= 0.90) {
      console.log(`🎯 HIGH-CONFIDENCE intent (${localIntent.confidence}):`, localIntent.action);
      
      return {
        success: true,
        userText,
        aiText: localIntent.response,
        action: localIntent.action,
        error: null
      };
    }

    // ✅ STEP 2: Try Gemini (but don't fail if quota exceeded)
    console.log('💬 No high-confidence intent. Trying Gemini...');
    
    const contextResult = await this.getFarmerContext(userId);
    const farmerContext = contextResult.success ? contextResult.context : null;

    const aiResponse = await this.processWithGemini(userText, conversationHistory, farmerContext);

    // ✅ STEP 3: If Gemini fails (quota), use smart fallback
    if (!aiResponse.success) {
      console.log('⚠️ Gemini failed, using smart fallback');
      
      const fallbackText = getSmartFallback(userText);
      
      return {
        success: true,
        userText,
        aiText: fallbackText,
        action: null,
        error: null
      };
    }

    // ✅ STEP 4: Gemini succeeded
    return {
      success: true,
      userText,
      aiText: aiResponse.text,
      action: null,
      error: null
    };

  } catch (error) {
    console.error('❌ Query error:', error);
    
    // ✅ Final fallback
    const fallbackText = getSmartFallback(userText);
    
    return {
      success: true,
      userText,
      aiText: fallbackText,
      action: null,
      error: error.message
    };
  }
}




  // ✅ NEW: Extract form actions from Gemini response
  extractFormActionsFromGemini(geminiText, originalText) {
    const text = geminiText.toLowerCase();
    const original = originalText.toLowerCase();
    
    // Check for crop types
    const cropTypes = {
      'tomato': 'tomato',
      'ಟೊಮೇಟೊ': 'tomato',
      'potato': 'potato',
      'ಆಲೂಗಡ್ಡೆ': 'potato',
      'onion': 'onion',
      'ಈರುಳ್ಳಿ': 'onion',
      'carrot': 'carrot',
      'ಕ್ಯಾರೆಟ್': 'carrot'
    };
    
    for (const [key, value] of Object.entries(cropTypes)) {
      if (text.includes(key) || original.includes(key)) {
        return { type: 'SET_CROP_TYPE', params: { value } };
      }
    }
    
    // Check for quantities
    const quantityMatch = text.match(/(\d+)\s*(kg|ಕೆಜಿ|kilo|ಕಿಲೋ)/) || original.match(/(\d+)\s*(kg|ಕೆಜಿ|kilo|ಕಿಲೋ)/);
    if (quantityMatch) {
      return { type: 'SET_QUANTITY', params: { value: quantityMatch[1] } };
    }
    
    // Check for prices
    const priceMatch = text.match(/(\d+)\s*(rs|ರೂ|ರೂಪಾಯಿ|rupees)/) || original.match(/(\d+)\s*(rs|ರೂ|ರೂಪಾಯಿ|rupees)/);
    if (priceMatch) {
      return { type: 'SET_PRICE', params: { value: priceMatch[1] } };
    }
    
    // Check for locations
    const locations = ['ಬೆಂಗಳೂರು', 'ಮೈಸೂರು', 'ಹಾಸನ', 'bangalore', 'mysore', 'hassan'];
    for (const location of locations) {
      if (text.includes(location.toLowerCase()) || original.includes(location.toLowerCase())) {
        return { type: 'SET_LOCATION', params: { value: location } };
      }
    }
    
    return null;
  }
}

module.exports = new VoiceService();
