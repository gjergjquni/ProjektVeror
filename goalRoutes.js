const Validators = require('./validators');
const ErrorHandler = require('./errorHandler');

class GoalRoutes {
    async handle(req, res, context) {
        const { authMiddleware } = context;

        // Protect all goal routes
        authMiddleware.requireAuth(req, res, async () => {
            const pathname = context.parsedUrl.pathname;
            const method = req.method.toUpperCase();

            if (pathname === '/goal/create' && method === 'POST') {
                await this.createGoal(req, res, context);
            } else if (pathname === '/goal/list' && method === 'GET') {
                await this.listGoals(req, res, context);
            } else {
                this.sendError(res, 404, 'Goal endpoint not found');
            }
        });
    }

    async createGoal(req, res, { databaseManager }) {
        try {
            const { name, targetAmount, category, targetDate } = req.body;
            const userId = req.user.userId;

            if (!name || !targetAmount) {
                return this.sendError(res, 400, 'Goal name and target amount are required.');
            }

            const goalId = Validators.generateSecureId();
            await databaseManager.run(
                `INSERT INTO goals (id, user_id, name, target_amount, category, target_date) VALUES (?, ?, ?, ?, ?, ?)`,
                [goalId, userId, name, parseFloat(targetAmount), category, targetDate]
            );
            this.sendSuccess(res, 201, { message: 'Goal created successfully', goalId });
        } catch (error) {
            ErrorHandler.logError(error, req);
            this.sendError(res, 500, 'Failed to create goal');
        }
    }

    async listGoals(req, res, { databaseManager }) {
        try {
            const userId = req.user.userId;
            const goals = await databaseManager.all('SELECT * FROM goals WHERE user_id = ?', [userId]);
            this.sendSuccess(res, 200, { goals });
        } catch (error) {
            ErrorHandler.logError(error, req);
            this.sendError(res, 500, 'Failed to retrieve goals');
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

module.exports = new GoalRoutes();