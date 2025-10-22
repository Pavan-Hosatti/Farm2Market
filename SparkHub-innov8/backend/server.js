require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path'); // ✅ ADD THIS

const app = express();
const PORT = process.env.PORT || 5000;

const corsOptions = {
    origin: 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());

// ✅ ADD THIS: Serve uploaded videos as static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('✅ MongoDB Connected Successfully');
    })
    .catch(err => {
        console.error('❌ MongoDB Connection Error:', err.message);
        process.exit(1);
    });

const authRoutes = require('./routes/authRoutes');
const cropListingRoutes = require('./routes/cropListingRoutes');
const bidRoutes = require('./routes/bidRoutes');
const voiceRoutes = require('./routes/voiceRoutes');

app.get('/', (req, res) => {
    res.send('Farm2Market Backend Running!');
});

app.use('/api/auth', authRoutes);
app.use('/api/crop-listings', cropListingRoutes);
app.use('/api/bids', bidRoutes);
app.use('/api/voice', voiceRoutes);

app.listen(PORT, () => {
    console.log(`✅ Server is running on port ${PORT}`);
    console.log(`📁 Serving videos from: ${path.join(__dirname, 'uploads')}`); // ✅ ADD THIS LOG
});