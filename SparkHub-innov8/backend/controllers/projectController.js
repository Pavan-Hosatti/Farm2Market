/**
 * Project Controller
 * Handles project CRUD operations and management
 */

const Project = require('../models/Project');
const ScopeGapDetector = require('../models/ScopeGapDetector');
const aiScoringsService = require('../services/aiScoringsService');
const documentIngestionService = require('../services/documentIngestionService');
const ragService = require('../services/ragService');

class ProjectController {
    /**
     * Create new project
     */
    async createProject(req, res) {
        try {
            const { title, description, scope, clientId } = req.body;

            const project = new Project({
                clientId,
                title,
                description,
                scope: {
                    summary: scope.summary,
                    requirements: scope.requirements || [],
                    budget: scope.budget,
                    timeline: scope.timeline,
                    acceptanceCriteria: scope.acceptanceCriteria || [],
                    requiredSkills: scope.requiredSkills || [],
                    level: scope.level || 'intermediate'
                },
                status: 'draft',
                gapDetection: {
                    hasMissingBudget: !scope.budget,
                    hasMissingTimeline: !scope.timeline,
                    hasMissingAcceptanceCriteria: !scope.acceptanceCriteria || scope.acceptanceCriteria.length === 0,
                    missingItems: [],
                    isGapsCritical: false,
                    lastCheckTime: new Date()
                }
            });

            await project.save();

            return res.status(201).json({
                success: true,
                projectId: project._id,
                message: 'Project created in draft mode',
                project: {
                    _id: project._id,
                    title: project.title,
                    status: project.status,
                    createdAt: project.createdAt
                }
            });
        } catch (error) {
            console.error('Create project error:', error);
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * Get project by ID
     */
    async getProject(req, res) {
        try {
            const { projectId } = req.params;

            const project = await Project.findById(projectId)
                .populate('documents')
                .populate('proposals');

            if (!project) {
                return res.status(404).json({ success: false, message: 'Project not found' });
            }

            return res.json({
                success: true,
                project
            });
        } catch (error) {
            console.error('Get project error:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Update project
     */
    async updateProject(req, res) {
        try {
            const { projectId } = req.params;
            const updates = req.body;

            const project = await Project.findByIdAndUpdate(
                projectId,
                { ...updates, updatedAt: new Date() },
                { new: true }
            );

            if (!project) {
                return res.status(404).json({ success: false, message: 'Project not found' });
            }

            // Re-check gaps if scope updated
            if (updates.scope) {
                const gapResult = await aiScoringsService.detectScopeGaps(projectId);
                project.gapDetection = gapResult.gaps ? { ...project.gapDetection } : {};
            }

            return res.json({
                success: true,
                message: 'Project updated',
                project
            });
        } catch (error) {
            console.error('Update project error:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Check gaps before publishing
     */
    async checkGaps(req, res) {
        try {
            const { projectId } = req.params;

            const gapResult = await aiScoringsService.detectScopeGaps(projectId);

            return res.json({
                success: true,
                ...gapResult,
                canPublish: gapResult.totalGapsFound === 0 || gapResult.highGapCount === 0
            });
        } catch (error) {
            console.error('Check gaps error:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Publish project (after gap check passed)
     */
    async publishProject(req, res) {
        try {
            const { projectId } = req.params;
            const { acknowledgeGaps } = req.body;

            const project = await Project.findById(projectId);
            if (!project) {
                return res.status(404).json({ success: false, message: 'Project not found' });
            }

            // Check if gaps are critical
            if (project.gapDetection.isGapsCritical && !acknowledgeGaps) {
                return res.status(400).json({
                    success: false,
                    message: 'Project has critical gaps. Please fix or acknowledge.',
                    gaps: project.gapDetection.missingItems
                });
            }

            project.status = 'published';
            project.isPublished = true;
            project.publishedAt = new Date();

            await project.save();

            return res.json({
                success: true,
                message: 'Project published successfully',
                project: {
                    _id: project._id,
                    status: project.status,
                    publishedAt: project.publishedAt
                }
            });
        } catch (error) {
            console.error('Publish project error:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * List projects
     */
    async listProjects(req, res) {
        try {
            const { clientId, status, isPublished } = req.query;
            const query = {};

            if (clientId) query.clientId = clientId;
            if (status) query.status = status;
            if (isPublished !== undefined) query.isPublished = isPublished === 'true';

            const projects = await Project.find(query)
                .select('_id title status isPublished proposals createdAt')
                .sort({ createdAt: -1 });

            return res.json({
                success: true,
                count: projects.length,
                projects
            });
        } catch (error) {
            console.error('List projects error:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Delete project
     */
    async deleteProject(req, res) {
        try {
            const { projectId } = req.params;

            const project = await Project.findByIdAndDelete(projectId);

            if (!project) {
                return res.status(404).json({ success: false, message: 'Project not found' });
            }

            return res.json({
                success: true,
                message: 'Project deleted'
            });
        } catch (error) {
            console.error('Delete project error:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Get project documents
     */
    async getProjectDocuments(req, res) {
        try {
            const { projectId } = req.params;

            const documents = await documentIngestionService.getProjectDocuments(projectId);

            return res.json({
                success: true,
                count: documents.length,
                documents
            });
        } catch (error) {
            console.error('Get documents error:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = new ProjectController();
