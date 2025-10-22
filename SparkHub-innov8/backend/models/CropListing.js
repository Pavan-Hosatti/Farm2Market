const mongoose = require('mongoose');

const cropListingSchema = new mongoose.Schema({
    farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Farmer', required: true },
    crop: { type: String, required: true },
    quantityKg: { type: Number, required: true },
    pricePerKg: { type: Number, required: true },
    location: { type: String, required: true },
    details: { type: String },
    marketChoice: { type: String, enum: ['primary', 'zero-waste'], default: 'primary' },
    videoUrl: { type: String, required: true },
    grade: { type: String, enum: ['A', 'B', 'C', 'Pending'], default: 'Pending' }, // NEW
    qualityScore: { type: Number, default: 0 }, // NEW
    status: { 
        type: String, 
        enum: ['pending_grading', 'graded', 'active', 'bidding', 'sold'], 
        default: 'pending_grading' 
    },
}, { timestamps: true });

module.exports = mongoose.model('CropListing', cropListingSchema);