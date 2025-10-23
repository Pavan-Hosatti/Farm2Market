require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ ENSURE UPLOADS FOLDER EXISTS
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('✅ Created uploads directory');
}

// 🔧 FIXED CORS - Added ML service port
const corsOptions = {
    origin: process.env.NODE_ENV === 'production' 
        ? [
            'https://farm2-market-ashen.vercel.app',
            'https://farm2-market-ashen.vercel.app/'
          ]
        : [
            'http://localhost:5173',  // Frontend
            'http://localhost:5001',  // ML Service
            'http://127.0.0.1:5173',
            'http://127.0.0.1:5001'
          ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ✅ ROOT ROUTE FIRST
app.get('/', (req, res) => {
    res.send('Farm2Market Backend Running!');
});

// 🔧 ADD ML SERVICE HEALTH CHECK
app.get('/api/ml-status', async (req, res) => {
    try {
        const axios = require('axios');
        const response = await axios.get('http://localhost:5001/');
        res.json({ 
            success: true, 
            message: 'ML service is running',
            mlStatus: response.data 
        });
    } catch (error) {
        res.status(503).json({ 
            success: false, 
            message: 'ML service is not available',
            error: error.message 
        });
    }
});

// ✅ IMPORT ROUTES WITH ERROR HANDLING
let authRoutes, cropListingRoutes, bidRoutes, voiceRoutes, predictRoutes;

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

// ✅ MOUNT ROUTES (ONLY IF THEY LOADED SUCCESSFULLY)
if (authRoutes) app.use('/api/auth', authRoutes);
if (cropListingRoutes) app.use('/api/crops', cropListingRoutes);
if (bidRoutes) app.use('/api/bids', bidRoutes);
if (voiceRoutes) app.use('/api/voice', voiceRoutes);
if (predictRoutes) app.use('/api/predict', predictRoutes);

console.log('📋 Mounted routes:');
console.log('   - /api/auth');
console.log('   - /api/crops');
console.log('   - /api/bids');
console.log('   - /api/voice');
console.log('   - /api/predict');

// ✅ CONNECT TO DATABASE AFTER MOUNTING ROUTES
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('✅ MongoDB Connected Successfully');
    })
    .catch(err => {
        console.error('❌ MongoDB Connection Error:', err.message);
    });

// ✅ 404 HANDLER FOR DEBUGGING
app.use((req, res, next) => {
    console.log(`⚠️  404 - Route not found: ${req.method} ${req.url}`);
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.url}`,
        availableRoutes: [
            'GET /',
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
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: err.message
    });
});

app.listen(PORT, () => {
    console.log(`✅ Server is running on port ${PORT}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📁 Serving uploads from: ${uploadsDir}`);
    console.log(`🤖 ML Service should be running on: http://localhost:5001`);
});
