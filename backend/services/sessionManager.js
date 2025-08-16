/**
 * JWT-based Session Manager for secure token handling
 * Implements JWT tokens with proper expiration and blacklisting
 * USES the standard 'jsonwebtoken' library for security.
 */

const crypto = require('crypto');
const config = require('../utils/config');
const jwt = require('jsonwebtoken'); // Use the standard library

class SessionManager {
    constructor() {
        this.sessionTimeout = config.security.sessionTimeout;
        this.jwtSecret = config.security.jwtSecret;

        // In-memory blacklist for revoked tokens (use Redis in production)
        this.blacklistedTokens = new Set();

        // Cleanup blacklisted tokens every hour
        setInterval(() => this.cleanupBlacklistedTokens(), 3600000);
    }

    /**
     * Create a JWT token for user session
     */
    createSession(userId, email, additionalData = {}) {
        const payload = {
            userId,
            email,
            ...additionalData
        };

        const token = jwt.sign(payload, this.jwtSecret, {
            expiresIn: this.sessionTimeout / 1000, // library expects seconds
            algorithm: 'HS256'
        });

        const decoded = jwt.decode(token);

        return {
            token,
            expiresAt: new Date(decoded.exp * 1000),
            userId,
            email
        };
    }

    /**
     * Validate and decode JWT token
     */
    validateSession(token) {
        try {
            // Check if token is blacklisted
            if (this.blacklistedTokens.has(token)) {
                return null;
            }

            // Verify and decode token using the library
            const payload = jwt.verify(token, this.jwtSecret, { algorithms: ['HS256'] });

            return {
                userId: payload.userId,
                email: payload.email,
                createdAt: new Date(payload.iat * 1000),
                expiresAt: new Date(payload.exp * 1000)
            };

        } catch (error) {
            // This will catch expired tokens, invalid signatures, etc.
            return null;
        }
    }

    /**
     * Revoke (blacklist) a token
     */
    destroySession(token) {
        this.blacklistedTokens.add(token);
    }

    /**
     * Refresh a token (create new one with extended expiration)
     */
    refreshSession(token) {
        try {
            // Verify the token but ignore if it's expired for the refresh logic
            const payload = jwt.verify(token, this.jwtSecret, { ignoreExpiration: true });
            
            // Create a brand new token
            return this.createSession(payload.userId, payload.email);

        } catch (error) {
            // If verification fails for any other reason (e.g., bad signature), throw error
            throw new Error('Cannot refresh invalid token');
        }
    }

    /**
     * Clean up expired blacklisted tokens
     */
    cleanupBlacklistedTokens() {
        // For in-memory storage, we just clear the set periodically.
        // In a production environment with a persistent store like Redis,
        // you would remove tokens where the expiration date has passed.
        this.blacklistedTokens.clear();
        console.log('Cleaned up in-memory token blacklist.');
    }
    
    /**
     * Validate token format without verifying signature
     */
    isValidTokenFormat(token) {
        try {
            if (!token || typeof token !== 'string') return false;
            const parts = token.split('.');
            return parts.length === 3;
        } catch (error) {
            return false;
        }
    }
}

module.exports = SessionManager;