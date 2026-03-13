/**
 * Algorand Blockchain Proof Service
 * Handles hashing, anchoring, and proof verification on Algorand
 */

const axios = require('axios');
const crypto = require('crypto');
const AlgorandProof = require('../models/AlgorandProof');
const algosdk = require('algosdk');

class AlgorandProofService {
    constructor() {
        // Initialize Algorand client
        this.algodToken = process.env.ALGORAND_TOKEN || '';
        this.algodServer = process.env.ALGORAND_SERVER || 'https://testnet-algorand.api.purestake.io/ps2';
        this.algodPort = 443;
        
        this.client = new algosdk.Algodv2(this.algodToken, this.algodServer, this.algodPort);
        
        // App configuration
        this.appId = parseInt(process.env.APP_ID || '756282697');
        this.appAddress = process.env.APP_ADDRESS || 'FEP7X7PUBYCVBJMGJCCG7WQHVYIFAZTUTLQKZZ6EW57BCD2KIQYFF3RMYQ';
    }

    /**
     * Generate SHA256 hash for content
     */
    generateHash(content) {
        if (typeof content === 'object') {
            content = JSON.stringify(content);
        }
        return crypto.createHash('sha256').update(content).digest('hex');
    }

    /**
     * Anchor document hash on Algorand
     */
    async anchorDocumentHash(projectId, documentId, contentHash, referenceData = {}) {
        try {
            // Create proof record
            const proof = new AlgorandProof({
                referenceType: 'project_document',
                referenceId: documentId,
                projectId,
                contentHash,
                contentSummary: referenceData.summary || 'Project document',
                blockchain: {
                    network: 'testnet',
                    appId: this.appId.toString(),
                    appAddress: this.appAddress
                },
                status: 'pending',
                fallbackMode: { isFallback: false }
            });

            await proof.save();

            // Attempt to anchor on blockchain
            try {
                const result = await this.submitToBlockchain(
                    proof._id,
                    contentHash,
                    'document_anchor'
                );

                if (result.success) {
                    proof.blockchain.transactionId = result.txId;
                    proof.blockchain.transactionUrl = result.txUrl;
                    proof.blockchain.anchoredAt = new Date();
                    proof.status = 'confirmed';
                    await proof.save();

                    return {
                        success: true,
                        proofId: proof._id,
                        contentHash,
                        transactionId: result.txId,
                        status: 'confirmed'
                    };
                }
            } catch (blockchainError) {
                console.warn('Blockchain anchor failed, using fallback:', blockchainError.message);
                
                // Fallback: store without blockchain confirmation
                proof.fallbackMode = {
                    isFallback: true,
                    fallbackReason: blockchainError.message,
                    willRetryAt: new Date(Date.now() + 5 * 60 * 1000) // Retry in 5 mins
                };
                proof.status = 'fallback';
                await proof.save();

                return {
                    success: true,
                    proofId: proof._id,
                    contentHash,
                    status: 'fallback',
                    message: 'Proof stored temporarily. Will anchor when blockchain is available.'
                };
            }
        } catch (error) {
            console.error('Document anchor error:', error);
            throw error;
        }
    }

    /**
     * Anchor proposal hash on Algorand
     */
    async anchorProposalHash(projectId, proposalId, contentHash) {
        try {
            const proof = new AlgorandProof({
                referenceType: 'proposal',
                referenceId: proposalId,
                projectId,
                contentHash,
                contentSummary: 'Freelancer proposal submission',
                blockchain: {
                    network: 'testnet',
                    appId: this.appId.toString(),
                    appAddress: this.appAddress
                },
                status: 'pending'
            });

            await proof.save();

            try {
                const result = await this.submitToBlockchain(
                    proof._id,
                    contentHash,
                    'proposal_anchor'
                );

                proof.blockchain.transactionId = result.txId;
                proof.status = 'confirmed';
                await proof.save();

                return {
                    success: true,
                    proofId: proof._id,
                    transactionId: result.txId,
                    status: 'confirmed'
                };
            } catch (err) {
                proof.status = 'fallback';
                proof.fallbackMode = { isFallback: true, fallbackReason: err.message };
                await proof.save();

                return {
                    success: true,
                    proofId: proof._id,
                    status: 'fallback',
                    message: 'Proposal recorded. Blockchain confirmation pending.'
                };
            }
        } catch (error) {
            console.error('Proposal anchor error:', error);
            throw error;
        }
    }

    /**
     * Anchor agreement/milestone on Algorand
     */
    async anchorAgreement(projectId, freelancerId, clientId, agreementData) {
        try {
            const agreementHash = this.generateHash(agreementData);

            const proof = new AlgorandProof({
                referenceType: 'agreement',
                referenceId: projectId,
                projectId,
                contentHash: agreementHash,
                contentSummary: 'Project agreement and milestones',
                blockchain: {
                    network: 'testnet',
                    appId: this.appId.toString(),
                    appAddress: this.appAddress
                },
                status: 'pending'
            });

            await proof.save();

            try {
                const result = await this.submitToBlockchain(
                    proof._id,
                    agreementHash,
                    'agreement_anchor'
                );

                proof.blockchain.transactionId = result.txId;
                proof.status = 'confirmed';
                await proof.save();

                return {
                    success: true,
                    agreementHash,
                    proofId: proof._id,
                    transactionId: result.txId
                };
            } catch (err) {
                proof.status = 'fallback';
                await proof.save();

                return {
                    success: true,
                    agreementHash,
                    proofId: proof._id,
                    status: 'fallback_pending'
                };
            }
        } catch (error) {
            console.error('Agreement anchor error:', error);
            throw error;
        }
    }

    /**
     * Submit to blockchain (placeholder for actual Algorand interaction)
     */
    async submitToBlockchain(proofId, contentHash, anchorType) {
        try {
            // TODO: Implement actual Algorand transaction submission
            // For now, return mock success
            
            const mockTxId = `ALGO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const mockTxUrl = `https://testnet.algoexplorer.io/tx/${mockTxId}`;

            // Simulate delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            return {
                success: true,
                txId: mockTxId,
                txUrl: mockTxUrl,
                timestamp: new Date()
            };
        } catch (error) {
            console.error('Blockchain submission error:', error);
            throw error;
        }
    }

    /**
     * Verify proof on Algorand
     */
    async verifyProof(proofId) {
        try {
            const proof = await AlgorandProof.findById(proofId);
            if (!proof) throw new Error('Proof not found');

            // If fallback mode, return fallback status
            if (proof.fallbackMode?.isFallback) {
                return {
                    verified: false,
                    status: 'fallback_pending',
                    message: 'Anchor pending. Blockchain verification will happen when service is available.',
                    proof: {
                        contentHash: proof.contentHash,
                        createdAt: proof.createdAt,
                        willRetryAt: proof.fallbackMode.willRetryAt
                    }
                };
            }

            // TODO: Verify against actual Algorand blockchain
            // For now, return confirmed status if transaction exists
            if (proof.blockchain.transactionId) {
                return {
                    verified: true,
                    status: 'confirmed',
                    proof: {
                        contentHash: proof.contentHash,
                        transactionId: proof.blockchain.transactionId,
                        transactionUrl: proof.blockchain.transactionUrl,
                        anchoredAt: proof.blockchain.anchoredAt,
                        network: proof.blockchain.network
                    }
                };
            }

            return {
                verified: false,
                status: 'pending',
                message: 'Proof is still pending confirmation'
            };
        } catch (error) {
            console.error('Proof verification error:', error);
            throw error;
        }
    }

    /**
     * Retry failed proofs
     */
    async retryFailedProofs() {
        try {
            const failedProofs = await AlgorandProof.find({
                status: 'fallback',
                retryCount: { $lt: 3 },
                'fallbackMode.willRetryAt': { $lte: new Date() }
            });

            console.log(`Retrying ${failedProofs.length} failed proofs...`);

            for (let proof of failedProofs) {
                try {
                    const result = await this.submitToBlockchain(
                        proof._id,
                        proof.contentHash,
                        proof.referenceType
                    );

                    proof.blockchain.transactionId = result.txId;
                    proof.status = 'confirmed';
                    proof.retryCount += 1;
                    proof.fallbackMode.isFallback = false;

                    await proof.save();
                    console.log(`✅ Proof ${proof._id} confirmed`);
                } catch (err) {
                    proof.retryCount += 1;
                    proof.fallbackMode.willRetryAt = new Date(Date.now() + 10 * 60 * 1000);
                    await proof.save();
                    console.warn(`⚠️ Proof ${proof._id} retry failed, will retry later`);
                }
            }

            return { retriedCount: failedProofs.length };
        } catch (error) {
            console.error('Retry proofs error:', error);
            throw error;
        }
    }

    /**
     * Get proof timeline for dispute resolution
     */
    async getProofTimeline(projectId) {
        try {
            const proofs = await AlgorandProof.find({ projectId })
                .sort({ createdAt: -1 });

            return {
                proofs: proofs.map(p => ({
                    type: p.referenceType,
                    hash: p.contentHash,
                    timestamp: p.blockchain.anchoredAt || p.createdAt,
                    transactionId: p.blockchain.transactionId,
                    status: p.status,
                    network: p.blockchain.network
                }))
            };
        } catch (error) {
            console.error('Proof timeline error:', error);
            throw error;
        }
    }
}

module.exports = new AlgorandProofService();
