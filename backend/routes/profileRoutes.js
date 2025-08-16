// profileRoutes.js

const Validators = require('../utils/validators');
const ErrorHandler = require('../middleware/errorHandler');

class ProfileRoutes {
    async handle(req, res, context) {
        const { authMiddleware, parsedUrl } = context;
        const pathname = parsedUrl.pathname;
        const method = req.method.toUpperCase();

        try {
            // Require authentication for all profile routes
            authMiddleware.requireAuth(req, res, async () => {
                if (pathname === '/profile' && method === 'GET') {
                    return await this.getProfile(req, res, context);
                }
                if (pathname === '/profile' && (method === 'PUT' || method === 'POST')) {
                    return await this.updateProfile(req, res, context);
                }
                return this.sendError(res, 404, 'Profile endpoint not found');
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
                       u.created_at, u.last_login, up.job_title, up.monthly_salary
                FROM users u
                LEFT JOIN user_profiles up ON u.id = up.user_id
                WHERE u.id = ? AND u.is_active = 1
            `, [userId]);

            if (!user) {
                return this.sendError(res, 404, 'User not found');
            }

            this.sendSuccess(res, 200, {
                profile: {
                    id: user.id,
                    email: user.email,
                    fullName: user.full_name,
                    dateOfBirth: user.date_of_birth,
                    employmentStatus: user.employment_status,
                    createdAt: user.created_at,
                    lastLogin: user.last_login,
                    jobTitle: user.job_title,
                    monthlySalary: user.monthly_salary,
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
            const { fullName, jobTitle, monthlySalary } = req.body;

            if (fullName) {
                // This part updates the 'users' table
                await databaseManager.run(
                    'UPDATE users SET full_name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                    [fullName, userId]
                );
            }

            // --- FIX: This logic correctly handles the separate user_profiles table ---
            if (jobTitle || monthlySalary) {
                // This query will INSERT a new profile row if one doesn't exist for the user,
                // or UPDATE the existing one if it does.
                await databaseManager.run(`
                    INSERT INTO user_profiles (user_id, job_title, monthly_salary)
                    VALUES (?, ?, ?)
                    ON DUPLICATE KEY UPDATE 
                       job_title = VALUES(job_title), 
                       monthly_salary = VALUES(monthly_salary)
                `, [
                    userId,
                    jobTitle || null,
                    monthlySalary || null
                ]);
            }

            this.sendSuccess(res, 200, {
                message: 'Profile updated successfully'
            });

        } catch (error) {
            ErrorHandler.logError(error, req);
            return this.sendError(res, 500, 'Failed to update profile');
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

module.exports = new ProfileRoutes();