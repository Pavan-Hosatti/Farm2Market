const CropListing = require('../models/CropListing');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// ML Service URL
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';

// NOTE: Assume axios, fs, path, FormData, CropListing, and ML_SERVICE_URL are defined/imported
exports.submitForGrading = async (req, res) => {
    console.log('\n🟢 ===== ASYNC JOB SUBMISSION STARTED =====');
    console.log('Timestamp:', new Date().toISOString());

    try {
        // ... (Steps 1, 2, 3: Logging and Validation remain the same) ...

        if (!req.file) {
            console.log('❌ VALIDATION FAILED: No file in request');
            return res.status(400).json({ 
                success: false, 
                message: 'Crop video file is required.',
                debug: 'req.file is undefined - check multer configuration'
            });
        }
        
        const { farmerId, crop, quantityKg, pricePerKg, location, details, marketChoice } = req.body;
        const videoPath = req.file.path;

        if (!fs.existsSync(videoPath)) {
            console.log('❌ FILE NOT FOUND ON DISK');
            return res.status(400).json({
                success: false,
                message: 'Uploaded video file not found on server',
                debug: { videoPath, exists: false }
            });
        }

        // 4. PREPARE ML REQUEST
        console.log('\n🔄 ===== SUBMITTING JOB TO ML SERVICE (ASYNC) =====');
        
        let job_id = null; // New variable to hold the job ID

        try {
            // Create form data (same as before)
            const formData = new FormData();
            const fileStream = fs.createReadStream(path.resolve(videoPath));
            
            formData.append('video', fileStream, {
                filename: req.file.originalname,
                contentType: req.file.mimetype
            });
            formData.append('cropType', (crop || '').toLowerCase());

            // 🛑 CRITICAL CHANGE: Use /api/ml/submit
            const mlUrl = `${ML_SERVICE_URL}/api/ml/submit`; 
            
            console.log('📤 ML Job Submission URL:', mlUrl);

            // 5. SEND TO ML SERVICE - Now expecting a fast 202 Accepted response
            console.log('⏳ Sending job submission request to ML service...');
            
            const mlResponse = await axios.post(mlUrl, formData, {
                headers: {
                    ...formData.getHeaders()
                },
                // Set a shorter timeout, as the ML service should respond quickly with a job_id
                timeout: 30000, 
                maxContentLength: Infinity,
                maxBodyLength: Infinity,
                validateStatus: (status) => status < 500
            });
            
            // 6. PROCESS ASYNC ML RESPONSE
            if (mlResponse.status === 202 && mlResponse.data.job_id) {
                job_id = mlResponse.data.job_id;
                console.log(`\n✅ Job successfully submitted. Job ID: ${job_id}`);
            } else {
                console.warn('⚠️ ML service did not return a valid job_id on 202 or returned a different status:', mlResponse.status);
                // Treat this as an ML error, but still save the crop as pending
                throw new Error(`ML submission failed: ${JSON.stringify(mlResponse.data)}`);
            }
            
        } catch (mlError) {
            // 7. HANDLE ML SERVICE ERRORS
            console.error('\n❌❌❌ ML SUBMISSION ERROR ❌❌❌');
            console.error('Error Message:', mlError.message);
            // We set job_id to null and proceed to save the crop with a 'failed_submission' status
        }
        
        // 8. SAVE TO DATABASE
        console.log('\n💾 ===== SAVING TO DATABASE =====');
        
        const statusToSave = job_id ? 'pending_grading' : 'failed_submission';
        
        console.log('Data to save:', {
            job_id: job_id || 'N/A',
            status: statusToSave
        });
        
        const newCrop = new CropListing({
            farmerId,
            crop,
            quantityKg: Number(quantityKg),
            pricePerKg: Number(pricePerKg),
            location,
            details,
            marketChoice,
            videoUrl: videoPath,
            status: statusToSave,
            // 🛑 CRITICAL CHANGE: Store the job ID
            mlJobId: job_id, 
            // Reset grade/score to default/pending, as we don't have the final result yet
            grade: 'Pending', 
            qualityScore: 0,
            gradeDetails: {}
        });
        
        const savedCrop = await newCrop.save();
        console.log('✅ Saved to database with ID:', savedCrop._id);
        
        // 9. SEND RESPONSE
        console.log('\n📤 ===== SENDING ASYNC RESPONSE (202 ACCEPTED) =====');
        const responseStatus = job_id ? 202 : 503; // 202 Accepted or 503 Service Unavailable
        
        const responseData = {
            success: !!job_id,
            message: job_id 
                ? 'Crop submitted. Grading job accepted and is now pending.'
                : 'Crop saved, but ML job submission failed. Try checking status later.',
            cropListingId: savedCrop._id,
            // 🛑 CRITICAL CHANGE: Return the job ID to the frontend for polling
            job_id: job_id 
        };
        
        console.log('Response:', JSON.stringify(responseData, null, 2));
        res.status(responseStatus).json(responseData);
        
        console.log('🟢 ===== ASYNC JOB SUBMISSION COMPLETED =====\n');
        
    } catch (error) {
        // ... (Step 10: General Error Handling remains the same) ...
        console.error('\n❌❌❌ CONTROLLER ERROR ❌❌❌');
        // ...
        res.status(500).json({
            success: false,
            message: 'Error submitting crop for grading',
            error: error.message,
            // ...
        });
    } finally {
        // 🗑️ IMPORTANT: You should NOT delete the uploaded file (req.file.path) here. 
        // Your ML service needs it. Ensure your ML service handles file cleanup (as it does 
        // in your `process_video_async` function) or your backend needs a separate cleanup job.
        // If your ML service processes the video from the path on this server, ensure it's not deleted.
    }
};

// New function to add to your Node.js controller file
exports.checkGradingStatus = async (req, res) => {
    const { jobId } = req.params;
    
    if (!jobId) {
        return res.status(400).json({ success: false, message: 'Job ID is required.' });
    }
    
    const mlStatusUrl = `${ML_SERVICE_URL}/api/ml/status/${jobId}`;
    console.log(`\n🔍 Checking ML Job Status for ${jobId} at: ${mlStatusUrl}`);

    try {
        // 1. Call the ML Service's Status Endpoint
        const mlResponse = await axios.get(mlStatusUrl, {
            // Use a quick timeout for the status check
            timeout: 15000 
        });

        // 2. Respond directly with the ML service's data
        // The ML service returns: { job_id, status, result?, error? }
        const data = mlResponse.data;

        console.log(`✅ Status check successful. Current status: ${data.status}`);
        
        // 200 OK is fine for a status check, regardless of pending/completed/failed
        return res.status(200).json(data); 

    } catch (error) {
        console.error(`❌ Error checking status for job ${jobId}:`, error.message);
        
        let errorMessage = 'Failed to connect to ML status service.';
        let statusCode = 503; 

        if (error.response) {
            // Pass through the error status if the ML service returned one
            errorMessage = error.response.data?.error || error.response.data?.message || 'ML Service error.';
            statusCode = error.response.status;
            
            // If the ML service returns 404 (Job not found), pass it along
            if (statusCode === 404) {
                 errorMessage = `Grading job ${jobId} not found.`;
            }
        }

        return res.status(statusCode).json({
            success: false,
            status: 'error',
            error: errorMessage
        });
    }
};

// GET ALL CROPS
exports.getAllCrops = async (req, res) => {
    try {
        const crops = await CropListing.find({ 
            status: { $in: ['active', 'bidding', 'graded', 'pending_grading'] } 
        })
            .populate('farmerId', 'name email phone')
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, listings: crops });
    } catch (error) {
        console.error('❌ Error fetching crops:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching crops for marketplace',
            error: error.message,
        });
    }
};

// GET CROP BY ID
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
        console.error('❌ Error fetching crop by ID:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching crop',
            error: error.message,
        });
    }
};

// GET FARMER'S LISTINGS
exports.getFarmersListings = async (req, res) => {
    try {
        const { farmerId } = req.params;
        const listings = await CropListing.find({ farmerId: farmerId })
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, cropListings: listings });
    } catch (error) {
        console.error('❌ Error fetching farmer listings:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching farmer listings',
            error: error.message,
        });
    }
};
