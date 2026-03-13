const mongoose = require('mongoose');

const scopeGapDetectorSchema = new mongoose.Schema({
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },

    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        required: true
    },

    // Detected gaps
    gaps: [{
        category: { type: String, enum: ['budget', 'timeline', 'acceptance_criteria', 'requirements', 'deliverables', 'other'] },
        issue: String,
        severity: { type: String, enum: ['critical', 'high', 'medium', 'low'] },
        suggestion: String,
        example: String
    }],

    // Summary
    totalGapsFound: Number,
    criticalGapCount: Number,
    highGapCount: Number,

    // Status
    hasAmbiguity: Boolean,
    isProceedingWithoutFix: Boolean,

    // Client acknowledgment
    clientAcknowledged: Boolean,
    acknowledgedAt: Date,
    clientMessage: String,

    // Assessment metadata
    assessedAt: Date,
    modelUsed: String,

    // Completion checklist
    ambiguityChecklist: [{
        item: String,
        isResolved: Boolean,
        resolvedAt: Date
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

scopeGapDetectorSchema.index({ projectId: 1 });
scopeGapDetectorSchema.index({ hasAmbiguity: 1 });

module.exports = mongoose.model('ScopeGapDetector', scopeGapDetectorSchema);
