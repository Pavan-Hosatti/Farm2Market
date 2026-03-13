/**
 * Proposal Controller
 * Handles proposal submission, scoring, and management
 */

const Proposal = require('../models/Proposal');
const aiScoringsService = require('../services/aiScoringsService');
const algorandProofService = require('../services/algorandProofService');
const negotiationAssistantService = require('../services/negotiationAssistantService');

class ProposalController {
    /**
     * Submit proposal
     */
    async submitProposal(req, res) {
        try {
            const { projectId, freelancerId, coverLetter, proposedBudget, proposedTimeline } = req.body;

            const proposal = new Proposal({
                projectId,
                freelancerId,
                coverLetter,
                proposedBudget,
                proposedTimeline,
                status: 'submitted',
                submittedAt: new Date()
            });

            await proposal.save();

            // Calculate comprehension score asynchronously
            setImmediate(() => {
                aiScoringsService.calculateBidComprehensionScore(proposal._id)
                    .catch(err => console.error('Score calculation error:', err));
            });

            // Calculate skill-fit asynchronously
            setImmediate(() => {
                aiScoringsService.calculateSkillFitRadar(proposal._id)
                    .catch(err => console.error('Skill-fit calculation error:', err));
            });

            // Anchor on blockchain asynchronously
            setImmediate(() => {
                const proposalHash = this.generateProposalHash(proposal);
                algorandProofService.anchorProposalHash(projectId, proposal._id, proposalHash)
                    .catch(err => console.error('Blockchain anchor error:', err));
            });

            return res.status(201).json({
                success: true,
                proposalId: proposal._id,
                message: 'Proposal submitted. AI scoring in progress.',
                proposal: {
                    _id: proposal._id,
                    status: proposal.status,
                    submittedAt: proposal.submittedAt
                }
            });
        } catch (error) {
            console.error('Submit proposal error:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Get proposal
     */
    async getProposal(req, res) {
        try {
            const { proposalId } = req.params;

            const proposal = await Proposal.findById(proposalId)
                .populate('freelancerId', 'name skills averageRating completedProjects')
                .populate('projectId', 'title scope');

            if (!proposal) {
                return res.status(404).json({ success: false, message: 'Proposal not found' });
            }

            return res.json({
                success: true,
                proposal
            });
        } catch (error) {
            console.error('Get proposal error:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * List proposals for project
     */
    async listProposals(req, res) {
        try {
            const { projectId } = req.params;
            const { status, sortBy } = req.query;

            const query = { projectId };
            if (status) query.status = status;

            const proposals = await Proposal.find(query)
                .populate('freelancerId', 'name skills averageRating');

            // Sort by comprehension score if requested
            let sorted = proposals;
            if (sortBy === 'score') {
                sorted = proposals.sort((a, b) => 
                    (b.aiComprehensionScore?.score || 0) - (a.aiComprehensionScore?.score || 0)
                );
            } else if (sortBy === 'newest') {
                sorted = proposals.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
            }

            return res.json({
                success: true,
                count: sorted.length,
                proposals: sorted.map(p => ({
                    _id: p._id,
                    freelancer: p.freelancerId?.name,
                    budget: p.proposedBudget,
                    comprehensionScore: p.aiComprehensionScore?.score || 'pending',
                    skillFitScore: p.skillFitScore?.overallFitScore || 'pending',
                    status: p.status,
                    isOutdated: p.isOutdated,
                    submittedAt: p.submittedAt
                }))
            });
        } catch (error) {
            console.error('List proposals error:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Get proposal scoring details
     */
    async getProposalScores(req, res) {
        try {
            const { proposalId } = req.params;

            const proposal = await Proposal.findById(proposalId);

            if (!proposal) {
                return res.status(404).json({ success: false, message: 'Proposal not found' });
            }

            // If scores not yet calculated, trigger calculation
            if (!proposal.aiComprehensionScore?.score) {
                setImmediate(() => {
                    aiScoringsService.calculateBidComprehensionScore(proposalId)
                        .catch(err => console.error('Score calculation error:', err));
                });

                return res.json({
                    success: true,
                    status: 'scoring_in_progress',
                    message: 'Scores are being calculated. Please check again shortly.'
                });
            }

            return res.json({
                success: true,
                scores: {
                    comprehension: {
                        score: proposal.aiComprehensionScore.score,
                        explanation: proposal.aiComprehensionScore.explanation,
                        missingPoints: proposal.aiComprehensionScore.missingPoints,
                        strengths: proposal.aiComprehensionScore.strengths
                    },
                    skillFit: {
                        overallFit: proposal.skillFitScore?.overallFitScore,
                        gaps: proposal.skillFitScore?.gaps,
                        recommendation: proposal.skillFitScore?.recommendation
                    }
                }
            });
        } catch (error) {
            console.error('Get proposal scores error:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Update proposal status
     */
    async updateProposalStatus(req, res) {
        try {
            const { proposalId } = req.params;
            const { status } = req.body;

            const validStatuses = ['draft', 'submitted', 'reviewed', 'shortlisted', 'rejected', 'withdrawn', 'accepted'];

            if (!validStatuses.includes(status)) {
                return res.status(400).json({ success: false, message: 'Invalid status' });
            }

            const proposal = await Proposal.findByIdAndUpdate(
                proposalId,
                { status, updatedAt: new Date() },
                { new: true }
            );

            return res.json({
                success: true,
                message: `Proposal status updated to ${status}`,
                proposal: { _id: proposal._id, status: proposal.status }
            });
        } catch (error) {
            console.error('Update status error:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Shortlist proposal
     */
    async shortlistProposal(req, res) {
        try {
            const { proposalId } = req.params;

            const proposal = await Proposal.findByIdAndUpdate(
                proposalId,
                { status: 'shortlisted', updatedAt: new Date() },
                { new: true }
            );

            // Generate negotiation recommendation
            const negotiationResult = await negotiationAssistantService.generateNegotiationRecommendation(proposalId);

            return res.json({
                success: true,
                message: 'Proposal shortlisted',
                proposal: { _id: proposal._id, status: proposal.status },
                negotiation: negotiationResult
            });
        } catch (error) {
            console.error('Shortlist proposal error:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Helper method to generate proposal hash
     */
    generateProposalHash(proposal) {
        const crypto = require('crypto');
        const content = JSON.stringify({
            projectId: proposal.projectId,
            freelancerId: proposal.freelancerId,
            budget: proposal.proposedBudget,
            coverLetter: proposal.coverLetter,
            timestamp: proposal.submittedAt
        });
        return crypto.createHash('sha256').update(content).digest('hex');
    }
}

module.exports = new ProposalController();
