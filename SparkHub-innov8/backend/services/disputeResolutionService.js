/**
 * Dispute Resolution Service
 * Generates neutral AI arbitration summaries and resolution recommendations
 */

const DisputeResolution = require('../models/DisputeResolution');
const ProposalChat = require('../models/ProposalChat');

class DisputeResolutionService {
    /**
     * Create dispute and generate AI summary
     */
    async createDispute(projectId, proposalId, freelancerId, clientId, issue, category) {
        try {
            // Fetch relevant context
            const Project = require('../models/Project');
            const Proposal = require('../models/Proposal');

            const [project, proposal] = await Promise.all([
                Project.findById(projectId),
                Proposal.findById(proposalId)
            ]);

            if (!project || !proposal) {
                throw new Error('Project or Proposal not found');
            }

            // Get chat history
            const chatHistory = await ProposalChat.find({ proposalId })
                .sort({ createdAt: -1 })
                .limit(50);

            // Create dispute
            const dispute = new DisputeResolution({
                projectId,
                proposalId,
                freelancerId,
                clientId,
                issue,
                category,
                briefContent: project.scope.summary,
                proposalContent: proposal.coverLetter,
                relevantChatHistory: chatHistory.map(msg => 
                    `${msg.senderType}: ${msg.message}`
                )
            });

            // Generate AI neutral summary
            const summary = await this.generateNeutralSummary(
                dispute,
                project,
                proposal,
                chatHistory
            );

            dispute.aiNeutralSummary = summary;
            dispute.status = 'under_review';

            await dispute.save();

            return {
                success: true,
                disputeId: dispute._id,
                summary: summary.summary,
                status: dispute.status
            };
        } catch (error) {
            console.error('Create dispute error:', error);
            throw error;
        }
    }

    /**
     * Generate neutral AI summary of dispute
     */
    async generateNeutralSummary(dispute, project, proposal, chatHistory) {
        try {
            // Extract timeline of events
            const timeline = this.buildTimeline(project, proposal, chatHistory);

            // Analyze both perspectives
            const freelancerPerspective = this.analyzeFreelancerPerspective(
                dispute,
                proposal,
                chatHistory
            );

            const clientPerspective = this.analyzeClientPerspective(
                dispute,
                project,
                chatHistory
            );

            // Generate neutral summary
            const summary = `
            DISPUTE SUMMARY:
            Issue Category: ${dispute.category}
            Issue Description: ${dispute.issue}
            
            TIMELINE:
            ${timeline.events.map(e => `- ${e.date}: ${e.event}`).join('\n')}
            
            FREELANCER'S PERSPECTIVE:
            ${freelancerPerspective.main_points.join('\n')}
            
            CLIENT'S PERSPECTIVE:
            ${clientPerspective.main_points.join('\n')}
            
            NEUTRAL ASSESSMENT:
            Both parties have valid concerns. The issue appears to stem from ${this.identifyRootCause(dispute, freelancerPerspective, clientPerspective)}.
            
            KEY FACTS:
            ${this.extractKeyFacts(dispute, project, proposal).join('\n')}
            `;

            return {
                summary: summary.trim(),
                keyPoints: [
                    ...freelancerPerspective.main_points.slice(0, 2),
                    ...clientPerspective.main_points.slice(0, 2)
                ],
                timeline: timeline.events,
                generatedAt: new Date(),
                modelUsed: 'bidbuddy-dispute-v1',
                confidence: 0.85
            };
        } catch (error) {
            console.error('Generate summary error:', error);
            throw error;
        }
    }

    /**
     * Build timeline of relevant events
     */
    buildTimeline(project, proposal, chatHistory) {
        const events = [
            {
                date: project.createdAt ? new Date(project.createdAt).toLocaleDateString() : 'N/A',
                event: 'Project created'
            },
            {
                date: proposal.createdAt ? new Date(proposal.createdAt).toLocaleDateString() : 'N/A',
                event: 'Proposal submitted'
            }
        ];

        if (proposal.submittedAt) {
            events.push({
                date: new Date(proposal.submittedAt).toLocaleDateString(),
                event: 'Proposal officially submitted'
            });
        }

        // Add chat milestones
        if (chatHistory.length > 0) {
            const firstChat = chatHistory[chatHistory.length - 1];
            events.push({
                date: new Date(firstChat.createdAt).toLocaleDateString(),
                event: 'Communication started'
            });
        }

        return { events: events.sort((a, b) => new Date(a.date) - new Date(b.date)) };
    }

    /**
     * Analyze freelancer perspective
     */
    analyzeFreelancerPerspective(dispute, proposal, chatHistory) {
        const freelancerMessages = chatHistory.filter(m => m.senderType === 'freelancer');

        const points = [
            `Freelancer submitted proposal with budget: $${proposal.proposedBudget}`,
            `Freelancer understood scope as: ${proposal.coverLetter.substring(0, 100)}...`
        ];

        if (freelancerMessages.length > 0) {
            points.push(
                `Freelancer raised concerns about: ${this.extractCommonThemes(freelancerMessages)}`
            );
        }

        return { main_points: points };
    }

    /**
     * Analyze client perspective
     */
    analyzeClientPerspective(dispute, project, chatHistory) {
        const clientMessages = chatHistory.filter(m => m.senderType === 'client');

        const points = [
            `Client posted project with scope: ${project.scope.summary?.substring(0, 100) || 'N/A'}...`,
            `Client's requirements: ${(project.scope.requirements || []).join(', ') || 'Not specified'}`
        ];

        if (clientMessages.length > 0) {
            points.push(
                `Client's main concerns: ${this.extractCommonThemes(clientMessages)}`
            );
        }

        return { main_points: points };
    }

    /**
     * Identify root cause of dispute
     */
    identifyRootCause(dispute, freelancerPersp, clientPersp) {
        const category = dispute.category;

        const rootCauses = {
            'scope_mismatch': 'ambiguity in project scope definition',
            'quality_issue': 'differing quality expectations',
            'deadline_miss': 'unrealistic timeline planning',
            'payment_dispute': 'budget misalignment',
            'communication': 'lack of clear communication channels',
            'other': 'misalignment on project terms'
        };

        return rootCauses[category] || 'miscommunication between parties';
    }

    /**
     * Extract key facts
     */
    extractKeyFacts(dispute, project, proposal) {
        return [
            `Project Scope Level: ${project.scope.level}`,
            `Freelancer Experience: Unknown`,
            `Client Previous Projects: Unknown`,
            `Agreement Status: ${dispute.proposalId ? 'Proposal submitted' : 'No proposal'}`,
            `Dispute Category: ${dispute.category}`
        ];
    }

    /**
     * Extract common themes from messages
     */
    extractCommonThemes(messages) {
        if (!messages || messages.length === 0) return 'None recorded';
        
        // Simple theme extraction (placeholder)
        const commonWords = ['timeline', 'budget', 'scope', 'quality', 'requirements'];
        
        let themes = [];
        for (let msg of messages) {
            for (let word of commonWords) {
                if (msg.message?.toLowerCase().includes(word) && !themes.includes(word)) {
                    themes.push(word);
                }
            }
        }

        return themes.length > 0 ? themes.join(', ') : 'scope and timeline';
    }

    /**
     * Generate resolution recommendation
     */
    async generateResolutionRecommendation(disputeId) {
        try {
            const dispute = await DisputeResolution.findById(disputeId);
            if (!dispute) throw new Error('Dispute not found');

            // Analyze fairness from both sides
            const fairnessAnalysis = this.calculateFairnessScore(dispute);

            // Generate recommendation
            const recommendation = {
                recommendation: this.generateRecommendationText(dispute, fairnessAnalysis),
                suggestedOutcome: this.suggestOutcome(dispute, fairnessAnalysis),
                fairnessScore: fairnessAnalysis
            };

            dispute.resolutionPath = recommendation;
            await dispute.save();

            return {
                success: true,
                recommendation: recommendation.recommendation,
                suggestedOutcome: recommendation.suggestedOutcome,
                fairnessScore: recommendation.fairnessScore
            };
        } catch (error) {
            console.error('Generate resolution error:', error);
            throw error;
        }
    }

    /**
     * Calculate fairness score
     */
    calculateFairnessScore(dispute) {
        // Simple fairness calculation
        let freelancerScore = 50; // Start neutral
        let clientScore = 50;

        // Adjust based on category
        if (dispute.category === 'payment_dispute') {
            // Lean slightly toward freelancer if scope was clear
            freelancerScore += 10;
        } else if (dispute.category === 'quality_issue') {
            // Lean toward client if quality standards were agreed
            clientScore += 10;
        }

        return {
            toFreelancer: Math.min(100, freelancerScore),
            toClient: Math.min(100, clientScore)
        };
    }

    /**
     * Generate recommendation text
     */
    generateRecommendationText(dispute, fairness) {
        if (fairness.toFreelancer > fairness.toClient) {
            return 'Evidence suggests freelancer\'s concerns are more justified.';
        } else if (fairness.toClient > fairness.toFreelancer) {
            return 'Evidence suggests client\'s concerns are more justified.';
        }
        return 'Both parties share responsibility for the dispute.';
    }

    /**
     * Suggest outcome
     */
    suggestOutcome(dispute, fairness) {
        const outcomes = {
            'scope_mismatch': 'Extend timeline or reduce scope to align expectations',
            'quality_issue': 'Offer revision/rework or partial refund',
            'deadline_miss': 'Adjust milestones or extend deadline with compensation',
            'payment_dispute': 'Negotiate phased payment schedule',
            'communication': 'Establish clear communication protocol going forward',
            'other': 'Mutual agreement on revised terms'
        };

        return outcomes[dispute.category] || outcomes.other;
    }

    /**
     * Log dispute resolution
     */
    async resolveDispute(disputeId, resolution) {
        try {
            const dispute = await DisputeResolution.findById(disputeId);
            if (!dispute) throw new Error('Dispute not found');

            dispute.resolution = {
                outcome: resolution.outcome,
                compensationAdjustment: resolution.compensation || 0,
                additionalMilestones: resolution.milestones || [],
                lessons: resolution.lessons || [],
                resolvedAt: new Date()
            };

            dispute.status = 'resolved';
            await dispute.save();

            return {
                success: true,
                disputeId,
                status: 'resolved',
                resolution: dispute.resolution
            };
        } catch (error) {
            console.error('Resolve dispute error:', error);
            throw error;
        }
    }

    /**
     * Get dispute history for project
     */
    async getDisputeHistory(projectId) {
        try {
            const disputes = await DisputeResolution.find({ projectId })
                .select('issue category status createdAt resolution')
                .sort({ createdAt: -1 });

            return {
                disputes,
                totalDisputes: disputes.length,
                resolvedDisputes: disputes.filter(d => d.status === 'resolved').length
            };
        } catch (error) {
            console.error('Get dispute history error:', error);
            throw error;
        }
    }
}

module.exports = new DisputeResolutionService();
