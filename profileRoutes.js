/**
 * Profile Routes Handler
 * Handles user profile management and settings
 */

const Validators = require('../validators');
const ErrorHandler = require('../errorHandler');

class ProfileRoutes {
    async handle(req, res, context) {
        const { sessionManager, authMiddleware, databaseManager, parsedUrl } = context;
        const pathname = parsedUrl.pathname;
        const method = req.method.toUpperCase();

        try {
            // Require authentication for all profile routes
            authMiddleware.requireAuth(req, res, async () => {
                switch (pathname) {
                    case '/profile':
                        if (method === 'GET') {
                            return await this.getProfile(req, res, { databaseManager });
                        } else if (method === 'PUT') {
                            return await this.updateProfile(req, res, { databaseManager });
                        }
                        break;

                    case '/profile/settings':
                        if (method === 'GET') {
                            return await this.getSettings(req, res, { databaseManager });
                        } else if (method === 'PUT') {
                            return await this.updateSettings(req, res, { databaseManager });
                        }
                        break;

                    default:
                        return this.sendError(res, 404, 'Profile endpoint not found');
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
                    savingsGoalPercentage: user.savings_goal_percentage
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
            const { fullName, jobTitle, monthlySalary, savingsGoalPercentage } = req.body;

            // Validate name if provided
            if (fullName) {
                const nameValidation = Validators.validateName(fullName);
                if (!nameValidation.valid) {
                    return this.sendError(res, 400, nameValidation.message);
                }
            }

            // Validate profile data if provided
            if (jobTitle || monthlySalary || savingsGoalPercentage) {
                const profileValidation = Validators.validateUserProfile(
                    jobTitle || '',
                    monthlySalary || 0,
                    savingsGoalPercentage || 0
                );
                if (!profileValidation.valid) {
                    return this.sendError(res, 400, profileValidation.message);
                }
            }

            // Update user name if provided
            if (fullName) {
                await databaseManager.run(
                    'UPDATE users SET full_name = ? WHERE id = ?',
                    [fullName, userId]
                );
            }

            // Update or create profile
            if (jobTitle || monthlySalary || savingsGoalPercentage) {
                await databaseManager.run(`
                    INSERT OR REPLACE INTO user_profiles (user_id, job_title, monthly_salary, savings_goal_percentage, updated_at)
                    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
                `, [
                    userId,
                    jobTitle || null,
                    monthlySalary || null,
                    savingsGoalPercentage || null
                ]);
            }

            // Log profile update
            await databaseManager.logAuditEvent(
                userId,
                'PROFILE_UPDATED',
                'User profile updated',
                req
            );

            this.sendSuccess(res, 200, {
                message: 'Profile updated successfully'
            });

        } catch (error) {
            ErrorHandler.logError(error, req);
            return this.sendError(res, 500, 'Failed to update profile');
        }
    }

    async getSettings(req, res, { databaseManager }) {
        try {
            const userId = req.user.userId;

            // Get user settings (you can extend this with a settings table)
            const settings = {
                notifications: {
                    email: true,
                    push: false
                },
                privacy: {
                    shareData: false,
                    publicProfile: false
                },
                preferences: {
                    currency: 'ALL',
                    language: 'sq',
                    timezone: 'Europe/Tirane'
                }
            };

            this.sendSuccess(res, 200, {
                settings
            });

        } catch (error) {
            ErrorHandler.logError(error, req);
            return this.sendError(res, 500, 'Failed to get settings');
        }
    }

    async updateSettings(req, res, { databaseManager }) {
        try {
            const userId = req.user.userId;
            const { notifications, privacy, preferences } = req.body;

            // Validate settings (you can add more validation here)
            if (notifications && typeof notifications !== 'object') {
                return this.sendError(res, 400, 'Invalid notifications settings');
            }

            if (privacy && typeof privacy !== 'object') {
                return this.sendError(res, 400, 'Invalid privacy settings');
            }

            if (preferences && typeof preferences !== 'object') {
                return this.sendError(res, 400, 'Invalid preferences settings');
            }

            // Update settings (in a real app, you'd store these in a settings table)
            // For now, we'll just log the update

            // Log settings update
            await databaseManager.logAuditEvent(
                userId,
                'SETTINGS_UPDATED',
                'User settings updated',
                req
            );

            this.sendSuccess(res, 200, {
                message: 'Settings updated successfully'
            });

        } catch (error) {
            ErrorHandler.logError(error, req);
            return this.sendError(res, 500, 'Failed to update settings');
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

module.exports = new ProfileRoutes(); 