const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const farmerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a farm name'],
        trim: true,
        maxlength: [100, 'Farm name cannot exceed 100 characters']
    },
    email: {
        type: String,
        required: [true, 'Please provide an email'],
        unique: true,
        lowercase: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: 8,
        select: false // Don't include password by default in queries
    },
    role: {
        type: String,
        enum: ['farmer'],
        default: 'farmer'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// --- MIDDLEWARE: Hash password before saving ---
farmerSchema.pre('save', async function(next) {
    // Only hash if password is modified
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

// --- INSTANCE METHOD: Sign JWT Token ---
farmerSchema.methods.getSignedJwtToken = function() {
    return jwt.sign(
        { id: this._id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE }
    );
};

// --- INSTANCE METHOD: Compare Passwords ---
farmerSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Farmer', farmerSchema);