// routes/authRoutes.js
const express = require('express');
// Import the controller functions
const { register, login, logout } = require('../controllers/authController'); 

const router = express.Router();

// Matches POST request to http://localhost:5000/api/auth/register
router.post('/register', register); 

// Matches POST request to http://localhost:5000/api/auth/login
router.post('/login', login); 

// Matches GET request to http://localhost:5000/api/auth/logout
router.get('/logout', logout); 

module.exports = router;