// routes/cropListingRoutes.js
const express = require('express');
const cropListingController = require('../controllers/cropListingController');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ============================================
// MULTER CONFIGURATION
// ============================================
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/';
        
        // Ensure directory exists
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB limit
    },
    fileFilter: (req, file, cb) => {
        // Accept only video files
        if (file.mimetype.startsWith('video/')) {
            cb(null, true);
        } else {
            cb(new Error('Only video files are allowed!'), false);
        }
    }
});

// ============================================
// ROUTES
// ============================================

// 🔥 MAIN SUBMISSION ROUTE
router.post('/submit-for-grading', upload.single('video'), cropListingController.submitForGrading);

// 🔥 STATUS CHECK ROUTE (for polling)
router.get('/grading-status/:jobId', cropListingController.checkGradingStatus);

// 🔥 WEBHOOK ROUTE (called by ML service)
// ✅ FIX: Changed from '/crops/ml-webhook' to '/ml-webhook'
// Because this router is already mounted at /api/crops in server.js
router.post('/ml-webhook', cropListingController.updateGradeFromML);

// 🔥 MARKETPLACE ROUTES
router.get('/all', cropListingController.getAllCrops);
router.get('/marketplace', cropListingController.getAllCrops); // Alias
router.get('/farmer/:farmerId', cropListingController.getFarmersListings);
router.get('/:id', cropListingController.getCropById);

module.exports = router;
