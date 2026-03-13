/**
 * RAG (Retrieval-Augmented Generation) Service
 * Handles vector search, context retrieval, and answer generation
 */

const mongoose = require('mongoose');
const ProjectDocument = require('../models/ProjectDocument');

class RAGService {
    /**
     * Search for relevant document snippets based on user query
     */
    async searchDocuments(projectId, queryEmbedding, topK = 5) {
        try {
            // Get all document chunks for the project
            const documents = await ProjectDocument.find({
                projectId,
                isLatestVersion: true,
                embeddingStatus: 'completed'
            });

            if (!documents.length) {
                return {
                    success: false,
                    message: 'No processed documents found for this project',
                    results: []
                };
            }

            // Collect all chunks with similarity scores
            const chunks = [];
            
            for (let doc of documents) {
                for (let chunk of doc.chunks) {
                    if (chunk.embeddings && chunk.embeddings.length > 0) {
                        // Calculate similarity (cosine distance as placeholder)
                        const similarity = this.cosineSimilarity(queryEmbedding, chunk.embeddings);
                        
                        chunks.push({
                            documentId: doc._id,
                            fileName: doc.fileName,
                            chunkIndex: chunk.chunkIndex,
                            text: chunk.text,
                            similarity,
                            version: doc.version
                        });
                    }
                }
            }

            // Sort by similarity and return top K
            chunks.sort((a, b) => b.similarity - a.similarity);
            const results = chunks.slice(0, topK);

            return {
                success: true,
                queryEmbedding: queryEmbedding.length,
                resultsCount: results.length,
                results: results.map(r => ({
                    documentId: r.documentId,
                    fileName: r.fileName,
                    snippet: r.text.substring(0, 300) + '...',
                    fullText: r.text,
                    similarity: r.similarity.toFixed(3),
                    version: r.version
                }))
            };
        } catch (error) {
            console.error('RAG search error:', error);
            throw error;
        }
    }

    /**
     * Generate answer based on retrieved context
     */
    async generateAnswer(projectId, query, retrievedContext) {
        try {
            // TODO: Integrate with LLM (OpenAI, HuggingFace, etc.)
            
            // For now, return structured response with context
            const answer = {
                query,
                answer: this.generatePlaceholderAnswer(query, retrievedContext),
                citations: retrievedContext.map(ctx => ({
                    document: ctx.fileName,
                    snippet: ctx.snippet,
                    fullText: ctx.fullText
                })),
                confidence: 0.8,
                timestamp: new Date()
            };

            return answer;
        } catch (error) {
            console.error('Answer generation error:', error);
            throw error;
        }
    }

    /**
     * Handle multimodal query (text + voice)
     */
    async handleMultimodalQuery(projectId, userInput, inputType = 'text', language = 'en') {
        try {
            let query = userInput;
            let queryEmbedding;

            // If voice input, transcribe first
            if (inputType === 'voice') {
                // TODO: Integrate with speech-to-text service
                query = userInput; // Assume transcription done beforehand
            }

            // Translate query if needed
            if (language !== 'en') {
                // TODO: Integrate with translation service
                query = userInput; // Assume translation done if needed
            }

            // Generate embedding for query
            queryEmbedding = await this.getQueryEmbedding(query);

            // Retrieve relevant documents
            const searchResults = await this.searchDocuments(projectId, queryEmbedding);

            if (!searchResults.success || !searchResults.results.length) {
                return {
                    success: false,
                    message: 'Could not find relevant information in project documents',
                    fallbackMessage: query // Return query as fallback
                };
            }

            // Generate answer
            const answer = await this.generateAnswer(
                projectId,
                query,
                searchResults.results
            );

            return {
                success: true,
                query,
                answer: answer.answer,
                citations: answer.citations,
                language,
                confidence: answer.confidence
            };
        } catch (error) {
            console.error('Multimodal query error:', error);
            throw error;
        }
    }

    /**
     * Get embedding for user query
     * TODO: Integrate with embedding service
     */
    async getQueryEmbedding(query) {
        // Placeholder: generate random embedding
        // In production, use OpenAI, Sentence Transformers, etc.
        return Array(1536).fill(0).map(() => Math.random());
    }

    /**
     * Cosine similarity between two vectors
     */
    cosineSimilarity(vec1, vec2) {
        if (vec1.length !== vec2.length) {
            throw new Error('Vector dimensions must match');
        }

        const dotProduct = vec1.reduce((sum, val, i) => sum + val * vec2[i], 0);
        const magnitude1 = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0));
        const magnitude2 = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0));

        if (magnitude1 === 0 || magnitude2 === 0) {
            return 0;
        }

        return dotProduct / (magnitude1 * magnitude2);
    }

    /**
     * Placeholder answer generation
     */
    generatePlaceholderAnswer(query, context) {
        if (!context || context.length === 0) {
            return `I couldn't find specific information about "${query}" in the project documents.`;
        }

        const topResult = context[0];
        return `Based on the project documents, regarding "${query}": ${topResult.snippet}`;
    }

    /**
     * Check if document version invalidates proposals
     */
    async checkDocumentUpdateImpact(projectId, oldVersionHash, newVersionHash) {
        try {
            // Get proposals for this project that relate to old version
            const Proposal = require('../models/Proposal');
            const proposals = await Proposal.find({
                projectId,
                status: { $in: ['submitted', 'reviewed', 'shortlisted'] },
                documentVersionHashes: oldVersionHash
            });

            return {
                impactedProposals: proposals.length,
                isSignificantChange: oldVersionHash !== newVersionHash,
                proposalIds: proposals.map(p => p._id)
            };
        } catch (error) {
            console.error('Document impact check error:', error);
            throw error;
        }
    }

    /**
     * Mark outdated proposals when brief changes
     */
    async markOutdatedProposals(projectId, reason) {
        try {
            const Proposal = require('../models/Proposal');
            
            const result = await Proposal.updateMany(
                {
                    projectId,
                    status: { $in: ['submitted', 'reviewed'] },
                    isOutdated: false
                },
                {
                    isOutdated: true,
                    outdatedReason: reason
                }
            );

            return {
                updatedCount: result.modifiedCount,
                message: `${result.modifiedCount} proposals marked as outdated`
            };
        } catch (error) {
            console.error('Mark outdated error:', error);
            throw error;
        }
    }
}

module.exports = new RAGService();
