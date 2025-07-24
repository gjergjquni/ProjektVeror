/**
 * JWT-based Session Manager for secure token handling
 * Implements JWT tokens with proper expiration and blacklisting
 */

const crypto = require('crypto');
const config = require('./config');

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
        const now = Math.floor(Date.now() / 1000);
        const expiresAt = now + (this.sessionTimeout / 1000);
        
        const payload = {
            userId,
            email,
            iat: now,
            exp: expiresAt,
            ...additionalData
        };
        
        const token = this.generateJWT(payload);
        
        return {
            token,
            expiresAt: new Date(expiresAt * 1000),
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
            
            const payload = this.verifyJWT(token);
            
            // Check if token has expired
            const now = Math.floor(Date.now() / 1000);
            if (payload.exp < now) {
                return null;
            }
            
            return {
                userId: payload.userId,
                email: payload.email,
                createdAt: new Date(payload.iat * 1000),
                expiresAt: new Date(payload.exp * 1000)
            };
            
        } catch (error) {
            return null;
        }
    }

    /**
     * Generate JWT token
     */
    generateJWT(payload) {
        const header = {
            alg: 'HS256',
            typ: 'JWT'
        };
        
        const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
        const encodedPayload = this.base64UrlEncode(JSON.stringify(payload));
        
        const signature = crypto
            .createHmac('sha256', this.jwtSecret)
            .update(`${encodedHeader}.${encodedPayload}`)
            .digest('base64url');
        
        return `${encodedHeader}.${encodedPayload}.${signature}`;
    }

    /**
     * Verify and decode JWT token
     */
    verifyJWT(token) {
        const parts = token.split('.');
        if (parts.length !== 3) {
            throw new Error('Invalid JWT format');
        }
        
        const [encodedHeader, encodedPayload, signature] = parts;
        
        // Verify signature
        const expectedSignature = crypto
            .createHmac('sha256', this.jwtSecret)
            .update(`${encodedHeader}.${encodedPayload}`)
            .digest('base64url');
        
        if (signature !== expectedSignature) {
            throw new Error('Invalid JWT signature');
        }
        
        // Decode payload
        const payload = JSON.parse(this.base64UrlDecode(encodedPayload));
        
        return payload;
    }

    /**
     * Base64URL encoding
     */
    base64UrlEncode(str) {
        return Buffer.from(str)
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');
    }

    /**
     * Base64URL decoding
     */
    base64UrlDecode(str) {
        // Add padding back
        str += '='.repeat((4 - str.length % 4) % 4);
        str = str.replace(/-/g, '+').replace(/_/g, '/');
        
        return Buffer.from(str, 'base64').toString();
    }

    /**
     * Revoke (blacklist) a token
     */
    destroySession(token) {
        this.blacklistedTokens.add(token);
        
        // Also add to database blacklist if available
        if (global.databaseManager) {
            const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
            const payload = this.verifyJWT(token);
            const expiresAt = new Date(payload.exp * 1000).toISOString();
            
            global.databaseManager.blacklistToken(tokenHash, payload.userId, expiresAt)
                .catch(err => console.error('Failed to blacklist token in database:', err));
        }
    }

    /**
     * Refresh a token (create new one with extended expiration)
     */
    refreshSession(token) {
        try {
            const payload = this.verifyJWT(token);
            const now = Math.floor(Date.now() / 1000);
            
            // Check if token is close to expiration (within 5 minutes)
            if (payload.exp - now > 300) {
                throw new Error('Token not close to expiration');
            }
            
            // Create new token with extended expiration
            return this.createSession(payload.userId, payload.email);
            
        } catch (error) {
            throw new Error('Cannot refresh invalid token');
        }
    }

    /**
     * Clean up expired blacklisted tokens
     */
    cleanupBlacklistedTokens() {
        // In production, this would be handled by database cleanup
        // For in-memory storage, we just clear the set periodically
        this.blacklistedTokens.clear();
    }

    /**
     * Get session statistics
     */
    getStats() {
        return {
            blacklistedTokens: this.blacklistedTokens.size,
            sessionTimeout: this.sessionTimeout
        };
    }

    /**
     * Validate token format without verifying signature
     */
    isValidTokenFormat(token) {
        try {
            const parts = token.split('.');
            if (parts.length !== 3) {
                return false;
            }
            
            // Try to decode payload to check format
            const payload = JSON.parse(this.base64UrlDecode(parts[1]));
            return payload.userId && payload.email && payload.exp;
            
        } catch (error) {
            return false;
        }
    }
}

module.exports = SessionManager; 