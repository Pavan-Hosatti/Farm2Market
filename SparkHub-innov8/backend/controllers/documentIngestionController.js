/**
 * Document Ingestion Controller
 * Handles document upload, processing, and status tracking
 */

const documentIngestionService = require('../services/documentIngestionService');
const ProjectDocument = require('../models/ProjectDocument');

class DocumentIngestionController {
    /**
     * Upload document to project
     */
    async uploadDocument(req, res) {
        try {
            const { projectId } = req.params;
            const file = req.file;

            if (!file) {
                return res.status(400).json({ success: false, message: 'No file provided' });
            }

            // Save file
            const fs = require('fs');
            const path = require('path');
            const uploadsDir = path.join(__dirname, '../../uploads');

            if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir, { recursive: true });
            }

            const filePath = path.join(uploadsDir, `${projectId}-${Date.now()}-${file.originalname}`);
            fs.writeFileSync(filePath, file.buffer);

            const fileUrl = `/uploads/${projectId}-${Date.now()}-${file.originalname}`;

            // Create document record
            const result = await documentIngestionService.uploadDocument(
                projectId,
                file,
                {
                    fileUrl,
                    fileName: file.originalname,
                    fileSize: file.size
                }
            );

            return res.status(201).json({
                success: true,
                documentId: result.documentId,
                fileName: file.originalname,
                status: 'queued',
                message: 'Document uploaded and queued for processing'
            });
        } catch (error) {
            console.error('Upload document error:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Get document processing status
     */
    async getDocumentStatus(req, res) {
        try {
            const { documentId } = req.params;

            const status = await documentIngestionService.getDocumentStatus(documentId);

            return res.json({
                success: true,
                ...status
            });
        } catch (error) {
            console.error('Get document status error:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Get project documents
     */
    async getProjectDocuments(req, res) {
        try {
            const { projectId } = req.params;
            const { includeOutdated = false } = req.query;

            const documents = await documentIngestionService.getProjectDocuments(
                projectId,
                includeOutdated === 'true'
            );

            return res.json({
                success: true,
                count: documents.length,
                documents: documents.map(d => ({
                    _id: d._id,
                    fileName: d.fileName,
                    fileType: d.fileType,
                    processingStatus: d.processingStatus,
                    embeddingStatus: d.embeddingStatus,
                    version: d.version,
                    uploadedAt: d.uploadedAt,
                    isLatestVersion: d.isLatestVersion
                }))
            });
        } catch (error) {
            console.error('Get documents error:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Compare document versions
     */
    async compareVersions(req, res) {
        try {
            const { documentId1, documentId2 } = req.query;

            const comparison = await documentIngestionService.compareVersions(documentId1, documentId2);

            return res.json({
                success: true,
                ...comparison
            });
        } catch (error) {
            console.error('Compare versions error:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Get document content and chunks
     */
    async getDocumentContent(req, res) {
        try {
            const { documentId } = req.params;

            const document = await ProjectDocument.findById(documentId)
                .select('fileName fileType chunks version rawContent');

            if (!document) {
                return res.status(404).json({ success: false, message: 'Document not found' });
            }

            return res.json({
                success: true,
                document: {
                    fileName: document.fileName,
                    fileType: document.fileType,
                    version: document.version,
                    chunksCount: document.chunks?.length || 0,
                    rawContent: document.rawContent,
                    chunks: document.chunks?.map(c => ({
                        index: c.chunkIndex,
                        text: c.text,
                        hasEmbeddings: (c.embeddings?.length || 0) > 0
                    }))
                }
            });
        } catch (error) {
            console.error('Get document content error:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Delete document
     */
    async deleteDocument(req, res) {
        try {
            const { documentId } = req.params;

            const document = await ProjectDocument.findByIdAndDelete(documentId);

            if (!document) {
                return res.status(404).json({ success: false, message: 'Document not found' });
            }

            return res.json({
                success: true,
                message: 'Document deleted'
            });
        } catch (error) {
            console.error('Delete document error:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Retry failed document processing
     */
    async retryProcessing(req, res) {
        try {
            const { documentId } = req.params;

            const document = await ProjectDocument.findById(documentId);
            if (!document) {
                return res.status(404).json({ success: false, message: 'Document not found' });
            }

            // Re-queue for processing
            documentIngestionService.enqueueDocumentProcessing(documentId);

            return res.json({
                success: true,
                message: 'Document re-queued for processing',
                documentId
            });
        } catch (error) {
            console.error('Retry processing error:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = new DocumentIngestionController();
