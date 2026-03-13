/**
 * Negotiation Assistant Service
 * Provides fair price recommendations and negotiation support
 */

const NegotiationAssistant = require('../models/NegotiationAssistant');
const Freelancer = require('../models/Freelancer');

class NegotiationAssistantService {
    /**
     * Generate negotiation recommendation
     */
    async generateNegotiationRecommendation(proposalId) {
        try {
            const Proposal = require('../models/Proposal');
            const proposal = await Proposal.findById(proposalId)
                .populate('projectId freelancerId');

            if (!proposal) throw new Error('Proposal not found');

            const project = proposal.projectId;
            const freelancer = proposal.freelancerId;

            // Calculate fair price range
            const priceAnalysis = this.analyzePricing(
                freelancer,
                project,
                proposal.proposedBudget
            );

            // Create recommendation
            const recommendation = new NegotiationAssistant({
                proposalId,
                projectId: project._id,
                freelancerId: freelancer._id,
                clientId: project.clientId,
                fairPriceRange: priceAnalysis.range,
                factors: priceAnalysis.factors,
                freelancerProposal: proposal.proposedBudget,
                isWithinRange: this.isWithinRange(
                    proposal.proposedBudget,
                    priceAnalysis.range
                ),
                discrepancy: this.calculateDiscrepancy(
                    proposal.proposedBudget,
                    priceAnalysis.range
                ),
                clientTalkingPoints: this.generateClientTalkingPoints(
                    freelancer,
                    project,
                    priceAnalysis
                ),
                freelancerTalkingPoints: this.generateFreelancerTalkingPoints(
                    freelancer,
                    project,
                    priceAnalysis
                ),
                recommendations: this.generateRecommendations(
                    proposal.proposedBudget,
                    priceAnalysis
                )
            });

            await recommendation.save();

            return {
                success: true,
                negotiationId: recommendation._id,
                fairRange: recommendation.fairPriceRange,
                freelancerProposal: proposal.proposedBudget,
                isWithinRange: recommendation.isWithinRange,
                discrepancy: recommendation.discrepancy,
                recommendations: recommendation.recommendations,
                nextStep: recommendation.isWithinRange 
                    ? 'Proceed with negotiation or accept'
                    : 'Discuss pricing adjustment'
            };
        } catch (error) {
            console.error('Negotiation recommendation error:', error);
            throw error;
        }
    }

    /**
     * Analyze pricing based on multiple factors
     */
    analyzePricing(freelancer, project, proposedBudget) {
        const factors = {
            scopeComplexity: this.assessScopeComplexity(project),
            marketReferences: this.getMarketReferences(project),
            riskBuffer: this.calculateRiskBuffer(project),
            freelancerExperience: this.assessFreelancerExperience(freelancer),
            urgency: this.assessUrgency(project)
        };

        // Calculate fair range
        const baseRate = factors.marketReferences.averageRate;
        const complexity = factors.scopeComplexity.level === 'complex' ? 1.3 : 1.0;
        const riskFactor = 1 + (factors.riskBuffer.percentage / 100);
        const experiencePremium = this.getExperiencePremium(freelancer);

        const minimum = baseRate * complexity * 0.8;
        const maximum = baseRate * complexity * riskFactor * experiencePremium;

        return {
            range: {
                minimum: Math.round(minimum),
                maximum: Math.round(maximum),
                recommended: Math.round((minimum + maximum) / 2),
                currency: 'USD'
            },
            factors
        };
    }

    /**
     * Assess scope complexity
     */
    assessScopeComplexity(project) {
        const requirements = (project.scope.requirements || []).length;
        const skills = (project.scope.requiredSkills || []).length;
        const criteria = (project.scope.acceptanceCriteria || []).length;

        const complexityScore = requirements + skills + criteria;

        return {
            level: complexityScore > 15 ? 'complex' : complexityScore > 8 ? 'medium' : 'simple',
            impact: complexityScore / 20
        };
    }

    /**
     * Get market references
     */
    getMarketReferences(project) {
        // TODO: Integrate with market data API
        // For now, return mock data based on project scope
        
        const skillLevel = project.scope.level;
        const rates = {
            beginner: 25,
            intermediate: 50,
            advanced: 100,
            expert: 150
        };

        const baseRate = rates[skillLevel] || 50;
        const range = 20;

        return {
            averageRate: baseRate,
            marketRange: {
                min: baseRate - range,
                max: baseRate + range
            },
            sources: ['market-data-api', 'historical-projects']
        };
    }

    /**
     * Calculate risk buffer
     */
    calculateRiskBuffer(project) {
        let riskPercentage = 10; // Base 10%

        // Increase if timeline is tight
        if (project.scope.timeline && project.scope.timeline.duration < 5) {
            riskPercentage += 15;
        }

        // Increase if high complexity
        if ((project.scope.requirements || []).length > 20) {
            riskPercentage += 20;
        }

        return {
            percentage: Math.min(riskPercentage, 50),
            reason: 'Covers scope uncertainty, timeline pressure, and revision risk'
        };
    }

    /**
     * Assess freelancer experience
     */
    assessFreelancerExperience(freelancer) {
        const yearsOfExp = freelancer.yearsOfExperience || 0;
        
        let level = 'beginner';
        if (yearsOfExp >= 10) level = 'expert';
        else if (yearsOfExp >= 5) level = 'advanced';
        else if (yearsOfExp >= 2) level = 'intermediate';

        return {
            level,
            premiumPercentage: yearsOfExp >= 10 ? 30 : yearsOfExp >= 5 ? 15 : 0
        };
    }

    /**
     * Get experience premium
     */
    getExperiencePremium(freelancer) {
        return 1 + ((freelancer.yearsOfExperience || 0) * 0.05);
    }

    /**
     * Assess project urgency
     */
    assessUrgency(project) {
        if (!project.scope.timeline || !project.scope.timeline.endDate) {
            return { isUrgent: false, multiplier: 1.0 };
        }

        const daysRemaining = Math.floor(
            (new Date(project.scope.timeline.endDate) - new Date()) / (1000 * 60 * 60 * 24)
        );

        return {
            isUrgent: daysRemaining < 7,
            multiplier: daysRemaining < 7 ? 1.2 : 1.0
        };
    }

    /**
     * Check if proposal is within fair range
     */
    isWithinRange(proposedBudget, range) {
        return proposedBudget >= range.minimum && proposedBudget <= range.maximum;
    }

    /**
     * Calculate discrepancy from fair range
     */
    calculateDiscrepancy(proposedBudget, range) {
        if (proposedBudget < range.minimum) {
            const percentage = Math.round(((range.minimum - proposedBudget) / range.minimum) * 100);
            return {
                percentage,
                direction: 'below',
                message: `${percentage}% below market rate`
            };
        }

        if (proposedBudget > range.maximum) {
            const percentage = Math.round(((proposedBudget - range.maximum) / range.maximum) * 100);
            return {
                percentage,
                direction: 'above',
                message: `${percentage}% above market rate`
            };
        }

        return {
            percentage: 0,
            direction: 'within',
            message: 'Within fair range'
        };
    }

    /**
     * Generate client talking points
     */
    generateClientTalkingPoints(freelancer, project, priceAnalysis) {
        const points = [
            `Market data shows typical range is $${priceAnalysis.range.minimum}-$${priceAnalysis.range.maximum}`,
            `Your project scope aligns with ${project.scope.level} complexity`
        ];

        if (freelancer.completedProjects < 10) {
            points.push('Freelancer has limited delivery history');
        }

        if (freelancer.averageRating < 4) {
            points.push('Ratings are below 4 stars');
        }

        if (priceAnalysis.factors.urgency.isUrgent) {
            points.push('Your timeline is tight - plan for emergency support costs');
        }

        return points.slice(0, 5);
    }

    /**
     * Generate freelancer talking points
     */
    generateFreelancerTalkingPoints(freelancer, project, priceAnalysis) {
        const points = [
            `My experience level (${freelancer.yearsOfExperience}+ years) justifies premium pricing`
        ];

        if (freelancer.averageRating >= 4.5) {
            points.push('I have a strong track record with 4.5+ stars');
        }

        if (freelancer.completedProjects > 50) {
            points.push(`I've successfully delivered ${freelancer.completedProjects}+ projects`);
        }

        if ((project.scope.requirements || []).length > 20) {
            points.push('Project scope is quite complex - requires expertise');
        }

        return points.slice(0, 5);
    }

    /**
     * Generate recommendations
     */
    generateRecommendations(proposedBudget, priceAnalysis) {
        const recommendations = [];

        if (proposedBudget < priceAnalysis.range.minimum) {
            recommendations.push(
                `Consider offering $${priceAnalysis.range.recommended} for fair compensation`
            );
            recommendations.push(
                'Underpriced proposals often lead to quality issues - invest in the right talent'
            );
        }

        if (proposedBudget > priceAnalysis.range.maximum) {
            recommendations.push(
                `This is above market; consider negotiating down to $${priceAnalysis.range.recommended}`
            );
            recommendations.push(
                'You might get similar quality from freelancers in the fair range'
            );
        }

        if (priceAnalysis.range.minimum === proposedBudget ||priceAnalysis.range.maximum === proposedBudget) {
            recommendations.push('Proposal is within fair range - good basis for negotiation');
        }

        return recommendations;
    }

    /**
     * Log negotiation round
     */
    async logNegotiationRound(negotiationId, initiatedBy, offer, response = null) {
        try {
            const negotiation = await NegotiationAssistant.findById(negotiationId);
            if (!negotiation) throw new Error('Negotiation not found');

            negotiation.rounds.push({
                roundNumber: negotiation.rounds.length + 1,
                initiatedBy,
                [initiatedBy === 'client' ? 'clientCounterOffer' : 'freelancerOffer']: offer,
                status: 'pending',
                timestamp: new Date()
            });

            await negotiation.save();

            return { success: true, roundNumber: negotiation.rounds.length };
        } catch (error) {
            console.error('Log negotiation round error:', error);
            throw error;
        }
    }

    /**
     * Accept negotiation
     */
    async acceptNegotiation(negotiationId, finalPrice) {
        try {
            const negotiation = await NegotiationAssistant.findById(negotiationId);
            if (!negotiation) throw new Error('Negotiation not found');

            negotiation.finalAgreedPrice = finalPrice;
            negotiation.agreedAt = new Date();

            await negotiation.save();

            return {
                success: true,
                agreedPrice: finalPrice,
                message: 'Negotiation accepted. Proceeding to agreement.'
            };
        } catch (error) {
            console.error('Accept negotiation error:', error);
            throw error;
        }
    }
}

module.exports = new NegotiationAssistantService();
