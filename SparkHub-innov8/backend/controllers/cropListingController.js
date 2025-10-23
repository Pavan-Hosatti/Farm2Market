const CropListing = require('../models/CropListing');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// ML Service URL
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';

exports.submitForGrading = async (req, res) => {
    console.log('\n🟢 ===== SUBMIT FOR GRADING STARTED =====');
    console.log('Timestamp:', new Date().toISOString());
    
    try {
        // 1. LOG REQUEST DATA
        console.log('\n📦 Request Body:', {
            farmerId: req.body.farmerId,
            crop: req.body.crop,
            quantityKg: req.body.quantityKg,
            pricePerKg: req.body.pricePerKg,
            location: req.body.location,
            marketChoice: req.body.marketChoice
        });
        
        console.log('\n📁 File Info:', req.file ? {
            fieldname: req.file.fieldname,
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
            path: req.file.path,
            destination: req.file.destination
        } : '❌ NO FILE UPLOADED');
        
        // 2. VALIDATE FILE EXISTS
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
        
        // 3. CHECK FILE ON DISK
        console.log('\n📂 File System Check:');
        console.log('  Path:', videoPath);
        console.log('  Exists:', fs.existsSync(videoPath));
        if (fs.existsSync(videoPath)) {
            const stats = fs.statSync(videoPath);
            console.log('  Size:', stats.size, 'bytes');
            console.log('  Readable:', fs.accessSync(videoPath, fs.constants.R_OK) === undefined);
        }
        
        if (!fs.existsSync(videoPath)) {
            console.log('❌ FILE NOT FOUND ON DISK');
            return res.status(400).json({
                success: false,
                message: 'Uploaded video file not found on server',
                debug: { videoPath, exists: false }
            });
        }

        // 4. PREPARE ML REQUEST
        let gradeResult;
        console.log('\n🔄 ===== CALLING ML SERVICE =====');
        console.log('ML Service URL:', ML_SERVICE_URL);
        
        try {
            // Create form data
            const formData = new FormData();
            const fileStream = fs.createReadStream(path.resolve(videoPath));
            
            // Log stream creation
            fileStream.on('error', (err) => {
                console.error('❌ File stream error:', err);
            });
            
            formData.append('video', fileStream, {
                filename: req.file.originalname,
                contentType: req.file.mimetype
            });
            formData.append('cropType', (crop || '').toLowerCase());

         const mlUrl = `${ML_SERVICE_URL}/api/ml/predict`;
            
            console.log('\n📤 ML Request Details:');
            console.log('  URL:', mlUrl);
            console.log('  Crop Type:', (crop || '').toLowerCase());
            console.log('  Original Filename:', req.file.originalname);
            console.log('  Content Type:', req.file.mimetype);

            // 5. SEND TO ML SERVICE
            console.log('\n⏳ Sending request to ML service...');
            const startTime = Date.now();
            
            const mlResponse = await axios.post(mlUrl, formData, {
                headers: {
                    ...formData.getHeaders()
                },
                timeout: 120000,
                maxContentLength: Infinity,
                maxBodyLength: Infinity,
                validateStatus: (status) => status < 500 // Don't throw on 4xx errors
            });
            
            const duration = Date.now() - startTime;
            console.log(`\n✅ ML Response received in ${duration}ms`);
            console.log('Status:', mlResponse.status);
            console.log('Headers:', mlResponse.headers);
            console.log('Data:', JSON.stringify(mlResponse.data, null, 2));

            // 6. VALIDATE ML RESPONSE
            if (mlResponse.status !== 200) {
                console.warn('⚠️ ML service returned non-200 status:', mlResponse.status);
                gradeResult = {
                    grade: 'Pending',
                    confidence: 0,
                    error: `ML service returned status ${mlResponse.status}: ${JSON.stringify(mlResponse.data)}`
                };
            } else {
                gradeResult = mlResponse.data || {};
                
                // Validate response structure
                if (!gradeResult.grade || gradeResult.grade === 'mock') {
                    console.warn('⚠️ Invalid ML response - missing or mock grade');
                    gradeResult = {
                        grade: 'Pending',
                        confidence: 0,
                        error: 'ML service returned invalid result',
                        raw_response: mlResponse.data
                    };
                } else {
                    // Normalize grade
                    gradeResult.grade = String(gradeResult.grade).toUpperCase();
                    gradeResult.confidence = typeof gradeResult.confidence === 'number' 
                        ? gradeResult.confidence 
                        : parseFloat(gradeResult.confidence) || 0;
                    
                    console.log('✅ Valid grade received:', {
                        grade: gradeResult.grade,
                        confidence: gradeResult.confidence,
                        frames_analyzed: gradeResult.frames_analyzed
                    });
                }
            }
            
        } catch (mlError) {
            // 7. HANDLE ML SERVICE ERRORS
            console.error('\n❌❌❌ ML SERVICE ERROR ❌❌❌');
            console.error('Error Type:', mlError.constructor.name);
            console.error('Error Message:', mlError.message);
            console.error('Error Code:', mlError.code);
            
            if (mlError.response) {
                console.error('\n📥 ML Service Response:');
                console.error('  Status:', mlError.response.status);
                console.error('  Status Text:', mlError.response.statusText);
                console.error('  Headers:', mlError.response.headers);
                console.error('  Data:', JSON.stringify(mlError.response.data, null, 2));
            } else if (mlError.request) {
                console.error('\n📤 No Response from ML Service');
                console.error('  Request sent but no response received');
                console.error('  Check if ML service is running on:', ML_SERVICE_URL);
                console.error('  Request config:', {
                    url: mlError.config?.url,
                    method: mlError.config?.method,
                    timeout: mlError.config?.timeout
                });
            } else {
                console.error('\n⚙️ Request Setup Error:', mlError.message);
                console.error('  Stack:', mlError.stack);
            }
            
            gradeResult = {
                grade: 'Pending',
                confidence: 0,
                error: `ML service error: ${mlError.code || mlError.message}`,
                debug: {
                    hasResponse: !!mlError.response,
                    hasRequest: !!mlError.request,
                    errorType: mlError.constructor.name
                }
            };
        }
        
        // 8. SAVE TO DATABASE
        console.log('\n💾 ===== SAVING TO DATABASE =====');
        const statusToSave = (gradeResult.grade && gradeResult.grade !== 'Pending') 
            ? 'graded' 
            : 'pending_grading';
            
        console.log('Data to save:', {
            grade: gradeResult.grade,
            confidence: gradeResult.confidence,
            status: statusToSave,
            hasError: !!gradeResult.error
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
            grade: gradeResult.grade || 'Pending',
            qualityScore: gradeResult.confidence || 0,
            status: statusToSave,
        });
        
        const savedCrop = await newCrop.save();
        console.log('✅ Saved to database with ID:', savedCrop._id);
        
        // 9. SEND RESPONSE
        console.log('\n📤 ===== SENDING RESPONSE =====');
        const responseData = {
            success: true,
            message: gradeResult.error 
                ? 'Crop submitted but grading is pending'
                : 'Crop submitted and graded successfully!',
            cropListing: savedCrop,
            gradeDetails: {
                grade: gradeResult.grade,
                confidence: gradeResult.confidence,
                error: gradeResult.error,
                frames_analyzed: gradeResult.frames_analyzed || 0,
                grade_breakdown: gradeResult.grade_breakdown || {}
            }
        };
        
        console.log('Response:', JSON.stringify(responseData, null, 2));
        res.status(201).json(responseData);
        
        console.log('🟢 ===== SUBMIT FOR GRADING COMPLETED =====\n');
        
    } catch (error) {
        // 10. HANDLE CONTROLLER ERRORS
        console.error('\n❌❌❌ CONTROLLER ERROR ❌❌❌');
        console.error('Error Type:', error.constructor.name);
        console.error('Error Message:', error.message);
        console.error('Stack Trace:', error.stack);
        
        res.status(500).json({
            success: false,
            message: 'Error submitting crop for grading',
            error: error.message,
            debug: {
                stack: error.stack,
                type: error.constructor.name
            }
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
