const mongoose = require('mongoose');

const algorandProofSchema = new mongoose.Schema({
    // Reference to what's being anchored
    referenceType: {
        type: String,
        enum: ['project_document', 'proposal', 'agreement', 'milestone', 'chat_message'],
        required: true
    },

    referenceId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },

    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },

    // Hash generation
    contentHash: {
        type: String,
        required: true,
        unique: true
    },

    contentSummary: String,

    hashAlgorithm: {
        type: String,
        default: 'SHA256'
    },

    // Version tracking
    version: {
        type: Number,
        default: 1
    },

    // Algorand transaction details
    blockchain: {
        network: {
            type: String,
            enum: ['testnet', 'mainnet'],
            default: 'testnet'
        },

        appId: {
            type: String,
            default: '756282697' // Default testnet app ID
        },

        appAddress: {
            type: String,
            default: 'FEP7X7PUBYCVBJMGJCCG7WQHVYIFAZTUTLQKZZ6EW57BCD2KIQYFF3RMYQ'
        },

        transactionId: String,

        transactionUrl: String,

        // When anchored
        anchoredAt: Date,

        // Confirmation
        isConfirmed: Boolean,

        confirmationRounds: Number,

        // Proof data
        proofData: {
            type: Object,
            default: {}
        }
    },

    // Fallback mode (if Algorand unavailable)
    fallbackMode: {
        isFallback: Boolean,
        fallbackReason: String,
        willRetryAt: Date
    },

    // Status
    status: {
        type: String,
        enum: ['pending', 'pending_retry', 'confirmed', 'failed', 'fallback'],
        default: 'pending'
    },

    errorMessage: String,

    // Retry logic
    retryCount: {
        type: Number,
        default: 0
    },

    maxRetries: {
        type: Number,
        default: 3
    },

    lastRetryAt: Date,

    // Viewing/Access
    isPublic: {
        type: Boolean,
        default: false
    },

    viewCount: {
        type: Number,
        default: 0
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

algorandProofSchema.index({ projectId: 1, referenceType: 1 });
algorandProofSchema.index({ status: 1 });
algorandProofSchema.index({ 'blockchain.transactionId': 1 });

module.exports = mongoose.model('AlgorandProof', algorandProofSchema);
