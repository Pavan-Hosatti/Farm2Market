const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const clientSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Client name is required'],
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
        enum: ['client', 'freelancer', 'admin'],
        default: 'client'
    },

    // Profile
    company: String,
    about: String,
    location: String,
    phoneNumber: String,
    website: String,

    // Verification
    isEmailVerified: {
        type: Boolean,
        default: false
    },

    emailVerificationToken: String,
    emailVerificationExpires: Date,

    // Profile completion
    isProfileComplete: {
        type: Boolean,
        default: false
    },

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

    // Projects
    projectsCount: {
        type: Number,
        default: 0
    },

    activeProjectsCount: {
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

    // Blockchain
    algorandAddress: String,

    // Metadata
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
clientSchema.pre('save', async function(next) {
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
clientSchema.methods.comparePassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Client', clientSchema);
