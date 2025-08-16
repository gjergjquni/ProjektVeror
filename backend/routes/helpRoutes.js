// backend/helpRoutes.js

const Validators = require('./validators');
const ErrorHandler = require('./errorHandler');

class HelpRoutes {
    async handle(req, res, context) {
        const { authMiddleware, parsedUrl } = context;

        // Help routes can be accessed without authentication for public help content
        const pathname = parsedUrl.pathname;
        const method = req.method.toUpperCase();

        // Public help routes (no auth required)
        if (pathname === '/help/faq' && method === 'GET') {
            return await this.getFAQ(req, res, context);
        }
        if (pathname === '/help/categories' && method === 'GET') {
            return await this.getHelpCategories(req, res, context);
        }
        if (pathname === '/help/search' && method === 'GET') {
            return await this.searchHelp(req, res, context);
        }
        if (pathname === '/help/article' && method === 'GET') {
            return await this.getHelpArticle(req, res, context);
        }

        // Protected help routes (require authentication)
        if (pathname === '/help/support-ticket' && method === 'POST') {
            return authMiddleware.requireAuth(req, res, async () => {
                return await this.createSupportTicket(req, res, context);
            });
        }
        if (pathname === '/help/my-tickets' && method === 'GET') {
            return authMiddleware.requireAuth(req, res, async () => {
                return await this.getUserTickets(req, res, context);
            });
        }
        if (pathname === '/help/ticket' && method === 'GET') {
            return authMiddleware.requireAuth(req, res, async () => {
                return await this.getTicketDetails(req, res, context);
            });
        }
        if (pathname === '/help/ticket/reply' && method === 'POST') {
            return authMiddleware.requireAuth(req, res, async () => {
                return await this.addTicketReply(req, res, context);
            });
        }
        if (pathname === '/help/feedback' && method === 'POST') {
            return authMiddleware.requireAuth(req, res, async () => {
                return await this.submitFeedback(req, res, context);
            });
        }
        if (pathname === '/help/contact' && method === 'POST') {
            return await this.contactSupport(req, res, context);
        }
        if (pathname === '/help/chat' && method === 'POST') {
            return authMiddleware.requireAuth(req, res, async () => {
                return await this.initiateLiveChat(req, res, context);
            });
        }
        
        this.sendError(res, 404, 'Help endpoint not found');
    }

    // --- GET FAQ ---
    async getFAQ(req, res, { databaseManager, parsedUrl }) {
        try {
            const { category, limit = 20, offset = 0 } = parsedUrl.query;
            
            let sql = 'SELECT * FROM help_faq WHERE is_active = 1';
            const params = [];
            
            if (category) {
                sql += ' AND category = ?';
                params.push(category);
            }
            
            sql += ' ORDER BY priority DESC, created_at DESC LIMIT ? OFFSET ?';
            params.push(parseInt(limit), parseInt(offset));
            
            const faqs = await databaseManager.all(sql, params);
            
            // Get total count for pagination
            let countSql = 'SELECT COUNT(*) as total FROM help_faq WHERE is_active = 1';
            if (category) {
                countSql += ' AND category = ?';
            }
            const countResult = await databaseManager.get(countSql, category ? [category] : []);
            const total = countResult ? countResult.total : 0;
            
            this.sendSuccess(res, 200, { 
                faqs, 
                pagination: { 
                    total, 
                    limit: parseInt(limit), 
                    offset: parseInt(offset),
                    hasMore: (parseInt(offset) + parseInt(limit)) < total
                }
            });
        } catch (error) {
            ErrorHandler.logError(error, req);
            this.sendError(res, 500, 'Failed to retrieve FAQ');
        }
    }

    // --- GET HELP CATEGORIES ---
    async getHelpCategories(req, res, { databaseManager }) {
        try {
            const categories = await databaseManager.all(
                'SELECT id, name, description, icon, article_count, is_active FROM help_categories WHERE is_active = 1 ORDER BY display_order ASC'
            );
            
            this.sendSuccess(res, 200, { categories });
        } catch (error) {
            ErrorHandler.logError(error, req);
            this.sendError(res, 500, 'Failed to retrieve help categories');
        }
    }

    // --- SEARCH HELP ---
    async searchHelp(req, res, { databaseManager, parsedUrl }) {
        try {
            const { q, category, type, limit = 10, offset = 0 } = parsedUrl.query;
            
            if (!q || q.trim().length < 2) {
                return this.sendError(res, 400, 'Search query must be at least 2 characters long');
            }
            
            let sql = `
                SELECT 
                    'faq' as type,
                    id,
                    question as title,
                    answer as content,
                    category,
                    priority,
                    created_at,
                    MATCH(question, answer) AGAINST(? IN BOOLEAN MODE) as relevance
                FROM help_faq 
                WHERE is_active = 1 AND MATCH(question, answer) AGAINST(? IN BOOLEAN MODE)
                
                UNION ALL
                
                SELECT 
                    'article' as type,
                    id,
                    title,
                    content,
                    category,
                    priority,
                    created_at,
                    MATCH(title, content) AGAINST(? IN BOOLEAN MODE) as relevance
                FROM help_articles 
                WHERE is_active = 1 AND MATCH(title, content) AGAINST(? IN BOOLEAN MODE)
            `;
            
            const searchTerm = q.trim();
            const params = [searchTerm, searchTerm, searchTerm, searchTerm];
            
            if (category) {
                sql = sql.replace(/WHERE is_active = 1/g, 'WHERE is_active = 1 AND category = ?');
                params.push(category, category);
            }
            
            if (type && ['faq', 'article'].includes(type)) {
                if (type === 'faq') {
                    sql = sql.replace(/UNION ALL[\s\S]*FROM help_articles[\s\S]*WHERE is_active = 1[\s\S]*MATCH\(title, content\) AGAINST\(\? IN BOOLEAN MODE\)/g, '');
                    params.splice(2, 2);
                } else {
                    sql = sql.replace(/SELECT[\s\S]*FROM help_faq[\s\S]*WHERE is_active = 1[\s\S]*MATCH\(question, answer\) AGAINST\(\? IN BOOLEAN MODE\)[\s\S]*UNION ALL/g, '');
                    params.splice(0, 2);
                }
            }
            
            sql += ' ORDER BY relevance DESC, priority DESC, created_at DESC LIMIT ? OFFSET ?';
            params.push(parseInt(limit), parseInt(offset));
            
            const results = await databaseManager.all(sql, params);
            
            this.sendSuccess(res, 200, { 
                results,
                query: q,
                pagination: { 
                    limit: parseInt(limit), 
                    offset: parseInt(offset)
                }
            });
        } catch (error) {
            ErrorHandler.logError(error, req);
            this.sendError(res, 500, 'Failed to search help content');
        }
    }

    // --- GET HELP ARTICLE ---
    async getHelpArticle(req, res, { databaseManager, parsedUrl }) {
        try {
            const { id, slug } = parsedUrl.query;
            
            if (!id && !slug) {
                return this.sendError(res, 400, 'Article ID or slug is required');
            }
            
            let sql, params;
            if (id) {
                sql = 'SELECT * FROM help_articles WHERE id = ? AND is_active = 1';
                params = [id];
            } else {
                sql = 'SELECT * FROM help_articles WHERE slug = ? AND is_active = 1';
                params = [slug];
            }
            
            const article = await databaseManager.get(sql, params);
            
            if (!article) {
                return this.sendError(res, 404, 'Help article not found');
            }
            
            // Increment view count
            await databaseManager.run(
                'UPDATE help_articles SET view_count = view_count + 1 WHERE id = ?',
                [article.id]
            );
            
            // Get related articles
            const relatedArticles = await databaseManager.all(
                'SELECT id, title, slug, category, created_at FROM help_articles WHERE category = ? AND id != ? AND is_active = 1 ORDER BY created_at DESC LIMIT 5',
                [article.category, article.id]
            );
            
            this.sendSuccess(res, 200, { 
                article,
                relatedArticles
            });
        } catch (error) {
            ErrorHandler.logError(error, req);
            this.sendError(res, 500, 'Failed to retrieve help article');
        }
    }

    // --- CREATE SUPPORT TICKET ---
    async createSupportTicket(req, res, { databaseManager }) {
        try {
            const userId = req.user.userId;
            const { subject, description, category, priority, attachments } = req.body;
            
            // Validation
            if (!subject || !description || !category) {
                return this.sendError(res, 400, 'Subject, description, and category are required');
            }
            
            if (subject.length > 200) {
                return this.sendError(res, 400, 'Subject must be less than 200 characters');
            }
            
            if (description.length > 5000) {
                return this.sendError(res, 400, 'Description must be less than 5000 characters');
            }
            
            const validPriorities = ['low', 'medium', 'high', 'urgent'];
            if (priority && !validPriorities.includes(priority)) {
                return this.sendError(res, 400, 'Invalid priority level');
            }
            
            const ticketId = Validators.generateSecureId();
            const ticketNumber = `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
            
            await databaseManager.run(
                `INSERT INTO support_tickets (
                    id, ticket_number, user_id, subject, description, category, priority, status, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, 'open', CURRENT_TIMESTAMP)`,
                [ticketId, ticketNumber, userId, subject, description, category, priority || 'medium']
            );
            
            // Log ticket creation
            await databaseManager.run(
                'INSERT INTO ticket_logs (ticket_id, user_id, action, details, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)',
                [ticketId, userId, 'created', 'Ticket created']
            );
            
            this.sendSuccess(res, 201, { 
                message: 'Support ticket created successfully',
                ticketId,
                ticketNumber
            });
        } catch (error) {
            ErrorHandler.logError(error, req);
            this.sendError(res, 500, 'Failed to create support ticket');
        }
    }

    // --- GET USER TICKETS ---
    async getUserTickets(req, res, { databaseManager, parsedUrl }) {
        try {
            const userId = req.user.userId;
            const { status, limit = 20, offset = 0 } = parsedUrl.query;
            
            let sql = 'SELECT * FROM support_tickets WHERE user_id = ?';
            const params = [userId];
            
            if (status) {
                sql += ' AND status = ?';
                params.push(status);
            }
            
            sql += ' ORDER BY updated_at DESC LIMIT ? OFFSET ?';
            params.push(parseInt(limit), parseInt(offset));
            
            const tickets = await databaseManager.all(sql, params);
            
            // Get total count for pagination
            let countSql = 'SELECT COUNT(*) as total FROM support_tickets WHERE user_id = ?';
            if (status) {
                countSql += ' AND status = ?';
            }
            const countResult = await databaseManager.get(countSql, status ? [userId, status] : [userId]);
            const total = countResult ? countResult.total : 0;
            
            this.sendSuccess(res, 200, { 
                tickets,
                pagination: { 
                    total, 
                    limit: parseInt(limit), 
                    offset: parseInt(offset),
                    hasMore: (parseInt(offset) + parseInt(limit)) < total
                }
            });
        } catch (error) {
            ErrorHandler.logError(error, req);
            this.sendError(res, 500, 'Failed to retrieve user tickets');
        }
    }

    // --- GET TICKET DETAILS ---
    async getTicketDetails(req, res, { databaseManager, parsedUrl }) {
        try {
            const userId = req.user.userId;
            const { ticketId } = parsedUrl.query;
            
            if (!ticketId) {
                return this.sendError(res, 400, 'Ticket ID is required');
            }
            
            // Get ticket details
            const ticket = await databaseManager.get(
                'SELECT * FROM support_tickets WHERE id = ? AND user_id = ?',
                [ticketId, userId]
            );
            
            if (!ticket) {
                return this.sendError(res, 404, 'Ticket not found');
            }
            
            // Get ticket replies
            const replies = await databaseManager.all(
                'SELECT * FROM ticket_replies WHERE ticket_id = ? ORDER BY created_at ASC',
                [ticketId]
            );
            
            // Get ticket logs
            const logs = await databaseManager.all(
                'SELECT * FROM ticket_logs WHERE ticket_id = ? ORDER BY created_at ASC',
                [ticketId]
            );
            
            this.sendSuccess(res, 200, { 
                ticket,
                replies,
                logs
            });
        } catch (error) {
            ErrorHandler.logError(error, req);
            this.sendError(res, 500, 'Failed to retrieve ticket details');
        }
    }

    // --- ADD TICKET REPLY ---
    async addTicketReply(req, res, { databaseManager }) {
        try {
            const userId = req.user.userId;
            const { ticketId, message, isInternal = false } = req.body;
            
            if (!ticketId || !message) {
                return this.sendError(res, 400, 'Ticket ID and message are required');
            }
            
            if (message.length > 5000) {
                return this.sendError(res, 400, 'Message must be less than 5000 characters');
            }
            
            // Verify ticket exists and user has access
            const ticket = await databaseManager.get(
                'SELECT id, status FROM support_tickets WHERE id = ? AND user_id = ?',
                [ticketId, userId]
            );
            
            if (!ticket) {
                return this.sendError(res, 404, 'Ticket not found');
            }
            
            if (ticket.status === 'closed') {
                return this.sendError(res, 400, 'Cannot reply to closed ticket');
            }
            
            const replyId = Validators.generateSecureId();
            
            await databaseManager.run(
                `INSERT INTO ticket_replies (
                    id, ticket_id, user_id, message, is_internal, created_at
                ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
                [replyId, ticketId, userId, message, isInternal ? 1 : 0]
            );
            
            // Update ticket status to 'waiting_for_support' if user replied
            if (!isInternal) {
                await databaseManager.run(
                    'UPDATE support_tickets SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                    ['waiting_for_support', ticketId]
                );
            }
            
            // Log the reply
            await databaseManager.run(
                'INSERT INTO ticket_logs (ticket_id, user_id, action, details, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)',
                [ticketId, userId, 'replied', 'User added reply']
            );
            
            this.sendSuccess(res, 201, { 
                message: 'Reply added successfully',
                replyId
            });
        } catch (error) {
            ErrorHandler.logError(error, req);
            this.sendError(res, 500, 'Failed to add ticket reply');
        }
    }

    // --- SUBMIT FEEDBACK ---
    async submitFeedback(req, res, { databaseManager }) {
        try {
            const userId = req.user.userId;
            const { type, rating, comment, page, userAgent } = req.body;
            
            // Validation
            if (!type || !rating) {
                return this.sendError(res, 400, 'Feedback type and rating are required');
            }
            
            if (rating < 1 || rating > 5) {
                return this.sendError(res, 400, 'Rating must be between 1 and 5');
            }
            
            const validTypes = ['general', 'feature', 'bug', 'ui', 'performance'];
            if (!validTypes.includes(type)) {
                return this.sendError(res, 400, 'Invalid feedback type');
            }
            
            if (comment && comment.length > 1000) {
                return this.sendError(res, 400, 'Comment must be less than 1000 characters');
            }
            
            const feedbackId = Validators.generateSecureId();
            
            await databaseManager.run(
                `INSERT INTO user_feedback (
                    id, user_id, type, rating, comment, page, user_agent, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
                [feedbackId, userId, type, rating, comment || null, page || null, userAgent || null]
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

    // --- CONTACT SUPPORT ---
    async contactSupport(req, res, { databaseManager }) {
        try {
            const { name, email, subject, message, category, priority } = req.body;
            
            // Validation
            if (!name || !email || !subject || !message) {
                return this.sendError(res, 400, 'Name, email, subject, and message are required');
            }
            
            if (!Validators.isValidEmail(email)) {
                return this.sendError(res, 400, 'Invalid email format');
            }
            
            if (subject.length > 200) {
                return this.sendError(res, 400, 'Subject must be less than 200 characters');
            }
            
            if (message.length > 5000) {
                return this.sendError(res, 400, 'Message must be less than 5000 characters');
            }
            
            const contactId = Validators.generateSecureId();
            
            await databaseManager.run(
                `INSERT INTO support_contacts (
                    id, name, email, subject, message, category, priority, status, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, 'new', CURRENT_TIMESTAMP)`,
                [contactId, name, email, subject, message, category || 'general', priority || 'medium']
            );
            
            this.sendSuccess(res, 201, { 
                message: 'Contact message sent successfully',
                contactId
            });
        } catch (error) {
            ErrorHandler.logError(error, req);
            this.sendError(res, 500, 'Failed to send contact message');
        }
    }

    // --- INITIATE LIVE CHAT ---
    async initiateLiveChat(req, res, { databaseManager }) {
        try {
            const userId = req.user.userId;
            const { topic, description } = req.body;
            
            if (!topic) {
                return this.sendError(res, 400, 'Chat topic is required');
            }
            
            if (description && description.length > 500) {
                return this.sendError(res, 400, 'Description must be less than 500 characters');
            }
            
            // Check if user already has an active chat
            const activeChat = await databaseManager.get(
                'SELECT id FROM live_chats WHERE user_id = ? AND status IN ("active", "waiting")',
                [userId]
            );
            
            if (activeChat) {
                return this.sendError(res, 409, 'You already have an active chat session');
            }
            
            const chatId = Validators.generateSecureId();
            
            await databaseManager.run(
                `INSERT INTO live_chats (
                    id, user_id, topic, description, status, created_at
                ) VALUES (?, ?, ?, ?, 'waiting', CURRENT_TIMESTAMP)`,
                [chatId, userId, topic, description || null]
            );
            
            this.sendSuccess(res, 201, { 
                message: 'Live chat initiated successfully',
                chatId,
                estimatedWaitTime: '5-10 minutes'
            });
        } catch (error) {
            ErrorHandler.logError(error, req);
            this.sendError(res, 500, 'Failed to initiate live chat');
        }
    }

    // --- HELPER FUNCTIONS ---
    sendSuccess(res, statusCode, data) {
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, ...data }));
    }

    sendError(res, statusCode, message) {
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: { message, code: statusCode } }));
    }
}

module.exports = new HelpRoutes();
