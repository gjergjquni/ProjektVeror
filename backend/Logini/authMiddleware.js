/**
 * Authentication Middleware for JWT-based security
 * Handles token validation, user authentication, and authorization
 */

const ErrorHandler = require('./errorHandler');
const config = require('./config');

class AuthMiddleware {
    constructor(sessionManager) {
        this.sessionManager = sessionManager;
    }

    /**
     * Middleware to require authentication
     * Validates JWT token and adds user info to request
     */
    requireAuth(req, res, next) {
        try {
            // Extract token from various sources
            const token = this.extractToken(req);
            
            if (!token) {
                return this.sendAuthError(res, 'Authentication required', 'NO_TOKEN');
            }

            // Validate token format first
            if (!this.sessionManager.isValidTokenFormat(token)) {
                return this.sendAuthError(res, 'Invalid token format', 'INVALID_TOKEN_FORMAT');
            }

            // Validate and decode token
            const session = this.sessionManager.validateSession(token);
            if (!session) {
                return this.sendAuthError(res, 'Token expired or invalid', 'INVALID_TOKEN');
            }

            // Add user information to request
            req.user = {
                userId: session.userId,
                email: session.email,
                token: token,
                session: session
            };

            // Log successful authentication
            if (global.databaseManager) {
                global.databaseManager.logAuditEvent(
                    session.userId, 
                    'AUTH_SUCCESS', 
                    `User authenticated via ${req.method} ${req.url}`,
                    req
                ).catch(err => console.error('Failed to log auth event:', err));
            }

            next();
            
        } catch (error) {
            ErrorHandler.logError(error, req);
            return this.sendAuthError(res, 'Authentication failed', 'AUTH_ERROR');
        }
    }

    /**
     * Middleware to require admin privileges
     */
    requireAdmin(req, res, next) {
        this.requireAuth(req, res, async () => {
            try {
                // Check if user has admin role
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
     * Middleware to require ownership of resource
     */
    requireOwnership(req, res, next) {
        this.requireAuth(req, res, () => {
            const targetUserId = req.params.userId || req.body.userId || req.query.userId;
            
            if (!targetUserId) {
                return this.sendAuthError(res, 'User ID required', 'MISSING_USER_ID', 400);
            }

            if (req.user.userId !== targetUserId) {
                // Log unauthorized access attempt
                if (global.databaseManager) {
                    global.databaseManager.logAuditEvent(
                        req.user.userId,
                        'UNAUTHORIZED_ACCESS',
                        `Attempted to access user ${targetUserId} data`,
                        req
                    ).catch(err => console.error('Failed to log unauthorized access:', err));
                }

                return this.sendAuthError(res, 'Access denied', 'ACCESS_DENIED', 403);
            }
            
            next();
        });
    }

    /**
     * Middleware to require specific permissions
     */
    requirePermission(permission) {
        return (req, res, next) => {
            this.requireAuth(req, res, async () => {
                try {
                    const hasPermission = await this.checkPermission(req.user.userId, permission);
                    
                    if (!hasPermission) {
                        return this.sendAuthError(res, `Permission '${permission}' required`, 'PERMISSION_DENIED', 403);
                    }

                    next();
                    
                } catch (error) {
                    ErrorHandler.logError(error, req);
                    return this.sendAuthError(res, 'Permission check failed', 'PERMISSION_CHECK_ERROR');
                }
            });
        };
    }

    /**
     * Extract JWT token from request
     */
    extractToken(req) {
        // Check Authorization header (Bearer token)
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            return authHeader.substring(7);
        }

        // Check custom header
        if (req.headers['x-auth-token']) {
            return req.headers['x-auth-token'];
        }

        // Check cookies (if using cookie-based auth)
        if (req.headers.cookie) {
            const cookies = this.parseCookies(req.headers.cookie);
            if (cookies.authToken) {
                return cookies.authToken;
            }
        }

        return null;
    }

    /**
     * Parse cookies string
     */
    parseCookies(cookieString) {
        const cookies = {};
        if (cookieString) {
            cookieString.split(';').forEach(cookie => {
                const [name, value] = cookie.trim().split('=');
                if (name && value) {
                    cookies[name] = decodeURIComponent(value);
                }
            });
        }
        return cookies;
    }

    /**
     * Check if user has admin role
     */
    async checkAdminRole(userId) {
        if (!global.databaseManager) {
            return false; // Default to false if no database
        }

        try {
            const user = await global.databaseManager.get(
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
     * Check if user has specific permission
     */
    async checkPermission(userId, permission) {
        if (!global.databaseManager) {
            return false; // Default to false if no database
        }

        try {
            // This is a simplified permission check
            // In a real application, you'd have a permissions table
            const user = await global.databaseManager.get(
                'SELECT permissions FROM users WHERE id = ? AND is_active = 1',
                [userId]
            );
            
            if (!user || !user.permissions) {
                return false;
            }

            const permissions = JSON.parse(user.permissions);
            return permissions.includes(permission);
            
        } catch (error) {
            console.error('Error checking permission:', error);
            return false;
        }
    }

    /**
     * Send authentication error response
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

    /**
     * Refresh token middleware
     */
    refreshToken(req, res, next) {
        try {
            const token = this.extractToken(req);
            
            if (!token) {
                return this.sendAuthError(res, 'Token required for refresh', 'NO_TOKEN');
            }

            const newSession = this.sessionManager.refreshSession(token);
            
            // Set new token in response headers
            res.setHeader('X-New-Token', newSession.token);
            res.setHeader('X-Token-Expires', newSession.expiresAt.toISOString());
            
            next();
            
        } catch (error) {
            ErrorHandler.logError(error, req);
            return this.sendAuthError(res, 'Token refresh failed', 'REFRESH_FAILED');
        }
    }

    /**
     * Logout middleware
     */
    logout(req, res, next) {
        try {
            const token = this.extractToken(req);
            
            if (token) {
                this.sessionManager.destroySession(token);
                
                // Log logout event
                if (global.databaseManager && req.user) {
                    global.databaseManager.logAuditEvent(
                        req.user.userId,
                        'LOGOUT',
                        'User logged out successfully',
                        req
                    ).catch(err => console.error('Failed to log logout event:', err));
                }
            }

            next();
            
        } catch (error) {
            ErrorHandler.logError(error, req);
            // Continue with logout even if there's an error
            next();
        }
    }
}

module.exports = AuthMiddleware; 