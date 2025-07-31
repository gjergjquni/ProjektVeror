/**
 * Main server file for Elioti Financial Platform
 * Uses native Node.js http module for better security and control
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Import core modules
const config = require('./config');
const ErrorHandler = require('./errorHandler');
const SessionManager = require('./sessionManager');
const AuthMiddleware = require('./authMiddleware');
const Validators = require('./validators');
const DatabaseManager = require('./databaseManager');
const RateLimiter = require('./rateLimiter');

// Import route handlers
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const transactionRoutes = require('./transactionRoutes');
const profileRoutes = require('./profileRoutes');

class EliotiServer {
    constructor() {
        this.sessionManager = new SessionManager();
        this.databaseManager = new DatabaseManager();
        this.authMiddleware = new AuthMiddleware(this.sessionManager, this.databaseManager);
        this.rateLimiter = new RateLimiter();
        
        this.routes = {
            '/auth': authRoutes,
            '/user': userRoutes,
            '/transaction': transactionRoutes,
            '/profile': profileRoutes
        };
        
        this.server = null;
    }

    /**
     * Initialize the server
     */
    async initialize() {
        try {
            config.validate();
            await this.databaseManager.connect();
            
            this.server = http.createServer(this.handleRequest.bind(this));
            
            this.server.listen(config.server.port, config.server.host, () => {
                console.log(`🚀 Elioti server running on ${config.server.host}:${config.server.port}`);
                console.log(`📊 Environment: ${config.server.environment}`);
                console.log(`🔐 Security: JWT enabled, bcrypt rounds: ${config.security.bcryptRounds}`);
            });

            this.setupGracefulShutdown();
            
        } catch (error) {
            console.error('❌ Failed to initialize server:', error);
            process.exit(1);
        }
    }

    /**
     * Main request handler
     */
    async handleRequest(req, res) {
        try {
            const parsedUrl = url.parse(req.url, true);
            const pathname = parsedUrl.pathname;
            const method = req.method.toUpperCase();

            this.setCORSHeaders(res);

            if (method === 'OPTIONS') {
                res.writeHead(200);
                res.end();
                return;
            }

            // --- RATE LIMITER DISABLED FOR DEVELOPMENT ---
            // The following block has been commented out to make testing easier.
            // Remember to re-enable it before deploying to production.
            /*
            const clientIP = this.getClientIP(req);
            if (!this.rateLimiter.checkLimit(clientIP, pathname)) {
                return this.sendError(res, 429, 'Rate limit exceeded');
            }
            */

            if (['POST', 'PUT', 'PATCH'].includes(method)) {
                await this.parseRequestBody(req);
            }

            const routeHandler = this.findRouteHandler(pathname);
            if (routeHandler) {
                await routeHandler.handle(req, res, {
                    sessionManager: this.sessionManager,
                    authMiddleware: this.authMiddleware,
                    databaseManager: this.databaseManager,
                    parsedUrl
                });
            } else {
                this.sendError(res, 404, 'Route not found');
            }

        } catch (error) {
            ErrorHandler.logError(error, req);
            this.sendError(res, 500, 'Internal server error');
        }
    }

    /**
     * Find appropriate route handler
     */
    findRouteHandler(pathname) {
        for (const [prefix, handler] of Object.entries(this.routes)) {
            if (pathname.startsWith(prefix)) {
                return handler;
            }
        }
        return null;
    }

    /**
     * Parse request body
     */
    async parseRequestBody(req) {
        return new Promise((resolve, reject) => {
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
                if (body.length > 1e6) { // 1MB limit
                    req.destroy();
                    reject(new Error('Request body too large'));
                }
            });
            req.on('end', () => {
                try {
                    req.body = body ? JSON.parse(body) : {};
                    resolve();
                } catch (error) {
                    reject(new Error('Invalid JSON in request body'));
                }
            });
            req.on('error', reject);
        });
    }

    /**
     * Set CORS headers
     */
    setCORSHeaders(res) {
        res.setHeader('Access-Control-Allow-Origin', config.cors.origin);
        res.setHeader('Access-Control-Allow-Methods', config.cors.methods.join(', '));
        res.setHeader('Access-Control-Allow-Headers', config.cors.allowedHeaders.join(', '));
        res.setHeader('Access-control-max-age', '86400');
    }

    /**
     * Get client IP address
     */
    getClientIP(req) {
        return req.headers['x-forwarded-for'] ||
               req.headers['x-real-ip'] ||
               req.connection.remoteAddress ||
               req.socket.remoteAddress;
    }

    /**
     * Send error response
     */
    sendError(res, statusCode, message) {
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: false,
            error: { message, code: statusCode, timestamp: new Date().toISOString() }
        }));
    }

    /**
     * Setup graceful shutdown
     */
    setupGracefulShutdown() {
        const shutdown = async (signal) => {
            console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
            if (this.server) {
                this.server.close(() => console.log('✅ HTTP server closed'));
            }
            if (this.databaseManager) {
                await this.databaseManager.disconnect();
            }
            console.log('👋 Server shutdown complete');
            process.exit(0);
        };

        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));
    }
}

// Start server if this file is run directly
if (require.main === module) {
    const server = new EliotiServer();
    server.initialize().catch(error => {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    });
}

module.exports = EliotiServer;