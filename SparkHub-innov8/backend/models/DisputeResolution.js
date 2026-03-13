const mongoose = require('mongoose');

const disputeResolutionSchema = new mongoose.Schema({
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },

    proposalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Proposal'
    },

    freelancerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Freelancer',
        required: true
    },

    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        required: true
    },

    // Dispute details
    issue: {
        type: String,
        required: true
    },

    category: {
        type: String,
        enum: ['scope_mismatch', 'quality_issue', 'deadline_miss', 'payment_dispute', 'communication', 'other'],
        required: true
    },

    severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium'
    },

    // Context sources
    briefContent: String,
    proposalContent: String,
    relevantChatHistory: [String],
    proofDocuments: [{
        type: String,
        hash: String,
        timestamp: Date
    }],

    // AI-generated neutral summary
    aiNeutralSummary: {
        summary: String,
        keyPoints: [String],
        timeline: [{
            event: String,
            timestamp: Date,
            source: String
        }],
        generatedAt: Date,
        modelUsed: String,
        confidence: Number
    },

    // Resolution recommendation
    resolutionPath: {
        recommendation: String,
        suggestedOutcome: String,
        fairnessScore: {
            toFreelancer: Number,
            toClient: Number
        }
    },

    // Status
    status: {
        type: String,
        enum: ['open', 'under_review', 'resolved', 'escalated', 'closed'],
        default: 'open'
    },

    // Resolution
    resolution: {
        outcome: String,
        compensationAdjustment: Number,
        additionalMilestones: [String],
        lessons: [String],
        resolvedAt: Date
    },

    // Both parties response
    freelancerResponse: String,
    freelancerRespondedAt: Date,

    clientResponse: String,
    clientRespondedAt: Date,

    createdAt: {
        type: Date,
        default: Date.now
    },

    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

disputeResolutionSchema.index({ projectId: 1, status: 1 });
disputeResolutionSchema.index({ freelancerId: 1, status: 1 });

module.exports = mongoose.model('DisputeResolution', disputeResolutionSchema);
