// controllers/voiceController.js - FIXED VERSION
const voiceService = require('../services/voiceService');
const VoiceConversation = require('../models/VoiceConversation');

const conversationCache = new Map();

const voiceController = {
  async processTextQuery(req, res) {
    try {
      console.log('=== Text Query Request ===');
      console.log('Body:', req.body);
      console.log('User:', req.user); // ✅ Log user info
      
      const startTime = Date.now(); // ✅ Track timing
      
      const { text, sessionId: clientSessionId, conversationHistory: clientHistory } = req.body;
      
      if (!text) {
        return res.status(400).json({
          success: false,
          message: 'No text provided'
        });
      }

      // ✅ GET USER ID FROM AUTH MIDDLEWARE
      const userId = req.user?.id || req.user?._id || 'anonymous';
      console.log('🔑 User ID:', userId);
      
      const sessionId = clientSessionId || `session_${Date.now()}`;
      let conversationHistory = conversationCache.get(sessionId) || [];
      
      if (clientHistory && Array.isArray(clientHistory)) {
        console.log('Using client conversation history:', clientHistory.length, 'messages');
        conversationHistory = clientHistory.map(msg => ({
          role: msg.role,
          content: msg.parts ? msg.parts[0].text : msg.text
        }));
      }

      console.log('📝 Processing text with history length:', conversationHistory.length);
      console.log('💬 User text:', text);
      
      // ✅ PASS USER ID TO SERVICE (3rd parameter!)
      const result = await voiceService.processTextQuery(
        text,
        conversationHistory,
        userId  // ✅ THIS WAS MISSING!
      );

      const endTime = Date.now();
      console.log(`⏱️ Total processing time: ${endTime - startTime}ms`);

      if (!result.success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to process text query',
          error: result.error
        });
      }

      console.log('✅ Text query processed successfully');
      console.log('🤖 AI response:', result.aiText);

      // Update conversation history
      conversationHistory.push(
        { role: 'user', content: result.userText },
        { role: 'assistant', content: result.aiText }
      );
      conversationCache.set(sessionId, conversationHistory);

      // Save to database (async, don't wait)
      VoiceConversation.create({
        userId: userId,
        sessionId: sessionId,
        userText: result.userText,
        aiText: result.aiText,
        confidence: 1.0,
        timestamp: new Date()
      }).catch(err => console.error('⚠️ Error saving to DB:', err));

      res.json({
        success: true,
        data: {
          sessionId: sessionId,
          userText: result.userText,
          aiText: result.aiText,
        }
      });

    } catch (error) {
      console.error('❌ Error in processTextQuery:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  },

  async getConversationHistory(req, res) {
    try {
      const { sessionId } = req.params;
      const userId = req.user?.id || req.user?._id;

      const conversations = await VoiceConversation.find({
        sessionId: sessionId,
        ...(userId && { userId: userId })
      }).sort({ timestamp: 1 });

      res.json({
        success: true,
        data: conversations
      });
    } catch (error) {
      console.error('Error in getConversationHistory:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  },

  async clearConversation(req, res) {
    try {
      const { sessionId } = req.params;
      conversationCache.delete(sessionId);

      res.json({
        success: true,
        message: 'Conversation cleared'
      });
    } catch (error) {
      console.error('Error in clearConversation:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
};

module.exports = voiceController;
