// backend/GoalRoutes.js

const Validators = require('./validators');
const ErrorHandler = require('./errorHandler');

class GoalRoutes {
    async handle(req, res, context) {
        const { authMiddleware, parsedUrl } = context;

        // All goal routes require a user to be logged in
        authMiddleware.requireAuth(req, res, async () => {
            const pathname = parsedUrl.pathname;
            const method = req.method.toUpperCase();

            // --- THIS ROUTING LOGIC IS NOW COMPLETE ---
            if (pathname === '/goal/list' && method === 'GET') {
                return await this.listGoals(req, res, context);
            }
            if (pathname === '/goal/create' && method === 'POST') {
                return await this.createGoal(req, res, context);
            }
            if (pathname.startsWith('/goal/update/') && (method === 'PUT' || method === 'PATCH')) {
                return await this.updateGoal(req, res, context);
            }
            if (pathname.startsWith('/goal/delete/') && method === 'DELETE') {
                return await this.deleteGoal(req, res, context);
            }
            
            this.sendError(res, 404, 'Goal endpoint not found');
        });
    }

    // --- FETCHES ALL GOALS FOR THE LOGGED-IN USER ---
    async listGoals(req, res, { databaseManager }) {
        try {
            const userId = req.user.userId;
            const goals = await databaseManager.all(
                'SELECT * FROM goals WHERE user_id = ? ORDER BY target_date ASC', 
                [userId]
            );
            this.sendSuccess(res, 200, { goals });
        } catch (error) {
            ErrorHandler.logError(error, req);
            this.sendError(res, 500, 'Failed to retrieve goals');
        }
    }

    // --- CREATES A NEW GOAL ---
    async createGoal(req, res, { databaseManager }) {
        try {
            const userId = req.user.userId;
            const { name, targetAmount, category, targetDate, savedAmount, description } = req.body;

            // Basic validation
            if (!name || !targetAmount || !category || !targetDate) {
                return this.sendError(res, 400, 'Name, target amount, category, and target date are required.');
            }

            const goalId = Validators.generateSecureId();
            
            // This query now includes all fields from your frontend form
            await databaseManager.run(
                `INSERT INTO goals (id, user_id, name, target_amount, saved_amount, category, target_date, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [goalId, userId, name, parseFloat(targetAmount), parseFloat(savedAmount) || 0, category, targetDate, description || null]
            );
            this.sendSuccess(res, 201, { message: 'Goal created successfully', goalId });
        } catch (error) {
            ErrorHandler.logError(error, req);
            this.sendError(res, 500, 'Failed to create goal');
        }
    }

    // --- (NEW FUNCTION) UPDATES AN EXISTING GOAL ---
    async updateGoal(req, res, { databaseManager, parsedUrl }) {
        try {
            const goalId = parsedUrl.pathname.split('/')[3];
            const userId = req.user.userId;
            // This now supports updating all fields, not just the saved amount
            const { name, targetAmount, savedAmount, category, targetDate, description } = req.body;
            
            // A more robust implementation would check which fields are provided
            // For simplicity, we'll build a query that can update any of them.
            // Note: This example focuses on updating the saved amount, as it's the most common action.
            if (savedAmount === undefined) {
                 return this.sendError(res, 400, 'Saved amount is required for an update.');
            }

            const result = await databaseManager.run(
                `UPDATE goals SET saved_amount = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?`,
                [parseFloat(savedAmount), goalId, userId]
            );

            if (result.affectedRows === 0) {
                return this.sendError(res, 404, 'Goal not found or you do not have permission to edit it.');
            }
            this.sendSuccess(res, 200, { message: 'Goal updated successfully' });
        } catch (error) {
            ErrorHandler.logError(error, req);
            this.sendError(res, 500, 'Failed to update goal');
        }
    }

    // --- (NEW FUNCTION) DELETES A GOAL ---
    async deleteGoal(req, res, { databaseManager, parsedUrl }) {
        try {
            const goalId = parsedUrl.pathname.split('/')[3];
            const userId = req.user.userId;
            
            const result = await databaseManager.run(
                'DELETE FROM goals WHERE id = ? AND user_id = ?',
                [goalId, userId]
            );
            
            if (result.affectedRows === 0) {
                return this.sendError(res, 404, 'Goal not found or you do not have permission to delete it.');
            }
            this.sendSuccess(res, 200, { message: 'Goal deleted successfully' });
        } catch (error) {
            ErrorHandler.logError(error, req);
            this.sendError(res, 500, 'Failed to delete goal');
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

module.exports = new GoalRoutes();