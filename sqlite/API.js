/**
 * API Routes Handler for SQLite operations
 * Follows the same structure as other BackEnd classes
 */

const http = require('http');
const url = require('url');
const DatabaseManager = require('../databaseManager');
const ErrorHandler = require('../errorHandler');
const Validators = require('../validators');

class APIRoutes {
    constructor() {
        this.databaseManager = new DatabaseManager();
    }

    /**
     * Handles routing for /api endpoints
     */
    async handle(req, res, context) {
        const { parsedUrl } = context;
        const pathname = parsedUrl.pathname;
        const method = req.method.toUpperCase();

        try {
            switch (pathname) {
                case '/api/user':
                    return await this.handleUser(req, res, method);

                case '/api/users':
                    return await this.handleUsers(req, res, method);

                default:
                    return this.sendError(res, 404, 'API endpoint not found');
            }
        } catch (error) {
            ErrorHandler.logError(error, req);
            return this.sendError(res, 500, 'Internal server error');
        }
    }

    /**
     * Handle single user operations
     */
    async handleUser(req, res, method) {
        const parsedUrl = url.parse(req.url, true);
        const userId = parsedUrl.query.id;

        switch (method) {
            case 'GET':
                return await this.getUser(req, res, userId);
            
            case 'POST':
                return await this.createUser(req, res);
            
            case 'PUT':
                return await this.updateUser(req, res, userId);
            
            default:
                return this.sendError(res, 405, 'Method not allowed');
        }
    }

    /**
     * Handle multiple users operations
     */
    async handleUsers(req, res, method) {
        switch (method) {
            case 'GET':
                return await this.getAllUsers(req, res);
            
            default:
                return this.sendError(res, 405, 'Method not allowed');
        }
    }

    /**
     * Get a single user by ID
     */
    async getUser(req, res, userId) {
        try {
            if (!userId) {
                return this.sendError(res, 400, 'User ID is required');
            }

            const user = await this.databaseManager.get(
                'SELECT id, email, full_name, date_of_birth, employment_status, created_at FROM users WHERE id = ?',
                [userId]
            );

            if (!user) {
                return this.sendError(res, 404, 'User not found');
            }

            this.sendSuccess(res, 200, { user });
        } catch (error) {
            ErrorHandler.logError(error, req);
            return this.sendError(res, 500, 'Failed to get user');
        }
    }

    /**
     * Get all users
     */
    async getAllUsers(req, res) {
        try {
            const users = await this.databaseManager.all(
                'SELECT id, email, full_name, date_of_birth, employment_status, created_at FROM users WHERE is_active = 1'
            );

            this.sendSuccess(res, 200, { users, count: users.length });
        } catch (error) {
            ErrorHandler.logError(error, req);
            return this.sendError(res, 500, 'Failed to get users');
        }
    }

    /**
     * Create a new user
     */
    async createUser(req, res) {
        try {
            const { email, password, fullName, dateOfBirth, employmentStatus } = req.body;

            // Validation
            if (!email || !password || !fullName) {
                return this.sendError(res, 400, 'Email, password, and full name are required');
            }

            const emailValidation = Validators.validateEmail(email);
            if (!emailValidation.valid) {
                return this.sendError(res, 400, emailValidation.message);
            }

            // Check if user already exists
            const existingUser = await this.databaseManager.get(
                'SELECT id FROM users WHERE email = ?',
                [emailValidation.sanitized]
            );

            if (existingUser) {
                return this.sendError(res, 409, 'User already exists');
            }

            const userId = Validators.generateSecureId();
            const hashedPassword = await require('bcrypt').hash(password, 10);

            await this.databaseManager.run(
                `INSERT INTO users (id, email, password_hash, full_name, date_of_birth, employment_status) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [userId, emailValidation.sanitized, hashedPassword, fullName, dateOfBirth || null, employmentStatus || 'student']
            );

            this.sendSuccess(res, 201, { 
                message: 'User created successfully', 
                userId 
            });
        } catch (error) {
            ErrorHandler.logError(error, req);
            return this.sendError(res, 500, 'Failed to create user');
        }
    }

    /**
     * Update user
     */
    async updateUser(req, res, userId) {
        try {
            if (!userId) {
                return this.sendError(res, 400, 'User ID is required');
            }

            const { fullName, dateOfBirth, employmentStatus } = req.body;

            const result = await this.databaseManager.run(
                `UPDATE users SET full_name = ?, date_of_birth = ?, employment_status = ?, updated_at = CURRENT_TIMESTAMP 
                 WHERE id = ?`,
                [fullName, dateOfBirth, employmentStatus, userId]
            );

            if (result.changes === 0) {
                return this.sendError(res, 404, 'User not found');
            }

            this.sendSuccess(res, 200, { message: 'User updated successfully' });
        } catch (error) {
            ErrorHandler.logError(error, req);
            return this.sendError(res, 500, 'Failed to update user');
        }
    }

    /**
     * Send success response
     */
    sendSuccess(res, statusCode, data) {
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            data: data
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
                statusCode: statusCode
            }
        }));
    }
}

module.exports = APIRoutes;