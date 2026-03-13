const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const freelancerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Freelancer name is required'],
        trim: true,
        maxlength: [100, 'Name cannot exceed 100 characters']
    },

    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
    },

    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: 8,
        select: false
    },

    role: {
        type: String,
        enum: ['freelancer', 'client', 'admin'],
        default: 'freelancer'
    },

    // Profile
    headline: String,
    about: String,
    location: String,
    phoneNumber: String,
    timezone: String,

    // Verification
    isEmailVerified: {
        type: Boolean,
        default: false
    },

    // Skills & Expertise
    skills: [{
        name: String,
        endorsements: {
            type: Number,
            default: 0
        }
    }],

    expertise: [String],

    languages: [{
        name: String,
        level: { type: String, enum: ['beginner', 'intermediate', 'fluent', 'native'] }
    }],

    // Work history
    yearsOfExperience: Number,
    completedProjects: {
        type: Number,
        default: 0
    },

    // Ratings
    averageRating: {
        type: Number,
        min: 0,
        max: 5,
        default: 0
    },

    totalRatings: {
        type: Number,
        default: 0
    },

    totalEarnings: {
        type: Number,
        default: 0
    },

    // Portfolio
    portfolio: [{
        title: String,
        description: String,
        url: String,
        imageUrl: String,
        completedDate: Date
    }],

    // Preferences
    language: {
        type: String,
        enum: ['en', 'ka', 'hi', 'te', 'ta', 'ml'],
        default: 'en'
    },

    preferredCurrency: {
        type: String,
        default: 'USD'
    },

    hourlyRate: {
        type: Number,
        min: 0
    },

    // Voice settings
    voiceEnabled: {
        type: Boolean,
        default: true
    },

    voiceLanguage: {
        type: String,
        enum: ['en', 'ka', 'hi', 'te', 'ta', 'ml'],
        default: 'en'
    },

    // Blockchain
    algorandAddress: String,

    // Metadata
    isProfileComplete: {
        type: Boolean,
        default: false
    },

    createdAt: {
        type: Date,
        default: Date.now
    },

    lastLogin: Date,

    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// Hash password before save
freelancerSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Compare password method
freelancerSchema.methods.comparePassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Freelancer', freelancerSchema);
