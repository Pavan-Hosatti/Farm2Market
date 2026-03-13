const mongoose = require('mongoose');

const proposalChatSchema = new mongoose.Schema({
    proposalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Proposal',
        required: true
    },

    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },

    // Message metadata
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },

    senderType: {
        type: String,
        enum: ['freelancer', 'client', 'system'],
        required: true
    },

    // Message content
    message: {
        type: String,
        required: true
    },

    messageType: {
        type: String,
        enum: ['text', 'voice_transcription', 'file'],
        default: 'text'
    },

    // Voice metadata
    voiceData: {
        audioUrl: String,
        language: String,
        transcription: String,
        confidence: Number
    },

    // File attachment
    attachment: {
        fileName: String,
        fileUrl: String,
        fileType: String
    },

    // RAG context (if referenced from documents)
    ragContext: {
        citedDocuments: [String],
        snippets: [String],
        confidence: Number
    },

    // Read status
    isRead: {
        type: Boolean,
        default: false
    },

    readAt: Date,

    createdAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Index for efficient queries
proposalChatSchema.index({ proposalId: 1, createdAt: -1 });
proposalChatSchema.index({ projectId: 1, createdAt: -1 });

module.exports = mongoose.model('ProposalChat', proposalChatSchema);
