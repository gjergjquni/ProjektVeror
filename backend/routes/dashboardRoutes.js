// backend/dashboardRoutes.js

const Validators = require('../utils/validators');
const ErrorHandler = require('../middleware/errorHandler');

class DashboardRoutes {
    async handle(req, res, context) {
        const { authMiddleware, parsedUrl } = context;

        // All dashboard routes require authentication
        authMiddleware.requireAuth(req, res, async () => {
            const pathname = parsedUrl.pathname;
            const method = req.method.toUpperCase();

            // Dashboard routing logic
            if (pathname === '/dashboard/overview' && method === 'GET') {
                return await this.getDashboardOverview(req, res, context);
            }
            if (pathname === '/dashboard/statistics' && method === 'GET') {
                return await this.getDashboardStatistics(req, res, context);
            }
            if (pathname === '/dashboard/transactions' && method === 'GET') {
                return await this.getDashboardTransactions(req, res, context);
            }
            if (pathname === '/dashboard/goals' && method === 'GET') {
                return await this.getDashboardGoals(req, res, context);
            }
            if (pathname === '/dashboard/analytics' && method === 'GET') {
                return await this.getDashboardAnalytics(req, res, context);
            }
            if (pathname === '/dashboard/insights' && method === 'GET') {
                return await this.getDashboardInsights(req, res, context);
            }
            if (pathname === '/dashboard/notifications' && method === 'GET') {
                return await this.getDashboardNotifications(req, res, context);
            }
            if (pathname === '/dashboard/quick-actions' && method === 'GET') {
                return await this.getQuickActions(req, res, context);
            }
            if (pathname === '/dashboard/export' && method === 'POST') {
                return await this.exportDashboardData(req, res, context);
            }
            if (pathname === '/dashboard/widgets' && method === 'GET') {
                return await this.getDashboardWidgets(req, res, context);
            }
            if (pathname === '/dashboard/customize' && method === 'PUT') {
                return await this.customizeDashboard(req, res, context);
            }
            
            this.sendError(res, 404, 'Dashboard endpoint not found');
        });
    }

    // --- GET DASHBOARD OVERVIEW ---
    async getDashboardOverview(req, res, { databaseManager }) {
        try {
            const userId = req.user.userId;
            
            // Get user's basic financial overview
            const overview = await this.buildDashboardOverview(databaseManager, userId);
            
            this.sendSuccess(res, 200, { overview });
        } catch (error) {
            ErrorHandler.logError(error, req);
            this.sendError(res, 500, 'Failed to retrieve dashboard overview');
        }
    }

    // --- GET DASHBOARD STATISTICS ---
    async getDashboardStatistics(req, res, { databaseManager, parsedUrl }) {
        try {
            const userId = req.user.userId;
            const { period = 'month', category } = parsedUrl.query;
            
            const validPeriods = ['week', 'month', 'quarter', 'year'];
            if (!validPeriods.includes(period)) {
                return this.sendError(res, 400, 'Invalid period specified');
            }
            
            const statistics = await this.buildDashboardStatistics(databaseManager, userId, period, category);
            
            this.sendSuccess(res, 200, { statistics });
        } catch (error) {
            ErrorHandler.logError(error, req);
            this.sendError(res, 500, 'Failed to retrieve dashboard statistics');
        }
    }

    // --- GET DASHBOARD TRANSACTIONS ---
    async getDashboardTransactions(req, res, { databaseManager, parsedUrl }) {
        try {
            const userId = req.user.userId;
            const { limit = 10, offset = 0, type, category } = parsedUrl.query;
            
            let sql = 'SELECT * FROM transactions WHERE user_id = ?';
            const params = [userId];
            
            if (type) {
                sql += ' AND type = ?';
                params.push(type);
            }
            
            if (category) {
                sql += ' AND category = ?';
                params.push(category);
            }
            
            sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
            params.push(parseInt(limit), parseInt(offset));
            
            const transactions = await databaseManager.all(sql, params);
            
            // Get total count for pagination
            let countSql = 'SELECT COUNT(*) as total FROM transactions WHERE user_id = ?';
            const countParams = [userId];
            
            if (type) {
                countSql += ' AND type = ?';
                countParams.push(type);
            }
            
            if (category) {
                countSql += ' AND category = ?';
                countParams.push(category);
            }
            
            const countResult = await databaseManager.get(countSql, countParams);
            const total = countResult ? countResult.total : 0;
            
            // Get transaction summary
            const summary = await this.getTransactionSummary(databaseManager, userId, type, category);
            
            this.sendSuccess(res, 200, { 
                transactions,
                summary,
                pagination: { 
                    total, 
                    limit: parseInt(limit), 
                    offset: parseInt(offset),
                    hasMore: (parseInt(offset) + parseInt(limit)) < total
                }
            });
        } catch (error) {
            ErrorHandler.logError(error, req);
            this.sendError(res, 500, 'Failed to retrieve dashboard transactions');
        }
    }

    // --- GET DASHBOARD GOALS ---
    async getDashboardGoals(req, res, { databaseManager, parsedUrl }) {
        try {
            const userId = req.user.userId;
            const { status, limit = 10, offset = 0 } = parsedUrl.query;
            
            let sql = 'SELECT * FROM goals WHERE user_id = ?';
            const params = [userId];
            
            if (status) {
                sql += ' AND status = ?';
                params.push(status);
            }
            
            sql += ' ORDER BY target_date ASC LIMIT ? OFFSET ?';
            params.push(parseInt(limit), parseInt(offset));
            
            const goals = await databaseManager.all(sql, params);
            
            // Get total count for pagination
            let countSql = 'SELECT COUNT(*) as total FROM goals WHERE user_id = ?';
            if (status) {
                countSql += ' AND status = ?';
            }
            const countResult = await databaseManager.get(countSql, status ? [userId, status] : [userId]);
            const total = countResult ? countResult.total : 0;
            
            // Calculate progress for each goal
            for (let goal of goals) {
                goal.progress = this.calculateGoalProgress(goal);
                goal.daysRemaining = this.calculateDaysRemaining(goal.target_date);
                goal.status = this.determineGoalStatus(goal);
            }
            
            // Get goals summary
            const summary = await this.getGoalsSummary(databaseManager, userId);
            
            this.sendSuccess(res, 200, { 
                goals,
                summary,
                pagination: { 
                    total, 
                    limit: parseInt(limit), 
                    offset: parseInt(offset),
                    hasMore: (parseInt(offset) + parseInt(limit)) < total
                }
            });
        } catch (error) {
            ErrorHandler.logError(error, req);
            this.sendError(res, 500, 'Failed to retrieve dashboard goals');
        }
    }

    // --- GET DASHBOARD ANALYTICS ---
    async getDashboardAnalytics(req, res, { databaseManager, parsedUrl }) {
        try {
            const userId = req.user.userId;
            const { period = 'month', type = 'all' } = parsedUrl.query;
            
            const validPeriods = ['week', 'month', 'quarter', 'year'];
            if (!validPeriods.includes(period)) {
                return this.sendError(res, 400, 'Invalid period specified');
            }
            
            const validTypes = ['all', 'income', 'expense', 'savings', 'goals'];
            if (!validTypes.includes(type)) {
                return this.sendError(res, 400, 'Invalid analytics type specified');
            }
            
            const analytics = await this.buildDashboardAnalytics(databaseManager, userId, period, type);
            
            this.sendSuccess(res, 200, { analytics });
        } catch (error) {
            ErrorHandler.logError(error, req);
            this.sendError(res, 500, 'Failed to retrieve dashboard analytics');
        }
    }

    // --- GET DASHBOARD INSIGHTS ---
    async getDashboardInsights(req, res, { databaseManager }) {
        try {
            const userId = req.user.userId;
            
            const insights = await this.generateDashboardInsights(databaseManager, userId);
            
            this.sendSuccess(res, 200, { insights });
        } catch (error) {
            ErrorHandler.logError(error, req);
            this.sendError(res, 500, 'Failed to retrieve dashboard insights');
        }
    }

    // --- GET DASHBOARD NOTIFICATIONS ---
    async getDashboardNotifications(req, res, { databaseManager, parsedUrl }) {
        try {
            const userId = req.user.userId;
            const { limit = 20, offset = 0, unreadOnly = false } = parsedUrl.query;
            
            let sql = 'SELECT * FROM user_notifications WHERE user_id = ?';
            const params = [userId];
            
            if (unreadOnly === 'true') {
                sql += ' AND is_read = 0';
            }
            
            sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
            params.push(parseInt(limit), parseInt(offset));
            
            const notifications = await databaseManager.all(sql, params);
            
            // Get total count for pagination
            let countSql = 'SELECT COUNT(*) as total FROM user_notifications WHERE user_id = ?';
            if (unreadOnly === 'true') {
                countSql += ' AND is_read = 0';
            }
            const countResult = await databaseManager.get(countSql, unreadOnly === 'true' ? [userId] : [userId]);
            const total = countResult ? countResult.total : 0;
            
            // Get unread count
            const unreadCount = await databaseManager.get(
                'SELECT COUNT(*) as count FROM user_notifications WHERE user_id = ? AND is_read = 0',
                [userId]
            );
            
            this.sendSuccess(res, 200, { 
                notifications,
                unreadCount: unreadCount ? unreadCount.count : 0,
                pagination: { 
                    total, 
                    limit: parseInt(limit), 
                    offset: parseInt(offset),
                    hasMore: (parseInt(offset) + parseInt(limit)) < total
                }
            });
        } catch (error) {
            ErrorHandler.logError(error, req);
            this.sendError(res, 500, 'Failed to retrieve dashboard notifications');
        }
    }

    // --- GET QUICK ACTIONS ---
    async getQuickActions(req, res, { databaseManager }) {
        try {
            const userId = req.user.userId;
            
            // Get user's quick actions based on their recent activity and preferences
            const quickActions = await this.buildQuickActions(databaseManager, userId);
            
            this.sendSuccess(res, 200, { quickActions });
        } catch (error) {
            ErrorHandler.logError(error, req);
            this.sendError(res, 500, 'Failed to retrieve quick actions');
        }
    }

    // --- EXPORT DASHBOARD DATA ---
    async exportDashboardData(req, res, { databaseManager }) {
        try {
            const userId = req.user.userId;
            const { format = 'json', period = 'month', includeTransactions = true, includeGoals = true } = req.body;
            
            const validFormats = ['json', 'csv', 'pdf'];
            if (!validFormats.includes(format)) {
                return this.sendError(res, 400, 'Invalid export format');
            }
            
            const validPeriods = ['week', 'month', 'quarter', 'year'];
            if (!validPeriods.includes(period)) {
                return this.sendError(res, 400, 'Invalid period specified');
            }
            
            // Gather dashboard data
            const dashboardData = await this.gatherDashboardData(databaseManager, userId, period, includeTransactions, includeGoals);
            
            // Format export data
            const exportData = this.formatDashboardExport(dashboardData, format);
            
            this.sendSuccess(res, 200, { 
                message: 'Dashboard data exported successfully',
                format,
                data: exportData,
                filename: `dashboard-${period}-${new Date().toISOString().split('T')[0]}.${format}`
            });
        } catch (error) {
            ErrorHandler.logError(error, req);
            this.sendError(res, 500, 'Failed to export dashboard data');
        }
    }

    // --- GET DASHBOARD WIDGETS ---
    async getDashboardWidgets(req, res, { databaseManager }) {
        try {
            const userId = req.user.userId;
            
            // Get user's dashboard widget configuration
            const widgets = await this.getUserDashboardWidgets(databaseManager, userId);
            
            this.sendSuccess(res, 200, { widgets });
        } catch (error) {
            ErrorHandler.logError(error, req);
            this.sendError(res, 500, 'Failed to retrieve dashboard widgets');
        }
    }

    // --- CUSTOMIZE DASHBOARD ---
    async customizeDashboard(req, res, { databaseManager }) {
        try {
            const userId = req.user.userId;
            const { layout, widgets, theme, refreshInterval } = req.body;
            
            // Validation
            if (layout && !['grid', 'list', 'compact'].includes(layout)) {
                return this.sendError(res, 400, 'Invalid layout specified');
            }
            
            if (theme && !['light', 'dark', 'auto'].includes(theme)) {
                return this.sendError(res, 400, 'Invalid theme specified');
            }
            
            if (refreshInterval && (refreshInterval < 30 || refreshInterval > 3600)) {
                return this.sendError(res, 400, 'Refresh interval must be between 30 and 3600 seconds');
            }
            
            // Update or create dashboard preferences
            const existingPrefs = await databaseManager.get(
                'SELECT user_id FROM dashboard_preferences WHERE user_id = ?',
                [userId]
            );
            
            if (existingPrefs) {
                const updateFields = [];
                const updateValues = [];
                
                if (layout !== undefined) {
                    updateFields.push('layout = ?');
                    updateValues.push(layout);
                }
                if (theme !== undefined) {
                    updateFields.push('theme = ?');
                    updateValues.push(theme);
                }
                if (refreshInterval !== undefined) {
                    updateFields.push('refresh_interval = ?');
                    updateValues.push(refreshInterval);
                }
                
                if (updateFields.length > 0) {
                    updateValues.push(userId);
                    const sql = `UPDATE dashboard_preferences SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`;
                    await databaseManager.run(sql, updateValues);
                }
            } else {
                await databaseManager.run(
                    'INSERT INTO dashboard_preferences (user_id, layout, theme, refresh_interval, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)',
                    [userId, layout || 'grid', theme || 'light', refreshInterval || 300]
                );
            }
            
            // Update widgets if provided
            if (widgets && Array.isArray(widgets)) {
                // Clear existing widgets
                await databaseManager.run(
                    'DELETE FROM dashboard_widgets WHERE user_id = ?',
                    [userId]
                );
                
                // Insert new widgets
                for (let widget of widgets) {
                    await databaseManager.run(
                        'INSERT INTO dashboard_widgets (user_id, widget_type, position, is_enabled, settings, created_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
                        [userId, widget.type, widget.position, widget.isEnabled ? 1 : 0, JSON.stringify(widget.settings || {}), new Date()]
                    );
                }
            }
            
            this.sendSuccess(res, 200, { 
                message: 'Dashboard customized successfully'
            });
        } catch (error) {
            ErrorHandler.logError(error, req);
            this.sendError(res, 500, 'Failed to customize dashboard');
        }
    }

    // --- HELPER FUNCTIONS ---

    // Build dashboard overview
    async buildDashboardOverview(databaseManager, userId) {
        try {
            // Get current month's financial summary
            const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
            
            const income = await databaseManager.get(
                'SELECT SUM(amount) as total FROM transactions WHERE user_id = ? AND type = "income" AND DATE_FORMAT(created_at, "%Y-%m") = ?',
                [userId, currentMonth]
            );
            
            const expenses = await databaseManager.get(
                'SELECT SUM(amount) as total FROM transactions WHERE user_id = ? AND type = "expense" AND DATE_FORMAT(created_at, "%Y-%m") = ?',
                [userId, currentMonth]
            );
            
            const savings = await databaseManager.get(
                'SELECT SUM(amount) as total FROM transactions WHERE user_id = ? AND type = "savings" AND DATE_FORMAT(created_at, "%Y-%m") = ?',
                [userId, currentMonth]
            );
            
            // Get active goals count
            const activeGoals = await databaseManager.get(
                'SELECT COUNT(*) as count FROM goals WHERE user_id = ? AND status = "active"',
                [userId]
            );
            
            // Get recent transactions count
            const recentTransactions = await databaseManager.get(
                'SELECT COUNT(*) as count FROM transactions WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)',
                [userId]
            );
            
            return {
                currentMonth: {
                    income: income ? income.total || 0 : 0,
                    expenses: expenses ? expenses.total || 0 : 0,
                    savings: savings ? savings.total || 0 : 0,
                    netIncome: (income ? income.total || 0 : 0) - (expenses ? expenses.total || 0 : 0)
                },
                summary: {
                    activeGoals: activeGoals ? activeGoals.count : 0,
                    recentTransactions: recentTransactions ? recentTransactions.count : 0,
                    totalBalance: await this.calculateTotalBalance(databaseManager, userId)
                }
            };
        } catch (error) {
            throw new Error(`Failed to build dashboard overview: ${error.message}`);
        }
    }

    // Build dashboard statistics
    async buildDashboardStatistics(databaseManager, userId, period, category) {
        try {
            const dateFilter = this.getDateFilter(period);
            
            let sql = 'SELECT * FROM transactions WHERE user_id = ? AND created_at >= ?';
            const params = [userId, dateFilter];
            
            if (category) {
                sql += ' AND category = ?';
                params.push(category);
            }
            
            const transactions = await databaseManager.all(sql, params);
            
            // Group by category and calculate totals
            const categoryStats = {};
            const typeStats = { income: 0, expense: 0, savings: 0 };
            
            for (let transaction of transactions) {
                // Category statistics
                if (!categoryStats[transaction.category]) {
                    categoryStats[transaction.category] = { total: 0, count: 0 };
                }
                categoryStats[transaction.category].total += transaction.amount;
                categoryStats[transaction.category].count += 1;
                
                // Type statistics
                if (typeStats[transaction.type] !== undefined) {
                    typeStats[transaction.type] += transaction.amount;
                }
            }
            
            // Calculate trends (compare with previous period)
            const previousPeriodFilter = this.getPreviousPeriodFilter(period);
            const previousTransactions = await databaseManager.all(
                'SELECT SUM(amount) as total FROM transactions WHERE user_id = ? AND created_at >= ?',
                [userId, previousPeriodFilter]
            );
            
            const previousTotal = previousTransactions ? previousTransactions.total || 0 : 0;
            const currentTotal = transactions.reduce((sum, t) => sum + t.amount, 0);
            const trend = previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal) * 100 : 0;
            
            return {
                period,
                category,
                transactions: {
                    total: currentTotal,
                    count: transactions.length,
                    trend: Math.round(trend * 100) / 100
                },
                byCategory: categoryStats,
                byType: typeStats,
                topCategories: Object.entries(categoryStats)
                    .sort(([,a], [,b]) => b.total - a.total)
                    .slice(0, 5)
                    .map(([category, stats]) => ({ category, ...stats }))
            };
        } catch (error) {
            throw new Error(`Failed to build dashboard statistics: ${error.message}`);
        }
    }

    // Get transaction summary
    async getTransactionSummary(databaseManager, userId, type, category) {
        try {
            let sql = 'SELECT * FROM transactions WHERE user_id = ?';
            const params = [userId];
            
            if (type) {
                sql += ' AND type = ?';
                params.push(type);
            }
            
            if (category) {
                sql += ' AND category = ?';
                params.push(category);
            }
            
            const transactions = await databaseManager.all(sql, params);
            
            const total = transactions.reduce((sum, t) => sum + t.amount, 0);
            const count = transactions.length;
            const average = count > 0 ? total / count : 0;
            
            // Get largest transaction
            const largest = transactions.length > 0 ? 
                transactions.reduce((max, t) => t.amount > max.amount ? t : max) : null;
            
            return {
                total,
                count,
                average: Math.round(average * 100) / 100,
                largest: largest ? { amount: largest.amount, description: largest.description, date: largest.created_at } : null
            };
        } catch (error) {
            throw new Error(`Failed to get transaction summary: ${error.message}`);
        }
    }

    // Get goals summary
    async getGoalsSummary(databaseManager, userId) {
        try {
            const goals = await databaseManager.all(
                'SELECT * FROM goals WHERE user_id = ?',
                [userId]
            );
            
            const total = goals.length;
            const active = goals.filter(g => g.status === 'active').length;
            const completed = goals.filter(g => g.status === 'completed').length;
            const overdue = goals.filter(g => new Date(g.target_date) < new Date() && g.status === 'active').length;
            
            const totalTarget = goals.reduce((sum, g) => sum + g.target_amount, 0);
            const totalSaved = goals.reduce((sum, g) => sum + g.saved_amount, 0);
            const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;
            
            return {
                total,
                active,
                completed,
                overdue,
                totalTarget,
                totalSaved,
                overallProgress: Math.round(overallProgress * 100) / 100
            };
        } catch (error) {
            throw new Error(`Failed to get goals summary: ${error.message}`);
        }
    }

    // Build dashboard analytics
    async buildDashboardAnalytics(databaseManager, userId, period, type) {
        try {
            const dateFilter = this.getDateFilter(period);
            
            if (type === 'all' || type === 'income' || type === 'expense') {
                const transactions = await databaseManager.all(
                    'SELECT * FROM transactions WHERE user_id = ? AND created_at >= ? AND type IN ("income", "expense")',
                    [userId, dateFilter]
                );
                
                // Group by date for trend analysis
                const dailyData = {};
                for (let transaction of transactions) {
                    const date = transaction.created_at.toISOString().split('T')[0];
                    if (!dailyData[date]) {
                        dailyData[date] = { income: 0, expense: 0 };
                    }
                    dailyData[date][transaction.type] += transaction.amount;
                }
                
                // Convert to array and sort by date
                const trendData = Object.entries(dailyData)
                    .map(([date, data]) => ({ date, ...data }))
                    .sort((a, b) => a.date.localeCompare(b.date));
                
                return { trendData };
            }
            
            if (type === 'goals') {
                const goals = await databaseManager.all(
                    'SELECT * FROM goals WHERE user_id = ? AND created_at >= ?',
                    [userId, dateFilter]
                );
                
                // Calculate progress trends
                const progressData = goals.map(goal => ({
                    id: goal.id,
                    name: goal.name,
                    progress: this.calculateGoalProgress(goal),
                    targetDate: goal.target_date,
                    category: goal.category
                }));
                
                return { progressData };
            }
            
            return { message: 'Analytics type not implemented' };
        } catch (error) {
            throw new Error(`Failed to build dashboard analytics: ${error.message}`);
        }
    }

    // Generate dashboard insights
    async generateDashboardInsights(databaseManager, userId) {
        try {
            const insights = [];
            
            // Get recent spending patterns
            const recentExpenses = await databaseManager.all(
                'SELECT * FROM transactions WHERE user_id = ? AND type = "expense" AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)',
                [userId]
            );
            
            if (recentExpenses.length > 0) {
                const totalExpenses = recentExpenses.reduce((sum, t) => sum + t.amount, 0);
                const avgDailyExpense = totalExpenses / 30;
                
                insights.push({
                    type: 'spending',
                    title: 'Spending Pattern',
                    message: `You've spent $${totalExpenses.toFixed(2)} in the last 30 days, averaging $${avgDailyExpense.toFixed(2)} per day.`,
                    severity: avgDailyExpense > 100 ? 'warning' : 'info'
                });
            }
            
            // Check goal progress
            const activeGoals = await databaseManager.all(
                'SELECT * FROM goals WHERE user_id = ? AND status = "active"',
                [userId]
            );
            
            for (let goal of activeGoals) {
                const progress = this.calculateGoalProgress(goal);
                const daysRemaining = this.calculateDaysRemaining(goal.target_date);
                
                if (progress < 50 && daysRemaining < 30) {
                    insights.push({
                        type: 'goal',
                        title: 'Goal Alert',
                        message: `Your goal "${goal.name}" is ${progress}% complete with only ${daysRemaining} days remaining. Consider increasing your savings rate.`,
                        severity: 'warning'
                    });
                }
            }
            
            // Check for unusual transactions
            const largeTransactions = await databaseManager.all(
                'SELECT * FROM transactions WHERE user_id = ? AND amount > 1000 AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)',
                [userId]
            );
            
            if (largeTransactions.length > 0) {
                insights.push({
                    type: 'transaction',
                    title: 'Large Transactions',
                    message: `You've made ${largeTransactions.length} large transaction(s) this week. Review your spending to ensure it aligns with your financial goals.`,
                    severity: 'info'
                });
            }
            
            return insights;
        } catch (error) {
            throw new Error(`Failed to generate dashboard insights: ${error.message}`);
        }
    }

    // Build quick actions
    async buildQuickActions(databaseManager, userId) {
        try {
            const actions = [
                {
                    id: 'add-transaction',
                    title: 'Add Transaction',
                    description: 'Record a new income or expense',
                    icon: 'plus-circle',
                    action: 'navigate',
                    target: '/transactions/add',
                    priority: 1
                },
                {
                    id: 'set-goal',
                    title: 'Set Goal',
                    description: 'Create a new financial goal',
                    icon: 'target',
                    action: 'navigate',
                    target: '/goals/create',
                    priority: 2
                },
                {
                    id: 'view-reports',
                    title: 'View Reports',
                    description: 'Generate financial reports',
                    icon: 'chart-bar',
                    action: 'navigate',
                    target: '/reports',
                    priority: 3
                }
            ];
            
            // Add contextual actions based on user's current situation
            const recentTransactions = await databaseManager.get(
                'SELECT COUNT(*) as count FROM transactions WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)',
                [userId]
            );
            
            if (recentTransactions && recentTransactions.count === 0) {
                actions.push({
                    id: 'first-transaction',
                    title: 'First Transaction',
                    description: 'Start tracking your finances',
                    icon: 'star',
                    action: 'navigate',
                    target: '/transactions/add',
                    priority: 0
                });
            }
            
            return actions.sort((a, b) => a.priority - b.priority);
        } catch (error) {
            throw new Error(`Failed to build quick actions: ${error.message}`);
        }
    }

    // Gather dashboard data for export
    async gatherDashboardData(databaseManager, userId, period, includeTransactions, includeGoals) {
        try {
            const dateFilter = this.getDateFilter(period);
            
            const data = {
                period,
                exportDate: new Date().toISOString(),
                overview: await this.buildDashboardOverview(databaseManager, userId),
                statistics: await this.buildDashboardStatistics(databaseManager, userId, period)
            };
            
            if (includeTransactions) {
                data.transactions = await databaseManager.all(
                    'SELECT * FROM transactions WHERE user_id = ? AND created_at >= ? ORDER BY created_at DESC',
                    [userId, dateFilter]
                );
            }
            
            if (includeGoals) {
                data.goals = await databaseManager.all(
                    'SELECT * FROM goals WHERE user_id = ? ORDER BY created_at DESC',
                    [userId]
                );
            }
            
            return data;
        } catch (error) {
            throw new Error(`Failed to gather dashboard data: ${error.message}`);
        }
    }

    // Format dashboard export
    formatDashboardExport(data, format) {
        switch (format) {
            case 'json':
                return JSON.stringify(data, null, 2);
            case 'csv':
                let csv = 'Type,Data\n';
                csv += `Period,${data.period}\n`;
                csv += `Export Date,${data.exportDate}\n`;
                csv += `Total Income,${data.overview.currentMonth.income}\n`;
                csv += `Total Expenses,${data.overview.currentMonth.expenses}\n`;
                csv += `Net Income,${data.overview.currentMonth.netIncome}\n`;
                return csv;
            case 'pdf':
                // In production, you'd use a PDF library like jsPDF or puppeteer
                return `Dashboard Report for ${data.period} - Generated on ${data.exportDate}`;
            default:
                return data;
        }
    }

    // Get user dashboard widgets
    async getUserDashboardWidgets(databaseManager, userId) {
        try {
            const widgets = await databaseManager.all(
                'SELECT * FROM dashboard_widgets WHERE user_id = ? AND is_enabled = 1 ORDER BY position ASC',
                [userId]
            );
            
            if (widgets.length === 0) {
                // Return default widgets
                return [
                    { type: 'overview', position: 1, isEnabled: true, settings: {} },
                    { type: 'transactions', position: 2, isEnabled: true, settings: {} },
                    { type: 'goals', position: 3, isEnabled: true, settings: {} },
                    { type: 'analytics', position: 4, isEnabled: true, settings: {} }
                ];
            }
            
            return widgets.map(widget => ({
                ...widget,
                settings: widget.settings ? JSON.parse(widget.settings) : {}
            }));
        } catch (error) {
            throw new Error(`Failed to get user dashboard widgets: ${error.message}`);
        }
    }

    // Calculate total balance
    async calculateTotalBalance(databaseManager, userId) {
        try {
            const income = await databaseManager.get(
                'SELECT SUM(amount) as total FROM transactions WHERE user_id = ? AND type = "income"',
                [userId]
            );
            
            const expenses = await databaseManager.get(
                'SELECT SUM(amount) as total FROM transactions WHERE user_id = ? AND type = "expense"',
                [userId]
            );
            
            const savings = await databaseManager.get(
                'SELECT SUM(amount) as total FROM transactions WHERE user_id = ? AND type = "savings"',
                [userId]
            );
            
            const totalIncome = income ? income.total || 0 : 0;
            const totalExpenses = expenses ? expenses.total || 0 : 0;
            const totalSavings = savings ? savings.total || 0 : 0;
            
            return totalIncome - totalExpenses + totalSavings;
        } catch (error) {
            return 0;
        }
    }

    // Calculate goal progress
    calculateGoalProgress(goal) {
        if (goal.target_amount <= 0) return 0;
        const progress = (goal.saved_amount / goal.target_amount) * 100;
        return Math.min(Math.round(progress * 100) / 100, 100);
    }

    // Calculate days remaining
    calculateDaysRemaining(targetDate) {
        const target = new Date(targetDate);
        const now = new Date();
        const diffTime = target - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return Math.max(diffDays, 0);
    }

    // Determine goal status
    determineGoalStatus(goal) {
        const progress = this.calculateGoalProgress(goal);
        const daysRemaining = this.calculateDaysRemaining(goal.target_date);
        
        if (progress >= 100) return 'completed';
        if (daysRemaining === 0 && progress < 100) return 'overdue';
        if (progress >= 75) return 'on-track';
        if (progress >= 50) return 'in-progress';
        return 'needs-attention';
    }

    // Get date filter for period
    getDateFilter(period) {
        const now = new Date();
        switch (period) {
            case 'week':
                return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            case 'month':
                return new Date(now.getFullYear(), now.getMonth(), 1);
            case 'quarter':
                const quarter = Math.floor(now.getMonth() / 3);
                return new Date(now.getFullYear(), quarter * 3, 1);
            case 'year':
                return new Date(now.getFullYear(), 0, 1);
            default:
                return new Date(now.getFullYear(), now.getMonth(), 1);
        }
    }

    // Get previous period filter
    getPreviousPeriodFilter(period) {
        const now = new Date();
        switch (period) {
            case 'week':
                return new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
            case 'month':
                return new Date(now.getFullYear(), now.getMonth() - 1, 1);
            case 'quarter':
                const quarter = Math.floor(now.getMonth() / 3);
                return new Date(now.getFullYear(), (quarter - 1) * 3, 1);
            case 'year':
                return new Date(now.getFullYear() - 1, 0, 1);
            default:
                return new Date(now.getFullYear(), now.getMonth() - 1, 1);
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

module.exports = new DashboardRoutes();
