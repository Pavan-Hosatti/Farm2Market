// utils/authMiddleware.js
const jwt = require('jsonwebtoken');
const Farmer = require('../models/Farmer'); // Import your Farmer model

// Protect routes by verifying the JWT
exports.protect = async (req, res, next) => {
    let token;

    // 1. Check for token in cookies (preferred for HTTP-only)
    if (req.cookies.token) {
        token = req.cookies.token;
    } 
    // OR check for token in the Authorization header (less secure, but a fallback)
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    // 2. Make sure token exists
    if (!token) {
        return res.status(401).json({ success: false, message: 'Not authorized to access this route. Missing token.' });
    }

    try {
        // 3. Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 4. Attach the user object (excluding the password) to the request
        // This makes user data (like ID and role) available in your controllers
        req.user = await Farmer.findById(decoded.id);

        // 5. Proceed to the next middleware/controller
        next();

    } catch (err) {
        console.error(err);
        return res.status(401).json({ success: false, message: 'Not authorized to access this route. Invalid token.' });
    }
};

// You can add more specific roles checks here if you need 'buyer' accounts later
// exports.authorize = (...roles) => { /* ... role checking logic ... */ };