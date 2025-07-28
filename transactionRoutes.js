/**
 * Transaction Routes Handler
 * Handles financial transaction operations with proper validation and security
 */

const Validators = require('../validators');
const ErrorHandler = require('../errorHandler');

class TransactionRoutes {
    async handle(req, res, context) {
        const { sessionManager, authMiddleware, databaseManager, parsedUrl } = context;
        const pathname = parsedUrl.pathname;
        const method = req.method.toUpperCase();

        try {
            // Require authentication for all transaction routes
            authMiddleware.requireAuth(req, res, async () => {
                switch (pathname) {
                    case '/transaction':
                        if (method === 'POST') {
                            return await this.createTransaction(req, res, { databaseManager });
                        } else if (method === 'GET') {
                            return await this.getTransactions(req, res, { databaseManager, parsedUrl });
                        }
                        break;

                    case '/transaction/summary':
                        if (method === 'GET') {
                            return await this.getTransactionSummary(req, res, { databaseManager, parsedUrl });
                        }
                        break;

                    default:
                        // Handle transaction by ID
                        if (pathname.startsWith('/transaction/')) {
                            const transactionId = pathname.split('/')[2];
                            if (method === 'GET') {
                                return await this.getTransaction(req, res, { databaseManager, transactionId });
                            } else if (method === 'PUT') {
                                return await this.updateTransaction(req, res, { databaseManager, transactionId });
                            } else if (method === 'DELETE') {
                                return await this.deleteTransaction(req, res, { databaseManager, transactionId });
                            }
                        }
                        return this.sendError(res, 404, 'Transaction endpoint not found');
                }
            });

        } catch (error) {
            ErrorHandler.logError(error, req);
            return this.sendError(res, 500, 'Internal server error');
        }
    }

    async createTransaction(req, res, { databaseManager }) {
        try {
            const userId = req.user.userId;
            const { amount, type, category, description, transactionDate } = req.body;

            // Validate transaction data
            const transactionValidation = Validators.validateTransaction(amount, type, category, description);
            if (!transactionValidation.valid) {
                return this.sendError(res, 400, transactionValidation.message);
            }

            // Validate transaction date
            const date = transactionDate ? new Date(transactionDate) : new Date();
            if (isNaN(date.getTime())) {
                return this.sendError(res, 400, 'Invalid transaction date');
            }

            // Generate transaction ID
            const transactionId = Validators.generateSecureId();

            // Create transaction
            await databaseManager.run(`
                INSERT INTO transactions (id, user_id, amount, type, category, description, transaction_date)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [
                transactionId,
                userId,
                transactionValidation.sanitized.amount,
                transactionValidation.sanitized.type,
                transactionValidation.sanitized.category,
                transactionValidation.sanitized.description,
                date.toISOString().split('T')[0]
            ]);

            // Log transaction creation
            await databaseManager.logAuditEvent(
                userId,
                'TRANSACTION_CREATED',
                `Created ${type} transaction: ${amount} in ${category}`,
                req
            );

            this.sendSuccess(res, 201, {
                message: 'Transaction created successfully',
                transaction: {
                    id: transactionId,
                    amount: transactionValidation.sanitized.amount,
                    type: transactionValidation.sanitized.type,
                    category: transactionValidation.sanitized.category,
                    description: transactionValidation.sanitized.description,
                    date: date.toISOString().split('T')[0]
                }
            });

        } catch (error) {
            ErrorHandler.logError(error, req);
            return this.sendError(res, 500, 'Failed to create transaction');
        }
    }

    async getTransactions(req, res, { databaseManager, parsedUrl }) {
        try {
            const userId = req.user.userId;
            const { page = 1, limit = 20, type, category, startDate, endDate } = parsedUrl.query;

            // Validate pagination
            const pageNum = parseInt(page);
            const limitNum = Math.min(parseInt(limit), 100); // Max 100 per page
            const offset = (pageNum - 1) * limitNum;

            // Build query
            let query = `
                SELECT id, amount, type, category, description, transaction_date, created_at
                FROM transactions 
                WHERE user_id = ?
            `;
            const params = [userId];

            // Add filters
            if (type && ['income', 'expense'].includes(type)) {
                query += ' AND type = ?';
                params.push(type);
            }

            if (category) {
                query += ' AND category = ?';
                params.push(category);
            }

            if (startDate) {
                query += ' AND transaction_date >= ?';
                params.push(startDate);
            }

            if (endDate) {
                query += ' AND transaction_date <= ?';
                params.push(endDate);
            }

            // Add ordering and pagination
            query += ' ORDER BY transaction_date DESC, created_at DESC LIMIT ? OFFSET ?';
            params.push(limitNum, offset);

            const transactions = await databaseManager.all(query, params);

            // Get total count for pagination
            let countQuery = 'SELECT COUNT(*) as total FROM transactions WHERE user_id = ?';
            const countParams = [userId];

            if (type && ['income', 'expense'].includes(type)) {
                countQuery += ' AND type = ?';
                countParams.push(type);
            }

            if (category) {
                countQuery += ' AND category = ?';
                countParams.push(category);
            }

            if (startDate) {
                countQuery += ' AND transaction_date >= ?';
                countParams.push(startDate);
            }

            if (endDate) {
                countQuery += ' AND transaction_date <= ?';
                countParams.push(endDate);
            }

            const countResult = await databaseManager.get(countQuery, countParams);
            const total = countResult.total;

            this.sendSuccess(res, 200, {
                transactions: transactions.map(t => ({
                    id: t.id,
                    amount: parseFloat(t.amount.toFixed(2)),
                    type: t.type,
                    category: t.category,
                    description: t.description,
                    date: t.transaction_date,
                    createdAt: t.created_at
                })),
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    pages: Math.ceil(total / limitNum)
                }
            });

        } catch (error) {
            ErrorHandler.logError(error, req);
            return this.sendError(res, 500, 'Failed to get transactions');
        }
    }

    async getTransaction(req, res, { databaseManager, transactionId }) {
        try {
            const userId = req.user.userId;

            const transaction = await databaseManager.get(`
                SELECT id, amount, type, category, description, transaction_date, created_at, updated_at
                FROM transactions 
                WHERE id = ? AND user_id = ?
            `, [transactionId, userId]);

            if (!transaction) {
                return this.sendError(res, 404, 'Transaction not found');
            }

            this.sendSuccess(res, 200, {
                transaction: {
                    id: transaction.id,
                    amount: parseFloat(transaction.amount.toFixed(2)),
                    type: transaction.type,
                    category: transaction.category,
                    description: transaction.description,
                    date: transaction.transaction_date,
                    createdAt: transaction.created_at,
                    updatedAt: transaction.updated_at
                }
            });

        } catch (error) {
            ErrorHandler.logError(error, req);
            return this.sendError(res, 500, 'Failed to get transaction');
        }
    }

    async updateTransaction(req, res, { databaseManager, transactionId }) {
        try {
            const userId = req.user.userId;
            const { amount, type, category, description, transactionDate } = req.body;

            // Check if transaction exists and belongs to user
            const existingTransaction = await databaseManager.get(`
                SELECT id FROM transactions WHERE id = ? AND user_id = ?
            `, [transactionId, userId]);

            if (!existingTransaction) {
                return this.sendError(res, 404, 'Transaction not found');
            }

            // Validate transaction data
            const transactionValidation = Validators.validateTransaction(amount, type, category, description);
            if (!transactionValidation.valid) {
                return this.sendError(res, 400, transactionValidation.message);
            }

            // Validate transaction date
            const date = transactionDate ? new Date(transactionDate) : new Date();
            if (isNaN(date.getTime())) {
                return this.sendError(res, 400, 'Invalid transaction date');
            }

            // Update transaction
            await databaseManager.run(`
                UPDATE transactions 
                SET amount = ?, type = ?, category = ?, description = ?, transaction_date = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ? AND user_id = ?
            `, [
                transactionValidation.sanitized.amount,
                transactionValidation.sanitized.type,
                transactionValidation.sanitized.category,
                transactionValidation.sanitized.description,
                date.toISOString().split('T')[0],
                transactionId,
                userId
            ]);

            // Log transaction update
            await databaseManager.logAuditEvent(
                userId,
                'TRANSACTION_UPDATED',
                `Updated transaction ${transactionId}`,
                req
            );

            this.sendSuccess(res, 200, {
                message: 'Transaction updated successfully',
                transaction: {
                    id: transactionId,
                    amount: transactionValidation.sanitized.amount,
                    type: transactionValidation.sanitized.type,
                    category: transactionValidation.sanitized.category,
                    description: transactionValidation.sanitized.description,
                    date: date.toISOString().split('T')[0]
                }
            });

        } catch (error) {
            ErrorHandler.logError(error, req);
            return this.sendError(res, 500, 'Failed to update transaction');
        }
    }

    async deleteTransaction(req, res, { databaseManager, transactionId }) {
        try {
            const userId = req.user.userId;

            // Check if transaction exists and belongs to user
            const existingTransaction = await databaseManager.get(`
                SELECT id, amount, type, category FROM transactions WHERE id = ? AND user_id = ?
            `, [transactionId, userId]);

            if (!existingTransaction) {
                return this.sendError(res, 404, 'Transaction not found');
            }

            // Delete transaction
            await databaseManager.run(`
                DELETE FROM transactions WHERE id = ? AND user_id = ?
            `, [transactionId, userId]);

            // Log transaction deletion
            await databaseManager.logAuditEvent(
                userId,
                'TRANSACTION_DELETED',
                `Deleted ${existingTransaction.type} transaction: ${existingTransaction.amount} in ${existingTransaction.category}`,
                req
            );

            this.sendSuccess(res, 200, {
                message: 'Transaction deleted successfully'
            });

        } catch (error) {
            ErrorHandler.logError(error, req);
            return this.sendError(res, 500, 'Failed to delete transaction');
        }
    }

    async getTransactionSummary(req, res, { databaseManager, parsedUrl }) {
        try {
            const userId = req.user.userId;
            const { startDate, endDate, groupBy = 'category' } = parsedUrl.query;

            // Validate date range if provided
            if (startDate && endDate) {
                const dateValidation = Validators.validateDateRange(startDate, endDate);
                if (!dateValidation.valid) {
                    return this.sendError(res, 400, dateValidation.message);
                }
            }

            // Build query
            let query = `
                SELECT 
                    ${groupBy === 'category' ? 'category' : 'DATE(transaction_date) as date'},
                    type,
                    COUNT(*) as count,
                    SUM(amount) as total
                FROM transactions 
                WHERE user_id = ?
            `;
            const params = [userId];

            if (startDate) {
                query += ' AND transaction_date >= ?';
                params.push(startDate);
            }

            if (endDate) {
                query += ' AND transaction_date <= ?';
                params.push(endDate);
            }

            query += ` GROUP BY ${groupBy === 'category' ? 'category, type' : 'DATE(transaction_date), type'}`;
            query += ' ORDER BY total DESC';

            const summary = await databaseManager.all(query, params);

            // Calculate totals
            const totals = summary.reduce((acc, item) => {
                if (item.type === 'income') {
                    acc.totalIncome += item.total;
                    acc.incomeCount += item.count;
                } else {
                    acc.totalExpenses += item.total;
                    acc.expenseCount += item.count;
                }
                return acc;
            }, { totalIncome: 0, totalExpenses: 0, incomeCount: 0, expenseCount: 0 });

            this.sendSuccess(res, 200, {
                summary: summary.map(item => ({
                    [groupBy === 'category' ? 'category' : 'date']: item[groupBy === 'category' ? 'category' : 'date'],
                    type: item.type,
                    count: item.count,
                    total: parseFloat(item.total.toFixed(2))
                })),
                totals: {
                    totalIncome: parseFloat(totals.totalIncome.toFixed(2)),
                    totalExpenses: parseFloat(totals.totalExpenses.toFixed(2)),
                    incomeCount: totals.incomeCount,
                    expenseCount: totals.expenseCount,
                    netAmount: parseFloat((totals.totalIncome - totals.totalExpenses).toFixed(2))
                }
            });

        } catch (error) {
            ErrorHandler.logError(error, req);
            return this.sendError(res, 500, 'Failed to get transaction summary');
        }
    }

    sendSuccess(res, statusCode, data) {
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            ...data,
            timestamp: new Date().toISOString()
        }));
    }

    sendError(res, statusCode, message) {
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: false,
            error: {
                message: message,
                code: statusCode,
                timestamp: new Date().toISOString()
            }
        }));
    }
}

module.exports = new TransactionRoutes(); 