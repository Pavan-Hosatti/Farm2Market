const mongoose = require('mongoose');

const voiceAssistantSessionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },

    userType: {
        type: String,
        enum: ['freelancer', 'client'],
        required: true
    },

    // Session context
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project'
    },

    proposalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Proposal'
    },

    // Voice settings
    language: {
        type: String,
        enum: ['en', 'ka', 'hi', 'te', 'ta', 'ml'],
        required: true
    },

    voiceLanguage: {
        type: String,
        enum: ['en', 'ka', 'hi', 'te', 'ta', 'ml']
    },

    // Session interactions
    interactions: [{
        sequenceNumber: Number,
        
        // User input
        userInput: {
            audioUrl: String,
            transcription: String,
            originalLanguage: String,
            timestamp: Date
        },

        // Intent detection
        detectedIntent: {
            category: String,
            action: String,
            entities: [String],
            confidence: Number
        },

        // AI response
        assistantResponse: {
            text: String,
            audioUrl: String,
            citations: [String],
            confidence: Number
        },

        // RAG context used
        ragContext: {
            citedDocuments: [String],
            snippets: [String]
        },

        // Outcome
        actionTaken: String,
        isSuccessful: Boolean,
        errorMessage: String
    }],

    // Session metadata
    totalInteractions: Number,
    successfulInteractions: Number,
    failedInteractions: Number,

    // Fallback tracking
    fallbacksUsed: [{
        reason: String,
        timestamp: Date,
        duration: Number
    }],

    // Session duration
    startTime: {
        type: Date,
        default: Date.now
    },

    endTime: Date,

    duration: Number,

    // Quality metrics
    userSatisfaction: Number, // 1-5
    assistantReliability: Number, // 0-100

    // Status
    status: {
        type: String,
        enum: ['active', 'paused', 'completed', 'error'],
        default: 'active'
    }
}, { timestamps: true });

voiceAssistantSessionSchema.index({ userId: 1, createdAt: -1 });
voiceAssistantSessionSchema.index({ projectId: 1 });

module.exports = mongoose.model('VoiceAssistantSession', voiceAssistantSessionSchema);
