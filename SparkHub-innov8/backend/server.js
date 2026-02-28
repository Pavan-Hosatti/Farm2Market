if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'development';
}
console.log(`🔧 Environment forced to: ${process.env.NODE_ENV}`);



require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const mapRoutes = require('./routes/marketplace.routes');

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ ENSURE UPLOADS FOLDER EXISTS
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('✅ Created uploads directory');
}

// 🔧 DYNAMIC ML SERVICE URL - Works in both local and production
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';
console.log(`🤖 ML Service URL: ${ML_SERVICE_URL}`);

// 🔧 COMPREHENSIVE CORS CONFIGURATION
// 🔧 COMPREHENSIVE CORS CONFIGURATION
const allowedOrigins = process.env.NODE_ENV === 'production'
    ? [
        // Add localhost for testing deployed backend with local frontend
        'http://localhost:5173',
        'http://localhost:5174',
        'https://farm2-market-ashen.vercel.app',
        'https://farm2-market-git-main-pavan-hosattis-projects.vercel.app',
        'https://farm2-market-4o7xt0kgz-pavan-hosattis-projects.vercel.app',
        process.env.ML_SERVICE_URL
      ].filter(Boolean)
    : [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:5001',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5001'
      ];

const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.warn(`⚠️  CORS blocked origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-auth-token'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 86400 // 24 hours
};


app.use(cors(corsOptions));





          



app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/public', express.static(path.join(__dirname, 'public')));

// ✅ ROOT ROUTE
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Farm2Market Backend Running!',
        environment: process.env.NODE_ENV || 'development',
        mlServiceUrl: ML_SERVICE_URL,
        timestamp: new Date().toISOString()
    });
});

// 🔧 HEALTH CHECK ENDPOINT
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        status: 'healthy',
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString()
    });
});

// 🔧 ML SERVICE HEALTH CHECK (Uses dynamic URL)
app.get('/api/ml-status', async (req, res) => {
    try {
        const axios = require('axios');
        const response = await axios.get(`${ML_SERVICE_URL}/`, {
            timeout: 10000 // 10 second timeout
        });
        res.json({ 
            success: true, 
            message: 'ML service is running',
            mlServiceUrl: ML_SERVICE_URL,
            mlStatus: response.data 
        });
    } catch (error) {
        console.error('❌ ML Service Error:', error.message);
        res.status(503).json({ 
            success: false, 
            message: 'ML service is not available',
            mlServiceUrl: ML_SERVICE_URL,
            error: error.message 
        });
    }
});

// ✅ IMPORT ROUTES WITH ERROR HANDLING
let authRoutes, cropListingRoutes, bidRoutes, voiceRoutes, predictRoutes, farmerProfileRoutes;

try {
    authRoutes = require('./routes/authRoutes');
    console.log('✅ Auth routes loaded');
} catch (err) {
    console.error('❌ Error loading auth routes:', err.message);
}

try {
    cropListingRoutes = require('./routes/cropListingRoutes');
    console.log('✅ Crop listing routes loaded');
} catch (err) {
    console.error('❌ Error loading crop listing routes:', err.message);
}

try {
    bidRoutes = require('./routes/bidRoutes');
    console.log('✅ Bid routes loaded');
} catch (err) {
    console.error('❌ Error loading bid routes:', err.message);
}

try {
    voiceRoutes = require('./routes/voiceRoutes');
    console.log('✅ Voice routes loaded');
} catch (err) {
    console.error('❌ Error loading voice routes:', err.message);
}

try {
    predictRoutes = require('./routes/predictRoutes');
    console.log('✅ Predict routes loaded');
} catch (err) {
    console.error('❌ Error loading predict routes:', err.message);
}


try {
    farmerProfileRoutes = require('./routes/farmer-profile.routes');
    console.log('✅ Farmer profile routes loaded');
} catch (err) {
    console.error('❌ Error loading farmer profile routes:', err.message);
}

// ✅ MOUNT ROUTES (ONLY IF THEY LOADED SUCCESSFULLY)
if (authRoutes) app.use('/api/auth', authRoutes);
if (cropListingRoutes) app.use('/api/crops', cropListingRoutes);
if (bidRoutes) app.use('/api/bids', bidRoutes);
if (voiceRoutes) app.use('/api/voice', voiceRoutes);
if (predictRoutes) app.use('/api/predict', predictRoutes);
// Mount the route (around line 100-110)
if (farmerProfileRoutes) app.use('/api/farmer-profile', farmerProfileRoutes);
app.use('/api/map', mapRoutes);


console.log('📋 Mounted routes:');
console.log('   - GET /');
console.log('   - GET /api/health');
console.log('   - GET /api/ml-status');
if (authRoutes) console.log('   - /api/auth/*');
if (cropListingRoutes) console.log('   - /api/crops/*');
if (bidRoutes) console.log('   - /api/bids/*');
if (voiceRoutes) console.log('   - /api/voice/*');
if (predictRoutes) console.log('   - /api/predict/*');
if (farmerProfileRoutes) console.log('   - /api/farmer-profile/*');

// ✅ CONNECT TO DATABASE
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('✅ MongoDB Connected Successfully');
    })
    .catch(err => {
        console.error('❌ MongoDB Connection Error:', err.message);
        // Don't exit process - let Render restart
    });

// ✅ 404 HANDLER
app.use((req, res, next) => {
    console.log(`⚠️  404 - Route not found: ${req.method} ${req.url}`);
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.url}`,
        requestedUrl: req.url,
        method: req.method,
        availableRoutes: [
            'GET /',
            'GET /api/health',
            'GET /api/ml-status',
            'POST /api/auth/register',
            'POST /api/auth/login',
            'POST /api/crops/submit-for-grading',
            'GET /api/crops/marketplace'
        ]
    });
});

// ✅ ERROR HANDLER
app.use((err, req, res, next) => {
    console.error('❌ Server Error:', err);
    
    // Handle CORS errors specifically
    if (err.message === 'Not allowed by CORS') {
        return res.status(403).json({
            success: false,
            message: 'CORS Error: Origin not allowed',
            error: err.message
        });
    }
    
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'production' ? 'An error occurred' : err.message
    });
});

// ✅ START SERVER
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server is running on port ${PORT}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📁 Serving uploads from: ${uploadsDir}`);
    console.log(`🤖 ML Service URL: ${ML_SERVICE_URL}`);
    console.log(`🔗 Allowed origins:`, allowedOrigins);
});
