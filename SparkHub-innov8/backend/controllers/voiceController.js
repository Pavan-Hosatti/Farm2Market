// controllers/voiceController.js - FINAL VERSION WITH ACTION SUPPORT
const voiceService = require('../services/voiceService');
const VoiceConversation = require('../models/VoiceConversation');

const conversationCache = new Map();

const voiceController = {
  async processTextQuery(req, res) {
    try {
      console.log('=== Text Query Request ===');
      console.log('Body:', req.body);
      console.log('User:', req.user);
      
      const startTime = Date.now();
      
      const { text, sessionId: clientSessionId, conversationHistory: clientHistory } = req.body;
      
      if (!text) {
        return res.status(400).json({
          success: false,
          message: 'No text provided',
          error: 'Text is required'
        });
      }

      // Get user ID from auth middleware
      const userId = req.user?.id || req.user?._id || 'anonymous';
      console.log('🔑 User ID:', userId);
      
      const sessionId = clientSessionId || `session_${Date.now()}`;
      let conversationHistory = conversationCache.get(sessionId) || [];
      
      if (clientHistory && Array.isArray(clientHistory)) {
        console.log('Using client conversation history:', clientHistory.length, 'messages');
        conversationHistory = clientHistory.map(msg => ({
          role: msg.role,
          parts: msg.parts || [{ text: msg.content || msg.text || '' }]
        }));
      }

      console.log('📝 Processing text with history length:', conversationHistory.length);
      console.log('💬 User text:', text);
      
      // ✅ CORRECT: Call voice service with 3 parameters
      const result = await voiceService.processTextQuery(
        text,
        conversationHistory,
        userId
      );

      const endTime = Date.now();
      console.log(`⏱️ Total processing time: ${endTime - startTime}ms`);
      console.log('🎯 Action detected:', result.action);
      console.log('💬 AI response:', result.aiText);

      if (!result.success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to process text query',
          error: result.error,
          data: {
            userText: text,
            aiText: result.aiText || 'ದೋಷ ಸಂಭವಿಸಿದೆ',
            action: null
          }
        });
      }

      // Update conversation history
      conversationHistory.push(
        { role: 'user', parts: [{ text: text }] },
        { role: 'assistant', parts: [{ text: result.aiText }] }
      );
      conversationCache.set(sessionId, conversationHistory);

      // Save to database (async)
      VoiceConversation.create({
        userId: userId,
        sessionId: sessionId,
        userText: text,
        aiText: result.aiText,
        action: result.action, // ✅ Store action
        confidence: 1.0,
        timestamp: new Date()
      }).catch(err => console.error('⚠️ Error saving to DB:', err));

      // ✅ CRITICAL FIX: Return EXACT format expected by frontend
      res.json({
        success: true,
        data: {
          sessionId: sessionId,
          userText: text,
          aiText: result.aiText,
          action: result.action // ✅ MUST be included here
        }
      });

    } catch (error) {
      console.error('❌ Error in processTextQuery:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
        data: {
          userText: req.body.text,
          aiText: 'ಸರ್ವರ್ ದೋಷ ಸಂಭವಿಸಿದೆ',
          action: null
        }
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
      })
      .select('userText aiText action timestamp')
      .sort({ timestamp: 1 });

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
      const userId = req.user?.id || req.user?._id;
      
      conversationCache.delete(sessionId);
      
      // Also delete from database
      await VoiceConversation.deleteMany({
        sessionId: sessionId,
        ...(userId && { userId: userId })
      });

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
