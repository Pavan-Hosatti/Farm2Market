const mongoose = require('mongoose');

const projectDocumentSchema = new mongoose.Schema({
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },

    fileName: {
        type: String,
        required: true
    },

    fileType: {
        type: String,
        enum: ['pdf', 'docx', 'txt', 'md', 'xlsx', 'other'],
        required: true
    },

    fileSize: Number,

    fileUrl: {
        type: String,
        required: true
    },

    storageKey: String,

    // Content after parsing
    rawContent: {
        type: String,
        select: false
    },

    // Chunked for embedding
    chunks: [{
        chunkIndex: Number,
        text: String,
        embeddings: [Number],
        startOffset: Number,
        endOffset: Number
    }],

    // Processing status
    processingStatus: {
        type: String,
        enum: ['queued', 'processing', 'completed', 'failed'],
        default: 'queued'
    },

    processingError: String,

    // Embedding status
    embeddingStatus: {
        type: String,
        enum: ['pending', 'in_progress', 'completed', 'failed'],
        default: 'pending'
    },

    // Version tracking
    version: {
        type: Number,
        default: 1
    },

    versionHash: String,

    // Diff from previous version
    changesSummary: String,

    previousVersionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProjectDocument'
    },

    isLatestVersion: {
        type: Boolean,
        default: true
    },

    uploadedAt: {
        type: Date,
        default: Date.now
    },

    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Index for efficient queries
projectDocumentSchema.index({ projectId: 1, isLatestVersion: 1 });
projectDocumentSchema.index({ processingStatus: 1 });

module.exports = mongoose.model('ProjectDocument', projectDocumentSchema);
