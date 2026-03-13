/**
 * BidBuddy API Routes
 * Main routing configuration for all endpoints
 */

const express = require('express');
const router = express.Router();

// Import controllers
const projectController = require('../controllers/projectController');
const proposalController = require('../controllers/proposalController');
const voiceRagController = require('../controllers/voiceRagController');
const documentIngestionController = require('../controllers/documentIngestionController');
const aiScoringController = require('../controllers/aiScoringController');
const algorandProofController = require('../controllers/algorandProofController');
const negotiationController = require('../controllers/negotiationController');
const disputeResolutionController = require('../controllers/disputeResolutionController');

// ============================================
// PROJECT ROUTES
// ============================================
router.post('/projects', projectController.createProject);
router.get('/projects/:projectId', projectController.getProject);
router.put('/projects/:projectId', projectController.updateProject);
router.get('/projects', projectController.listProjects);
router.delete('/projects/:projectId', projectController.deleteProject);

// Gap detection
router.post('/projects/:projectId/check-gaps', projectController.checkGaps);
router.post('/projects/:projectId/publish', projectController.publishProject);

// Project documents
router.get('/projects/:projectId/documents', projectController.getProjectDocuments);

// ============================================
// DOCUMENT INGESTION ROUTES
// ============================================
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

router.post('/projects/:projectId/documents/upload', upload.single('file'), documentIngestionController.uploadDocument);
router.get('/documents/:documentId/status', documentIngestionController.getDocumentStatus);
router.get('/projects/:projectId/documents/list', documentIngestionController.getProjectDocuments);
router.get('/documents/compare', documentIngestionController.compareVersions);
router.get('/documents/:documentId/content', documentIngestionController.getDocumentContent);
router.delete('/documents/:documentId', documentIngestionController.deleteDocument);
router.post('/documents/:documentId/retry', documentIngestionController.retryProcessing);

// ============================================
// PROPOSAL ROUTES
// ============================================
router.post('/proposals', proposalController.submitProposal);
router.get('/proposals/:proposalId', proposalController.getProposal);
router.get('/projects/:projectId/proposals', proposalController.listProposals);
router.get('/proposals/:proposalId/scores', proposalController.getProposalScores);
router.patch('/proposals/:proposalId/status', proposalController.updateProposalStatus);
router.post('/proposals/:proposalId/shortlist', proposalController.shortlistProposal);

// ============================================
// AI SCORING ROUTES
// ============================================

// Bid Comprehension Score
router.get('/proposals/:proposalId/comprehension-score', aiScoringController.getBidComprehensionScore);

// Skill-Fit Radar
router.get('/proposals/:proposalId/skill-fit-radar', aiScoringController.getSkillFitRadar);

// Scope Gap Detector
router.post('/projects/:projectId/detect-gaps', aiScoringController.detectScopeGaps);

// Comprehensive Scoring Reports
router.get('/proposals/:proposalId/scoring-report', aiScoringController.getScoringReport);
router.get('/projects/:projectId/proposals/ranked-by-score', aiScoringController.rankProposalsByScore);

// ============================================
// VOICE & RAG CHAT ROUTES
// ============================================

// Voice Sessions
router.post('/voice/sessions', voiceRagController.startVoiceSession);
router.post('/voice/sessions/:sessionId/query', voiceRagController.processVoiceQuery);
router.post('/voice/sessions/:sessionId/text-query', voiceRagController.processTextQuery);
router.post('/voice/sessions/:sessionId/navigate', voiceRagController.voiceNavigation);
router.post('/voice/sessions/:sessionId/end', voiceRagController.endVoiceSession);

// Multilingual Voice
router.post('/voice/kannada', voiceRagController.kannada);

// Proposal Chat
router.post('/proposals/:proposalId/chat', voiceRagController.saveProposalChat);
router.get('/proposals/:proposalId/chat', voiceRagController.getProposalChat);

// ============================================
// ALGORAND PROOF ROUTES
// ============================================

// Document proofs
router.get('/documents/:documentId/proof', algorandProofController.getDocumentProof);

// Proposal proofs
router.get('/proposals/:proposalId/proof', algorandProofController.getProposalProof);

// Proof timeline (for disputes)
router.get('/projects/:projectId/proof-timeline', algorandProofController.getProofTimeline);

// General proof operations
router.get('/proofs/:proofId/verify', algorandProofController.verifyProof);
router.get('/projects/:projectId/proofs', algorandProofController.getProjectProofs);
router.post('/proofs/retry-failed', algorandProofController.retryFailedProofs);
router.get('/blockchain/status', algorandProofController.getBlockchainStatus);

// ============================================
// NEGOTIATION ROUTES
// ============================================

// Negotiation Recommendations
router.get('/proposals/:proposalId/negotiation', negotiationController.getNegotiationRecommendation);
router.get('/proposals/:proposalId/negotiation/analysis', negotiationController.getNegotiationAnalysis);

// Negotiation Rounds
router.post('/negotiations/:negotiationId/round', negotiationController.logNegotiationRound);
router.post('/negotiations/:negotiationId/accept', negotiationController.acceptNegotiation);

// History
router.get('/projects/:projectId/negotiations', negotiationController.getNegotiationHistory);

// ============================================
// DISPUTE RESOLUTION ROUTES
// ============================================

// Create and manage disputes
router.post('/disputes', disputeResolutionController.createDispute);
router.get('/disputes/:disputeId', disputeResolutionController.getDispute);

// Resolution
router.get('/disputes/:disputeId/resolution', disputeResolutionController.getResolutionRecommendation);
router.post('/disputes/:disputeId/resolve', disputeResolutionController.resolveDispute);

// Responses
router.post('/disputes/:disputeId/freelancer-response', disputeResolutionController.freelancerResponse);
router.post('/disputes/:disputeId/client-response', disputeResolutionController.clientResponse);

// History
router.get('/projects/:projectId/disputes', disputeResolutionController.getDisputeHistory);

// Demo
router.post('/projects/:projectId/proposals/:proposalId/mock-dispute', disputeResolutionController.mockDisputeDemo);

// ============================================
// HEALTH CHECK
// ============================================
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'BidBuddy API is running',
        version: '1.0.0',
        status: 'operational'
    });
});

module.exports = router;
