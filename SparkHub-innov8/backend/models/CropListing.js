// models/CropListing.js
const mongoose = require('mongoose');

const cropListingSchema = new mongoose.Schema({
    farmerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Farmer',
        required: true
    },

    crop: {
        type: String,
        required: true
    },

    quantityKg: {
        type: Number,
        required: true
    },

    pricePerKg: {
        type: Number,
        required: true
    },

    // ✅ Simple location object (no defaults)
    location: {
        latitude: Number,
        longitude: Number,
        address: String,
        city: String,
        state: String,
        country: {
            type: String,
            default: 'India'
        }
    },

    // ✅ CRITICAL FIX: Remove defaults and make completely optional
    geoLocation: {
        type: {
            type: String,
            enum: ['Point']
            // ❌ REMOVED: default: 'Point'
        },
        coordinates: {
            type: [Number]
            // ❌ No default value
        }
    },

    details: {
        type: String
    },

    marketChoice: {
        type: String,
        enum: ['primary', 'zero-waste'],
        default: 'primary'
    },

    videoUrl: {
        type: String,
        required: true
    },

    grade: {
        type: String,
        enum: ['A', 'B', 'C', 'Pending'],
        default: 'Pending'
    },

    qualityScore: {
        type: Number,
        default: 0
    },

    status: {
        type: String,
        enum: [
            'pending_grading',
            'graded',
            'active',
            'bidding',
            'sold',
            'grading_failed',
            'failed_submission'
        ],
        default: 'pending_grading'
    },

    mlJobId: {
        type: String,
        default: null
    },

    gradeDetails: {
        type: Object,
        default: {}
    },

    physicalAudit: {
        type: Object,
        default: {}
    }

}, { timestamps: true });

// ✅ Keep the 2dsphere index (it won't cause issues if field is missing)
cropListingSchema.index({ geoLocation: '2dsphere' });

module.exports = mongoose.model('CropListing', cropListingSchema);
