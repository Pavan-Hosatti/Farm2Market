/**
 * Dispute Resolution Controller
 * Handles dispute creation, AI arbitration, and resolution
 */

const disputeResolutionService = require('../services/disputeResolutionService');

class DisputeResolutionController {
    /**
     * Create dispute
     */
    async createDispute(req, res) {
        try {
            const { projectId, proposalId, freelancerId, clientId, issue, category } = req.body;

            const result = await disputeResolutionService.createDispute(
                projectId,
                proposalId,
                freelancerId,
                clientId,
                issue,
                category
            );

            return res.status(201).json({
                success: true,
                disputeId: result.disputeId,
                message: 'Dispute created. AI analysis complete.',
                summary: result.summary,
                status: result.status
            });
        } catch (error) {
            console.error('Create dispute error:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Get dispute details
     */
    async getDispute(req, res) {
        try {
            const { disputeId } = req.params;
            const DisputeResolution = require('../models/DisputeResolution');

            const dispute = await DisputeResolution.findById(disputeId)
                .populate('projectId', 'title scope')
                .populate('freelancerId', 'name')
                .populate('clientId', 'name');

            if (!dispute) {
                return res.status(404).json({ success: false, message: 'Dispute not found' });
            }

            return res.json({
                success: true,
                dispute: {
                    _id: dispute._id,
                    issue: dispute.issue,
                    category: dispute.category,
                    status: dispute.status,
                    summary: dispute.aiNeutralSummary?.summary,
                    resolutionPath: dispute.resolutionPath,
                    timeline: dispute.aiNeutralSummary?.timeline,
                    createdAt: dispute.createdAt
                }
            });
        } catch (error) {
            console.error('Get dispute error:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Generate resolution recommendation
     */
    async getResolutionRecommendation(req, res) {
        try {
            const { disputeId } = req.params;

            const result = await disputeResolutionService.generateResolutionRecommendation(disputeId);

            return res.json({
                success: true,
                recommendation: result.recommendation,
                suggestedOutcome: result.suggestedOutcome,
                fairnessScore: result.fairnessScore
            });
        } catch (error) {
            console.error('Get resolution recommendation error:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Freelancer provides response
     */
    async freelancerResponse(req, res) {
        try {
            const { disputeId } = req.params;
            const { response } = req.body;
            const DisputeResolution = require('../models/DisputeResolution');

            const dispute = await DisputeResolution.findByIdAndUpdate(
                disputeId,
                {
                    freelancerResponse: response,
                    freelancerRespondedAt: new Date()
                },
                { new: true }
            );

            return res.json({
                success: true,
                message: 'Freelancer response recorded',
                disputeId
            });
        } catch (error) {
            console.error('Freelancer response error:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Client provides response
     */
    async clientResponse(req, res) {
        try {
            const { disputeId } = req.params;
            const { response } = req.body;
            const DisputeResolution = require('../models/DisputeResolution');

            const dispute = await DisputeResolution.findByIdAndUpdate(
                disputeId,
                {
                    clientResponse: response,
                    clientRespondedAt: new Date()
                },
                { new: true }
            );

            return res.json({
                success: true,
                message: 'Client response recorded',
                disputeId
            });
        } catch (error) {
            console.error('Client response error:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Resolve dispute
     */
    async resolveDispute(req, res) {
        try {
            const { disputeId } = req.params;
            const { outcome, compensation, milestones, lessons } = req.body;

            const result = await disputeResolutionService.resolveDispute(
                disputeId,
                {
                    outcome,
                    compensation,
                    milestones,
                    lessons
                }
            );

            return res.json({
                success: true,
                message: 'Dispute resolved',
                resolution: result.resolution
            });
        } catch (error) {
            console.error('Resolve dispute error:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Get dispute history
     */
    async getDisputeHistory(req, res) {
        try {
            const { projectId } = req.params;

            const result = await disputeResolutionService.getDisputeHistory(projectId);

            return res.json({
                success: true,
                totalDisputes: result.totalDisputes,
                resolvedDisputes: result.resolvedDisputes,
                disputes: result.disputes
            });
        } catch (error) {
            console.error('Get dispute history error:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Mock dispute test (for demo)
     */
    async mockDisputeDemo(req, res) {
        try {
            const { projectId, proposalId } = req.params;
            const DisputeResolution = require('../models/DisputeResolution');

            // Create test dispute
            const dispute = new DisputeResolution({
                projectId,
                proposalId,
                freelancerId: 'freelancer_demo_id',
                clientId: 'client_demo_id',
                issue: 'Work quality does not meet acceptance criteria',
                category: 'quality_issue',
                status: 'open',
                aiNeutralSummary: {
                    summary: 'Demo dispute summary. Client reports quality issues with deliverables.',
                    keyPoints: [
                        'Client expected high-fidelity design',
                        'Freelancer delivered basic mockup',
                        'Acceptance criteria were ambiguous'
                    ],
                    timeline: [
                        { event: 'Project created', timestamp: new Date() },
                        { event: 'Proposal submitted', timestamp: new Date() },
                        { event: 'Dispute raised', timestamp: new Date() }
                    ]
                }
            });

            await dispute.save();

            return res.json({
                success: true,
                disputeId: dispute._id,
                message: 'Demo dispute created for testing',
                summary: dispute.aiNeutralSummary.summary
            });
        } catch (error) {
            console.error('Mock dispute demo error:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = new DisputeResolutionController();
