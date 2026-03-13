import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, File, CheckCircle, AlertCircle, Loader, FileText, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * DocumentUpload Component
 * Allows users to upload and manage project documents
 * Features:
 * - Drag-and-drop file upload
 * - Progress tracking (queued → processing → completed/failed)
 * - File preview with document type detection
 * - Remove uploaded files
 * - Multiple file support
 */

export default function DocumentUpload({ projectId, onDocumentsUpdated = () => {} }) {
  const fileInputRef = useRef(null);
  
  // State management
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Mock document upload with async job status
  const mockUploadDocument = async (file) => {
    return new Promise((resolve) => {
      // Create mock document object with status tracking
      const mockDoc = {
        id: `doc_${Date.now()}`,
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date(),
        status: 'queued', // queued → processing → completed/failed
        progress: 0,
        embeddingStatus: 'pending', // pending → embedding → indexed
        chunkCount: 0
      };

      // Simulate job queue: queued → processing → completed
      let currentStatus = 'queued';
      let currentProgress = 0;

      // Step 1: Queued (0.5s)
      setTimeout(() => {
        currentStatus = 'processing';
        currentProgress = 10;
        setUploadedFiles(prev =>
          prev.map(doc => doc.id === mockDoc.id ? { ...doc, status: 'processing', progress: currentProgress } : doc)
        );
      }, 500);

      // Step 2: Processing - Parsing (1s)
      setTimeout(() => {
        currentProgress = 40;
        setUploadedFiles(prev =>
          prev.map(doc => doc.id === mockDoc.id ? { ...doc, progress: currentProgress } : doc)
        );
      }, 1500);

      // Step 3: Processing - Chunking (1.5s)
      setTimeout(() => {
        currentProgress = 70;
        const chunkCount = Math.ceil(file.size / 1024); // Mock: 1 chunk per KB
        setUploadedFiles(prev =>
          prev.map(doc => doc.id === mockDoc.id ? { ...doc, progress: currentProgress, chunkCount } : doc)
        );
      }, 3000);

      // Step 4: Processing - Embedding (2s)
      setTimeout(() => {
        currentProgress = 95;
        setUploadedFiles(prev =>
          prev.map(doc => doc.id === mockDoc.id ? { ...doc, progress: currentProgress, embeddingStatus: 'embedding' } : doc)
        );
      }, 5000);

      // Step 5: Complete (0.5s)
      setTimeout(() => {
        currentStatus = 'completed';
        currentProgress = 100;
        setUploadedFiles(prev =>
          prev.map(doc =>
            doc.id === mockDoc.id
              ? { ...doc, status: 'completed', progress: currentProgress, embeddingStatus: 'indexed' }
              : doc
          )
        );
        onDocumentsUpdated({ ...mockDoc, status: 'completed' });
        resolve({ ...mockDoc, status: 'completed' });
      }, 7000);
    });
  };

  const handleFileSelect = async (files) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);

    for (const file of files) {
      // Validate file
      if (file.size > 50 * 1024 * 1024) { // 50MB limit
        toast.error(`${file.name} is too large (max 50MB)`);
        continue;
      }

      // Add to uploads list with "queued" status
      const newDoc = {
        id: `doc_${Date.now()}_${Math.random()}`,
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date(),
        status: 'queued',
        progress: 0,
        embeddingStatus: 'pending',
        chunkCount: 0
      };

      setUploadedFiles(prev => [...prev, newDoc]);

      // Mock upload process
      try {
        await mockUploadDocument(file);
        toast.success(`${file.name} indexed and ready for RAG queries`);
      } catch (error) {
        toast.error(`Failed to process ${file.name}`);
        setUploadedFiles(prev =>
          prev.map(doc =>
            doc.id === newDoc.id ? { ...doc, status: 'failed' } : doc
          )
        );
      }
    }

    setIsUploading(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleRemoveFile = (docId) => {
    setUploadedFiles(prev => prev.filter(doc => doc.id !== docId));
    toast.success('Document removed');
  };

  const getFileIcon = (type) => {
    if (type.includes('pdf')) return '📄';
    if (type.includes('word') || type.includes('document')) return '📃';
    if (type.includes('spreadsheet') || type.includes('excel')) return '📊';
    if (type.includes('text')) return '📝';
    return '📎';
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-green-400';
      case 'processing':
        return 'text-blue-400';
      case 'queued':
        return 'text-yellow-400';
      case 'failed':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getEmbeddingBadgeColor = (status) => {
    switch (status) {
      case 'indexed':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'embedding':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const completedCount = uploadedFiles.filter(f => f.status === 'completed').length;
  const totalChunks = uploadedFiles.filter(f => f.status === 'completed').reduce((sum, f) => sum + f.chunkCount, 0);

  return (
    <div className="w-full space-y-6">
      {/* Upload Stats */}
      {uploadedFiles.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-lg p-4"
        >
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-gray-400 text-sm">Documents</p>
              <p className="text-white font-bold text-lg">{completedCount}/{uploadedFiles.length}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total Chunks</p>
              <p className="text-white font-bold text-lg">{totalChunks}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Status</p>
              <p className="text-purple-400 font-bold text-sm">
                {isUploading ? 'Processing...' : 'Ready for RAG'}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Upload Dropzone */}
      <motion.div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-purple-500 bg-purple-500/10'
            : 'border-gray-600 hover:border-purple-500/50 bg-gray-800/30 hover:bg-gray-800/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.txt,.md,.xlsx,.csv"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />

        <motion.div
          initial={{ scale: 1 }}
          animate={{ scale: isDragging ? 1.1 : 1 }}
          className="space-y-3"
        >
          <Upload className="w-12 h-12 text-purple-400 mx-auto" />
          <div>
            <p className="text-white font-semibold">Drop your project documents here</p>
            <p className="text-gray-400 text-sm mt-1">
              Support: PDF, Word, Text, Excel • Max 50MB per file
            </p>
          </div>
          <button
            className="mt-4 px-6 py-2 bg-purple-500/20 border border-purple-500/50 text-purple-300 rounded-lg hover:bg-purple-500/30 transition-colors text-sm"
          >
            or click to browse
          </button>
        </motion.div>
      </motion.div>

      {/* Uploaded Files List */}
      <AnimatePresence>
        {uploadedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            <h3 className="text-white font-semibold text-sm">Document Queue</h3>

            {uploadedFiles.map((doc) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-4 space-y-3"
              >
                {/* Document Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-2xl">{getFileIcon(doc.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{doc.name}</p>
                      <p className="text-gray-400 text-xs">
                        {formatFileSize(doc.size)} • {new Date(doc.uploadedAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>

                  {/* Status Badge & Remove Button */}
                  <div className="flex items-center gap-2 ml-2">
                    <div className={`flex items-center gap-1 text-xs font-medium ${getStatusColor(doc.status)}`}>
                      {doc.status === 'queued' && (
                        <>
                          <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                          Queued
                        </>
                      )}
                      {doc.status === 'processing' && (
                        <>
                          <Loader className="w-3 h-3 animate-spin" />
                          Processing
                        </>
                      )}
                      {doc.status === 'completed' && (
                        <>
                          <CheckCircle className="w-3 h-3" />
                          Complete
                        </>
                      )}
                      {doc.status === 'failed' && (
                        <>
                          <AlertCircle className="w-3 h-3" />
                          Failed
                        </>
                      )}
                    </div>

                    {doc.status === 'completed' && (
                      <button
                        onClick={() => handleRemoveFile(doc.id)}
                        className="p-1 hover:bg-red-500/20 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                {doc.status !== 'completed' && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Processing stages:</span>
                      <span>{doc.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                        initial={{ width: '0%' }}
                        animate={{ width: `${doc.progress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-2 space-y-1">
                      <div className={doc.progress >= 40 ? 'text-gray-300' : 'text-gray-600'}>
                        ✓ Upload complete {doc.progress >= 40 ? '(40%)' : ''}
                      </div>
                      <div className={doc.progress >= 70 ? 'text-gray-300' : 'text-gray-600'}>
                        {doc.progress >= 70 ? '✓' : '○'} Chunked ({doc.chunkCount} chunks) {doc.progress >= 70 ? '(70%)' : ''}
                      </div>
                      <div className={doc.progress >= 95 ? 'text-gray-300' : 'text-gray-600'}>
                        {doc.progress >= 95 ? '✓' : '○'} Embedding vectors {doc.progress >= 95 ? '(95%)' : ''}
                      </div>
                    </div>
                  </div>
                )}

                {/* Embedding Status Badge (When Complete) */}
                {doc.status === 'completed' && (
                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium border ${getEmbeddingBadgeColor(
                        doc.embeddingStatus
                      )}`}
                    >
                      <CheckCircle className="w-3 h-3 inline mr-1" />
                      {doc.embeddingStatus === 'indexed' ? 'Ready for RAG' : 'Embedding...'}
                    </span>
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {uploadedFiles.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-8 text-gray-500 text-sm"
        >
          <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No documents uploaded yet</p>
          <p className="text-xs mt-1">Upload documents to enable RAG-based Q&A in Phase 4</p>
        </motion.div>
      )}
    </div>
  );
}
