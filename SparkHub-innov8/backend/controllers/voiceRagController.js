/**
 * Voice & RAG Chat Controller
 * Handles voice input, transcription, Q&A, and voice navigation
 */

const voiceService = require('../services/voiceService');
const ragService = require('../services/ragService');
const VoiceAssistantSession = require('../models/VoiceAssistantSession');
const ProposalChat = require('../models/ProposalChat');

class VoiceRagController {
    /**
     * Start voice assistant session
     */
    async startVoiceSession(req, res) {
        try {
            const { userId, userType, projectId, language = 'en' } = req.body;

            const session = new VoiceAssistantSession({
                userId,
                userType,
                projectId,
                language,
                status: 'active',
                startTime: new Date()
            });

            await session.save();

            return res.status(201).json({
                success: true,
                sessionId: session._id,
                language: session.language,
                message: `Voice session started. You can now ask questions about the project brief.`
            });
        } catch (error) {
            console.error('Start voice session error:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Process voice query (voice to text to RAG to speech)
     */
    async processVoiceQuery(req, res) {
        try {
            const { sessionId, projectId, audioUrl, language = 'en' } = req.body;

            const session = await VoiceAssistantSession.findById(sessionId);
            if (!session) {
                return res.status(404).json({ success: false, message: 'Session not found' });
            }

            // Step 1: Process voice query (transcribe + translate)
            const queryResult = await voiceService.processVoiceQuery(audioUrl, projectId, language);

            if (!queryResult.success) {
                return res.status(400).json({
                    success: false,
                    message: 'Failed to process audio',
                    fallback: true
                });
            }

            const query = queryResult.query;

            // Step 2: Retrieve documents from RAG
            const queryEmbedding = await ragService.getQueryEmbedding(query);
            const searchResults = await ragService.searchDocuments(projectId, queryEmbedding, 5);

            let responseText = '';
            let citations = [];

            if (searchResults.success && searchResults.results.length > 0) {
                // Step 3: Generate answer
                const answer = await ragService.generateAnswer(
                    projectId,
                    query,
                    searchResults.results
                );

                responseText = answer.answer;
                citations = answer.citations;
            } else {
                responseText = `I couldn't find information about "${query}" in the project documents. Please refer to the brief directly.`;
            }

            // Step 4: Generate speech response
            const audioResponse = await voiceService.generateSpeech(responseText, language);

            // Log interaction
            session.interactions.push({
                sequenceNumber: (session.interactions?.length || 0) + 1,
                userInput: {
                    audioUrl,
                    transcription: query,
                    originalLanguage: language,
                    timestamp: new Date()
                },
                assistantResponse: {
                    text: responseText,
                    audioUrl: audioResponse.audioUrl,
                    confidence: 0.9
                },
                ragContext: searchResults.success ? {
                    citedDocuments: searchResults.results.map(r => r.fileName),
                    snippets: searchResults.results.map(r => r.snippet)
                } : { citedDocuments: [], snippets: [] },
                actionTaken: 'rag_search',
                isSuccessful: true
            });

            session.totalInteractions = (session.totalInteractions || 0) + 1;
            session.successfulInteractions = (session.successfulInteractions || 0) + 1;
            await session.save();

            return res.json({
                success: true,
                query,
                answer: responseText,
                audioUrl: audioResponse.audioUrl,
                citations,
                language,
                confidence: 0.9
            });
        } catch (error) {
            console.error('Process voice query error:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Process text query
     */
    async processTextQuery(req, res) {
        try {
            const { projectId, query, language = 'en' } = req.body;

            // Get query embedding
            const queryEmbedding = await ragService.getQueryEmbedding(query);

            // Search documents
            const searchResults = await ragService.searchDocuments(projectId, queryEmbedding, 5);

            if (!searchResults.success || !searchResults.results.length) {
                return res.json({
                    success: false,
                    message: 'No relevant information found',
                    query
                });
            }

            // Generate answer
            const answer = await ragService.generateAnswer(
                projectId,
                query,
                searchResults.results
            );

            return res.json({
                success: true,
                query,
                answer: answer.answer,
                citations: answer.citations,
                confidence: answer.confidence
            });
        } catch (error) {
            console.error('Process text query error:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Voice navigation
     */
    async voiceNavigation(req, res) {
        try {
            const { sessionId, audioInput, currentPage } = req.body;

            const session = await VoiceAssistantSession.findById(sessionId);
            if (!session) {
                return res.status(404).json({ success: false, message: 'Session not found' });
            }

            // Process voice input
            const queryResult = await voiceService.processVoiceQuery(audioInput, session.projectId, session.language);

            if (!queryResult.success) {
                return res.status(400).json({
                    success: false,
                    message: 'Could not understand voice command'
                });
            }

            // Handle navigation
            const navigation = await voiceService.handleVoiceNavigation(
                queryResult.query,
                currentPage,
                { language: session.language }
            );

            return res.json({
                success: true,
                nextAction: navigation.nextAction,
                responseText: navigation.responseText,
                audioUrl: navigation.audioUrl,
                intent: navigation.intent
            });
        } catch (error) {
            console.error('Voice navigation error:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Save proposal chat message
     */
    async saveProposalChat(req, res) {
        try {
            const { proposalId, projectId, senderId, senderType, message, messageType } = req.body;

            const chat = new ProposalChat({
                proposalId,
                projectId,
                senderId,
                senderType,
                message,
                messageType,
                isRead: false
            });

            await chat.save();

            return res.status(201).json({
                success: true,
                chatId: chat._id,
                message: 'Message saved'
            });
        } catch (error) {
            console.error('Save chat error:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Get proposal chat history
     */
    async getProposalChat(req, res) {
        try {
            const { proposalId } = req.params;
            const { limit = 50 } = req.query;

            const messages = await ProposalChat.find({ proposalId })
                .sort({ createdAt: -1 })
                .limit(parseInt(limit));

            return res.json({
                success: true,
                messages: messages.reverse()
            });
        } catch (error) {
            console.error('Get chat error:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * End voice session
     */
    async endVoiceSession(req, res) {
        try {
            const { sessionId } = req.params;

            const session = await VoiceAssistantSession.findById(sessionId);
            if (!session) {
                return res.status(404).json({ success: false, message: 'Session not found' });
            }

            session.status = 'completed';
            session.endTime = new Date();
            session.duration = (session.endTime - session.startTime) / 1000; // seconds

            await session.save();

            return res.json({
                success: true,
                message: 'Voice session ended',
                session: {
                    duration: session.duration,
                    totalInteractions: session.totalInteractions,
                    successfulInteractions: session.successfulInteractions
                }
            });
        } catch (error) {
            console.error('End voice session error:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Kannada voice support
     */
    async kannada(req, res) {
        try {
            const { sessionId, projectId, audioUrl } = req.body;

            // Process Kannada voice query
            const session = await VoiceAssistantSession.findById(sessionId);
            if (!session) {
                return res.status(404).json({ success: false, message: 'Session not found' });
            }

            const queryResult = await voiceService.processKannadaVoice(audioUrl, projectId);

            if (!queryResult.success) {
                return res.status(400).json({
                    success: false,
                    message: 'Failed to process Kannada audio',
                    fallback: true
                });
            }

            // REST of flow same as processVoiceQuery but with Ka language
            return res.json({
                success: true,
                language: 'ka',
                query: queryResult.query,
                message: 'Kannada query processed'
            });
        } catch (error) {
            console.error('Kannada processing error:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = new VoiceRagController();
