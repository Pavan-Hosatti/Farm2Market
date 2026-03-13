const mongoose = require('mongoose');

const skillFitRadarSchema = new mongoose.Schema({
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

    // Overall fit score
    overallFitScore: {
        type: Number,
        min: 0,
        max: 100,
        required: true
    },

    // Radar breakdown
    radarDimensions: {
        technicalSkills: {
            score: Number,
            weight: Number,
            matched: [String],
            missing: [String]
        },
        experience: {
            score: Number,
            weight: Number,
            yearsRequired: Number,
            yearsHave: Number,
            relevantProjects: [String]
        },
        language: {
            score: Number,
            weight: Number,
            required: [String],
            fluent: [String]
        },
        communicationHistory: {
            score: Number,
            weight: Number,
            pastResponsiveness: Number,
            pastQuality: Number
        },
        portfolio: {
            score: Number,
            weight: Number,
            relevantPieces: [String],
            complexity: String
        }
    },

    // Strength areas
    strengths: [String],

    // Gap areas
    gaps: [{
        skill: String,
        severity: { type: String, enum: ['critical', 'high', 'medium', 'low'] },
        mitigation: String
    }],

    // Recommendations
    recommendation: String,

    // Assessment metadata
    assessedAt: Date,
    modelUsed: String,

    createdAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

skillFitRadarSchema.index({ proposalId: 1 });
skillFitRadarSchema.index({ overallFitScore: -1 });

module.exports = mongoose.model('SkillFitRadar', skillFitRadarSchema);
