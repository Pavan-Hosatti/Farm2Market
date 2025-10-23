// controllers/predictController.js
const fs = require('fs');
const path = require('path');

// Mock prediction function - Replace with your actual ML model later
const predictGrade = async (req, res) => {
    try {
        const { cropType } = req.body;
        const imageFile = req.file;

        if (!imageFile) {
            return res.status(400).json({ message: 'No image file uploaded' });
        }

        // Mock ML prediction - Replace this with your actual model inference
        const grades = ['A', 'B', 'C', 'D'];
        const randomGrade = grades[Math.floor(Math.random() * grades.length)];
        const confidence = Math.floor(Math.random() * 20) + 75; // 75-95%

        // Mock grade breakdown
        const gradeBreakdown = {
            color: Math.floor(Math.random() * 20) + 80,
            size: Math.floor(Math.random() * 20) + 80,
            defects: Math.floor(Math.random() * 15) + 5,
            freshness: Math.floor(Math.random() * 20) + 80,
        };

        // Clean up uploaded file after processing (optional)
        // fs.unlinkSync(imageFile.path);

        res.json({
            success: true,
            grade: randomGrade,
            confidence: confidence,
            grade_breakdown: gradeBreakdown,
            cropType: cropType,
            message: 'Prediction successful'
        });

    } catch (error) {
        console.error('Prediction error:', error);
        res.status(500).json({ 
            message: 'Prediction failed', 
            error: error.message 
        });
    }
};

module.exports = {
    predictGrade
};
