// backend/authRoutes.js

const bcrypt = require('bcrypt');
const Validators = require('./validators');
const ErrorHandler = require('./errorHandler');
const config = require('./config');

class AuthRoutes {
    async handle(req, res, context) {
        // ... handle function remains the same ...
        const { sessionManager, databaseManager, parsedUrl } = context;
        const pathname = parsedUrl.pathname;
        const method = req.method.toUpperCase();

        try {
            if (method !== 'POST') {
                return this.sendError(res, 405, 'Method Not Allowed');
            }

            switch (pathname) {
                case '/auth/register':
                    return await this.register(req, res, { databaseManager });

                case '/auth/login':
                    return await this.login(req, res, { sessionManager, databaseManager });

                default:
                    return this.sendError(res, 404, 'Authentication endpoint not found');
            }
        } catch (error) {
            ErrorHandler.logError(error, req);
            return this.sendError(res, 500, 'Internal server error');
        }
    }

    async register(req, res, { databaseManager }) {
        try {
            // REMOVED: employmentStatus is no longer received
            const { email, password, fullName, day, month, year } = req.body;

            // REMOVED: employmentStatus from the check
            if (!email || !password || !fullName || !day || !month || !year) {
                return this.sendError(res, 400, 'All fields are required.');
            }

            // --- Validation (no changes needed for these) ---
            const emailValidation = Validators.validateEmail(email);
            if (!emailValidation.valid) return this.sendError(res, 400, emailValidation.message);
            const passwordValidation = Validators.validatePassword(password);
            if (!passwordValidation.valid) return this.sendError(res, 400, passwordValidation.message);
            const nameValidation = Validators.validateName(fullName);
            if (!nameValidation.valid) return this.sendError(res, 400, nameValidation.message);
            const dobValidation = Validators.validateDateOfBirth(day, month, year);
            if (!dobValidation.valid) return this.sendError(res, 400, dobValidation.message);
            
            // --- Database Operations ---
            const existingUser = await databaseManager.get('SELECT id FROM users WHERE email = ?', [emailValidation.sanitized]);
            if (existingUser) {
                return this.sendError(res, 409, 'Email already registered');
            }

            const hashedPassword = await bcrypt.hash(password, config.security.bcryptRounds);
            const userId = Validators.generateSecureId();

            // REMOVED: employment_status from the INSERT query
            await databaseManager.run(
                `INSERT INTO users (id, email, password_hash, full_name, date_of_birth) VALUES (?, ?, ?, ?, ?)`,
                [userId, emailValidation.sanitized, hashedPassword, nameValidation.sanitized, dobValidation.sanitized]
            );
            
            this.sendSuccess(res, 201, { message: 'Registration successful', userId });

        } catch (error) {
            ErrorHandler.logError(error, req);
            return this.sendError(res, 500, 'Registration failed');
        }
    }
    
    // login function and helpers remain the same
    async login(req, res, { sessionManager, databaseManager }) {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return this.sendError(res, 400, 'Email and password are required.');
            }
            
            const emailValidation = Validators.validateEmail(email);
            if (!emailValidation.valid) {
                return this.sendError(res, 400, emailValidation.message);
            }

            const user = await databaseManager.get(
                'SELECT * FROM users WHERE email = ?',
                [emailValidation.sanitized]
            );

            if (!user || !(await bcrypt.compare(password, user.password_hash))) {
                return this.sendError(res, 401, 'Invalid email or password');
            }
            
            if (!user.is_active) {
                return this.sendError(res, 403, 'Account is deactivated');
            }

            await databaseManager.run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);
            const session = sessionManager.createSession(user.id, user.email);

            this.sendSuccess(res, 200, {
                message: 'Login successful',
                token: session.token,
                user: {
                    id: user.id,
                    fullName: user.full_name,
                    email: user.email,
                }
            });

        } catch (error) {
            ErrorHandler.logError(error, req);
            return this.sendError(res, 500, 'Login failed');
        }
    }

    sendSuccess(res, statusCode, data) {
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, ...data, timestamp: new Date().toISOString() }));
    }

    sendError(res, statusCode, message) {
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: { message, code: statusCode, timestamp: new Date().toISOString() } }));
    }
}

module.exports = new AuthRoutes();