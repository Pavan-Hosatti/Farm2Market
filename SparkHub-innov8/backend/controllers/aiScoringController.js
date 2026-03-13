/**
 * AI Scoring Controller
 * Handles bid comprehension, skill-fit radar, and scope gap detection
 */

const aiScoringsService = require('../services/aiScoringsService');

class AIScoringController {
    /**
     * Get bid comprehension score
     */
    async getBidComprehensionScore(req, res) {
        try {
            const { proposalId } = req.params;

            const result = await aiScoringsService.calculateBidComprehensionScore(proposalId);

            return res.json({
                success: true,
                score: result.score,
                explanation: result.explanation,
                missingPoints: result.missingPoints,
                strengths: result.strengths
            });
        } catch (error) {
            console.error('Get comprehension score error:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Get skill-fit radar
     */
    async getSkillFitRadar(req, res) {
        try {
            const { proposalId } = req.params;

            const result = await aiScoringsService.calculateSkillFitRadar(proposalId);

            return res.json({
                success: true,
                overallScore: result.overallFitScore,
                dimensions: result.radarDimensions,
                strengths: result.strengths,
                gaps: result.gaps,
                recommendation: result.recommendation
            });
        } catch (error) {
            console.error('Get skill-fit radar error:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Detect scope gaps (pre-publish)
     */
    async detectScopeGaps(req, res) {
        try {
            const { projectId } = req.params;

            const result = await aiScoringsService.detectScopeGaps(projectId);

            return res.json({
                success: true,
                totalGaps: result.totalGapsFound,
                criticalGaps: result.criticalGapCount,
                gaps: result.gaps,
                canPublish: result.canPublish,
                message: result.message
            });
        } catch (error) {
            console.error('Detect scope gaps error:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Get comprehensive scoring report for proposal
     */
    async getScoringReport(req, res) {
        try {
            const { proposalId } = req.params;
            const Proposal = require('../models/Proposal');

            const proposal = await Proposal.findById(proposalId);
            if (!proposal) {
                return res.status(404).json({ success: false, message: 'Proposal not found' });
            }

            // Ensure scores are calculated
            if (!proposal.aiComprehensionScore?.score) {
                await aiScoringsService.calculateBidComprehensionScore(proposalId);
            }

            if (!proposal.skillFitScore?.overallFitScore) {
                await aiScoringsService.calculateSkillFitRadar(proposalId);
            }

            // Retrieve updated proposal
            const updated = await Proposal.findById(proposalId).populate('freelancerId');

            return res.json({
                success: true,
                report: {
                    freelancer: {
                        name: updated.freelancerId?.name,
                        rating: updated.freelancerId?.averageRating
                    },
                    comprehensionScore: {
                        score: updated.aiComprehensionScore?.score,
                        explanation: updated.aiComprehensionScore?.explanation,
                        missingPoints: updated.aiComprehensionScore?.missingPoints
                    },
                    skillFitScore: {
                        overallFit: updated.skillFitScore?.overallFitScore,
                        recommendation: updated.skillFitScore?.recommendation,
                        gaps: updated.skillFitScore?.gaps
                    },
                    proposedBudget: updated.proposedBudget,
                    status: updated.status
                }
            });
        } catch (error) {
            console.error('Get scoring report error:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Rank proposals by comprehension score
     */
    async rankProposalsByScore(req, res) {
        try {
            const { projectId } = req.params;
            const Proposal = require('../models/Proposal');

            const proposals = await Proposal.find({ projectId })
                .populate('freelancerId', 'name averageRating')
                .sort({ 'aiComprehensionScore.score': -1 });

            const ranked = proposals.map((p, index) => ({
                rank: index + 1,
                proposalId: p._id,
                freelancer: p.freelancerId?.name,
                comprehensionScore: p.aiComprehensionScore?.score || 'pending',
                skillFitScore: p.skillFitScore?.overallFitScore || 'pending',
                budget: p.proposedBudget,
                status: p.status
            }));

            return res.json({
                success: true,
                proposalCount: ranked.length,
                rankedProposals: ranked
            });
        } catch (error) {
            console.error('Rank proposals error:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = new AIScoringController();
