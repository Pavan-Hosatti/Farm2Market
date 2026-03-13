const mongoose = require('mongoose');

const proposalSchema = new mongoose.Schema({
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },

    freelancerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Freelancer',
        required: true
    },

    // Proposal content
    coverLetter: {
        type: String,
        required: true
    },

    proposedBudget: {
        type: Number,
        required: true
    },

    proposedTimeline: {
        duration: Number,
        unit: { type: String, enum: ['days', 'weeks', 'months'] },
        deliveryDate: Date
    },

    // Comprehension scoring
    aiComprehensionScore: {
        score: {
            type: Number,
            min: 0,
            max: 100
        },
        explanation: String,
        missingPoints: [String],
        strengths: [String],
        scoredAt: Date,
        modelUsed: String
    },

    // Skill/fit assessment
    skillFitScore: {
        overallFit: {
            type: Number,
            min: 0,
            max: 100
        },
        skillGaps: [String],
        relevantExperience: [String],
        assessedAt: Date
    },

    // Version tracking
    version: {
        type: Number,
        default: 1
    },

    documentVersionHashes: [String],

    // Check if proposal is outdated (brief was updated)
    isOutdated: {
        type: Boolean,
        default: false
    },

    outdatedReason: String,

    previousVersionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Proposal'
    },

    // Status
    status: {
        type: String,
        enum: ['draft', 'submitted', 'reviewed', 'shortlisted', 'rejected', 'withdrawn', 'accepted'],
        default: 'draft'
    },

    submittedAt: Date,

    // Negotiation
    negotiationOffers: [{
        offeredBy: { type: String, enum: ['freelancer', 'client'] },
        proposedBudget: Number,
        proposedTimeline: {
            duration: Number,
            unit: { type: String, enum: ['days', 'weeks', 'months'] }
        },
        message: String,
        createdAt: { type: Date, default: Date.now },
        acceptedAt: Date,
        status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' }
    }],

    // Blockchain anchoring
    blockchain: {
        proposalHash: String,
        proposalHashTx: String,
        anchoredAt: Date
    },

    // Chat history for dispute
    chatHistory: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProposalChat'
    }],

    createdAt: {
        type: Date,
        default: Date.now
    },

    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Index for efficient queries
proposalSchema.index({ projectId: 1, status: 1 });
proposalSchema.index({ freelancerId: 1, status: 1 });
proposalSchema.index({ 'aiComprehensionScore.score': -1 });

module.exports = mongoose.model('Proposal', proposalSchema);
