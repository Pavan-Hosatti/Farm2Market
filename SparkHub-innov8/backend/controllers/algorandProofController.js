/**
 * Algorand Proof Controller
 * Handles blockchain proof anchoring and verification
 */

const algorandProofService = require('../services/algorandProofService');

class AlgorandProofController {
    /**
     * Get proof for document
     */
    async getDocumentProof(req, res) {
        try {
            const { documentId } = req.params;
            const AlgorandProof = require('../models/AlgorandProof');

            const proof = await AlgorandProof.findOne({ referenceId: documentId });

            if (!proof) {
                return res.status(404).json({ success: false, message: 'Proof not found' });
            }

            const verified = await algorandProofService.verifyProof(proof._id);

            return res.json({
                success: true,
                proof: {
                    contentHash: proof.contentHash,
                    transactionId: proof.blockchain.transactionId,
                    status: proof.status,
                    network: proof.blockchain.network,
                    appId: proof.blockchain.appId
                },
                verification: verified
            });
        } catch (error) {
            console.error('Get document proof error:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Get proof for proposal
     */
    async getProposalProof(req, res) {
        try {
            const { proposalId } = req.params;
            const AlgorandProof = require('../models/AlgorandProof');

            const proof = await AlgorandProof.findOne({
                referenceId: proposalId,
                referenceType: 'proposal'
            });

            if (!proof) {
                return res.status(404).json({
                    success: false,
                    message: 'Proposal proof not yet anchored',
                    status: 'pending'
                });
            }

            const verified = await algorandProofService.verifyProof(proof._id);

            return res.json({
                success: true,
                proof: {
                    contentHash: proof.contentHash,
                    transactionId: proof.blockchain.transactionId,
                    status: proof.status,
                    network: proof.blockchain.network,
                    anchoredAt: proof.blockchain.anchoredAt,
                    transactionUrl: proof.blockchain.transactionUrl
                },
                verification: verified
            });
        } catch (error) {
            console.error('Get proposal proof error:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Get proof timeline for project (for dispute resolution)
     */
    async getProofTimeline(req, res) {
        try {
            const { projectId } = req.params;

            const timeline = await algorandProofService.getProofTimeline(projectId);

            return res.json({
                success: true,
                proofTimeline: timeline.proofs
            });
        } catch (error) {
            console.error('Get proof timeline error:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Verify proof
     */
    async verifyProof(req, res) {
        try {
            const { proofId } = req.params;

            const verification = await algorandProofService.verifyProof(proofId);

            return res.json({
                success: true,
                verification
            });
        } catch (error) {
            console.error('Verify proof error:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Get all proofs for project
     */
    async getProjectProofs(req, res) {
        try {
            const { projectId } = req.params;
            const AlgorandProof = require('../models/AlgorandProof');

            const proofs = await AlgorandProof.find({ projectId })
                .select('referenceType contentHash status blockchain.transactionId blockchain.network createdAt')
                .sort({ createdAt: -1 });

            return res.json({
                success: true,
                proofCount: proofs.length,
                proofs: proofs.map(p => ({
                    type: p.referenceType,
                    hash: p.contentHash,
                    status: p.status,
                    transactionId: p.blockchain.transactionId,
                    network: p.blockchain.network,
                    timestamp: p.createdAt
                }))
            });
        } catch (error) {
            console.error('Get project proofs error:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Retry failed proof anchoring
     */
    async retryFailedProofs(req, res) {
        try {
            const result = await algorandProofService.retryFailedProofs();

            return res.json({
                success: true,
                message: `Retried ${result.retriedCount} failed proofs`,
                retriedCount: result.retriedCount
            });
        } catch (error) {
            console.error('Retry failed proofs error:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Get blockchain status
     */
    async getBlockchainStatus(req, res) {
        try {
            const AlgorandProof = require('../models/AlgorandProof');

            const stats = await AlgorandProof.aggregate([
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 }
                    }
                }
            ]);

            const statusMap = {};
            stats.forEach(s => statusMap[s._id] = s.count);

            return res.json({
                success: true,
                blockchainStatus: {
                    confirmed: statusMap.confirmed || 0,
                    pending: statusMap.pending || 0,
                    fallback: statusMap.fallback || 0,
                    failed: statusMap.failed || 0
                },
                network: 'testnet',
                appId: '756282697'
            });
        } catch (error) {
            console.error('Get blockchain status error:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = new AlgorandProofController();
