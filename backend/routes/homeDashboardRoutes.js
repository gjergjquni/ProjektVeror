// backend/homeDashboardRoutes.js

const Validators = require('./validators');
const ErrorHandler = require('./errorHandler');

class HomeDashboardRoutes {
    async handle(req, res, context) {
        const { authMiddleware, parsedUrl } = context;

        // All home dashboard routes require authentication
        authMiddleware.requireAuth(req, res, async () => {
            const pathname = parsedUrl.pathname;
            const method = req.method.toUpperCase();

            // Home Dashboard routing logic
            if (pathname === '/home/summary' && method === 'GET') {
                return await this.getHomeSummary(req, res, context);
            }
            if (pathname === '/home/quick-stats' && method === 'GET') {
                return await this.getQuickStats(req, res, context);
            }
            if (pathname === '/home/recent-activity' && method === 'GET') {
                return await this.getRecentActivity(req, res, context);
            }
            if (pathname === '/home/upcoming-deadlines' && method === 'GET') {
                return await this.getUpcomingDeadlines(req, res, context);
            }
            if (pathname === '/home/financial-health' && method === 'GET') {
                return await this.getFinancialHealth(req, res, context);
            }
            if (pathname === '/home/recommendations' && method === 'GET') {
                return await this.getRecommendations(req, res, context);
            }
            if (pathname === '/home/weather-widget' && method === 'GET') {
                return await this.getWeatherWidget(req, res, context);
            }
            if (pathname === '/home/news-feed' && method === 'GET') {
                return await this.getNewsFeed(req, res, context);
            }
            if (pathname === '/home/calendar' && method === 'GET') {
                return await this.getCalendarEvents(req, res, context);
            }
            if (pathname === '/home/quick-actions' && method === 'GET') {
                return await this.getHomeQuickActions(req, res, context);
            }
            
            this.sendError(res, 404, 'Home Dashboard endpoint not found');
        });
    }

    // --- GET HOME SUMMARY ---
    async getHomeSummary(req, res, { databaseManager }) {
        try {
            const userId = req.user.userId;
            
            // Get comprehensive home summary
            const summary = await this.buildHomeSummary(databaseManager, userId);
            
            this.sendSuccess(res, 200, { summary });
        } catch (error) {
            ErrorHandler.logError(error, req);
            this.sendError(res, 500, 'Failed to retrieve home summary');
        }
    }

    // --- GET QUICK STATS ---
    async getQuickStats(req, res, { databaseManager }) {
        try {
            const userId = req.user.userId;
            
            const stats = await this.buildQuickStats(databaseManager, userId);
            
            this.sendSuccess(res, 200, { stats });
        } catch (error) {
            ErrorHandler.logError(error, req);
            this.sendError(res, 500, 'Failed to retrieve quick stats');
        }
    }

    // --- GET RECENT ACTIVITY ---
    async getRecentActivity(req, res, { databaseManager, parsedUrl }) {
        try {
            const userId = req.user.userId;
            const { limit = 15, type } = parsedUrl.query;
            
            const activities = await this.buildRecentActivity(databaseManager, userId, parseInt(limit), type);
            
            this.sendSuccess(res, 200, { activities });
        } catch (error) {
            ErrorHandler.logError(error, req);
            this.sendError(res, 500, 'Failed to retrieve recent activity');
        }
    }

    // --- GET UPCOMING DEADLINES ---
    async getUpcomingDeadlines(req, res, { databaseManager, parsedUrl }) {
        try {
            const userId = req.user.userId;
            const { days = 30 } = parsedUrl.query;
            
            const deadlines = await this.buildUpcomingDeadlines(databaseManager, userId, parseInt(days));
            
            this.sendSuccess(res, 200, { deadlines });
        } catch (error) {
            ErrorHandler.logError(error, req);
            this.sendError(res, 500, 'Failed to retrieve upcoming deadlines');
        }
    }

    // --- GET FINANCIAL HEALTH ---
    async getFinancialHealth(req, res, { databaseManager }) {
        try {
            const userId = req.user.userId;
            
            const health = await this.assessFinancialHealth(databaseManager, userId);
            
            this.sendSuccess(res, 200, { health });
        } catch (error) {
            ErrorHandler.logError(error, req);
            this.sendError(res, 500, 'Failed to assess financial health');
        }
    }

    // --- GET RECOMMENDATIONS ---
    async getRecommendations(req, res, { databaseManager }) {
        try {
            const userId = req.user.userId;
            
            const recommendations = await this.generateRecommendations(databaseManager, userId);
            
            this.sendSuccess(res, 200, { recommendations });
        } catch (error) {
            ErrorHandler.logError(error, req);
            this.sendError(res, 500, 'Failed to generate recommendations');
        }
    }

    // --- GET WEATHER WIDGET ---
    async getWeatherWidget(req, res, { databaseManager, parsedUrl }) {
        try {
            const { location } = parsedUrl.query;
            
            // In production, integrate with weather API
            const weather = await this.getWeatherData(location);
            
            this.sendSuccess(res, 200, { weather });
        } catch (error) {
            ErrorHandler.logError(error, req);
            this.sendError(res, 500, 'Failed to retrieve weather data');
        }
    }

    // --- GET NEWS FEED ---
    async getNewsFeed(req, res, { databaseManager, parsedUrl }) {
        try {
            const { category = 'finance', limit = 5 } = parsedUrl.query;
            
            // In production, integrate with news API
            const news = await this.getNewsData(category, parseInt(limit));
            
            this.sendSuccess(res, 200, { news });
        } catch (error) {
            ErrorHandler.logError(error, req);
            this.sendError(res, 500, 'Failed to retrieve news feed');
        }
    }

    // --- GET CALENDAR EVENTS ---
    async getCalendarEvents(req, res, { databaseManager, parsedUrl }) {
        try {
            const userId = req.user.userId;
            const { start, end } = parsedUrl.query;
            
            const events = await this.getCalendarData(databaseManager, userId, start, end);
            
            this.sendSuccess(res, 200, { events });
        } catch (error) {
            ErrorHandler.logError(error, req);
            this.sendError(res, 500, 'Failed to retrieve calendar events');
        }
    }

    // --- GET HOME QUICK ACTIONS ---
    async getHomeQuickActions(req, res, { databaseManager }) {
        try {
            const userId = req.user.userId;
            
            const actions = await this.buildHomeQuickActions(databaseManager, userId);
            
            this.sendSuccess(res, 200, { actions });
        } catch (error) {
            ErrorHandler.logError(error, req);
            this.sendError(res, 500, 'Failed to retrieve quick actions');
        }
    }

    // --- HELPER FUNCTIONS ---

    // Build home summary
    async buildHomeSummary(databaseManager, userId) {
        try {
            const today = new Date();
            const currentMonth = today.toISOString().slice(0, 7);
            
            // Get monthly financial summary
            const monthlySummary = await this.getMonthlySummary(databaseManager, userId, currentMonth);
            
            // Get goal progress summary
            const goalSummary = await this.getGoalProgressSummary(databaseManager, userId);
            
            // Get recent achievements
            const achievements = await this.getRecentAchievements(databaseManager, userId);
            
            return {
                monthlySummary,
                goalSummary,
                achievements,
                lastUpdated: new Date().toISOString()
            };
        } catch (error) {
            throw new Error(`Failed to build home summary: ${error.message}`);
        }
    }

    // Build quick stats
    async buildQuickStats(databaseManager, userId) {
        try {
            const today = new Date();
            const weekStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            
            // Weekly spending
            const weeklySpending = await databaseManager.get(
                'SELECT SUM(amount) as total FROM transactions WHERE user_id = ? AND type = "expense" AND created_at >= ?',
                [userId, weekStart]
            );
            
            // Weekly income
            const weeklyIncome = await databaseManager.get(
                'SELECT SUM(amount) as total FROM transactions WHERE user_id = ? AND type = "income" AND created_at >= ?',
                [userId, weekStart]
            );
            
            // Active goals count
            const activeGoals = await databaseManager.get(
                'SELECT COUNT(*) as count FROM goals WHERE user_id = ? AND status = "active"',
                [userId]
            );
            
            // Days since last transaction
            const lastTransaction = await databaseManager.get(
                'SELECT created_at FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
                [userId]
            );
            
            const daysSinceLastTransaction = lastTransaction ? 
                Math.floor((today - new Date(lastTransaction.created_at)) / (1000 * 60 * 60 * 24)) : 0;
            
            return {
                weeklySpending: weeklySpending ? weeklySpending.total || 0 : 0,
                weeklyIncome: weeklyIncome ? weeklyIncome.total || 0 : 0,
                activeGoals: activeGoals ? activeGoals.count : 0,
                daysSinceLastTransaction
            };
        } catch (error) {
            throw new Error(`Failed to build quick stats: ${error.message}`);
        }
    }

    // Build recent activity
    async buildRecentActivity(databaseManager, userId, limit, type) {
        try {
            let activities = [];
            
            if (!type || type === 'transactions') {
                const transactions = await databaseManager.all(
                    'SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
                    [userId, limit]
                );
                
                activities.push(...transactions.map(t => ({
                    type: 'transaction',
                    id: t.id,
                    title: `${t.type.charAt(0).toUpperCase() + t.type.slice(1)}: $${t.amount}`,
                    description: t.description,
                    timestamp: t.created_at,
                    category: t.category,
                    amount: t.amount
                })));
            }
            
            if (!type || type === 'goals') {
                const goalUpdates = await databaseManager.all(
                    'SELECT * FROM goals WHERE user_id = ? ORDER BY updated_at DESC LIMIT ?',
                    [userId, limit]
                );
                
                activities.push(...goalUpdates.map(g => ({
                    type: 'goal',
                    id: g.id,
                    title: `Goal: ${g.name}`,
                    description: `Progress: ${Math.round((g.saved_amount / g.target_amount) * 100)}%`,
                    timestamp: g.updated_at,
                    progress: Math.round((g.saved_amount / g.target_amount) * 100)
                })));
            }
            
            // Sort by timestamp and limit
            return activities
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .slice(0, limit);
        } catch (error) {
            throw new Error(`Failed to build recent activity: ${error.message}`);
        }
    }

    // Build upcoming deadlines
    async buildUpcomingDeadlines(databaseManager, userId, days) {
        try {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + days);
            
            const deadlines = [];
            
            // Goal deadlines
            const goalDeadlines = await databaseManager.all(
                'SELECT * FROM goals WHERE user_id = ? AND target_date <= ? AND status = "active" ORDER BY target_date ASC',
                [userId, futureDate]
            );
            
            for (let goal of goalDeadlines) {
                const daysUntil = Math.ceil((new Date(goal.target_date) - new Date()) / (1000 * 60 * 60 * 24));
                deadlines.push({
                    type: 'goal',
                    id: goal.id,
                    title: goal.name,
                    description: `Target: $${goal.target_amount}`,
                    dueDate: goal.target_date,
                    daysUntil,
                    priority: daysUntil <= 7 ? 'high' : daysUntil <= 14 ? 'medium' : 'low'
                });
            }
            
            // Sort by priority and due date
            return deadlines.sort((a, b) => {
                if (a.priority === b.priority) {
                    return new Date(a.dueDate) - new Date(b.dueDate);
                }
                const priorityOrder = { high: 1, medium: 2, low: 3 };
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            });
        } catch (error) {
            throw new Error(`Failed to build upcoming deadlines: ${error.message}`);
        }
    }

    // Assess financial health
    async assessFinancialHealth(databaseManager, userId) {
        try {
            const health = {
                score: 0,
                factors: [],
                recommendations: []
            };
            
            // Calculate income vs expenses ratio
            const monthlyIncome = await this.getMonthlyIncome(databaseManager, userId);
            const monthlyExpenses = await this.getMonthlyExpenses(databaseManager, userId);
            
            if (monthlyIncome > 0) {
                const ratio = monthlyExpenses / monthlyIncome;
                if (ratio <= 0.5) {
                    health.score += 30;
                    health.factors.push({ factor: 'Low expense ratio', score: 30, status: 'excellent' });
                } else if (ratio <= 0.7) {
                    health.score += 20;
                    health.factors.push({ factor: 'Good expense ratio', score: 20, status: 'good' });
                } else if (ratio <= 0.9) {
                    health.score += 10;
                    health.factors.push({ factor: 'Moderate expense ratio', score: 10, status: 'fair' });
                } else {
                    health.factors.push({ factor: 'High expense ratio', score: 0, status: 'poor' });
                    health.recommendations.push('Consider reducing expenses to improve financial health');
                }
            }
            
            // Check emergency fund
            const emergencyFund = await this.getEmergencyFund(databaseManager, userId);
            if (emergencyFund >= monthlyExpenses * 3) {
                health.score += 25;
                health.factors.push({ factor: 'Emergency fund', score: 25, status: 'excellent' });
            } else if (emergencyFund >= monthlyExpenses * 2) {
                health.score += 15;
                health.factors.push({ factor: 'Emergency fund', score: 15, status: 'good' });
            } else if (emergencyFund >= monthlyExpenses) {
                health.score += 10;
                health.factors.push({ factor: 'Emergency fund', score: 10, status: 'fair' });
            } else {
                health.factors.push({ factor: 'Emergency fund', score: 0, status: 'poor' });
                health.recommendations.push('Build emergency fund to cover 3-6 months of expenses');
            }
            
            // Check goal progress
            const goalProgress = await this.getOverallGoalProgress(databaseManager, userId);
            if (goalProgress >= 75) {
                health.score += 25;
                health.factors.push({ factor: 'Goal progress', score: 25, status: 'excellent' });
            } else if (goalProgress >= 50) {
                health.score += 15;
                health.factors.push({ factor: 'Goal progress', score: 15, status: 'good' });
            } else if (goalProgress >= 25) {
                health.score += 10;
                health.factors.push({ factor: 'Goal progress', score: 10, status: 'fair' });
            } else {
                health.factors.push({ factor: 'Goal progress', score: 0, status: 'poor' });
                health.recommendations.push('Focus on achieving your financial goals');
            }
            
            // Check debt-to-income ratio
            const debtRatio = await this.getDebtToIncomeRatio(databaseManager, userId);
            if (debtRatio <= 0.3) {
                health.score += 20;
                health.factors.push({ factor: 'Debt ratio', score: 20, status: 'excellent' });
            } else if (debtRatio <= 0.5) {
                health.score += 15;
                health.factors.push({ factor: 'Debt ratio', score: 15, status: 'good' });
            } else if (debtRatio <= 0.7) {
                health.score += 10;
                health.factors.push({ factor: 'Debt ratio', score: 10, status: 'fair' });
            } else {
                health.factors.push({ factor: 'Debt ratio', score: 0, status: 'poor' });
                health.recommendations.push('Work on reducing debt to improve financial health');
            }
            
            // Determine overall status
            if (health.score >= 80) health.status = 'excellent';
            else if (health.score >= 60) health.status = 'good';
            else if (health.score >= 40) health.status = 'fair';
            else health.status = 'poor';
            
            return health;
        } catch (error) {
            throw new Error(`Failed to assess financial health: ${error.message}`);
        }
    }

    // Generate recommendations
    async generateRecommendations(databaseManager, userId) {
        try {
            const recommendations = [];
            
            // Check spending patterns
            const recentExpenses = await databaseManager.all(
                'SELECT * FROM transactions WHERE user_id = ? AND type = "expense" AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)',
                [userId]
            );
            
            if (recentExpenses.length > 0) {
                const totalExpenses = recentExpenses.reduce((sum, t) => sum + t.amount, 0);
                const avgDailyExpense = totalExpenses / 30;
                
                if (avgDailyExpense > 100) {
                    recommendations.push({
                        type: 'spending',
                        priority: 'high',
                        title: 'Reduce Daily Spending',
                        description: `Your average daily spending is $${avgDailyExpense.toFixed(2)}. Consider setting a daily budget.`,
                        action: 'Set daily spending limit'
                    });
                }
            }
            
            // Check goal progress
            const activeGoals = await databaseManager.all(
                'SELECT * FROM goals WHERE user_id = ? AND status = "active"',
                [userId]
            );
            
            for (let goal of activeGoals) {
                const progress = (goal.saved_amount / goal.target_amount) * 100;
                const daysRemaining = Math.ceil((new Date(goal.target_date) - new Date()) / (1000 * 60 * 60 * 24));
                
                if (progress < 50 && daysRemaining < 30) {
                    recommendations.push({
                        type: 'goal',
                        priority: 'high',
                        title: 'Goal Deadline Approaching',
                        description: `Your goal "${goal.name}" needs attention. You're ${progress.toFixed(1)}% complete with ${daysRemaining} days left.`,
                        action: 'Review goal strategy'
                    });
                }
            }
            
            // Check for savings opportunities
            const monthlyIncome = await this.getMonthlyIncome(databaseManager, userId);
            const monthlyExpenses = await this.getMonthlyExpenses(databaseManager, userId);
            
            if (monthlyIncome > 0 && monthlyExpenses > 0) {
                const savingsRate = ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100;
                
                if (savingsRate < 20) {
                    recommendations.push({
                        type: 'savings',
                        priority: 'medium',
                        title: 'Increase Savings Rate',
                        description: `Your current savings rate is ${savingsRate.toFixed(1)}%. Aim for at least 20% for better financial security.`,
                        action: 'Create savings plan'
                    });
                }
            }
            
            return recommendations.sort((a, b) => {
                const priorityOrder = { high: 1, medium: 2, low: 3 };
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            });
        } catch (error) {
            throw new Error(`Failed to generate recommendations: ${error.message}`);
        }
    }

    // Get weather data (placeholder)
    async getWeatherData(location) {
        // In production, integrate with OpenWeatherMap or similar API
        return {
            location: location || 'Unknown',
            temperature: '22°C',
            condition: 'Sunny',
            humidity: '65%',
            windSpeed: '12 km/h'
        };
    }

    // Get news data (placeholder)
    async getNewsData(category, limit) {
        // In production, integrate with NewsAPI or similar
        return [
            {
                title: 'Financial Planning Tips for 2024',
                summary: 'Expert advice on managing your finances in the new year',
                source: 'Financial Times',
                publishedAt: new Date().toISOString()
            }
        ].slice(0, limit);
    }

    // Get calendar data
    async getCalendarData(databaseManager, userId, start, end) {
        try {
            // In production, integrate with Google Calendar or similar
            // For now, return goal deadlines as calendar events
            const goals = await databaseManager.all(
                'SELECT * FROM goals WHERE user_id = ? AND status = "active" AND target_date BETWEEN ? AND ?',
                [userId, start || new Date(), end || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)]
            );
            
            return goals.map(goal => ({
                id: goal.id,
                title: `Goal: ${goal.name}`,
                start: goal.target_date,
                end: goal.target_date,
                type: 'goal',
                description: `Target: $${goal.target_amount}`
            }));
        } catch (error) {
            throw new Error(`Failed to get calendar data: ${error.message}`);
        }
    }

    // Build home quick actions
    async buildHomeQuickActions(databaseManager, userId) {
        try {
            const actions = [
                {
                    id: 'add-transaction',
                    title: 'Add Transaction',
                    icon: 'plus',
                    action: 'navigate',
                    target: '/transactions/add',
                    priority: 1
                },
                {
                    id: 'view-goals',
                    title: 'View Goals',
                    icon: 'target',
                    action: 'navigate',
                    target: '/goals',
                    priority: 2
                },
                {
                    id: 'generate-report',
                    title: 'Generate Report',
                    icon: 'chart',
                    action: 'navigate',
                    target: '/reports',
                    priority: 3
                }
            ];
            
            return actions.sort((a, b) => a.priority - b.priority);
        } catch (error) {
            throw new Error(`Failed to build home quick actions: ${error.message}`);
        }
    }

    // Helper methods for financial calculations
    async getMonthlySummary(databaseManager, userId, month) {
        const income = await databaseManager.get(
            'SELECT SUM(amount) as total FROM transactions WHERE user_id = ? AND type = "income" AND DATE_FORMAT(created_at, "%Y-%m") = ?',
            [userId, month]
        );
        
        const expenses = await databaseManager.get(
            'SELECT SUM(amount) as total FROM transactions WHERE user_id = ? AND type = "expense" AND DATE_FORMAT(created_at, "%Y-%m") = ?',
            [userId, month]
        );
        
        return {
            income: income ? income.total || 0 : 0,
            expenses: expenses ? expenses.total || 0 : 0,
            netIncome: (income ? income.total || 0 : 0) - (expenses ? expenses.total || 0 : 0)
        };
    }

    async getGoalProgressSummary(databaseManager, userId) {
        const goals = await databaseManager.all(
            'SELECT * FROM goals WHERE user_id = ? AND status = "active"',
            [userId]
        );
        
        const totalGoals = goals.length;
        const completedGoals = goals.filter(g => g.saved_amount >= g.target_amount).length;
        const overallProgress = totalGoals > 0 ? 
            goals.reduce((sum, g) => sum + (g.saved_amount / g.target_amount), 0) / totalGoals * 100 : 0;
        
        return { totalGoals, completedGoals, overallProgress: Math.round(overallProgress * 100) / 100 };
    }

    async getRecentAchievements(databaseManager, userId) {
        const achievements = [];
        
        // Check for completed goals
        const completedGoals = await databaseManager.all(
            'SELECT * FROM goals WHERE user_id = ? AND status = "completed" AND updated_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)',
            [userId]
        );
        
        for (let goal of completedGoals) {
            achievements.push({
                type: 'goal_completed',
                title: `Goal Completed: ${goal.name}`,
                description: `You saved $${goal.target_amount}`,
                date: goal.updated_at
            });
        }
        
        return achievements.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    async getMonthlyIncome(databaseManager, userId) {
        const currentMonth = new Date().toISOString().slice(0, 7);
        const result = await databaseManager.get(
            'SELECT SUM(amount) as total FROM transactions WHERE user_id = ? AND type = "income" AND DATE_FORMAT(created_at, "%Y-%m") = ?',
            [userId, currentMonth]
        );
        return result ? result.total || 0 : 0;
    }

    async getMonthlyExpenses(databaseManager, userId) {
        const currentMonth = new Date().toISOString().slice(0, 7);
        const result = await databaseManager.get(
            'SELECT SUM(amount) as total FROM transactions WHERE user_id = ? AND type = "expense" AND DATE_FORMAT(created_at, "%Y-%m") = ?',
            [userId, currentMonth]
        );
        return result ? result.total || 0 : 0;
    }

    async getEmergencyFund(databaseManager, userId) {
        const result = await databaseManager.get(
            'SELECT SUM(amount) as total FROM transactions WHERE user_id = ? AND type = "savings"',
            [userId]
        );
        return result ? result.total || 0 : 0;
    }

    async getOverallGoalProgress(databaseManager, userId) {
        const goals = await databaseManager.all(
            'SELECT * FROM goals WHERE user_id = ? AND status = "active"',
            [userId]
        );
        
        if (goals.length === 0) return 0;
        
        const totalProgress = goals.reduce((sum, goal) => {
            if (goal.target_amount > 0) {
                return sum + (goal.saved_amount / goal.target_amount);
            }
            return sum;
        }, 0);
        
        return (totalProgress / goals.length) * 100;
    }

    async getDebtToIncomeRatio(databaseManager, userId) {
        const monthlyIncome = await this.getMonthlyIncome(databaseManager, userId);
        const monthlyExpenses = await this.getMonthlyExpenses(databaseManager, userId);
        
        if (monthlyIncome <= 0) return 0;
        
        // Simplified debt calculation (in production, you'd have a separate debt table)
        return monthlyExpenses / monthlyIncome;
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

module.exports = new HomeDashboardRoutes();
