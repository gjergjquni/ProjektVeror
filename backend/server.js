// server.js

require('dotenv').config();

const http = require('http');
const url = require('url');

// Core modules
const config = require('./utils/config');
const ErrorHandler = require('./middleware/errorHandler');
const SessionManager = require('./services/sessionManager');
const AuthMiddleware = require('./middleware/authMiddleware');
const DatabaseManager = require('./services/databaseManager');
const RateLimiter = require('./middleware/rateLimiter');

// Route handlers
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const goalRoutes = require('./routes/goalRoutes');
const profileRoutes = require('./routes/profileRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const helpRoutes = require('./routes/helpRoutes');
const aiChatRoutes = require('./routes/aiChatRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const homeDashboardRoutes = require('./routes/homeDashboardRoutes');

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
            '/goal': goalRoutes,
            '/profile': profileRoutes,
            '/settings': settingsRoutes,
            '/help': helpRoutes,
            '/ai-chat': aiChatRoutes,
            '/dashboard': dashboardRoutes,
            '/home': homeDashboardRoutes
        };
        
        this.server = null;
    }

    async initialize() {
        try {
            config.validate();
            await this.databaseManager.connect();
            this.server = http.createServer(this.handleRequest.bind(this));
            this.server.listen(config.server.port, config.server.host, () => {
                console.log(`🚀 Elioti server running on ${config.server.host}:${config.server.port}`);
            });
            this.setupGracefulShutdown();
        } catch (error) {
            console.error('❌ Failed to initialize server:', error);
            process.exit(1);
        }
    }

    async handleRequest(req, res) {
        try {
            const parsedUrl = url.parse(req.url, true);
            const pathname = parsedUrl.pathname;
            const method = req.method.toUpperCase();

            this.setCORSHeaders(res);

            // --- FIX: Activate your Rate Limiter on every request ---
            const clientIp = req.socket.remoteAddress;
            if (!this.rateLimiter.checkLimit(clientIp, pathname)) {
                const remaining = this.rateLimiter.getRemainingRequests(clientIp, pathname);
                const resetTime = this.rateLimiter.getResetTime(clientIp, pathname);
                res.setHeader('X-RateLimit-Remaining', remaining);
                res.setHeader('X-RateLimit-Reset', new Date(resetTime).toISOString());
                return this.sendError(res, 429, 'Too many requests, please try again later.');
            }

            if (method === 'OPTIONS') {
                res.writeHead(204); // 204 No Content is more appropriate for pre-flight requests
                res.end();
                return;
            }

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
            if (error.message === 'Invalid JSON in request body' || error.message === 'Request body too large') {
                return this.sendError(res, 400, error.message);
            }
            ErrorHandler.logError(error, req);
            this.sendError(res, 500, 'Internal server error');
        }
    }

    findRouteHandler(pathname) {
        for (const [prefix, handler] of Object.entries(this.routes)) {
            if (pathname.startsWith(prefix)) return handler;
        }
        return null;
    }

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

    setCORSHeaders(res) {
        res.setHeader('Access-Control-Allow-Origin', config.cors.origin);
        res.setHeader('Access-Control-Allow-Methods', config.cors.methods.join(', '));
        res.setHeader('Access-Control-Allow-Headers', config.cors.allowedHeaders.join(', '));
        res.setHeader('Access-control-max-age', '86400');
    }

    sendError(res, statusCode, message) {
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: false,
            error: { message, code: statusCode, timestamp: new Date().toISOString() }
        }));
    }

    setupGracefulShutdown() {
        const shutdown = async (signal) => {
            console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
            if (this.server) this.server.close(() => console.log('✅ HTTP server closed'));
            if (this.databaseManager) await this.databaseManager.disconnect();
            console.log('👋 Server shutdown complete');
            process.exit(0);
        };
        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));
    }
}

if (require.main === module) {
    const server = new EliotiServer();
    server.initialize().catch(error => {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    });
}

module.exports = EliotiServer;