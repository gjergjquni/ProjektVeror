// backend/aiChatRoutes.js

const Validators = require('../utils/validators');
const ErrorHandler = require('../middleware/errorHandler');

class AIChatRoutes {
    constructor() {
        this.conversationHistory = new Map(); // In-memory storage for conversation history
        this.userSessions = new Map(); // Track user chat sessions
    }

    async handle(req, res, context) {
        const { authMiddleware, parsedUrl } = context;

        // All AI chat routes require authentication
        authMiddleware.requireAuth(req, res, async () => {
            const pathname = parsedUrl.pathname;
            const method = req.method.toUpperCase();

            // AI Chat routing logic
            if (pathname === '/ai-chat/start' && method === 'POST') {
                return await this.startChat(req, res, context);
            }
            if (pathname === '/ai-chat/message' && method === 'POST') {
                return await this.sendMessage(req, res, context);
            }
            if (pathname === '/ai-chat/conversation' && method === 'GET') {
                return await this.getConversation(req, res, context);
            }
            if (pathname === '/ai-chat/conversations' && method === 'GET') {
                return await this.getConversations(req, res, context);
            }
            if (pathname === '/ai-chat/clear' && method === 'POST') {
                return await this.clearConversation(req, res, context);
            }
            if (pathname === '/ai-chat/export' && method === 'POST') {
                return await this.exportConversation(req, res, context);
            }
            if (pathname === '/ai-chat/settings' && method === 'GET') {
                return await this.getChatSettings(req, res, context);
            }
            if (pathname === '/ai-chat/settings' && method === 'PUT') {
                return await this.updateChatSettings(req, res, context);
            }
            if (pathname === '/ai-chat/feedback' && method === 'POST') {
                return await this.submitChatFeedback(req, res, context);
            }
            if (pathname === '/ai-chat/context' && method === 'POST') {
                return await this.setContext(req, res, context);
            }
            if (pathname === '/ai-chat/suggestions' && method === 'GET') {
                return await this.getSuggestions(req, res, context);
            }
            if (pathname === '/ai-chat/stream' && method === 'POST') {
                return await this.streamMessage(req, res, context);
            }
            
            this.sendError(res, 404, 'AI Chat endpoint not found');
        });
    }

    // --- START CHAT ---
    async startChat(req, res, { databaseManager }) {
        try {
            const userId = req.user.userId;
            const { topic, context, model = 'gpt-3.5-turbo' } = req.body;
            
            // Validation
            if (topic && topic.length > 200) {
                return this.sendError(res, 400, 'Topic must be less than 200 characters');
            }
            
            if (context && context.length > 1000) {
                return this.sendError(res, 400, 'Context must be less than 1000 characters');
            }
            
            const validModels = ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo', 'claude-3-sonnet'];
            if (!validModels.includes(model)) {
                return this.sendError(res, 400, 'Invalid AI model specified');
            }
            
            const conversationId = Validators.generateSecureId();
            const sessionId = Validators.generateSecureId();
            
            // Create conversation record in database
            await databaseManager.run(
                `INSERT INTO ai_conversations (
                    id, user_id, topic, context, model, status, created_at
                ) VALUES (?, ?, ?, ?, ?, 'active', CURRENT_TIMESTAMP)`,
                [conversationId, userId, topic || null, context || null, model]
            );
            
            // Initialize conversation in memory
            this.conversationHistory.set(conversationId, {
                messages: [],
                context: context || '',
                model: model,
                startTime: new Date(),
                lastActivity: new Date()
            });
            
            // Track user session
            this.userSessions.set(userId, {
                conversationId,
                sessionId,
                lastActivity: new Date()
            });
            
            // Log conversation start
            await databaseManager.run(
                'INSERT INTO ai_chat_logs (conversation_id, user_id, action, details, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)',
                [conversationId, userId, 'started', `Started chat with ${model} model`]
            );
            
            this.sendSuccess(res, 201, { 
                message: 'Chat started successfully',
                conversationId,
                sessionId,
                model,
                topic: topic || 'General conversation'
            });
        } catch (error) {
            ErrorHandler.logError(error, req);
            this.sendError(res, 500, 'Failed to start chat');
        }
    }

    // --- SEND MESSAGE ---
    async sendMessage(req, res, { databaseManager }) {
        try {
            const userId = req.user.userId;
            const { conversationId, message, messageType = 'text' } = req.body;
            
            // Validation
            if (!conversationId || !message) {
                return this.sendError(res, 400, 'Conversation ID and message are required');
            }
            
            if (message.length > 4000) {
                return this.sendError(res, 400, 'Message must be less than 4000 characters');
            }
            
            const validMessageTypes = ['text', 'image', 'file'];
            if (!validMessageTypes.includes(messageType)) {
                return this.sendError(res, 400, 'Invalid message type');
            }
            
            // Verify conversation exists and user has access
            const conversation = await databaseManager.get(
                'SELECT * FROM ai_conversations WHERE id = ? AND user_id = ? AND status = "active"',
                [conversationId, userId]
            );
            
            if (!conversation) {
                return this.sendError(res, 404, 'Conversation not found or inactive');
            }
            
            // Get conversation history from memory
            const history = this.conversationHistory.get(conversationId);
            if (!history) {
                return this.sendError(res, 404, 'Conversation history not found');
            }
            
            const messageId = Validators.generateSecureId();
            const timestamp = new Date();
            
            // Add user message to history
            const userMessage = {
                id: messageId,
                role: 'user',
                content: message,
                type: messageType,
                timestamp: timestamp,
                tokens: this.estimateTokens(message)
            };
            
            history.messages.push(userMessage);
            history.lastActivity = timestamp;
            
            // Save user message to database
            await databaseManager.run(
                `INSERT INTO ai_messages (
                    id, conversation_id, user_id, role, content, message_type, tokens, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [messageId, conversationId, userId, 'user', message, messageType, userMessage.tokens, timestamp]
            );
            
            // Generate AI response
            const aiResponse = await this.generateAIResponse(history, conversation.model);
            
            // Add AI response to history
            const aiMessageId = Validators.generateSecureId();
            const aiMessage = {
                id: aiMessageId,
                role: 'assistant',
                content: aiResponse.content,
                type: 'text',
                timestamp: new Date(),
                tokens: aiResponse.tokens
            };
            
            history.messages.push(aiMessage);
            
            // Save AI response to database
            await databaseManager.run(
                `INSERT INTO ai_messages (
                    id, conversation_id, user_id, role, content, message_type, tokens, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [aiMessageId, conversationId, null, 'assistant', aiResponse.content, 'text', aiResponse.tokens, aiMessage.timestamp]
            );
            
            // Update conversation last activity
            await databaseManager.run(
                'UPDATE ai_conversations SET last_activity = CURRENT_TIMESTAMP WHERE id = ?',
                [conversationId]
            );
            
            // Log message exchange
            await databaseManager.run(
                'INSERT INTO ai_chat_logs (conversation_id, user_id, action, details, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)',
                [conversationId, userId, 'message_sent', `Message exchanged (${userMessage.tokens + aiMessage.tokens} tokens)`]
            );
            
            this.sendSuccess(res, 200, { 
                message: 'Message sent successfully',
                userMessage: {
                    id: messageId,
                    content: message,
                    timestamp: timestamp
                },
                aiResponse: {
                    id: aiMessageId,
                    content: aiResponse.content,
                    timestamp: aiMessage.timestamp
                },
                conversationStats: {
                    totalMessages: history.messages.length,
                    totalTokens: history.messages.reduce((sum, msg) => sum + msg.tokens, 0)
                }
            });
        } catch (error) {
            ErrorHandler.logError(error, req);
            this.sendError(res, 500, 'Failed to send message');
        }
    }

    // --- GET CONVERSATION ---
    async getConversation(req, res, { databaseManager, parsedUrl }) {
        try {
            const userId = req.user.userId;
            const { conversationId, limit = 50, offset = 0 } = parsedUrl.query;
            
            if (!conversationId) {
                return this.sendError(res, 400, 'Conversation ID is required');
            }
            
            // Verify conversation exists and user has access
            const conversation = await databaseManager.get(
                'SELECT * FROM ai_conversations WHERE id = ? AND user_id = ?',
                [conversationId, userId]
            );
            
            if (!conversation) {
                return this.sendError(res, 404, 'Conversation not found');
            }
            
            // Get messages from database with pagination
            const messages = await databaseManager.all(
                'SELECT * FROM ai_messages WHERE conversation_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
                [conversationId, parseInt(limit), parseInt(offset)]
            );
            
            // Get total message count
            const countResult = await databaseManager.get(
                'SELECT COUNT(*) as total FROM ai_messages WHERE conversation_id = ?',
                [conversationId]
            );
            const total = countResult ? countResult.total : 0;
            
            // Get conversation stats
            const stats = await this.getConversationStats(databaseManager, conversationId);
            
            this.sendSuccess(res, 200, { 
                conversation,
                messages: messages.reverse(), // Show in chronological order
                stats,
                pagination: { 
                    total, 
                    limit: parseInt(limit), 
                    offset: parseInt(offset),
                    hasMore: (parseInt(offset) + parseInt(limit)) < total
                }
            });
        } catch (error) {
            ErrorHandler.logError(error, req);
            this.sendError(res, 500, 'Failed to retrieve conversation');
        }
    }

    // --- GET CONVERSATIONS ---
    async getConversations(req, res, { databaseManager, parsedUrl }) {
        try {
            const userId = req.user.userId;
            const { status, limit = 20, offset = 0 } = parsedUrl.query;
            
            let sql = 'SELECT * FROM ai_conversations WHERE user_id = ?';
            const params = [userId];
            
            if (status) {
                sql += ' AND status = ?';
                params.push(status);
            }
            
            sql += ' ORDER BY last_activity DESC LIMIT ? OFFSET ?';
            params.push(parseInt(limit), parseInt(offset));
            
            const conversations = await databaseManager.all(sql, params);
            
            // Get total count for pagination
            let countSql = 'SELECT COUNT(*) as total FROM ai_conversations WHERE user_id = ?';
            if (status) {
                countSql += ' AND status = ?';
            }
            const countResult = await databaseManager.get(countSql, status ? [userId, status] : [userId]);
            const total = countResult ? countResult.total : 0;
            
            // Get basic stats for each conversation
            for (let conv of conversations) {
                const messageCount = await databaseManager.get(
                    'SELECT COUNT(*) as count FROM ai_messages WHERE conversation_id = ?',
                    [conv.id]
                );
                conv.messageCount = messageCount ? messageCount.count : 0;
                
                const tokenCount = await databaseManager.get(
                    'SELECT SUM(tokens) as total FROM ai_messages WHERE conversation_id = ?',
                    [conv.id]
                );
                conv.totalTokens = tokenCount ? tokenCount.total : 0;
            }
            
            this.sendSuccess(res, 200, { 
                conversations,
                pagination: { 
                    total, 
                    limit: parseInt(limit), 
                    offset: parseInt(offset),
                    hasMore: (parseInt(offset) + parseInt(limit)) < total
                }
            });
        } catch (error) {
            ErrorHandler.logError(error, req);
            this.sendError(res, 500, 'Failed to retrieve conversations');
        }
    }

    // --- CLEAR CONVERSATION ---
    async clearConversation(req, res, { databaseManager }) {
        try {
            const userId = req.user.userId;
            const { conversationId } = req.body;
            
            if (!conversationId) {
                return this.sendError(res, 400, 'Conversation ID is required');
            }
            
            // Verify conversation exists and user has access
            const conversation = await databaseManager.get(
                'SELECT * FROM ai_conversations WHERE id = ? AND user_id = ?',
                [conversationId, userId]
            );
            
            if (!conversation) {
                return this.sendError(res, 404, 'Conversation not found');
            }
            
            // Clear messages from database
            await databaseManager.run(
                'DELETE FROM ai_messages WHERE conversation_id = ?',
                [conversationId]
            );
            
            // Clear conversation history from memory
            this.conversationHistory.delete(conversationId);
            
            // Update conversation status
            await databaseManager.run(
                'UPDATE ai_conversations SET status = "cleared", last_activity = CURRENT_TIMESTAMP WHERE id = ?',
                [conversationId]
            );
            
            // Log conversation clear
            await databaseManager.run(
                'INSERT INTO ai_chat_logs (conversation_id, user_id, action, details, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)',
                [conversationId, userId, 'cleared', 'Conversation cleared by user']
            );
            
            this.sendSuccess(res, 200, { 
                message: 'Conversation cleared successfully'
            });
        } catch (error) {
            ErrorHandler.logError(error, req);
            this.sendError(res, 500, 'Failed to clear conversation');
        }
    }

    // --- EXPORT CONVERSATION ---
    async exportConversation(req, res, { databaseManager }) {
        try {
            const userId = req.user.userId;
            const { conversationId, format = 'json' } = req.body;
            
            if (!conversationId) {
                return this.sendError(res, 400, 'Conversation ID is required');
            }
            
            const validFormats = ['json', 'txt', 'csv'];
            if (!validFormats.includes(format)) {
                return this.sendError(res, 400, 'Invalid export format');
            }
            
            // Verify conversation exists and user has access
            const conversation = await databaseManager.get(
                'SELECT * FROM ai_conversations WHERE id = ? AND user_id = ?',
                [conversationId, userId]
            );
            
            if (!conversation) {
                return this.sendError(res, 404, 'Conversation not found');
            }
            
            // Get all messages
            const messages = await databaseManager.all(
                'SELECT * FROM ai_messages WHERE conversation_id = ? ORDER BY created_at ASC',
                [conversationId]
            );
            
            // Format export data
            const exportData = this.formatExportData(conversation, messages, format);
            
            // Log export
            await databaseManager.run(
                'INSERT INTO ai_chat_logs (conversation_id, user_id, action, details, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)',
                [conversationId, userId, 'exported', `Conversation exported as ${format}`]
            );
            
            this.sendSuccess(res, 200, { 
                message: 'Conversation exported successfully',
                format,
                data: exportData,
                filename: `conversation-${conversationId}-${new Date().toISOString().split('T')[0]}.${format}`
            });
        } catch (error) {
            ErrorHandler.logError(error, req);
            this.sendError(res, 500, 'Failed to export conversation');
        }
    }

    // --- GET CHAT SETTINGS ---
    async getChatSettings(req, res, { databaseManager }) {
        try {
            const userId = req.user.userId;
            
            const settings = await databaseManager.get(
                'SELECT * FROM ai_chat_settings WHERE user_id = ?',
                [userId]
            );
            
            if (!settings) {
                // Create default settings
                const defaultSettings = {
                    default_model: 'gpt-3.5-turbo',
                    max_tokens: 4000,
                    temperature: 0.7,
                    max_conversations: 10,
                    auto_save: 1,
                    context_window: 10,
                    language: 'en',
                    theme: 'light'
                };
                
                await databaseManager.run(
                    'INSERT INTO ai_chat_settings (user_id, default_model, max_tokens, temperature, max_conversations, auto_save, context_window, language, theme) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [userId, ...Object.values(defaultSettings)]
                );
                
                return this.sendSuccess(res, 200, { settings: defaultSettings });
            }
            
            this.sendSuccess(res, 200, { settings });
        } catch (error) {
            ErrorHandler.logError(error, req);
            this.sendError(res, 500, 'Failed to retrieve chat settings');
        }
    }

    // --- UPDATE CHAT SETTINGS ---
    async updateChatSettings(req, res, { databaseManager }) {
        try {
            const userId = req.user.userId;
            const { defaultModel, maxTokens, temperature, maxConversations, autoSave, contextWindow, language, theme } = req.body;
            
            // Validation
            const validModels = ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo', 'claude-3-sonnet'];
            if (defaultModel && !validModels.includes(defaultModel)) {
                return this.sendError(res, 400, 'Invalid AI model');
            }
            
            if (maxTokens && (maxTokens < 100 || maxTokens > 8000)) {
                return this.sendError(res, 400, 'Max tokens must be between 100 and 8000');
            }
            
            if (temperature && (temperature < 0 || temperature > 2)) {
                return this.sendError(res, 400, 'Temperature must be between 0 and 2');
            }
            
            if (maxConversations && (maxConversations < 1 || maxConversations > 50)) {
                return this.sendError(res, 400, 'Max conversations must be between 1 and 50');
            }
            
            const updateFields = [];
            const updateValues = [];
            
            if (defaultModel !== undefined) {
                updateFields.push('default_model = ?');
                updateValues.push(defaultModel);
            }
            if (maxTokens !== undefined) {
                updateFields.push('max_tokens = ?');
                updateValues.push(maxTokens);
            }
            if (temperature !== undefined) {
                updateFields.push('temperature = ?');
                updateValues.push(temperature);
            }
            if (maxConversations !== undefined) {
                updateFields.push('max_conversations = ?');
                updateValues.push(maxConversations);
            }
            if (autoSave !== undefined) {
                updateFields.push('auto_save = ?');
                updateValues.push(autoSave ? 1 : 0);
            }
            if (contextWindow !== undefined) {
                updateFields.push('context_window = ?');
                updateValues.push(contextWindow);
            }
            if (language !== undefined) {
                updateFields.push('language = ?');
                updateValues.push(language);
            }
            if (theme !== undefined) {
                updateFields.push('theme = ?');
                updateValues.push(theme);
            }
            
            if (updateFields.length === 0) {
                return this.sendError(res, 400, 'No valid fields to update');
            }
            
            updateValues.push(userId);
            
            // Check if settings exist, if not create them
            const existingSettings = await databaseManager.get(
                'SELECT user_id FROM ai_chat_settings WHERE user_id = ?',
                [userId]
            );
            
            if (existingSettings) {
                const sql = `UPDATE ai_chat_settings SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`;
                await databaseManager.run(sql, updateValues);
            } else {
                // Create new settings record
                const insertFields = ['user_id', ...updateFields.map(field => field.split(' = ')[0])];
                const insertValues = [userId, ...updateValues.slice(0, -1)];
                const sql = `INSERT INTO ai_chat_settings (${insertFields.join(', ')}) VALUES (${insertFields.map(() => '?').join(', ')})`;
                await databaseManager.run(sql, insertValues);
            }
            
            this.sendSuccess(res, 200, { message: 'Chat settings updated successfully' });
        } catch (error) {
            ErrorHandler.logError(error, req);
            this.sendError(res, 500, 'Failed to update chat settings');
        }
    }

    // --- SUBMIT CHAT FEEDBACK ---
    async submitChatFeedback(req, res, { databaseManager }) {
        try {
            const userId = req.user.userId;
            const { conversationId, messageId, rating, feedback, feedbackType } = req.body;
            
            // Validation
            if (!conversationId || !messageId || !rating) {
                return this.sendError(res, 400, 'Conversation ID, message ID, and rating are required');
            }
            
            if (rating < 1 || rating > 5) {
                return this.sendError(res, 400, 'Rating must be between 1 and 5');
            }
            
            if (feedback && feedback.length > 500) {
                return this.sendError(res, 400, 'Feedback must be less than 500 characters');
            }
            
            const validFeedbackTypes = ['helpful', 'unhelpful', 'inaccurate', 'inappropriate', 'other'];
            if (feedbackType && !validFeedbackTypes.includes(feedbackType)) {
                return this.sendError(res, 400, 'Invalid feedback type');
            }
            
            // Verify conversation exists and user has access
            const conversation = await databaseManager.get(
                'SELECT * FROM ai_conversations WHERE id = ? AND user_id = ?',
                [conversationId, userId]
            );
            
            if (!conversation) {
                return this.sendError(res, 404, 'Conversation not found');
            }
            
            const feedbackId = Validators.generateSecureId();
            
            await databaseManager.run(
                `INSERT INTO ai_message_feedback (
                    id, conversation_id, message_id, user_id, rating, feedback, feedback_type, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
                [feedbackId, conversationId, messageId, userId, rating, feedback || null, feedbackType || 'other']
            );
            
            this.sendSuccess(res, 201, { 
                message: 'Feedback submitted successfully',
                feedbackId
            });
        } catch (error) {
            ErrorHandler.logError(error, req);
            this.sendError(res, 500, 'Failed to submit feedback');
        }
    }

    // --- SET CONTEXT ---
    async setContext(req, res, { databaseManager }) {
        try {
            const userId = req.user.userId;
            const { conversationId, context } = req.body;
            
            if (!conversationId || !context) {
                return this.sendError(res, 400, 'Conversation ID and context are required');
            }
            
            if (context.length > 1000) {
                return this.sendError(res, 400, 'Context must be less than 1000 characters');
            }
            
            // Verify conversation exists and user has access
            const conversation = await databaseManager.get(
                'SELECT * FROM ai_conversations WHERE id = ? AND user_id = ?',
                [conversationId, userId]
            );
            
            if (!conversation) {
                return this.sendError(res, 404, 'Conversation not found');
            }
            
            // Update context in database
            await databaseManager.run(
                'UPDATE ai_conversations SET context = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [context, conversationId]
            );
            
            // Update context in memory
            const history = this.conversationHistory.get(conversationId);
            if (history) {
                history.context = context;
            }
            
            this.sendSuccess(res, 200, { 
                message: 'Context updated successfully'
            });
        } catch (error) {
            ErrorHandler.logError(error, req);
            this.sendError(res, 500, 'Failed to update context');
        }
    }

    // --- GET SUGGESTIONS ---
    async getSuggestions(req, res, { databaseManager, parsedUrl }) {
        try {
            const { category, limit = 10 } = parsedUrl.query;
            
            let sql = 'SELECT * FROM ai_chat_suggestions WHERE is_active = 1';
            const params = [];
            
            if (category) {
                sql += ' AND category = ?';
                params.push(category);
            }
            
            sql += ' ORDER BY priority DESC, usage_count DESC LIMIT ?';
            params.push(parseInt(limit));
            
            const suggestions = await databaseManager.all(sql, params);
            
            this.sendSuccess(res, 200, { suggestions });
        } catch (error) {
            ErrorHandler.logError(error, req);
            this.sendError(res, 500, 'Failed to retrieve suggestions');
        }
    }

    // --- STREAM MESSAGE (for real-time chat) ---
    async streamMessage(req, res, { databaseManager }) {
        try {
            const userId = req.user.userId;
            const { conversationId, message } = req.body;
            
            if (!conversationId || !message) {
                return this.sendError(res, 400, 'Conversation ID and message are required');
            }
            
            // Set headers for streaming
            res.writeHead(200, {
                'Content-Type': 'text/plain',
                'Transfer-Encoding': 'chunked',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive'
            });
            
            // Verify conversation exists and user has access
            const conversation = await databaseManager.get(
                'SELECT * FROM ai_conversations WHERE id = ? AND user_id = ? AND status = "active"',
                [conversationId, userId]
            );
            
            if (!conversation) {
                res.write('data: {"error": "Conversation not found"}\n\n');
                res.end();
                return;
            }
            
            // Send initial response
            res.write('data: {"status": "processing"}\n\n');
            
            // Simulate streaming AI response (in production, this would connect to actual AI service)
            const aiResponse = await this.generateAIResponse({ messages: [] }, conversation.model);
            
            // Stream the response word by word
            const words = aiResponse.content.split(' ');
            for (let i = 0; i < words.length; i++) {
                const chunk = {
                    type: 'token',
                    content: words[i] + (i < words.length - 1 ? ' ' : ''),
                    isComplete: i === words.length - 1
                };
                
                res.write(`data: ${JSON.stringify(chunk)}\n\n`);
                
                // Small delay to simulate streaming
                await new Promise(resolve => setTimeout(resolve, 50));
            }
            
            res.write('data: {"status": "complete"}\n\n');
            res.end();
            
        } catch (error) {
            ErrorHandler.logError(error, req);
            res.write(`data: {"error": "Failed to stream message"}\n\n`);
            res.end();
        }
    }

    // --- HELPER FUNCTIONS ---

    // Generate AI response (placeholder - replace with actual AI service integration)
    async generateAIResponse(history, model) {
        // This is a placeholder implementation
        // In production, you would integrate with OpenAI, Anthropic, or other AI services
        
        const responses = [
            "I understand your question. Let me help you with that.",
            "That's an interesting point. Here's what I think about it.",
            "Based on the context, I can provide some insights.",
            "I'd be happy to help you with that. Let me break it down.",
            "That's a great question. Here's my analysis."
        ];
        
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        
        return {
            content: randomResponse,
            tokens: this.estimateTokens(randomResponse)
        };
    }

    // Estimate token count (rough approximation)
    estimateTokens(text) {
        // Rough approximation: 1 token ≈ 4 characters for English text
        return Math.ceil(text.length / 4);
    }

    // Get conversation statistics
    async getConversationStats(databaseManager, conversationId) {
        try {
            const messageCount = await databaseManager.get(
                'SELECT COUNT(*) as count FROM ai_messages WHERE conversation_id = ?',
                [conversationId]
            );
            
            const tokenCount = await databaseManager.get(
                'SELECT SUM(tokens) as total FROM ai_messages WHERE conversation_id = ?',
                [conversationId]
            );
            
            const userMessageCount = await databaseManager.get(
                'SELECT COUNT(*) as count FROM ai_messages WHERE conversation_id = ? AND role = "user"',
                [conversationId]
            );
            
            const aiMessageCount = await databaseManager.get(
                'SELECT COUNT(*) as count FROM ai_messages WHERE conversation_id = ? AND role = "assistant"',
                [conversationId]
            );
            
            return {
                totalMessages: messageCount ? messageCount.count : 0,
                totalTokens: tokenCount ? tokenCount.total : 0,
                userMessages: userMessageCount ? userMessageCount.count : 0,
                aiMessages: aiMessageCount ? aiMessageCount.count : 0
            };
        } catch (error) {
            return {
                totalMessages: 0,
                totalTokens: 0,
                userMessages: 0,
                aiMessages: 0
            };
        }
    }

    // Format export data
    formatExportData(conversation, messages, format) {
        const baseData = {
            conversation: {
                id: conversation.id,
                topic: conversation.topic,
                context: conversation.context,
                model: conversation.model,
                created_at: conversation.created_at
            },
            messages: messages.map(msg => ({
                role: msg.role,
                content: msg.content,
                timestamp: msg.created_at,
                tokens: msg.tokens
            }))
        };
        
        switch (format) {
            case 'json':
                return JSON.stringify(baseData, null, 2);
            case 'txt':
                let txt = `Conversation: ${conversation.topic || 'General'}\n`;
                txt += `Model: ${conversation.model}\n`;
                txt += `Created: ${conversation.created_at}\n\n`;
                txt += messages.map(msg => `${msg.role.toUpperCase()}: ${msg.content}`).join('\n\n');
                return txt;
            case 'csv':
                let csv = 'Role,Content,Timestamp,Tokens\n';
                csv += messages.map(msg => `"${msg.role}","${msg.content.replace(/"/g, '""')}","${msg.timestamp}","${msg.tokens}"`).join('\n');
                return csv;
            default:
                return baseData;
        }
    }

    sendSuccess(res, statusCode, data) {
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, ...data }));
    }

    sendError(res, statusCode, message) {
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: { message, code: statusCode } }));
    }
}

module.exports = new AIChatRoutes();
