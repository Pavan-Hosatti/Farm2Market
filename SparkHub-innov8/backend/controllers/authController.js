// controllers/authController.js
const Farmer = require('../models/Farmer'); // Use the Farmer model
const jwt = require('jsonwebtoken');

// --- Helper Function ---
const sendAuthResponse = (farmer, statusCode, res) => {
    const token = farmer.getSignedJwtToken();

    // Set expiration for cookie (e.g., 30 days)
    const cookieOptions = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
        httpOnly: true,
        // Set secure: true in production if using HTTPS
        // secure: process.env.NODE_ENV === 'production'
    };

    res.status(statusCode).cookie('token', token, cookieOptions).json({
        success: true,
        token,
        // IMPORTANT: The 'user' object matches what your AuthContext expects
        user: { 
            _id: farmer._id,
            name: farmer.name,
            email: farmer.email,
            role: farmer.role, // Will be 'farmer'
            avatar: farmer.name.charAt(0).toUpperCase()
        }
    });
};

// @desc    Register a new Farmer
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
    try {
        // Frontend sends name, email, password
        const { name, email, password } = req.body; 

        // 💡 Key change: Hardcode the role to 'farmer' as per your requirement
        const role = 'farmer';

        const farmer = await Farmer.create({
            name,
            email,
            password,
            role
        });

        sendAuthResponse(farmer, 201, res);

    } catch (err) {
        // Log the error for debugging
        console.error(err); 
        
        // Handle Mongoose/MongoDB errors (e.g., duplicate email)
        if (err.code === 11000) {
            return res.status(400).json({ success: false, message: 'This email is already registered.' });
        }
        if (err.name === 'ValidationError') {
            const message = Object.values(err.errors).map(val => val.message);
            return res.status(400).json({ success: false, message: message.join(', ') });
        }

        res.status(500).json({ success: false, message: 'Registration failed due to a server error.' });
    }
};


// @desc    Login a Farmer
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide email and password.' });
        }

        // Find the farmer by email (and ensure the stored password field is selected)
        const farmer = await Farmer.findOne({ email }).select('+password');

        if (!farmer) {
            return res.status(401).json({ success: false, message: 'Invalid credentials.' });
        }

        // Check if the password matches
        const isMatch = await farmer.matchPassword(password);

        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials.' });
        }

        // Success
        sendAuthResponse(farmer, 200, res);

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Login failed due to a server error.' });
    }
};


// @desc    Log out and clear cookie
// @route   GET /api/auth/logout
// @access  Public (clears cookie)
exports.logout = (req, res, next) => {
    res.cookie('token', 'none', {
        expires: new Date(Date.now() + 10 * 1000), // Expire immediately
        httpOnly: true,
    }).status(200).json({
        success: true,
        message: 'Logged out successfully'
    });
};