/**
 * Authentication Routes Handler
 * Handles login, register, logout, and password reset functionality
 */

const bcrypt = require('bcrypt');
const Validators = require('../validators');
const ErrorHandler = require('../errorHandler');
const config = require('../config');

class AuthRoutes {
    /**
     * Handle authentication routes
     */
    async handle(req, res, context) {
        const { sessionManager, authMiddleware, databaseManager, parsedUrl } = context;
        const pathname = parsedUrl.pathname;
        const method = req.method.toUpperCase();

        try {
            // Route to appropriate handler
            switch (pathname) {
                case '/auth/register':
                    if (method === 'POST') {
                        return await this.register(req, res, { sessionManager, databaseManager });
                    }
                    break;

                case '/auth/login':
                    if (method === 'POST') {
                        return await this.login(req, res, { sessionManager, databaseManager });
                    }
                    break;

                case '/auth/logout':
                    if (method === 'POST') {
                        return await this.logout(req, res, { sessionManager, authMiddleware, databaseManager });
                    }
                    break;

                case '/auth/refresh':
                    if (method === 'POST') {
                        return await this.refreshToken(req, res, { sessionManager, authMiddleware });
                    }
                    break;

                case '/auth/forgot-password':
                    if (method === 'POST') {
                        return await this.forgotPassword(req, res, { databaseManager });
                    }
                    break;

                case '/auth/reset-password':
                    if (method === 'POST') {
                        return await this.resetPassword(req, res, { databaseManager });
                    }
                    break;

                default:
                    return this.sendError(res, 404, 'Authentication endpoint not found');
            }

        } catch (error) {
            ErrorHandler.logError(error, req);
            return this.sendError(res, 500, 'Internal server error');
        }
    }

    /**
     * User registration
     */
    async register(req, res, { sessionManager, databaseManager }) {
        try {
            const { email, password, fullName, day, month, year, employmentStatus } = req.body;

            // Validate required fields
            ErrorHandler.validateUserInput(req.body, ['email', 'password', 'fullName', 'day', 'month', 'year', 'employmentStatus']);

            // Enhanced validation
            const emailValidation = Validators.validateEmail(email);
            if (!emailValidation.valid) {
                return this.sendError(res, 400, emailValidation.message);
            }

            const passwordValidation = Validators.validatePassword(password);
            if (!passwordValidation.valid) {
                return this.sendError(res, 400, passwordValidation.message);
            }

            const nameValidation = Validators.validateName(fullName);
            if (!nameValidation.valid) {
                return this.sendError(res, 400, nameValidation.message);
            }

            const dobValidation = Validators.validateDateOfBirth(day, month, year);
            if (!dobValidation.valid) {
                return this.sendError(res, 400, dobValidation.message);
            }

            const statusValidation = Validators.validateEmploymentStatus(employmentStatus);
            if (!statusValidation.valid) {
                return this.sendError(res, 400, statusValidation.message);
            }

            // Check if user already exists
            const existingUser = await databaseManager.get(
                'SELECT id FROM users WHERE email = ?',
                [emailValidation.sanitized]
            );

            if (existingUser) {
                return this.sendError(res, 409, 'Email already registered');
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, config.security.bcryptRounds);

            // Generate user ID
            const userId = Validators.generateSecureId();

            // Create user in database
            await databaseManager.run(`
                INSERT INTO users (id, email, password_hash, full_name, date_of_birth, employment_status)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [
                userId,
                emailValidation.sanitized,
                hashedPassword,
                nameValidation.sanitized,
                dobValidation.sanitized,
                statusValidation.sanitized
            ]);

            // Log registration event
            await databaseManager.logAuditEvent(
                userId,
                'USER_REGISTERED',
                'New user registration',
                req
            );

            // Create session
            const session = sessionManager.createSession(userId, emailValidation.sanitized);

            this.sendSuccess(res, 201, {
                message: 'Registration successful',
                userId: userId,
                token: session.token,
                expiresAt: session.expiresAt,
                user: {
                    email: emailValidation.sanitized,
                    fullName: nameValidation.sanitized,
                    employmentStatus: statusValidation.sanitized
                }
            });

        } catch (error) {
            ErrorHandler.logError(error, req);
            return this.sendError(res, 500, 'Registration failed');
        }
    }

    /**
     * User login
     */
    async login(req, res, { sessionManager, databaseManager }) {
        try {
            const { email, password } = req.body;

            // Validate required fields
            ErrorHandler.validateUserInput(req.body, ['email', 'password']);

            // Validate email format
            const emailValidation = Validators.validateEmail(email);
            if (!emailValidation.valid) {
                return this.sendError(res, 400, emailValidation.message);
            }

            // Find user
            const user = await databaseManager.get(
                'SELECT id, email, password_hash, full_name, employment_status, is_active FROM users WHERE email = ?',
                [emailValidation.sanitized]
            );

            if (!user) {
                return this.sendError(res, 401, 'Invalid credentials');
            }

            if (!user.is_active) {
                return this.sendError(res, 401, 'Account is deactivated');
            }

            // Verify password
            const passwordMatch = await bcrypt.compare(password, user.password_hash);
            if (!passwordMatch) {
                // Log failed login attempt
                await databaseManager.logAuditEvent(
                    user.id,
                    'LOGIN_FAILED',
                    'Invalid password attempt',
                    req
                );

                return this.sendError(res, 401, 'Invalid credentials');
            }

            // Update last login
            await databaseManager.run(
                'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
                [user.id]
            );

            // Create session
            const session = sessionManager.createSession(user.id, user.email);

            // Log successful login
            await databaseManager.logAuditEvent(
                user.id,
                'LOGIN_SUCCESS',
                'User logged in successfully',
                req
            );

            this.sendSuccess(res, 200, {
                message: 'Login successful',
                userId: user.id,
                token: session.token,
                expiresAt: session.expiresAt,
                user: {
                    email: user.email,
                    fullName: user.full_name,
                    employmentStatus: user.employment_status
                }
            });

        } catch (error) {
            ErrorHandler.logError(error, req);
            return this.sendError(res, 500, 'Login failed');
        }
    }

    /**
     * User logout
     */
    async logout(req, res, { sessionManager, authMiddleware, databaseManager }) {
        try {
            // Use auth middleware to validate token
            authMiddleware.logout(req, res, async () => {
                if (req.user) {
                    // Log logout event
                    await databaseManager.logAuditEvent(
                        req.user.userId,
                        'LOGOUT',
                        'User logged out successfully',
                        req
                    );
                }

                this.sendSuccess(res, 200, {
                    message: 'Logout successful'
                });
            });

        } catch (error) {
            ErrorHandler.logError(error, req);
            return this.sendError(res, 500, 'Logout failed');
        }
    }

    /**
     * Refresh authentication token
     */
    async refreshToken(req, res, { sessionManager, authMiddleware }) {
        try {
            // Use auth middleware to refresh token
            authMiddleware.refreshToken(req, res, () => {
                this.sendSuccess(res, 200, {
                    message: 'Token refreshed successfully',
                    newToken: res.getHeader('X-New-Token'),
                    expiresAt: res.getHeader('X-Token-Expires')
                });
            });

        } catch (error) {
            ErrorHandler.logError(error, req);
            return this.sendError(res, 500, 'Token refresh failed');
        }
    }

    /**
     * Forgot password request
     */
    async forgotPassword(req, res, { databaseManager }) {
        try {
            const { email } = req.body;

            if (!email) {
                return this.sendError(res, 400, 'Email is required');
            }

            const emailValidation = Validators.validateEmail(email);
            if (!emailValidation.valid) {
                return this.sendError(res, 400, emailValidation.message);
            }

            // Check if user exists
            const user = await databaseManager.get(
                'SELECT id, email FROM users WHERE email = ? AND is_active = 1',
                [emailValidation.sanitized]
            );

            if (!user) {
                // Don't reveal if email exists or not (security)
                return this.sendSuccess(res, 200, {
                    message: 'If the email exists, a password reset link has been sent'
                });
            }

            // Generate reset token (in a real app, you'd send this via email)
            const resetToken = Validators.generateSecureId();
            const resetExpires = new Date(Date.now() + 3600000); // 1 hour

            // Store reset token (in a real app, you'd have a password_resets table)
            await databaseManager.run(`
                INSERT OR REPLACE INTO password_resets (user_id, reset_token, expires_at)
                VALUES (?, ?, ?)
            `, [user.id, resetToken, resetExpires.toISOString()]);

            // Log password reset request
            await databaseManager.logAuditEvent(
                user.id,
                'PASSWORD_RESET_REQUESTED',
                'Password reset requested',
                req
            );

            // In production, send email here
            console.log(`Password reset token for ${user.email}: ${resetToken}`);

            this.sendSuccess(res, 200, {
                message: 'If the email exists, a password reset link has been sent'
            });

        } catch (error) {
            ErrorHandler.logError(error, req);
            return this.sendError(res, 500, 'Password reset request failed');
        }
    }

    /**
     * Reset password with token
     */
    async resetPassword(req, res, { databaseManager }) {
        try {
            const { token, newPassword } = req.body;

            if (!token || !newPassword) {
                return this.sendError(res, 400, 'Token and new password are required');
            }

            const passwordValidation = Validators.validatePassword(newPassword);
            if (!passwordValidation.valid) {
                return this.sendError(res, 400, passwordValidation.message);
            }

            // Find valid reset token
            const resetRecord = await databaseManager.get(`
                SELECT user_id, expires_at FROM password_resets 
                WHERE reset_token = ? AND expires_at > datetime('now')
            `, [token]);

            if (!resetRecord) {
                return this.sendError(res, 400, 'Invalid or expired reset token');
            }

            // Hash new password
            const hashedPassword = await bcrypt.hash(newPassword, config.security.bcryptRounds);

            // Update user password
            await databaseManager.run(
                'UPDATE users SET password_hash = ? WHERE id = ?',
                [hashedPassword, resetRecord.user_id]
            );

            // Delete used reset token
            await databaseManager.run(
                'DELETE FROM password_resets WHERE reset_token = ?',
                [token]
            );

            // Log password reset
            await databaseManager.logAuditEvent(
                resetRecord.user_id,
                'PASSWORD_RESET_COMPLETED',
                'Password reset completed',
                req
            );

            this.sendSuccess(res, 200, {
                message: 'Password reset successful'
            });

        } catch (error) {
            ErrorHandler.logError(error, req);
            return this.sendError(res, 500, 'Password reset failed');
        }
    }

    /**
     * Send success response
     */
    sendSuccess(res, statusCode, data) {
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            ...data,
            timestamp: new Date().toISOString()
        }));
    }

    /**
     * Send error response
     */
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

module.exports = new AuthRoutes(); 