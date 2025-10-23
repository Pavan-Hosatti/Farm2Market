const jwt = require('jsonwebtoken');
const Farmer = require('../models/Farmer');

// ✅ NEW: Accept token from Authorization header OR cookies
exports.protect = async (req, res, next) => {
  try {
    let token;

    // 🔥 PRIORITY 1: Check Authorization header (for frontend without credentials)
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      console.log('✅ Token found in Authorization header');
    }
    // 🔥 PRIORITY 2: Check cookies (fallback for cookie-based auth)
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
      console.log('✅ Token found in cookies');
    }

    // Make sure token exists
    if (!token) {
      console.log('❌ No token found in request');
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route. Please login.'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('✅ Token verified for user:', decoded.id);

      // Get user from token
      req.user = await Farmer.findById(decoded.id);

      if (!req.user) {
        console.log('❌ User not found in database');
        return res.status(401).json({
          success: false,
          message: 'User not found. Please login again.'
        });
      }

      console.log('✅ User authenticated:', req.user.email);
      next();
    } catch (err) {
      console.error('❌ Token verification error:', err.message);
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token failed. Please login again.'
      });
    }
  } catch (error) {
    console.error('❌ Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error in authentication'
    });
  }
};
