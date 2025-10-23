// controllers/authController.js
const Farmer = require('../models/Farmer');
const jwt = require('jsonwebtoken');

// --- Helper Function ---
const sendAuthResponse = (farmer, statusCode, res) => {
    const token = farmer.getSignedJwtToken();

    // Set expiration for cookie (e.g., 30 days)
    const cookieOptions = {
        expires: new Date(Date.now() + (process.env.JWT_COOKIE_EXPIRE || 30) * 24 * 60 * 60 * 1000),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // ✅ Enable in production
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax' // ✅ For cross-origin
    };

    res.status(statusCode)
        .cookie('token', token, cookieOptions)
        .json({
            success: true,
            token, // 🔥 RETURN TOKEN IN RESPONSE BODY
            user: { 
                id: farmer._id, // ✅ Changed from _id to id for consistency
                _id: farmer._id, // Keep both for compatibility
                name: farmer.name,
                email: farmer.email,
                phone: farmer.phone, // ✅ Added phone
                role: farmer.role,
                avatar: farmer.name.charAt(0).toUpperCase()
            }
        });
};

// @desc    Register a new Farmer
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
    try {
        const { name, email, password, phone } = req.body; // ✅ Added phone

        // Validate required fields
        if (!name || !email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please provide name, email, and password.' 
            });
        }

        // Check if farmer already exists
        const existingFarmer = await Farmer.findOne({ email });
        
        if (existingFarmer) {
            return res.status(400).json({ 
                success: false, 
                message: 'A user with this email already exists.' 
            });
        }

        // 💡 Hardcode the role to 'farmer'
        const farmer = await Farmer.create({
            name,
            email,
            password,
            phone: phone || '', // Optional phone
            role: 'farmer'
        });

        console.log('✅ New farmer registered:', farmer.email);
        sendAuthResponse(farmer, 201, res);

    } catch (err) {
        console.error('❌ Registration error:', err);
        
        // Handle Mongoose/MongoDB errors
        if (err.code === 11000) {
            return res.status(400).json({ 
                success: false, 
                message: 'This email is already registered.' 
            });
        }
        
        if (err.name === 'ValidationError') {
            const message = Object.values(err.errors).map(val => val.message);
            return res.status(400).json({ 
                success: false, 
                message: message.join(', ') 
            });
        }

        res.status(500).json({ 
            success: false, 
            message: 'Registration failed due to a server error.' 
        });
    }
};

// @desc    Login a Farmer
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please provide email and password.' 
            });
        }

        // Find the farmer by email (select password field)
        const farmer = await Farmer.findOne({ email }).select('+password');

        if (!farmer) {
            console.log('❌ Login failed: User not found');
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid credentials.' 
            });
        }

        // Check if the password matches
        const isMatch = await farmer.matchPassword(password);

        if (!isMatch) {
            console.log('❌ Login failed: Invalid password');
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid credentials.' 
            });
        }

        console.log('✅ Farmer logged in:', farmer.email);
        sendAuthResponse(farmer, 200, res);

    } catch (err) {
        console.error('❌ Login error:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Login failed due to a server error.' 
        });
    }
};

// @desc    Get current logged in farmer
// @route   GET /api/auth/me
// @access  Private (requires token)
exports.getMe = async (req, res, next) => {
    try {
        // req.user is set by the protect middleware
        const farmer = await Farmer.findById(req.user.id);

        if (!farmer) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            user: {
                id: farmer._id,
                _id: farmer._id,
                name: farmer.name,
                email: farmer.email,
                phone: farmer.phone,
                role: farmer.role,
                avatar: farmer.name.charAt(0).toUpperCase()
            }
        });
    } catch (err) {
        console.error('❌ Get me error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to get user data'
        });
    }
};

// @desc    Log out and clear cookie
// @route   GET /api/auth/logout
// @access  Public (clears cookie)
exports.logout = (req, res, next) => {
    console.log('✅ User logged out');
    
    res.cookie('token', 'none', {
        expires: new Date(Date.now() + 10 * 1000), // Expire immediately
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    }).status(200).json({
        success: true,
        message: 'Logged out successfully'
    });
};
