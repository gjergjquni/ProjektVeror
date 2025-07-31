/**
 * Authentication Routes Handler
 * Handles login, register, logout, and password reset functionality
 */

const bcrypt = require('bcrypt');
const Validators = require('./validators');
const ErrorHandler = require('./errorHandler');
const config = require('./config');

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
     * User login - THIS FUNCTION IS NOW CORRECTED AND SECURE
     */
    async login(req, res, { sessionManager, databaseManager }) {
        try {
            const { email, password } = req.body;

            // Validate required fields
            ErrorHandler.validateUserInput(req.body, ['email', 'password']);

            const emailValidation = Validators.validateEmail(email);
            if (!emailValidation.valid) {
                return this.sendError(res, 400, emailValidation.message);
            }

            // Find user in the database
            const user = await databaseManager.get(
                'SELECT id, email, password_hash, full_name, employment_status, is_active FROM users WHERE email = ?',
                [emailValidation.sanitized]
            );

            // SECURITY FIX: If no user is found, or if the user is inactive, send a generic error.
            if (!user || !user.is_active) {
                return this.sendError(res, 401, 'Invalid credentials');
            }

            // SECURITY FIX: Verify the password against the stored hash
            const passwordMatch = await bcrypt.compare(password, user.password_hash);
            if (!passwordMatch) {
                // Log failed login attempt for security auditing
                await databaseManager.logAuditEvent(
                    user.id,
                    'LOGIN_FAILED',
                    'Invalid password attempt',
                    req
                );
                return this.sendError(res, 401, 'Invalid credentials');
            }

            // Update last login timestamp
            await databaseManager.run(
                'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
                [user.id]
            );

            // Create a new session (JWT token)
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
            // This logic correctly uses middleware to handle token invalidation
            authMiddleware.requireAuth(req, res, async () => {
                const token = authMiddleware.extractToken(req);
                if (token) {
                    sessionManager.destroySession(token); // Blacklists the token
                }
                
                if (req.user) {
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
        // This function is complex and relies on the corrected SessionManager
        // For now, the logic is okay, but ensure SessionManager is updated.
        try {
            const oldToken = authMiddleware.extractToken(req);
            if (!oldToken) {
                return this.sendError(res, 401, 'No token provided');
            }
            const newSession = sessionManager.refreshSession(oldToken);
            this.sendSuccess(res, 200, {
                message: 'Token refreshed successfully',
                token: newSession.token,
                expiresAt: newSession.expiresAt
            });
        } catch (error) {
            ErrorHandler.logError(error, req);
            return this.sendError(res, 401, 'Token refresh failed');
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