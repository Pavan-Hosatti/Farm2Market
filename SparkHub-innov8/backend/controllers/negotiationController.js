/**
 * Negotiation Controller
 * Handles negotiation recommendations and fair pricing
 */

const negotiationAssistantService = require('../services/negotiationAssistantService');

class NegotiationController {
    /**
     * Get negotiation recommendation
     */
    async getNegotiationRecommendation(req, res) {
        try {
            const { proposalId } = req.params;

            const result = await negotiationAssistantService.generateNegotiationRecommendation(proposalId);

            return res.json({
                success: true,
                fairRange: result.fairRange,
                freelancerProposal: result.freelancerProposal,
                isWithinRange: result.isWithinRange,
                discrepancy: result.discrepancy,
                recommendations: result.recommendations,
                nextStep: result.nextStep
            });
        } catch (error) {
            console.error('Get negotiation recommendation error:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Get detailed negotiation analysis
     */
    async getNegotiationAnalysis(req, res) {
        try {
            const { proposalId } = req.params;
            const NegotiationAssistant = require('../models/NegotiationAssistant');
            const Proposal = require('../models/Proposal');

            const proposal = await Proposal.findById(proposalId)
                .populate('projectId')
                .populate('freelancerId');

            if (!proposal) {
                return res.status(404).json({ success: false, message: 'Proposal not found' });
            }

            let negotiation = await NegotiationAssistant.findOne({ proposalId });

            if (!negotiation) {
                const result = await negotiationAssistantService.generateNegotiationRecommendation(proposalId);
                negotiation = await NegotiationAssistant.findOne({ proposalId });
            }

            return res.json({
                success: true,
                proposal: {
                    budget: proposal.proposedBudget
                },
                negotiation: {
                    fairRange: negotiation.fairPriceRange,
                    factors: negotiation.factors,
                    clientTalkingPoints: negotiation.clientTalkingPoints,
                    freelancerTalkingPoints: negotiation.freelancerTalkingPoints,
                    recommendations: negotiation.recommendations,
                    status: negotiation.finalAgreedPrice ? 'agreed' : 'open'
                }
            });
        } catch (error) {
            console.error('Get negotiation analysis error:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Log negotiation round
     */
    async logNegotiationRound(req, res) {
        try {
            const { negotiationId } = req.params;
            const { initiatedBy, offer } = req.body;

            const result = await negotiationAssistantService.logNegotiationRound(
                negotiationId,
                initiatedBy,
                offer
            );

            return res.json({
                success: true,
                message: `Negotiation round ${result.roundNumber} logged`,
                roundNumber: result.roundNumber
            });
        } catch (error) {
            console.error('Log negotiation round error:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Accept negotiation and finalize price
     */
    async acceptNegotiation(req, res) {
        try {
            const { negotiationId } = req.params;
            const { finalPrice } = req.body;

            const result = await negotiationAssistantService.acceptNegotiation(negotiationId, finalPrice);

            return res.json({
                success: true,
                message: result.message,
                agreedPrice: result.agreedPrice
            });
        } catch (error) {
            console.error('Accept negotiation error:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Get negotiation history
     */
    async getNegotiationHistory(req, res) {
        try {
            const { projectId } = req.params;
            const NegotiationAssistant = require('../models/NegotiationAssistant');

            const negotiations = await NegotiationAssistant.find({ projectId })
                .select('proposalId freelancerId fairPriceRange finalAgreedPrice rounds status createdAt');

            return res.json({
                success: true,
                count: negotiations.length,
                negotiations: negotiations.map(n => ({
                    proposalId: n.proposalId,
                    freelancerId: n.freelancerId,
                    fairRange: n.fairPriceRange,
                    finalPrice: n.finalAgreedPrice,
                    roundsCount: n.rounds?.length || 0,
                    status: n.finalAgreedPrice ? 'agreed' : 'open'
                }))
            });
        } catch (error) {
            console.error('Get negotiation history error:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = new NegotiationController();
