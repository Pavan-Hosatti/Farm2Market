const express = require('express');
const router = express.Router();
const voiceController = require('../controllers/voiceController');
const authMiddleware = require('../middleware/authMiddleware');

// ✅ MAIN ROUTES - Use authMiddleware
router.post('/query', authMiddleware, voiceController.processTextQuery);
router.get('/conversation/:sessionId', authMiddleware, voiceController.getConversationHistory);
router.delete('/conversation/:sessionId', authMiddleware, voiceController.clearConversation);

// ✅ DEBUG ROUTE (optional - remove in production)
router.post('/debug', authMiddleware, async (req, res) => {
  console.log('=== DEBUG VOICE REQUEST ===');
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  console.log('User:', req.user);
  
  const { text } = req.body;
  
  if (text.includes('market') || text.includes('ಮಾರುಕಟ್ಟೆ')) {
    return res.json({
      success: true,
      data: {
        userText: text,
        aiText: 'ಮಾರುಕಟ್ಟೆಗೆ ತೆಗೆದುಕೊಂಡು ಹೋಗುತ್ತಿದ್ದೇನೆ',
        action: { type: 'NAVIGATE', params: { route: '/marketplace' } }
      }
    });
  }
  
  if (text.includes('video') || text.includes('ವೀಡಿಯೋ')) {
    return res.json({
      success: true,
      data: {
        userText: text,
        aiText: 'ವೀಡಿಯೋ ಅಪ್ಲೋಡ್ ಮಾಡುತ್ತಿದ್ದೇನೆ',
        action: { type: 'UPLOAD_VIDEO', params: {} }
      }
    });
  }
  
  if (text.includes('profile') || text.includes('ಪ್ರೊಫೈಲ್')) {
    return res.json({
      success: true,
      data: {
        userText: text,
        aiText: 'ನಿಮ್ಮ ಪ್ರೊಫೈಲ್ ತೋರಿಸುತ್ತಿದ್ದೇನೆ',
        action: { type: 'NAVIGATE', params: { route: '/profile' } }
      }
    });
  }
  
  if (text.includes('dashboard') || text.includes('ಡ್ಯಾಶ್')) {
    return res.json({
      success: true,
      data: {
        userText: text,
        aiText: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ತೆರೆಯುತ್ತಿದ್ದೇನೆ',
        action: { type: 'NAVIGATE', params: { route: '/farmer-dashboard' } }
      }
    });
  }
  
  // Default response
  res.json({
    success: true,
    data: {
      userText: text,
      aiText: 'ನಾನು ಚೆನ್ನಾಗಿದ್ದೇನೆ. ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?',
      action: null
    }
  });
});

module.exports = router;
