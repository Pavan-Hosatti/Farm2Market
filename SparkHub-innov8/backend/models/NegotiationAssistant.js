const mongoose = require('mongoose');

const negotiationAssistantSchema = new mongoose.Schema({
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

    // Suggested fair range
    fairPriceRange: {
        minimum: Number,
        maximum: Number,
        recommended: Number,
        currency: String
    },

    // Factors in calculation
    factors: {
        scopeComplexity: {
            level: String,
            impact: Number
        },
        marketReferences: {
            averageRate: Number,
            marketRange: {
                min: Number,
                max: Number
            },
            sources: [String]
        },
        riskBuffer: {
            percentage: Number,
            reason: String
        },
        freelancerExperience: {
            level: String,
            premiumPercentage: Number
        },
        urgency: {
            isUrgent: Boolean,
            multiplier: Number
        }
    },

    // Freelancer proposal vs recommendation
    freelancerProposal: Number,
    isWithinRange: Boolean,
    discrepancy: {
        percentage: Number,
        direction: String // 'above', 'below', 'within'
    },

    // Negotiation talking points
    clientTalkingPoints: [String],
    freelancerTalkingPoints: [String],

    // Suggested next steps
    recommendations: [String],

    // Negotiation history
    rounds: [{
        roundNumber: Number,
        initiatedBy: String,
        freelancerOffer: Number,
        clientCounterOffer: Number,
        status: String,
        timestamp: Date
    }],

    // Final agreed price
    finalAgreedPrice: Number,
    agreedAt: Date,

    createdAt: {
        type: Date,
        default: Date.now
    },

    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

negotiationAssistantSchema.index({ proposalId: 1 });
negotiationAssistantSchema.index({ projectId: 1 });

module.exports = mongoose.model('NegotiationAssistant', negotiationAssistantSchema);
