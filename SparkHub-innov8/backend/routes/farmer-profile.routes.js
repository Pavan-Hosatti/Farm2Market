const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const Farmer = require('../models/Farmer');

// @route   GET /api/farmer-profile/me
// @desc    Get current farmer's profile
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const profile = await Farmer.findById(req.user.id).select('-password');
    
    if (!profile) {
      return res.status(404).json({ 
        success: false, 
        message: 'Profile not found' 
      });
    }
    
    res.json(profile);
  } catch (err) {
    console.error('Error in GET /me:', err.message);
    res.status(500).json({ success: false, message: 'Server Error', error: err.message });
  }
});

// @route   PUT /api/farmer-profile
// @desc    Update farmer profile
// @access  Private
router.put('/', auth, async (req, res) => {
  try {
    const {
      farmName,
      location,
      description,
      phoneNumber,
      whatsappNumber,
      farmSize,
      farmingType,
      primaryCrops,
      secondaryCrops,
      expertise
    } = req.body;
    
    const profile = await Farmer.findByIdAndUpdate(
      req.user.id,
      {
        $set: {
          farmName,
          location,
          description,
          phoneNumber,
          whatsappNumber,
          farmSize,
          farmingType,
          primaryCrops,
          secondaryCrops,
          expertise,
          isProfileComplete: true
        }
      },
      { new: true }
    ).select('-password');
    
    if (!profile) {
      return res.status(404).json({ 
        success: false, 
        message: 'Profile not found' 
      });
    }
    
    res.json(profile);
  } catch (err) {
    console.error('Error in PUT /:', err.message);
    res.status(500).json({ success: false, message: 'Server Error', error: err.message });
  }
});

module.exports = router;
