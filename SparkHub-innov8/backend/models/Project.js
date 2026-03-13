const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    // Project metadata
    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        required: true
    },

    title: {
        type: String,
        required: [true, 'Project title is required'],
        trim: true,
        maxlength: [200, 'Title cannot exceed 200 characters']
    },

    description: {
        type: String,
        required: true
    },

    // Scope details
    scope: {
        summary: String,
        requirements: [String],
        budget: {
            min: Number,
            max: Number,
            currency: { type: String, default: 'USD' }
        },
        timeline: {
            startDate: Date,
            endDate: Date,
            milestones: [{
                name: String,
                dueDate: Date,
                deliverables: [String]
            }]
        },
        acceptanceCriteria: [String],
        requiredSkills: [String],
        level: {
            type: String,
            enum: ['beginner', 'intermediate', 'advanced', 'expert'],
            default: 'intermediate'
        }
    },

    // Document management
    documents: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProjectDocument'
    }],

    // Quality flags
    gapDetection: {
        hasMissingBudget: Boolean,
        hasMissingTimeline: Boolean,
        hasMissingAcceptanceCriteria: Boolean,
        missingItems: [String],
        isGapsCritical: Boolean,
        lastCheckTime: Date
    },

    // Status
    status: {
        type: String,
        enum: ['draft', 'gap_check_pending', 'gaps_flagged', 'ready_to_publish', 'published', 'in_progress', 'completed', 'archived'],
        default: 'draft'
    },

    isPublished: {
        type: Boolean,
        default: false
    },

    publishedAt: Date,

    // Proposals
    proposals: {
        type: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Proposal'
        }],
        default: []
    },

    selectedProposalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Proposal'
    },

    // Living knowledge base
    lastDocumentUpdate: Date,
    isKBLive: {
        type: Boolean,
        default: true
    },

    // Blockchain anchoring
    blockchain: {
        documentHashAnchor: String,
        documentHashTx: String,
        documentVersion: String,
        lastAnchorTime: Date
    },

    createdAt: {
        type: Date,
        default: Date.now
    },

    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Index for queries
projectSchema.index({ clientId: 1, status: 1 });
projectSchema.index({ isPublished: 1, createdAt: -1 });

module.exports = mongoose.model('Project', projectSchema);
