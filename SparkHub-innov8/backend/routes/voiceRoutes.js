const express = require('express');
const router = express.Router();
const voiceController = require('../controllers/voiceController');
const { protect } = require('../middleware/auth');

router.post('/query', protect, voiceController.processTextQuery);
router.get('/conversation/:sessionId', protect, voiceController.getConversationHistory);
router.delete('/conversation/:sessionId', protect, voiceController.clearConversation);

module.exports = router;
