/**
 * Document Ingestion Service
 * Handles document upload, parsing, chunking, and embedding for living knowledge base
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const ProjectDocument = require('../models/ProjectDocument');

class DocumentIngestionService {
    /**
     * Upload document and queue for processing
     */
    async uploadDocument(projectId, file, options = {}) {
        try {
            const {
                fileName = file.originalname,
                fileType = this.getFileType(file.originalname),
                fileSize = file.size,
                storageKey = `${projectId}/${Date.now()}-${file.originalname}`,
                fileUrl = `/uploads/${storageKey}`
            } = options;

            // Mark old versions as not latest
            await ProjectDocument.updateMany(
                { projectId, isLatestVersion: true },
                { isLatestVersion: false }
            );

            // Create document record
            const document = new ProjectDocument({
                projectId,
                fileName,
                fileType,
                fileSize,
                fileUrl,
                storageKey,
                processingStatus: 'queued',
                embeddingStatus: 'pending',
                version: 1
            });

            await document.save();

            // Queue for async processing
            this.enqueueDocumentProcessing(document._id);

            return {
                success: true,
                documentId: document._id,
                status: 'queued',
                message: 'Document queued for processing'
            };
        } catch (error) {
            console.error('Document upload error:', error);
            throw error;
        }
    }

    /**
     * Process document: parse content and create chunks
     */
    async processDocument(documentId) {
        try {
            const document = await ProjectDocument.findById(documentId);
            if (!document) throw new Error('Document not found');

            document.processingStatus = 'processing';
            await document.save();

            // Read file
            const fileContent = await this.readFile(document.fileUrl);
            document.rawContent = fileContent;

            // Parse and chunk
            const chunks = await this.chunkContent(fileContent, documentId);
            document.chunks = chunks;

            document.processingStatus = 'completed';

            // Generate version hash
            document.versionHash = this.generateHash(fileContent);

            await document.save();

            // Queue for embedding
            this.enqueueEmbedding(documentId);

            console.log(`✅ Document ${documentId} processed: ${chunks.length} chunks created`);
            return { success: true, chunksCount: chunks.length };
        } catch (error) {
            console.error(`Document processing error for ${documentId}:`, error);
            
            const document = await ProjectDocument.findById(documentId);
            if (document) {
                document.processingStatus = 'failed';
                document.processingError = error.message;
                await document.save();
            }

            throw error;
        }
    }

    /**
     * Create embeddings for document chunks
     */
    async embedDocument(documentId) {
        try {
            const document = await ProjectDocument.findById(documentId);
            if (!document) throw new Error('Document not found');

            document.embeddingStatus = 'in_progress';
            await document.save();

            // For each chunk, generate embedding (placeholder for now)
            for (let chunk of document.chunks) {
                // TODO: Integrate with actual embedding service (OpenAI, HuggingFace, etc.)
                // For now, create dummy embedding
                chunk.embeddings = Array(1536).fill(0).map(() => Math.random());
            }

            document.embeddingStatus = 'completed';
            await document.save();

            console.log(`✅ Document ${documentId} embeddings completed`);
            return { success: true };
        } catch (error) {
            console.error(`Embedding error for ${documentId}:`, error);

            const document = await ProjectDocument.findById(documentId);
            if (document) {
                document.embeddingStatus = 'failed';
                await document.save();
            }

            throw error;
        }
    }

    /**
     * Chunk content into manageable pieces
     */
    async chunkContent(content, documentId, chunkSize = 500) {
        const chunks = [];
        const lines = content.split('\n').filter(line => line.trim());

        let currentChunk = '';
        let startOffset = 0;
        let chunkIndex = 0;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            if ((currentChunk + line).length > chunkSize && currentChunk.length > 0) {
                // Save current chunk
                chunks.push({
                    chunkIndex: chunkIndex++,
                    text: currentChunk.trim(),
                    startOffset,
                    endOffset: startOffset + currentChunk.length,
                    embeddings: [] // To be filled during embedding phase
                });

                startOffset += currentChunk.length;
                currentChunk = line + '\n';
            } else {
                currentChunk += line + '\n';
            }
        }

        // Add final chunk
        if (currentChunk.trim()) {
            chunks.push({
                chunkIndex: chunkIndex,
                text: currentChunk.trim(),
                startOffset,
                endOffset: startOffset + currentChunk.length,
                embeddings: []
            });
        }

        return chunks;
    }

    /**
     * Read file content based on type
     */
    async readFile(filePath) {
        try {
            // TODO: Implement PDF parsing, DOCX parsing, etc.
            // For now, assume text files
            const content = fs.readFileSync(filePath, 'utf8');
            return content;
        } catch (error) {
            throw new Error(`Failed to read file: ${error.message}`);
        }
    }

    /**
     * Get file type from extension
     */
    getFileType(fileName) {
        const ext = path.extname(fileName).toLowerCase().replace('.', '');
        const validTypes = ['pdf', 'docx', 'txt', 'md', 'xlsx'];
        return validTypes.includes(ext) ? ext : 'other';
    }

    /**
     * Generate SHA256 hash for version control
     */
    generateHash(content) {
        const crypto = require('crypto');
        return crypto.createHash('sha256').update(content).digest('hex');
    }

    /**
     * Get document status
     */
    async getDocumentStatus(documentId) {
        const document = await ProjectDocument.findById(documentId);
        if (!document) throw new Error('Document not found');

        return {
            documentId: document._id,
            fileName: document.fileName,
            processingStatus: document.processingStatus,
            embeddingStatus: document.embeddingStatus,
            chunksCount: document.chunks.length,
            version: document.version,
            uploadedAt: document.uploadedAt,
            error: document.processingError
        };
    }

    /**
     * Enqueue document processing
     * TODO: Integrate with Bull queue or similar job queue
     */
    enqueueDocumentProcessing(documentId) {
        // For now, process synchronously
        // In production, use job queue like Bull
        setImmediate(() => {
            this.processDocument(documentId).catch(err => 
                console.error(`Async processing error: ${err.message}`)
            );
        });
    }

    /**
     * Enqueue embedding
     */
    enqueueEmbedding(documentId) {
        setImmediate(() => {
            this.embedDocument(documentId).catch(err => 
                console.error(`Async embedding error: ${err.message}`)
            );
        });
    }

    /**
     * Get all project documents
     */
    async getProjectDocuments(projectId, includeOutdated = false) {
        const query = { projectId };
        
        if (!includeOutdated) {
            query.isLatestVersion = true;
        }

        const documents = await ProjectDocument.find(query)
            .select('-chunks -rawContent')
            .sort({ uploadedAt: -1 });

        return documents;
    }

    /**
     * Compare document versions
     */
    async compareVersions(documentId1, documentId2) {
        const doc1 = await ProjectDocument.findById(documentId1);
        const doc2 = await ProjectDocument.findById(documentId2);

        if (!doc1 || !doc2) throw new Error('Document not found');

        return {
            doc1: { hash: doc1.versionHash, uploadedAt: doc1.uploadedAt },
            doc2: { hash: doc2.versionHash, uploadedAt: doc2.uploadedAt },
            isDifferent: doc1.versionHash !== doc2.versionHash,
            changeSummary: doc2.changesSummary
        };
    }
}

module.exports = new DocumentIngestionService();
