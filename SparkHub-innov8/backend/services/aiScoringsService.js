/**
 * AI Scoring Services
 * Bid Comprehension Score, Skill-Fit Radar, Gap Detector
 */

const mongoose = require('mongoose');
const Proposal = require('../models/Proposal');
const Project = require('../models/Project');
const Freelancer = require('../models/Freelancer');
const ScopeGapDetector = require('../models/ScopeGapDetector');

class AIScoringsService {
    /**
     * Calculate AI Bid Comprehension Score
     */
    async calculateBidComprehensionScore(proposalId) {
        try {
            const proposal = await Proposal.findById(proposalId).populate('projectId freelancerId');
            if (!proposal) throw new Error('Proposal not found');

            const project = proposal.projectId;
            const freelancer = proposal.freelancerId;

            // Extract key requirements from project brief
            const requirements = {
                scope: project.scope.summary || '',
                budget: project.scope.budget,
                timeline: project.scope.timeline,
                criteria: project.scope.acceptanceCriteria || [],
                skills: project.scope.requiredSkills || []
            };

            // Analyze proposal against requirements
            const analysis = {
                hasAddressedScope: this.checkScopeUnderstanding(proposal.coverLetter, project),
                hasBudgetAlignment: this.checkBudgetAlignment(proposal.proposedBudget, project.scope.budget),
                hasRealisticTimeline: this.checkTimelineAlignment(proposal.proposedTimeline, project.scope.timeline),
                hasSkillMatch: this.checkSkillMatch(freelancer.skills, project.scope.requiredSkills),
                hasQualitySignals: this.checkQualitySignals(proposal.coverLetter, freelancer)
            };

            // Calculate score
            const score = this.calculateScore(analysis);

            // Identify missing points
            const missingPoints = this.identifyGaps(analysis, proposal, project);

            // Generate explanation
            const explanation = this.generateScoreExplanation(analysis, score);

            // Store score
            proposal.aiComprehensionScore = {
                score,
                explanation,
                missingPoints,
                strengths: this.getStrengths(analysis),
                scoredAt: new Date(),
                modelUsed: 'bidbuddy-comprehension-v1'
            };

            await proposal.save();

            return {
                success: true,
                score,
                explanation,
                missingPoints,
                strengths: proposal.aiComprehensionScore.strengths
            };
        } catch (error) {
            console.error('Comprehension score error:', error);
            throw error;
        }
    }

    /**
     * Calculate Skill-Fit Radar score
     */
    async calculateSkillFitRadar(proposalId) {
        try {
            const proposal = await Proposal.findById(proposalId).populate('projectId freelancerId');
            if (!proposal) throw new Error('Proposal not found');

            const project = proposal.projectId;
            const freelancer = proposal.freelancerId;

            const radarDimensions = {
                technicalSkills: this.assessTechnicalSkills(freelancer.skills, project.scope.requiredSkills),
                experience: this.assessExperience(freelancer, project),
                language: this.assessLanguage(freelancer.languages, ['en']),
                communicationHistory: this.assessCommunication(freelancer),
                portfolio: this.assessPortfolio(freelancer, project)
            };

            // Calculate weighted score
            const overallFitScore = this.calculateWeightedScore(radarDimensions);

            const skillFitData = {
                overallFitScore,
                radarDimensions,
                strengths: this.extractStrengths(radarDimensions),
                gaps: this.extractGaps(radarDimensions),
                recommendation: this.generateFitRecommendation(overallFitScore)
            };

            proposal.skillFitScore = skillFitData;
            await proposal.save();

            return skillFitData;
        } catch (error) {
            console.error('Skill-fit radar error:', error);
            throw error;
        }
    }

    /**
     * Run Scope Gap Detector
     */
    async detectScopeGaps(projectId) {
        try {
            const project = await Project.findById(projectId);
            if (!project) throw new Error('Project not found');

            const gaps = [];

            // Check for missing budget
            if (!project.scope.budget || !project.scope.budget.min || !project.scope.budget.max) {
                gaps.push({
                    category: 'budget',
                    issue: 'Budget range not specified',
                    severity: 'critical',
                    suggestion: 'Define minimum and maximum budget for the project',
                    example: 'e.g., $500 - $2000'
                });
            }

            // Check for missing timeline
            if (!project.scope.timeline || !project.scope.timeline.endDate) {
                gaps.push({
                    category: 'timeline',
                    issue: 'Project timeline not specified',
                    severity: 'critical',
                    suggestion: 'Define project start and end dates',
                    example: 'e.g., 2 weeks, starting immediately'
                });
            }

            // Check for missing acceptance criteria
            if (!project.scope.acceptanceCriteria || project.scope.acceptanceCriteria.length === 0) {
                gaps.push({
                    category: 'acceptance_criteria',
                    issue: 'Acceptance criteria not defined',
                    severity: 'high',
                    suggestion: 'List clear criteria for project completion',
                    example: 'e.g., Code should pass unit tests, documentation complete'
                });
            }

            // Check for missing requirements
            if (!project.scope.requirements || project.scope.requirements.length === 0) {
                gaps.push({
                    category: 'requirements',
                    issue: 'Project requirements not detailed',
                    severity: 'high',
                    suggestion: 'Provide detailed functional and technical requirements',
                    example: 'e.g., Must support 1000+ concurrent users'
                });
            }

            // Check for missing required skills
            if (!project.scope.requiredSkills || project.scope.requiredSkills.length === 0) {
                gaps.push({
                    category: 'requirements',
                    issue: 'Required skills not specified',
                    severity: 'medium',
                    suggestion: 'List specific skills needed',
                    example: 'e.g., React.js, Node.js, MongoDB'
                });
            }

            // Create detector record
            const detector = new ScopeGapDetector({
                projectId,
                clientId: project.clientId,
                gaps,
                totalGapsFound: gaps.length,
                criticalGapCount: gaps.filter(g => g.severity === 'critical').length,
                highGapCount: gaps.filter(g => g.severity === 'high').length,
                hasAmbiguity: gaps.length > 0,
                isProceedingWithoutFix: false,
                assessedAt: new Date(),
                modelUsed: 'bidbuddy-gapdetector-v1',
                ambiguityChecklist: gaps.map((g, i) => ({
                    item: `${g.category}: ${g.issue}`,
                    isResolved: false
                }))
            });

            await detector.save();

            // Update project status
            if (gaps.length > 0) {
                project.status = 'gaps_flagged';
                project.gapDetection = {
                    hasMissingBudget: gaps.some(g => g.category === 'budget'),
                    hasMissingTimeline: gaps.some(g => g.category === 'timeline'),
                    hasMissingAcceptanceCriteria: gaps.some(g => g.category === 'acceptance_criteria'),
                    missingItems: gaps.map(g => g.issue),
                    isGapsCritical: gaps.some(g => g.severity === 'critical'),
                    lastCheckTime: new Date()
                };
                await project.save();
            }

            return {
                success: true,
                gapDetectorId: detector._id,
                totalGaps: gaps.length,
                criticalGaps: gaps.filter(g => g.severity === 'critical').length,
                gaps: gaps,
                canPublish: gaps.length === 0 || gaps.every(g => g.severity === 'low'),
                message: gaps.length === 0 ? 'Project brief is complete!' : `${gaps.length} gaps detected`
            };
        } catch (error) {
            console.error('Scope gap detection error:', error);
            throw error;
        }
    }

    // ========= Helper Methods =========

    checkScopeUnderstanding(coverLetter, project) {
        const keyTerms = [
            project.scope.summary?.toLowerCase(),
            ...project.scope.requirements.map(r => r.toLowerCase()).slice(0, 3)
        ].filter(Boolean);

        const letterLower = coverLetter.toLowerCase();
        const matchCount = keyTerms.filter(term => letterLower.includes(term)).length;
        return matchCount >= Math.ceil(keyTerms.length * 0.5);
    }

    checkBudgetAlignment(proposedBudget, budgetRange) {
        if (!budgetRange || !budgetRange.min || !budgetRange.max) return false;
        return proposedBudget >= budgetRange.min * 0.8 && proposedBudget <= budgetRange.max * 1.2;
    }

    checkTimelineAlignment(proposedTimeline, projectTimeline) {
        if (!proposedTimeline || !projectTimeline) return false;
        // Simplified alignment check
        return proposedTimeline.duration > 0;
    }

    checkSkillMatch(freelancerSkills, requiredSkills) {
        if (!freelancerSkills || !requiredSkills) return false;
        const freelancerSkillNames = freelancerSkills.map(s => s.name?.toLowerCase());
        const requiredLower = requiredSkills.map(s => s.toLowerCase());
        const matches = requiredLower.filter(r => freelancerSkillNames.some(f => f.includes(r)));
        return matches.length >= requiredLower.length * 0.6;
    }

    checkQualitySignals(coverLetter, freelancer) {
        const qualitySignals = [
            coverLetter.length > 200,
            freelancer.averageRating > 3.5,
            freelancer.completedProjects > 3,
            freelancer.isProfileComplete
        ];
        return qualitySignals.filter(Boolean).length >= 2;
    }

    calculateScore(analysis) {
        const scores = {
            scope: analysis.hasAddressedScope ? 20 : 0,
            budget: analysis.hasBudgetAlignment ? 20 : 0,
            timeline: analysis.hasRealisticTimeline ? 20 : 0,
            skills: analysis.hasSkillMatch ? 25 : 0,
            quality: analysis.hasQualitySignals ? 15 : 0
        };
        return Math.min(100, Object.values(scores).reduce((a, b) => a + b, 0));
    }

    identifyGaps(analysis, proposal, project) {
        const gaps = [];
        if (!analysis.hasAddressedScope) gaps.push('Proposal does not address key project scope items');
        if (!analysis.hasBudgetAlignment) gaps.push('Proposed budget misaligns with project range');
        if (!analysis.hasRealisticTimeline) gaps.push('Timeline may not be realistic for scope');
        if (!analysis.hasSkillMatch) gaps.push('Missing key required skills');
        if (!analysis.hasQualitySignals) gaps.push('Limited evidence of quality delivery history');
        return gaps;
    }

    generateScoreExplanation(analysis, score) {
        const parts = [];
        if (analysis.hasAddressedScope) parts.push('Freelancer clearly understands project scope');
        if (analysis.hasBudgetAlignment) parts.push('Budget proposal is well-aligned');
        if (analysis.hasRealisticTimeline) parts.push('Timeline appears realistic');
        if (analysis.hasSkillMatch) parts.push('Skills are well-matched to requirements');
        
        return `Score: ${score}/100. ${parts.join('. ')}`;
    }

    getStrengths(analysis) {
        const strengths = [];
        if (analysis.hasAddressedScope) strengths.push('Deep understanding of scope');
        if (analysis.hasBudgetAlignment) strengths.push('Realistic pricing');
        if (analysis.hasSkillMatch) strengths.push('Strong skill alignment');
        return strengths;
    }

    assessTechnicalSkills(freelancerSkills, requiredSkills) {
        const freelancerSkillNames = freelancerSkills?.map(s => s.name?.toLowerCase()) || [];
        const requiredLower = requiredSkills?.map(s => s.toLowerCase()) || [];
        const matched = requiredLower.filter(r => freelancerSkillNames.some(f => f.includes(r)));
        
        return {
            score: Math.min(100, (matched.length / Math.max(1, requiredLower.length)) * 100),
            weight: 0.35,
            matched,
            missing: requiredLower.filter(r => !matched.includes(r))
        };
    }

    assessExperience(freelancer, project) {
        return {
            score: Math.min(100, (freelancer.yearsOfExperience || 0) / 10 * 100),
            weight: 0.25,
            yearsRequired: 3,
            yearsHave: freelancer.yearsOfExperience || 0,
            relevantProjects: freelancer.completedProjects || 0
        };
    }

    assessLanguage(languages, required) {
        const hasRequired = languages?.some(l => required.includes(l.name));
        return {
            score: hasRequired ? 100 : 50,
            weight: 0.15,
            required,
            fluent: languages?.map(l => l.name) || []
        };
    }

    assessCommunication(freelancer) {
        return {
            score: (freelancer.averageRating || 0) / 5 * 100,
            weight: 0.15,
            pastResponsiveness: 85,
            pastQuality: (freelancer.averageRating || 0) / 5 * 100
        };
    }

    assessPortfolio(freelancer, project) {
        const relevant = freelancer.portfolio?.filter(p => 
            project.scope.requiredSkills?.some(s => p.title?.toLowerCase().includes(s.toLowerCase()))
        ).length || 0;

        return {
            score: Math.min(100, relevant * 20),
            weight: 0.1,
            relevantPieces: relevant,
            complexity: freelancer.completedProjects > 10 ? 'advanced' : 'intermediate'
        };
    }

    calculateWeightedScore(dimensions) {
        let totalScore = 0;
        let totalWeight = 0;
        
        Object.values(dimensions).forEach(dim => {
            totalScore += (dim.score || 0) * dim.weight;
            totalWeight += dim.weight;
        });

        return Math.round(totalScore / totalWeight);
    }

    extractStrengths(dimensions) {
        const strengths = [];
        if (dimensions.technicalSkills.score > 80) strengths.push('Strong technical skills');
        if (dimensions.experience.score > 70) strengths.push('Good experience level');
        if (dimensions.communicationHistory.score > 80) strengths.push('Excellent communication');
        return strengths;
    }

    extractGaps(dimensions) {
        const gaps = [];
        if (dimensions.technicalSkills.score < 60) {
            gaps.push({
                skill: 'Technical Skills',
                severity: dimensions.technicalSkills.score < 40 ? 'critical' : 'medium',
                mitigation: 'Consider training or pairing with experienced developer'
            });
        }
        return gaps;
    }

    generateFitRecommendation(score) {
        if (score >= 85) return 'Strong fit - Highly recommended';
        if (score >= 70) return 'Good fit - Recommended';
        if (score >= 50) return 'Acceptable fit - Consider carefully';
        return 'Poor fit - Not recommended';
    }
}

module.exports = new AIScoringsService();
