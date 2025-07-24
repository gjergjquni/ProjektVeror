/**
 * User Routes Handler
 * Handles user profile management and user-related operations
 */

const Validators = require('../validators');
const ErrorHandler = require('../errorHandler');

class UserRoutes {
    async handle(req, res, context) {
        const { sessionManager, authMiddleware, databaseManager, parsedUrl } = context;
        const pathname = parsedUrl.pathname;
        const method = req.method.toUpperCase();

        try {
            // Require authentication for all user routes
            authMiddleware.requireAuth(req, res, async () => {
                switch (pathname) {
                    case '/user/profile':
                        if (method === 'GET') {
                            return await this.getProfile(req, res, { databaseManager });
                        } else if (method === 'PUT') {
                            return await this.updateProfile(req, res, { databaseManager });
                        }
                        break;

                    case '/user/balance':
                        if (method === 'GET') {
                            return await this.getBalance(req, res, { databaseManager });
                        }
                        break;

                    case '/user/stats':
                        if (method === 'GET') {
                            return await this.getUserStats(req, res, { databaseManager });
                        }
                        break;

                    default:
                        return this.sendError(res, 404, 'User endpoint not found');
                }
            });

        } catch (error) {
            ErrorHandler.logError(error, req);
            return this.sendError(res, 500, 'Internal server error');
        }
    }

    async getProfile(req, res, { databaseManager }) {
        try {
            const userId = req.user.userId;

            const user = await databaseManager.get(`
                SELECT u.id, u.email, u.full_name, u.date_of_birth, u.employment_status, 
                       u.created_at, u.last_login, up.job_title, up.monthly_salary, up.savings_goal_percentage
                FROM users u
                LEFT JOIN user_profiles up ON u.id = up.user_id
                WHERE u.id = ? AND u.is_active = 1
            `, [userId]);

            if (!user) {
                return this.sendError(res, 404, 'User not found');
            }

            this.sendSuccess(res, 200, {
                user: {
                    id: user.id,
                    email: user.email,
                    fullName: user.full_name,
                    dateOfBirth: user.date_of_birth,
                    employmentStatus: user.employment_status,
                    createdAt: user.created_at,
                    lastLogin: user.last_login,
                    profile: {
                        jobTitle: user.job_title,
                        monthlySalary: user.monthly_salary,
                        savingsGoalPercentage: user.savings_goal_percentage
                    }
                }
            });

        } catch (error) {
            ErrorHandler.logError(error, req);
            return this.sendError(res, 500, 'Failed to get profile');
        }
    }

    async updateProfile(req, res, { databaseManager }) {
        try {
            const userId = req.user.userId;
            const { jobTitle, monthlySalary, savingsGoalPercentage } = req.body;

            // Validate profile data
            const profileValidation = Validators.validateUserProfile(jobTitle, monthlySalary, savingsGoalPercentage);
            if (!profileValidation.valid) {
                return this.sendError(res, 400, profileValidation.message);
            }

            // Update or create profile
            await databaseManager.run(`
                INSERT OR REPLACE INTO user_profiles (user_id, job_title, monthly_salary, savings_goal_percentage, updated_at)
                VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
            `, [
                userId,
                profileValidation.sanitized.jobTitle,
                profileValidation.sanitized.monthlySalary,
                profileValidation.sanitized.savingsGoalPercentage
            ]);

            // Log profile update
            await databaseManager.logAuditEvent(
                userId,
                'PROFILE_UPDATED',
                'User profile updated',
                req
            );

            this.sendSuccess(res, 200, {
                message: 'Profile updated successfully',
                profile: profileValidation.sanitized
            });

        } catch (error) {
            ErrorHandler.logError(error, req);
            return this.sendError(res, 500, 'Failed to update profile');
        }
    }

    async getBalance(req, res, { databaseManager }) {
        try {
            const userId = req.user.userId;

            // Get total income and expenses
            const result = await databaseManager.get(`
                SELECT 
                    COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
                    COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expenses
                FROM transactions 
                WHERE user_id = ?
            `, [userId]);

            const balance = result.total_income - result.total_expenses;

            this.sendSuccess(res, 200, {
                balance: parseFloat(balance.toFixed(2)),
                totalIncome: parseFloat(result.total_income.toFixed(2)),
                totalExpenses: parseFloat(result.total_expenses.toFixed(2))
            });

        } catch (error) {
            ErrorHandler.logError(error, req);
            return this.sendError(res, 500, 'Failed to get balance');
        }
    }

    async getUserStats(req, res, { databaseManager }) {
        try {
            const userId = req.user.userId;

            // Get various statistics
            const stats = await databaseManager.get(`
                SELECT 
                    COUNT(*) as total_transactions,
                    COUNT(CASE WHEN type = 'income' THEN 1 END) as income_count,
                    COUNT(CASE WHEN type = 'expense' THEN 1 END) as expense_count,
                    COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
                    COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expenses,
                    COALESCE(AVG(CASE WHEN type = 'income' THEN amount END), 0) as avg_income,
                    COALESCE(AVG(CASE WHEN type = 'expense' THEN amount END), 0) as avg_expense
                FROM transactions 
                WHERE user_id = ?
            `, [userId]);

            // Get recent transactions
            const recentTransactions = await databaseManager.all(`
                SELECT id, amount, type, category, description, transaction_date
                FROM transactions 
                WHERE user_id = ?
                ORDER BY transaction_date DESC
                LIMIT 5
            `, [userId]);

            this.sendSuccess(res, 200, {
                stats: {
                    totalTransactions: stats.total_transactions,
                    incomeCount: stats.income_count,
                    expenseCount: stats.expense_count,
                    totalIncome: parseFloat(stats.total_income.toFixed(2)),
                    totalExpenses: parseFloat(stats.total_expenses.toFixed(2)),
                    averageIncome: parseFloat(stats.avg_income.toFixed(2)),
                    averageExpense: parseFloat(stats.avg_expense.toFixed(2)),
                    balance: parseFloat((stats.total_income - stats.total_expenses).toFixed(2))
                },
                recentTransactions: recentTransactions.map(t => ({
                    id: t.id,
                    amount: parseFloat(t.amount.toFixed(2)),
                    type: t.type,
                    category: t.category,
                    description: t.description,
                    date: t.transaction_date
                }))
            });

        } catch (error) {
            ErrorHandler.logError(error, req);
            return this.sendError(res, 500, 'Failed to get user statistics');
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

module.exports = new UserRoutes(); 