/**
 * Rate Limiter for API security
 * Prevents abuse and implements rate limiting per IP and endpoint
 */

const crypto = require('crypto');

class RateLimiter {
    constructor() {
        // Store rate limit data in memory (in production, use Redis)
        this.limits = new Map();
        
        // Rate limit configurations
        this.configs = {
            // General API limits
            default: { requests: 100, window: 60000 }, // 100 requests per minute
            
            // Authentication endpoints (more restrictive)
            '/auth/login': { requests: 5, window: 300000 }, // 5 attempts per 5 minutes
            '/auth/register': { requests: 3, window: 600000 }, // 3 attempts per 10 minutes
            '/auth/forgot-password': { requests: 3, window: 600000 }, // 3 attempts per 10 minutes
            
            // Financial endpoints (very restrictive)
            '/transaction': { requests: 50, window: 60000 }, // 50 requests per minute
            '/user/balance': { requests: 10, window: 60000 }, // 10 requests per minute
            
            // Profile endpoints
            '/profile': { requests: 20, window: 60000 }, // 20 requests per minute
        };
        
        // Cleanup expired entries every 5 minutes
        setInterval(() => this.cleanup(), 300000);
    }

    /**
     * Check if request is within rate limits
     */
    checkLimit(clientIP, endpoint) {
        const key = this.generateKey(clientIP, endpoint);
        const config = this.getConfig(endpoint);
        
        const now = Date.now();
        const windowStart = now - config.window;
        
        // Get or create rate limit data for this key
        if (!this.limits.has(key)) {
            this.limits.set(key, []);
        }
        
        const requests = this.limits.get(key);
        
        // Remove expired requests
        const validRequests = requests.filter(timestamp => timestamp > windowStart);
        
        // Check if limit exceeded
        if (validRequests.length >= config.requests) {
            return false;
        }
        
        // Add current request
        validRequests.push(now);
        this.limits.set(key, validRequests);
        
        return true;
    }

    /**
     * Get remaining requests for a client
     */
    getRemainingRequests(clientIP, endpoint) {
        const key = this.generateKey(clientIP, endpoint);
        const config = this.getConfig(endpoint);
        
        if (!this.limits.has(key)) {
            return config.requests;
        }
        
        const now = Date.now();
        const windowStart = now - config.window;
        const requests = this.limits.get(key);
        const validRequests = requests.filter(timestamp => timestamp > windowStart);
        
        return Math.max(0, config.requests - validRequests.length);
    }

    /**
     * Get reset time for rate limit
     */
    getResetTime(clientIP, endpoint) {
        const key = this.generateKey(clientIP, endpoint);
        const config = this.getConfig(endpoint);
        
        if (!this.limits.has(key)) {
            return Date.now() + config.window;
        }
        
        const requests = this.limits.get(key);
        if (requests.length === 0) {
            return Date.now() + config.window;
        }
        
        // Find the oldest request in the current window
        const now = Date.now();
        const windowStart = now - config.window;
        const validRequests = requests.filter(timestamp => timestamp > windowStart);
        
        if (validRequests.length === 0) {
            return Date.now() + config.window;
        }
        
        const oldestRequest = Math.min(...validRequests);
        return oldestRequest + config.window;
    }

    /**
     * Generate unique key for client and endpoint
     */
    generateKey(clientIP, endpoint) {
        return crypto.createHash('sha256')
            .update(`${clientIP}:${endpoint}`)
            .digest('hex');
    }

    /**
     * Get rate limit configuration for endpoint
     */
    getConfig(endpoint) {
        // Find exact match first
        if (this.configs[endpoint]) {
            return this.configs[endpoint];
        }
        
        // Find prefix match
        for (const [pattern, config] of Object.entries(this.configs)) {
            if (endpoint.startsWith(pattern)) {
                return config;
            }
        }
        
        // Return default configuration
        return this.configs.default;
    }

    /**
     * Clean up expired rate limit entries
     */
    cleanup() {
        const now = Date.now();
        
        for (const [key, requests] of this.limits.entries()) {
            // Keep only recent requests (within the longest window)
            const maxWindow = Math.max(...Object.values(this.configs).map(c => c.window));
            const validRequests = requests.filter(timestamp => timestamp > now - maxWindow);
            
            if (validRequests.length === 0) {
                this.limits.delete(key);
            } else {
                this.limits.set(key, validRequests);
            }
        }
    }

    /**
     * Reset rate limits for a specific client and endpoint
     */
    reset(clientIP, endpoint) {
        const key = this.generateKey(clientIP, endpoint);
        this.limits.delete(key);
    }

    /**
     * Get rate limit statistics
     */
    getStats() {
        const stats = {
            totalKeys: this.limits.size,
            totalRequests: 0,
            endpoints: {}
        };
        
        for (const [key, requests] of this.limits.entries()) {
            stats.totalRequests += requests.length;
        }
        
        return stats;
    }

    /**
     * Set custom rate limit for testing
     */
    setCustomLimit(endpoint, requests, window) {
        this.configs[endpoint] = { requests, window };
    }
}

module.exports = RateLimiter; 