// controllers/cropListingController.js
const CropListing = require('../models/CropListing');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// ML Service URL
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';
console.log('🤖 ML Service URL:', ML_SERVICE_URL);

// ============================================
// SUBMIT FOR GRADING (ASYNC)
// ============================================
exports.submitForGrading = async (req, res) => {
    console.log('\n' + '='.repeat(60));
    console.log('📥 NEW CROP SUBMISSION');
    console.log('='.repeat(60));
    console.log('⏰ Timestamp:', new Date().toISOString());

    try {
        // ✅ STEP 1: VALIDATE FILE
        if (!req.file) {
            console.log('❌ No file uploaded');
            return res.status(400).json({ 
                success: false, 
                message: 'Video file is required'
            });
        }

        const videoPath = req.file.path;
        console.log('📹 Video uploaded:', {
            filename: req.file.filename,
            size: `${(req.file.size / (1024 * 1024)).toFixed(2)} MB`,
            path: videoPath
        });

        // Verify file exists on disk
        if (!fs.existsSync(videoPath)) {
            console.log('❌ File not found on disk:', videoPath);
            return res.status(500).json({
                success: false,
                message: 'File upload failed - file not found'
            });
        }

        // ✅ STEP 2: EXTRACT FORM DATA
        const { 
            farmerId, 
            crop, 
            quantityKg, 
            pricePerKg, 
            location, 
            latitude,
            longitude,
            address,
            city,
            state,
            details, 
            marketChoice,
            physicalAudit 
        } = req.body;

        console.log('📋 Form Data:', {
            farmerId,
            crop,
            quantityKg,
            pricePerKg,
            location,
            latitude,
            longitude,
            marketChoice
        });

        // Validate required fields
        if (!crop || !quantityKg || !pricePerKg) {
            console.log('❌ Missing required fields');
            
            // Clean up file
            fs.unlinkSync(videoPath);
            
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: crop, quantityKg, pricePerKg'
            });
        }

        // ✅ STEP 3: SUBMIT TO ML SERVICE
        console.log('\n🤖 Submitting to ML Service...');
       console.log('📡 URL:', `${ML_SERVICE_URL}/submit`);

        let job_id = null;
        let mlSubmissionError = null;

        try {
            const formData = new FormData();
            const absolutePath = path.resolve(videoPath);
            console.log('📂 Absolute path:', absolutePath);
            
            const fileStream = fs.createReadStream(absolutePath);
            
            fileStream.on('error', (error) => {
                console.error('❌ File stream error:', error);
            });

            formData.append('video', fileStream, {
                filename: req.file.originalname,
                contentType: req.file.mimetype
            });
            
            formData.append('cropType', (crop || '').toLowerCase());

            console.log('📤 Sending to ML service...');
            console.log('📦 File:', req.file.originalname);
            console.log('🌾 Crop Type:', crop.toLowerCase());

            const mlResponse = await axios.post(
               `${ML_SERVICE_URL}/submit`, 
                formData,
                {
                    headers: {
                        ...formData.getHeaders()
                    },
                    timeout: 120000,
                    maxContentLength: 100 * 1024 * 1024,
                    maxBodyLength: 100 * 1024 * 1024,
                    validateStatus: (status) => status < 500
                }
            );

            console.log('📨 ML Response Status:', mlResponse.status);
            console.log('📨 ML Response Data:', JSON.stringify(mlResponse.data, null, 2));

            if (mlResponse.status === 202 && mlResponse.data.job_id) {
                job_id = mlResponse.data.job_id;
                console.log('✅ Job submitted successfully!');
                console.log('🆔 Job ID:', job_id);
            } else {
                throw new Error(`Unexpected ML response: ${JSON.stringify(mlResponse.data)}`);
            }

        } catch (mlError) {
            console.error('\n❌ ML SUBMISSION ERROR:');
            console.error('Message:', mlError.message);
            console.error('Code:', mlError.code);
            
            if (mlError.response) {
                console.error('Response Status:', mlError.response.status);
                console.error('Response Data:', mlError.response.data);
            }

            mlSubmissionError = mlError.message;
        }

        // ✅ STEP 4: SAVE TO DATABASE
        console.log('\n💾 Saving to database...');

        // Build base crop data
        const cropData = {
            farmerId: farmerId || '60c72b2f9b1d9c0015b8b4a1',
            crop,
            quantityKg: Number(quantityKg),
            pricePerKg: Number(pricePerKg),
            details: details || '',
            marketChoice: marketChoice || 'primary',
            videoUrl: `/uploads/${req.file.filename}`,
            status: job_id ? 'pending_grading' : 'failed_submission',
            mlJobId: job_id,
            grade: 'Pending',
            qualityScore: 0,
            gradeDetails: mlSubmissionError ? { error: mlSubmissionError } : {}
        };

        // ✅ CRITICAL FIX: Only add geoLocation if we have valid coordinates
        let hasValidCoordinates = false;

        // Try to parse coordinates from different sources
        if (latitude && longitude) {
            const lat = parseFloat(latitude);
            const lng = parseFloat(longitude);
            
            if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
                cropData.location = {
                    latitude: lat,
                    longitude: lng,
                    address: address || location || '',
                    city: city || '',
                    state: state || '',
                    country: 'India'
                };
                
                cropData.geoLocation = {
                    type: 'Point',
                    coordinates: [lng, lat]
                };
                
                hasValidCoordinates = true;
                console.log('📍 Location set with coordinates:', cropData.location);
                console.log('🗺️ GeoLocation set:', cropData.geoLocation);
            }
        } else if (location && location.includes(',')) {
            const [lat, lng] = location.split(',').map(s => parseFloat(s.trim()));
            
            if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
                cropData.location = {
                    latitude: lat,
                    longitude: lng,
                    address: address || '',
                    city: city || '',
                    state: state || '',
                    country: 'India'
                };
                
                cropData.geoLocation = {
                    type: 'Point',
                    coordinates: [lng, lat]
                };
                
                hasValidCoordinates = true;
                console.log('📍 Location parsed from string:', cropData.location);
                console.log('🗺️ GeoLocation set:', cropData.geoLocation);
            }
        }
        
        // If no valid coordinates, only set location as address
        if (!hasValidCoordinates && location) {
            cropData.location = {
                address: location,
                country: 'India'
            };
            console.log('📍 Location set (address only, no coordinates):', cropData.location);
            console.log('⚠️ No geoLocation field added (no valid coordinates)');
        }

        // Parse physical audit if provided
        if (physicalAudit) {
            try {
                cropData.physicalAudit = typeof physicalAudit === 'string' 
                    ? JSON.parse(physicalAudit) 
                    : physicalAudit;
            } catch (e) {
                console.warn('⚠️ Could not parse physicalAudit:', e.message);
            }
        }

        console.log('\n📦 Final crop data to save:');
        console.log(JSON.stringify(cropData, null, 2));

        const savedCrop = await CropListing.create(cropData);
        console.log('✅ Saved to database successfully!');
        console.log('🆔 Crop ID:', savedCrop._id);
        console.log('📊 Status:', savedCrop.status);

        // ✅ STEP 5: SEND RESPONSE
        console.log('\n📤 Sending response to frontend...');

        const responseData = {
            success: !!job_id,
            message: job_id 
                ? 'Crop submitted successfully. Grading in progress.' 
                : 'Crop saved, but ML service is unavailable. Grade will be Pending.',
            cropListingId: savedCrop._id,
            job_id: job_id,
            status: job_id ? 'pending' : 'failed',
            error: mlSubmissionError
        };

        console.log('Response:', JSON.stringify(responseData, null, 2));
        console.log('='.repeat(60) + '\n');

        return res.status(job_id ? 202 : 200).json(responseData);

    } catch (error) {
        console.error('\n❌❌❌ CONTROLLER ERROR ❌❌❌');
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);

        // Clean up file on error
        if (req.file && req.file.path && fs.existsSync(req.file.path)) {
            try {
                fs.unlinkSync(req.file.path);
                console.log('🗑️ Cleaned up file after error');
            } catch (cleanupErr) {
                console.error('⚠️ Could not delete file:', cleanupErr.message);
            }
        }

        return res.status(500).json({
            success: false,
            message: 'Error submitting crop',
            error: error.message
        });
    }
};

// ============================================
// CHECK GRADING STATUS (POLLING)
// ============================================
exports.checkGradingStatus = async (req, res) => {
    const { jobId } = req.params;
    
    console.log(`\n🔍 Status check for job: ${jobId}`);
    
    if (!jobId) {
        return res.status(400).json({ 
            success: false, 
            message: 'Job ID is required' 
        });
    }
    
    try {
        // Check database first
        const crop = await CropListing.findOne({ mlJobId: jobId });
        
        if (crop && crop.status === 'graded') {
            console.log(`✅ Job ${jobId} completed (from database)`);
            return res.status(200).json({
                job_id: jobId,
                status: 'completed',
                result: {
                    grade: crop.grade,
                    confidence: crop.qualityScore,
                    overall_confidence: crop.gradeDetails?.overall_confidence || crop.qualityScore,
                    grade_breakdown: crop.gradeDetails?.grade_breakdown || {},
                    frames_analyzed: crop.gradeDetails?.frames_analyzed || 0
                }
            });
        }
        
        // Query ML service
      const mlStatusUrl = `${ML_SERVICE_URL}/status/${jobId}`;
        console.log(`📡 Checking ML service: ${mlStatusUrl}`);
        
        const mlResponse = await axios.get(mlStatusUrl, {
            timeout: 10000
        });

        console.log(`📨 ML Status:`, mlResponse.data);
        return res.status(200).json(mlResponse.data);

    } catch (error) {
        console.error(`❌ Error checking status:`, error.message);
        
        // Fallback to database
        try {
            const crop = await CropListing.findOne({ mlJobId: jobId });
            if (crop) {
                return res.status(200).json({
                    job_id: jobId,
                    status: crop.status === 'graded' ? 'completed' : 'processing',
                    result: crop.status === 'graded' ? {
                        grade: crop.grade,
                        confidence: crop.qualityScore
                    } : null
                });
            }
        } catch (dbError) {
            console.error('❌ Database fallback failed:', dbError.message);
        }
        
        return res.status(503).json({
            success: false,
            status: 'error',
            error: 'Unable to check status - ML service may be down'
        });
    }
};

// ============================================
// ML WEBHOOK (Called by ML service when done)
// ============================================
exports.updateGradeFromML = async (req, res) => {
    console.log('\n' + '='.repeat(60));
    console.log('🔔 ML WEBHOOK RECEIVED');
    console.log('='.repeat(60));
    console.log('Body:', JSON.stringify(req.body, null, 2));
    
    try {
        const { job_id, status, result, error } = req.body;
        
        if (!job_id) {
            console.log('❌ No job_id in webhook');
            return res.status(400).json({ 
                success: false, 
                message: 'job_id is required' 
            });
        }

        const crop = await CropListing.findOne({ mlJobId: job_id });
        
        if (!crop) {
            console.log(`⚠️ No crop found for job: ${job_id}`);
            return res.status(404).json({ 
                success: false, 
                message: 'Crop not found for this job' 
            });
        }

        console.log(`📦 Found crop: ${crop._id}`);

        if (status === 'completed' && result) {
            crop.status = 'graded';
            crop.grade = result.grade;
            crop.qualityScore = result.confidence;
            crop.gradeDetails = {
                overall_confidence: result.overall_confidence,
                grade_breakdown: result.grade_breakdown,
                frames_analyzed: result.frames_analyzed
            };
            
            console.log(`✅ Updated with grade: ${result.grade} (${result.confidence}%)`);
            
        } else if (status === 'failed') {
            crop.status = 'grading_failed';
            crop.gradeDetails = { error: error || 'Grading failed' };
            
            console.log(`❌ Grading failed: ${error}`);
        }

        await crop.save();
        console.log('💾 Saved to database');
        console.log('='.repeat(60) + '\n');
        
        return res.status(200).json({ 
            success: true, 
            message: 'Webhook processed successfully',
            cropId: crop._id 
        });

    } catch (error) {
        console.error('❌ Webhook error:', error);
        return res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

// ============================================
// GET ALL CROPS (Marketplace)
// ============================================
exports.getAllCrops = async (req, res) => {
    try {
        const crops = await CropListing.find({ 
            status: { $in: ['active', 'bidding', 'graded', 'pending_grading'] } 
        })
            .populate('farmerId', 'name email phone')
            .sort({ createdAt: -1 });
            
        res.status(200).json({ 
            success: true, 
            listings: crops 
        });
    } catch (error) {
        console.error('❌ Error fetching crops:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching crops',
            error: error.message
        });
    }
};

// ============================================
// GET CROP BY ID
// ============================================
exports.getCropById = async (req, res) => {
    try {
        const { id } = req.params;
        const crop = await CropListing.findById(id)
            .populate('farmerId', 'name email phone');
            
        if (!crop) {
            return res.status(404).json({
                success: false,
                message: 'Crop not found'
            });
        }
        
        res.status(200).json({ 
            success: true, 
            crop 
        });
    } catch (error) {
        console.error('❌ Error fetching crop:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching crop',
            error: error.message
        });
    }
};

// ============================================
// GET FARMER'S LISTINGS
// ============================================
exports.getFarmersListings = async (req, res) => {
    try {
        const { farmerId } = req.params;
        const listings = await CropListing.find({ farmerId })
            .sort({ createdAt: -1 });
            
        res.status(200).json({ 
            success: true, 
            cropListings: listings 
        });
    } catch (error) {
        console.error('❌ Error fetching farmer listings:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching listings',
            error: error.message
        });
    }
};
