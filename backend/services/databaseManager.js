// DatabaseManager.js

const mysql = require('mysql2/promise');
const EventEmitter = require('events');
const config = require('./config');

class DatabaseManager extends EventEmitter {
    constructor() {
        super();
        this.pool = null; // We will use a connection pool
        this.isConnected = false;
        this.mockMode = process.env.NODE_ENV === 'development' && !process.env.DB_HOST;
    }

    async connect() {
        try {
            // If in mock mode, skip database connection
            if (this.mockMode) {
                console.log('🔧 Running in mock database mode for development');
                this.isConnected = true;
                this.emit('connect');
                return;
            }

            // Create a connection pool instead of a single connection
            this.pool = mysql.createPool({
                host: config.database.host,
                user: config.database.user,
                password: config.database.password,
                database: config.database.name,
                port: config.database.port,
                waitForConnections: true,
                connectionLimit: 10,
                queueLimit: 0
            });

            // Test the connection
            const connection = await this.pool.getConnection();
            connection.release(); // Release the connection back to the pool

            this.isConnected = true;
            this.emit('connect');
            console.log('✅ MySQL Database connected successfully.');

        } catch (error) {
            console.error('❌ DB connection failed:', error.message);
            
            // In development, allow server to start even if DB fails
            if (process.env.NODE_ENV === 'development') {
                console.log('🔧 Continuing in mock mode for development');
                this.mockMode = true;
                this.isConnected = true;
                this.emit('connect');
                return;
            }
            
            this.emit('error', error);
            throw error; // Re-throw error to stop the server from starting
        }
    }

    async run(sql, params = []) {
        if (!this.isConnected) throw new Error('Database not connected');
        
        if (this.mockMode) {
            console.log('🔧 Mock DB: run() called with:', sql, params);
            return { insertId: 1, affectedRows: 1 };
        }
        
        const [result] = await this.pool.execute(sql, params);
        return result;
    }

    async get(sql, params = []) {
        if (!this.isConnected) throw new Error('Database not connected');
        
        if (this.mockMode) {
            console.log('🔧 Mock DB: get() called with:', sql, params);
            return null; // Return null for mock mode
        }
        
        const [rows] = await this.pool.execute(sql, params);
        return rows[0] || null;
    }

    async all(sql, params = []) {
        if (!this.isConnected) throw new Error('Database not connected');
        
        if (this.mockMode) {
            console.log('🔧 Mock DB: all() called with:', sql, params);
            return []; // Return empty array for mock mode
        }
        
        const [rows] = await this.pool.execute(sql, params);
        return rows;
    }

    /**
     * --- THIS FUNCTION IS NEW ---
     * Writes an audit event to the database.
     * This is used for logging important security or user actions.
     */
    async logAuditEvent(userId, action, details, req) {
        if (!this.isConnected) return; // Don't try to log if DB is down

        if (this.mockMode) {
            console.log('🔧 Mock DB: logAuditEvent() called:', { userId, action, details });
            return;
        }

        const sql = `
            INSERT INTO audit_logs (user_id, action, details, ip_address, user_agent)
            VALUES (?, ?, ?, ?, ?)
        `;
        
        const ip = req.socket.remoteAddress;
        const userAgent = req.headers['user-agent'] || 'Unknown';
        const params = [userId, action, details, ip, userAgent];

        try {
            await this.pool.execute(sql, params);
        } catch (error) {
            // A failure to write to the audit log should not crash the main request.
            console.error('Failed to write to audit log:', error);
        }
    }

    async disconnect() {
        if (this.pool) {
            await this.pool.end();
            this.isConnected = false;
            console.log('✅ Database pool closed');
        }
    }
}

module.exports = DatabaseManager;