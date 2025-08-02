const Validators = require('./validators');
const ErrorHandler = require('./errorHandler');
const Transaction = require('./Transaction');
const UserProfile = require('./UserProfile');
const ReportGenerator = require('./ReportGenerator');

class TransactionRoutes {
    async handle(req, res, context) {
        const { authMiddleware, parsedUrl } = context;
        authMiddleware.requireAuth(req, res, async () => {
            const pathname = parsedUrl.pathname;
            const method = req.method.toUpperCase();

            if (pathname === '/transaction/dashboard' && method === 'GET') {
                return await this.getDashboardData(req, res, context);
            }
            if (pathname === '/transaction/create' && method === 'POST') {
                return await this.createTransaction(req, res, context);
            }
            if (pathname === '/transaction/list' && method === 'GET') {
                return await this.getTransactions(req, res, context);
            }
            if (pathname.startsWith('/transaction/update/')) {
                return await this.updateTransaction(req, res, context);
            }
            if (pathname.startsWith('/transaction/delete/')) {
                return await this.deleteTransaction(req, res, context);
            }
            this.sendError(res, 404, 'Transaction endpoint not found');
        });
    }

    async getDashboardData(req, res, { databaseManager }) {
        try {
            const userId = req.user.userId;
            const dbTransactions = await databaseManager.all('SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC', [userId]);
            
            const balanceData = dbTransactions.reduce((acc, t) => {
                if (t.type === 'income') acc.totalIncome += t.amount;
                else acc.totalExpenses += t.amount;
                return acc;
            }, { totalIncome: 0, totalExpenses: 0 });
            
            const balance = balanceData.totalIncome - balanceData.totalExpenses;

            const transactions = dbTransactions.map(t => new Transaction(t.id, t.amount, t.date, t.type, t.category, t.description, t.user_id));
            const userProfileData = await databaseManager.get('SELECT * FROM user_profiles WHERE user_id = ?', [userId]);
            const userProfile = userProfileData ? new UserProfile(userId, userProfileData.job_title, userProfileData.monthly_salary) : null;
            
            let reports = null;
            if (userProfile && transactions.length > 0) {
                const reportGenerator = new ReportGenerator(transactions, userProfile);
                reports = { spendingAnalysis: reportGenerator.generateSpendingAnalysis() };
            }

            this.sendSuccess(res, 200, {
                balance: { current: balance, totalIncome: balanceData.totalIncome, totalExpenses: balanceData.totalExpenses },
                reports: reports,
                recentTransactions: transactions.slice(0, 5)
            });
        } catch (error) {
            ErrorHandler.logError(error, req);
            this.sendError(res, 500, 'Failed to get dashboard data');
        }
    }

    async createTransaction(req, res, { databaseManager }) {
        try {
            const userId = req.user.userId;
            const { name, amount, type, category, description, date, method } = req.body;
            
            if (!name || !amount || !type || !category || !date) {
                return this.sendError(res, 400, 'Missing required fields.');
            }

            const transactionId = Validators.generateSecureId();
            await databaseManager.run(
                `INSERT INTO transactions (id, user_id, name, amount, type, category, description, date, method) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [transactionId, userId, name, parseFloat(amount), type, category, description, date, method]
            );
            this.sendSuccess(res, 201, { message: 'Transaction created successfully', transactionId });
        } catch (error) {
            ErrorHandler.logError(error, req);
            this.sendError(res, 500, 'Failed to create transaction');
        }
    }

    async getTransactions(req, res, { databaseManager }) {
        try {
            const userId = req.user.userId;
            const transactions = await databaseManager.all('SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC', [userId]);
            this.sendSuccess(res, 200, { transactions });
        } catch (error) {
            ErrorHandler.logError(error, req);
            this.sendError(res, 500, 'Failed to get transactions');
        }
    }

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

            if (result.changes === 0) return this.sendError(res, 404, 'Transaction not found or not owned by user.');
            this.sendSuccess(res, 200, { message: 'Transaction updated successfully' });
        } catch (error) {
            ErrorHandler.logError(error, req);
            this.sendError(res, 500, 'Failed to update transaction');
        }
    }

    async deleteTransaction(req, res, { databaseManager, parsedUrl }) {
        try {
            const transactionId = parsedUrl.pathname.split('/')[3];
            const userId = req.user.userId;
            
            const result = await databaseManager.run('DELETE FROM transactions WHERE id = ? AND user_id = ?', [transactionId, userId]);
            
            if (result.changes === 0) return this.sendError(res, 404, 'Transaction not found or not owned by user.');
            this.sendSuccess(res, 200, { message: 'Transaction deleted successfully' });
        } catch (error) {
            ErrorHandler.logError(error, req);
            this.sendError(res, 500, 'Failed to delete transaction');
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

module.exports = new TransactionRoutes();