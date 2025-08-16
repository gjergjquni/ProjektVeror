// backend/TransactionRoutes.js

const Validators = require('../utils/validators');
const ErrorHandler = require('../middleware/errorHandler');

class TransactionRoutes {
    async handle(req, res, context) {
        const { authMiddleware, parsedUrl } = context;

        // All transaction routes require a user to be logged in
        authMiddleware.requireAuth(req, res, async () => {
            const pathname = parsedUrl.pathname;
            const method = req.method.toUpperCase();

            // --- THIS ROUTER NOW INCLUDES THE /alerts ENDPOINT ---
            if (pathname === '/transaction/dashboard' && method === 'GET') {
                return await this.getDashboardData(req, res, context);
            }
            if (pathname === '/transaction/list' && method === 'GET') {
                return await this.getTransactions(req, res, context);
            }
            if (pathname === '/transaction/alerts' && method === 'GET') {
                return await this.getAlerts(req, res, context);
            }
            if (pathname === '/transaction/create' && method === 'POST') {
                return await this.createTransaction(req, res, context);
            }
            if (pathname.startsWith('/transaction/update/') && (method === 'PUT' || method === 'PATCH')) {
                return await this.updateTransaction(req, res, context);
            }
            if (pathname.startsWith('/transaction/delete/') && method === 'DELETE') {
                return await this.deleteTransaction(req, res, context);
            }
            
            this.sendError(res, 404, 'Transaction endpoint not found');
        });
    }

    // --- FETCHES DATA FOR THE MAIN DASHBOARD ---
    async getDashboardData(req, res, { databaseManager }) {
        try {
            const userId = req.user.userId;

            const summary = await databaseManager.get(`
                SELECT 
                    COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as totalIncome,
                    COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as totalExpenses
                FROM transactions 
                WHERE user_id = ?
            `, [userId]);
            
            const balance = summary.totalIncome - summary.totalExpenses;

            const recentTransactions = await databaseManager.all(
                'SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC LIMIT 5', 
                [userId]
            );

            this.sendSuccess(res, 200, {
                balance: { 
                    current: parseFloat(balance.toFixed(2)), 
                    totalIncome: parseFloat(summary.totalIncome.toFixed(2)), 
                    totalExpenses: parseFloat(summary.totalExpenses.toFixed(2)) 
                },
                recentTransactions: recentTransactions
            });
        } catch (error) {
            ErrorHandler.logError(error, req);
            this.sendError(res, 500, 'Failed to get dashboard data');
        }
    }

    // --- FETCHES A FILTERED LIST OF TRANSACTIONS FOR THE TRANSACTIONS PAGE ---
    async getTransactions(req, res, { databaseManager, parsedUrl }) {
        try {
            const userId = req.user.userId;
            const filters = parsedUrl.query;
            const conditions = ['user_id = ?'];
            const params = [userId];

            if (filters.search) {
                conditions.push('name LIKE ?');
                params.push(`%${filters.search}%`);
            }
            if (filters.kategoria && filters.kategoria !== 'Kategoria') {
                conditions.push('category = ?');
                params.push(filters.kategoria);
            }
            if (filters.dateFrom) { conditions.push('date >= ?'); params.push(filters.dateFrom); }
            if (filters.dateTo) { conditions.push('date <= ?'); params.push(filters.dateTo); }
            if (filters.min) { conditions.push('amount >= ?'); params.push(parseFloat(filters.min)); }
            if (filters.max) { conditions.push('amount <= ?'); params.push(parseFloat(filters.max)); }

            const whereClause = `WHERE ${conditions.join(' AND ')}`;
            
            const transactions = await databaseManager.all(
                `SELECT * FROM transactions ${whereClause} ORDER BY date DESC`,
                params
            );
            
            const summary = await databaseManager.get(`
                SELECT 
                    COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as totalIncome,
                    COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as totalExpenses
                FROM transactions 
                WHERE user_id = ?
            `, [userId]);
            
            const balance = summary.totalIncome - summary.totalExpenses;

            this.sendSuccess(res, 200, { 
                transactions,
                summary: {
                    totalIncome: parseFloat(summary.totalIncome.toFixed(2)),
                    totalExpenses: parseFloat(summary.totalExpenses.toFixed(2)),
                    balance: parseFloat(balance.toFixed(2))
                }
            });
        } catch (error) {
            ErrorHandler.logError(error, req);
            this.sendError(res, 500, 'Failed to get transactions');
        }
    }

    // --- (THIS IS THE NEW FUNCTION) GENERATES SMART ALERTS ---
    async getAlerts(req, res, { databaseManager }) {
        try {
            const userId = req.user.userId;
            const alerts = [];

            const transactions = await databaseManager.all(
                "SELECT type, amount, category FROM transactions WHERE user_id = ? AND date >= CURDATE() - INTERVAL 30 DAY",
                [userId]
            );

            if (transactions.length === 0) {
                alerts.push({ type: 'info', text: 'Financat tuaja duken në rregull. Vazhdoni kështu!' });
                return this.sendSuccess(res, 200, { alerts });
            }

            const summary = transactions.reduce((acc, t) => {
                if(t.type === 'income') acc.totalIncome += t.amount;
                else acc.totalExpenses += t.amount;
                return acc;
            }, { totalIncome: 0.0, totalExpenses: 0.0 });

            if (summary.totalExpenses > summary.totalIncome) {
                alerts.push({ type: 'danger', text: 'Kujdes! Keni shpenzuar më shumë se të ardhurat tuaja këtë muaj.' });
            }

            const expensesByCategory = transactions
                .filter(t => t.type === 'expense')
                .reduce((acc, t) => {
                    acc[t.category] = (acc[t.category] || 0) + t.amount;
                    return acc;
                }, {});

            for (const category in expensesByCategory) {
                if (summary.totalIncome > 0 && expensesByCategory[category] > (summary.totalIncome * 0.35)) { 
                    alerts.push({ type: 'warning', text: `Shpenzime të larta në kategorinë "${category}" këtë muaj.` });
                }
            }
            
            const largeExpense = transactions.find(t => t.type === 'expense' && t.amount > 500);
            if (largeExpense) {
                 alerts.push({ type: 'info', text: `Vumë re një transaksion të madh prej ${largeExpense.amount}€ në kategorinë "${largeExpense.category}".` });
            }

            if (alerts.length === 0) {
                alerts.push({ type: 'info', text: 'Financat tuaja duken në rregull këtë muaj. Vazhdoni kështu!' });
            }

            this.sendSuccess(res, 200, { alerts });
        } catch (error) {
            ErrorHandler.logError(error, req);
            this.sendError(res, 500, 'Failed to generate alerts.');
        }
    }

    // --- CREATES A NEW TRANSACTION ---
    async createTransaction(req, res, { databaseManager }) {
        try {
            const userId = req.user.userId;
            const { name, amount, type, category, description, date, method } = req.body;
            
            const validation = Validators.validateTransaction(amount, type, category, description);
            if (!validation.valid) {
                return this.sendError(res, 400, validation.message);
            }

            const sanitized = validation.sanitized;
            const transactionId = Validators.generateSecureId();

            await databaseManager.run(
                `INSERT INTO transactions (id, user_id, name, amount, type, category, description, date, method) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [transactionId, userId, name, sanitized.amount, sanitized.type, sanitized.category, sanitized.description, date, method]
            );
            this.sendSuccess(res, 201, { message: 'Transaction created successfully', transactionId });
        } catch (error) {
            ErrorHandler.logError(error, req);
            this.sendError(res, 500,  'Failed to create transaction');
        }
    }

    // --- UPDATES AN EXISTING TRANSACTION ---
    async updateTransaction(req, res, { databaseManager, parsedUrl }) {
        try {
            const transactionId = parsedUrl.pathname.split('/')[3];
            const userId = req.user.userId;
            const { name, amount, type, category, description, date, method } = req.body;
            
            const result = await databaseManager.run(
                `UPDATE transactions SET name=?, amount=?, type=?, category=?, description=?, date=?, method=?, updated_at=CURRENT_TIMESTAMP
                 WHERE id = ? AND user_id = ?`,
                [name, parseFloat(amount), type, category, description, date, method, transactionId, userId]
            );

            if (result.affectedRows === 0) {
                return this.sendError(res, 404, 'Transaction not found or you do not have permission to edit it.');
            }
            this.sendSuccess(res, 200, { message: 'Transaction updated successfully' });
        } catch (error) {
            ErrorHandler.logError(error, req);
            this.sendError(res, 500, 'Failed to update transaction');
        }
    }

    // --- DELETES A TRANSACTION ---
    async deleteTransaction(req, res, { databaseManager, parsedUrl }) {
        try {
            const transactionId = parsedUrl.pathname.split('/')[3];
            const userId = req.user.userId;
            
            const result = await databaseManager.run(
                'DELETE FROM transactions WHERE id = ? AND user_id = ?',
                [transactionId, userId]
            );
            
            if (result.affectedRows === 0) {
                return this.sendError(res, 404, 'Transaction not found or you do not have permission to delete it.');
            }
            this.sendSuccess(res, 200, { message: 'Transaction deleted successfully' });
        } catch (error) {
            ErrorHandler.logError(error, req);
            this.sendError(res, 500, 'Failed to delete transaction');
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

module.exports = new TransactionRoutes();