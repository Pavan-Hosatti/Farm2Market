const CropListing = require('../models/CropListing');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// ML Service URL
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';

// --- Farmer Submits Crop for Grading ---
exports.submitForGrading = async (req, res) => {
    try {
        const { farmerId, crop, quantityKg, pricePerKg, location, details, marketChoice } = req.body;
       
        // ✅ Check if file exists
        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                message: 'Crop video file is required.' 
            });
        }
       
        const videoPath = req.file.path; // Multer saves file here
        
        console.log(`📤 Submitting ${crop} for AI grading...`);
        console.log(`📁 Video path: ${videoPath}`);
        
        // ✅ Verify file exists before sending to ML service
        if (!fs.existsSync(videoPath)) {
            return res.status(400).json({
                success: false,
                message: 'Uploaded video file not found on server'
            });
        }

        // Call ML Service for grading
        let gradeResult;
        try {
            // ✅ FIXED: Send as form-data with absolute path
            const formData = new FormData();
            formData.append('videoPath', path.resolve(videoPath)); // Absolute path
            formData.append('cropType', crop.toLowerCase());
            
            console.log('🔄 Sending to ML service:', {
                videoPath: path.resolve(videoPath),
                cropType: crop.toLowerCase()
            });

            const mlResponse = await axios.post(
                `${ML_SERVICE_URL}/api/ml/predict`, 
                formData,
                {
                    headers: formData.getHeaders(),
                    timeout: 60000 // 60 second timeout
                }
            );
            
            gradeResult = mlResponse.data;
            console.log(`✅ Grade received: ${gradeResult.grade} (${gradeResult.confidence}%)`);
            console.log('📊 Grade breakdown:', gradeResult.grade_breakdown);
            
        } catch (mlError) {
            console.error('❌ ML Service Error:', mlError.message);
            if (mlError.response) {
                console.error('Response data:', mlError.response.data);
                console.error('Response status:', mlError.response.status);
            }
            
            // If ML service fails, still save with pending status
            gradeResult = {
                grade: 'Pending',
                confidence: 0,
                error: mlError.response?.data?.error || 'ML service unavailable'
            };
        }
        
        // Save to database with grade
        const newCrop = new CropListing({
            farmerId,
            crop,
            quantityKg: Number(quantityKg),
            pricePerKg: Number(pricePerKg),
            location,
            details,
            marketChoice,
            videoUrl: videoPath,
            grade: gradeResult.grade || 'Pending',
            qualityScore: gradeResult.confidence || 0,
            status: gradeResult.grade && gradeResult.grade !== 'Pending' ? 'graded' : 'pending_grading',
        });
        
        const savedCrop = await newCrop.save();
        
        res.status(201).json({
            success: true,
            message: 'Crop submitted and graded successfully!',
            cropListing: savedCrop,
            gradeDetails: {
                ...gradeResult,
                frames_analyzed: gradeResult.frames_analyzed || 0
            }
        });
        
    } catch (error) {
        console.error('Error in submitForGrading:', error);
        res.status(500).json({
            success: false,
            message: 'Error submitting crop for grading',
            error: error.message,
        });
    }
};

// --- GET ALL CROPS (Marketplace view) ---
exports.getAllCrops = async (req, res) => {
    try {
        const crops = await CropListing.find({ 
            status: { $in: ['active', 'bidding', 'graded'] } 
        })
            .populate('farmerId', 'name email phone')
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, listings: crops });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching crops for marketplace',
            error: error.message,
        });
    }
};

// --- GET Crop By ID ---
exports.getCropById = async (req, res) => {
    try {
        const { id } = req.params;
        const crop = await CropListing.findById(id)
            .populate('farmerId', 'name email phone');
        if (!crop) {
            return res.status(404).json({
                success: false,
                message: 'Crop not found',
            });
        }
        res.status(200).json({ success: true, crop });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching crop',
            error: error.message,
        });
    }
};

// --- Get Farmer's Own Listings ---
exports.getFarmersListings = async (req, res) => {
    try {
        const { farmerId } = req.params;
        const listings = await CropListing.find({ farmerId: farmerId })
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, cropListings: listings });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching farmer listings',
            error: error.message,
        });
    }
};