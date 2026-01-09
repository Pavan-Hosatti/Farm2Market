// services/voiceService.js - Using DIRECT API calls (bypassing buggy SDK)
require('dotenv').config();
const axios = require('axios');
const CropListing = require('../models/CropListing');
const Bid = require('../models/Bid');
const Farmer = require('../models/Farmer');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY not found');
  throw new Error('GEMINI_API_KEY is required');
}

console.log('✅ API Key loaded:', GEMINI_API_KEY.substring(0, 10) + '...');

let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 6000;
const requestCount = { count: 0, resetTime: Date.now() + 60000 };
const MAX_REQUESTS_PER_MINUTE = 10;

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

  async processWithGemini(text, conversationHistory = [], farmerContext = null) {
    try {
      // Rate limiting
      const now = Date.now();
      
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

      // Build prompt
      let systemPrompt = `You are a helpful AI for Farm2Market platform in Karnataka.
CRITICAL: Respond ONLY in Kannada (ಕನ್ನಡ). Never use English.
Help farmers with crops, bids, sales, and farming questions.`;

      if (farmerContext) {
        systemPrompt += `\n\nFARMER'S DATA:\n${farmerContext}\n\nUse this when they ask about their data.`;
      }

      systemPrompt += `\n\nKeep responses short (2-3 sentences) in simple Kannada.`;

      // Build messages
      const messages = [
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'model', parts: [{ text: 'ಅರ್ಥವಾಯಿತು. ನಾನು ಕನ್ನಡದಲ್ಲಿ ಸಹಾಯ ಮಾಡುತ್ತೇನೆ.' }] }
      ];

      // Add conversation history (last 10 messages)
      const limitedHistory = conversationHistory.slice(-10);
      for (const msg of limitedHistory) {
        messages.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        });
      }

      // Add current question
      messages.push({ role: 'user', parts: [{ text: text }] });

      // ✅ DIRECT API CALL - Use CURRENT working models (Dec 2024)
      const modelsToTry = [
        { url: 'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent', name: 'gemini-2.5-flash' },
        { url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', name: 'gemini-2.5-flash (v1beta)' },
        { url: 'https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent', name: 'gemini-2.0-flash' },
        { url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', name: 'gemini-2.0-flash (v1beta)' }
      ];

      let lastError = null;

      for (const model of modelsToTry) {
        try {
          console.log(`🔄 Trying: ${model.name}`);
          
          const response = await axios.post(
            `${model.url}?key=${GEMINI_API_KEY}`,
            {
              contents: messages.map(msg => ({
                role: msg.role,
                parts: msg.parts
              }))
            },
            {
              headers: { 'Content-Type': 'application/json' },
              timeout: 30000
            }
          );

          const responseText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
          
          if (responseText) {
            console.log(`✅ Success with ${model.name}`);
            return { success: true, text: responseText };
          }

        } catch (error) {
          console.log(`❌ ${model.name} failed:`, error.response?.data?.error?.message || error.message);
          lastError = error;
          continue;
        }
      }

      // All models failed
      throw lastError || new Error('All models failed');

    } catch (error) {
      console.error('❌ Gemini error:', error.response?.data || error.message);
      
      let errorMessage = 'ಕ್ಷಮಿಸಿ, ನಾನು ಈಗ ಉತ್ತರಿಸಲು ಸಾಧ್ಯವಾಗುತ್ತಿಲ್ಲ.';
      const errorStr = error.response?.data?.error?.message || error.message || '';
      
      if (errorStr.includes('429') || errorStr.includes('quota') || errorStr.includes('Too Many Requests')) {
        const retryMatch = errorStr.match(/retry in (\d+\.?\d*)/i);
        const seconds = retryMatch ? Math.ceil(parseFloat(retryMatch[1])) : 30;
        errorMessage = `API ಮಿತಿ ತಲುಪಿದೆ. ${seconds} ಸೆಕೆಂಡ್ ನಂತರ ಪ್ರಯತ್ನಿಸಿ.`;
      } else if (errorStr.includes('404')) {
        errorMessage = 'AI ಸೇವೆ ಲಭ್ಯವಿಲ್ಲ. API ಕೀ ಪರಿಶೀಲಿಸಿ.';
      }
      
      return { success: false, error: errorStr, text: errorMessage };
    }
  }

  async processTextQuery(userText, conversationHistory = [], userId = null) {
    try {
      const contextResult = await this.getFarmerContext(userId);
      const farmerContext = contextResult.success ? contextResult.context : null;

      const aiResponse = await this.processWithGemini(userText, conversationHistory, farmerContext);

      return {
        success: aiResponse.success,
        userText: userText,
        aiText: aiResponse.text,
        error: aiResponse.error
      };
    } catch (error) {
      console.error('❌ Query error:', error);
      return {
        success: false,
        error: error.message,
        aiText: 'ತಾಂತ್ರಿಕ ದೋಷ ಸಂಭವಿಸಿದೆ.'
      };
    }
  }
}

module.exports = new VoiceService();
