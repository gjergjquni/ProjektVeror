/**
 * Authentication Middleware for JWT-based security
 * Handles token validation, user authentication, and authorization
 */

const ErrorHandler = require('./errorHandler');
const config = require('./config');

class AuthMiddleware {
    constructor(sessionManager, databaseManager) {
        this.sessionManager = sessionManager;
        this.databaseManager = databaseManager; // Receives the database manager
    }

    /**
     * Middleware to require basic authentication.
     * It checks for a valid token and attaches the user to the request.
     */
    requireAuth(req, res, next) {
        try {
            const token = this.extractToken(req);
            if (!token) {
                return this.sendAuthError(res, 'Authentication required', 'NO_TOKEN');
            }

            const session = this.sessionManager.validateSession(token);
            if (!session) {
                return this.sendAuthError(res, 'Token expired or invalid', 'INVALID_TOKEN');
            }

            req.user = {
                userId: session.userId,
                email: session.email,
                token: token
            };

            // Proceed to the next function in the chain (like requireAdmin or the final route handler)
            next();

        } catch (error) {
            ErrorHandler.logError(error, req);
            return this.sendAuthError(res, 'Authentication failed', 'AUTH_ERROR');
        }
    }

    /**
     * Middleware to require admin privileges.
     * This should be used AFTER requireAuth.
     */
    requireAdmin(req, res, next) {
        this.requireAuth(req, res, async () => {
            try {
                const isAdmin = await this.checkAdminRole(req.user.userId);
                if (!isAdmin) {
                    return this.sendAuthError(res, 'Admin privileges required', 'ADMIN_REQUIRED', 403);
                }
                next();
            } catch (error) {
                ErrorHandler.logError(error, req);
                return this.sendAuthError(res, 'Authorization check failed', 'AUTH_CHECK_ERROR');
            }
        });
    }
    
    /**
     * Middleware to require ownership of a resource.
     * Checks if the logged-in user's ID matches the target user ID in the request.
     */
    requireOwnership(req, res, next) {
        this.requireAuth(req, res, () => {
            const targetUserId = req.params.userId || req.body.userId || req.query.userId;
            if (!targetUserId) {
                return this.sendAuthError(res, 'User ID required for ownership check', 'MISSING_USER_ID', 400);
            }

            if (req.user.userId !== targetUserId) {
                this.databaseManager.logAuditEvent(
                    req.user.userId,
                    'UNAUTHORIZED_ACCESS',
                    `User attempted to access resource belonging to ${targetUserId}`,
                    req
                ).catch(err => console.error('Failed to log unauthorized access:', err));

                return this.sendAuthError(res, 'Access denied', 'ACCESS_DENIED', 403);
            }
            
            next();
        });
    }

    /**
     * Checks the database to see if a user has the 'admin' role.
     * This is a helper function used by requireAdmin.
     */
    async checkAdminRole(userId) {
        if (!this.databaseManager) {
            return false;
        }
        try {
            // Note: This assumes you have a 'role' column in your 'users' table.
            // You may need to add this column to your schema in DatabaseManager.js
            const user = await this.databaseManager.get(
                'SELECT role FROM users WHERE id = ? AND is_active = 1',
                [userId]
            );
            return user && user.role === 'admin';
        } catch (error) {
            console.error('Error checking admin role:', error);
            return false;
        }
    }

    /**
     * Extracts JWT token from request headers.
     */
    extractToken(req) {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            return authHeader.substring(7);
        }
        if (req.headers['x-auth-token']) {
            return req.headers['x-auth-token'];
        }
        return null;
    }

    /**
     * Sends a standardized authentication error response.
     */
    sendAuthError(res, message, errorCode, statusCode = 401) {
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: false,
            error: {
                message: message,
                code: errorCode,
                timestamp: new Date().toISOString()
            }
        }));
    }
}

module.exports = AuthMiddleware;