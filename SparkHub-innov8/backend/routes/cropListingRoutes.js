const express = require('express');
const cropListingController = require('../controllers/cropListingController');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// --- Multer Configuration ---
// Destination: 'uploads/' directory inside the backend folder
// Filename: Use the current timestamp to ensure uniqueness
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // You MUST ensure this 'uploads/' directory exists in your backend root
        cb(null, 'uploads/'); 
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });
// ----------------------------

// Farmer Submission Route (Handles file upload)
// The field name 'cropFile' must match the field name in AIGrader.jsx
router.post('/submit-for-grading', upload.single('cropFile'), cropListingController.submitForGrading); 

// Existing Routes (Renamed to match new controller functions)
router.get('/all', cropListingController.getAllCrops);
router.get('/farmer/:farmerId', cropListingController.getFarmersListings); // NEW: Fetches farmer's own listings
router.get('/:id', cropListingController.getCropById);

module.exports = router;
