/**
 * Database Manager for SQLCipher integration
 * Handles encrypted database connections and operations
 */

const sqlite3 = require('sqlite3');
const path = require('path');
const EventEmitter = require('events');
const fs = require('fs');

class DatabaseManager extends EventEmitter {
    constructor() {
        super();
        this.db = null;
        this.isConnected = false;
        // Use your SQLite database file
        this.dbPath = 'C:/Users/W11/Desktop/sqlite/mydatabase.db';
        this.queryQueue = [];
    }

    /**
     * Connect to SQLite database with auto-reconnect
     */
    async connect(retries = 3) {
        return new Promise((resolve, reject) => {
            try {
                // Ensure directory exists
                const dataDir = path.dirname(this.dbPath);
                if (!fs.existsSync(dataDir)) {
                    fs.mkdirSync(dataDir, { recursive: true });
                }
                // Create database connection (no encryption)
                this.db = new sqlite3.Database(this.dbPath, (err) => {
                    if (err) {
                        if (retries > 0) {
                            setTimeout(() => this.connect(retries - 1).then(resolve).catch(reject), 1000);
                        } else {
                            this.emit('error', err);
                            reject(new Error(`Database connection failed: ${err.message}`));
                        }
                        return;
                    }
                    // Initialize database schema
                    this.initializeSchema()
                        .then(() => {
                            this.isConnected = true;
                            this.emit('connect');
                            console.log('✅ Database connected');
                            resolve();
                        })
                        .catch((e) => {
                            this.emit('error', e);
                            reject(e);
                        });
                });
                // Enable foreign keys
                this.db.run('PRAGMA foreign_keys = ON');
            } catch (error) {
                this.emit('error', error);
                reject(error);
            }
        });
    }

    /**
     * Initialize database schema
     */
    async initializeSchema() {
        const schema = `
            -- Users table
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                full_name TEXT NOT NULL,
                date_of_birth TEXT NOT NULL,
                employment_status TEXT NOT NULL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                last_login TEXT,
                is_active INTEGER DEFAULT 1
            );

            -- User profiles table
            CREATE TABLE IF NOT EXISTS user_profiles (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                job_title TEXT,
                monthly_salary REAL,
                savings_goal_percentage REAL DEFAULT 20,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            -- Transactions table
            CREATE TABLE IF NOT EXISTS transactions (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                amount REAL NOT NULL,
                type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
                category TEXT NOT NULL,
                description TEXT,
                transaction_date TEXT NOT NULL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            -- Sessions table for JWT token blacklisting
            CREATE TABLE IF NOT EXISTS blacklisted_tokens (
                token_hash TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                expires_at TEXT NOT NULL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            -- Audit log table
            CREATE TABLE IF NOT EXISTS audit_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT,
                action TEXT NOT NULL,
                details TEXT,
                ip_address TEXT,
                user_agent TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
            );

            -- Create indexes for better performance
            CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
            CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
            CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);
            CREATE INDEX IF NOT EXISTS idx_blacklisted_tokens_expires ON blacklisted_tokens(expires_at);
            CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
            CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);
        `;

        return this.run(schema);
    }

    /**
     * Run a query and log slow queries
     */
    async run(sql, params = []) {
        return new Promise((resolve, reject) => {
            if (!this.isConnected) {
                reject(new Error('Database not connected'));
                return;
            }
            const start = Date.now();
            this.db.run(sql, params, function(err) {
                const duration = Date.now() - start;
                if (duration > 200) {
                    try {
                        fs.appendFileSync('logs/slow-queries.log', `[${new Date().toISOString()}] ${sql} (${duration}ms)\n`);
                    } catch (e) {}
                }
                if (err) {
                    try {
                        fs.appendFileSync('logs/db-errors.log', `[${new Date().toISOString()}] ${err.message}\n`);
                    } catch (e) {}
                    reject(err);
                } else {
                    resolve({
                        lastID: this.lastID,
                        changes: this.changes
                    });
                }
            });
        });
    }

    /**
     * Get a single row
     */
    async get(sql, params = []) {
        return new Promise((resolve, reject) => {
            if (!this.isConnected) {
                reject(new Error('Database not connected'));
                return;
            }

            this.db.get(sql, params, (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    /**
     * Get multiple rows
     */
    async all(sql, params = []) {
        return new Promise((resolve, reject) => {
            if (!this.isConnected) {
                reject(new Error('Database not connected'));
                return;
            }

            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    /**
     * Begin a transaction
     */
    async beginTransaction() {
        return this.run('BEGIN TRANSACTION');
    }

    /**
     * Commit a transaction
     */
    async commitTransaction() {
        return this.run('COMMIT');
    }

    /**
     * Rollback a transaction
     */
    async rollbackTransaction() {
        return this.run('ROLLBACK');
    }

    /**
     * Execute a transaction with multiple operations
     */
    async transaction(operations) {
        try {
            await this.beginTransaction();
            const result = await operations();
            await this.commitTransaction();
            return result;
        } catch (error) {
            await this.rollbackTransaction();
            throw error;
        }
    }

    /**
     * Log audit event
     */
    async logAuditEvent(userId, action, details = null, req = null) {
        const ipAddress = req ? this.getClientIP(req) : null;
        const userAgent = req ? req.headers['user-agent'] : null;

        const sql = `
            INSERT INTO audit_log (user_id, action, details, ip_address, user_agent)
            VALUES (?, ?, ?, ?, ?)
        `;

        return this.run(sql, [userId, action, details, ipAddress, userAgent]);
    }

    /**
     * Get client IP from request
     */
    getClientIP(req) {
        return req.headers['x-forwarded-for'] || 
               req.headers['x-real-ip'] || 
               req.connection.remoteAddress || 
               req.socket.remoteAddress;
    }

    /**
     * Clean up expired blacklisted tokens
     */
    async cleanupExpiredTokens() {
        const sql = 'DELETE FROM blacklisted_tokens WHERE expires_at < datetime("now")';
        return this.run(sql);
    }

    /**
     * Check if token is blacklisted
     */
    async isTokenBlacklisted(tokenHash) {
        const sql = 'SELECT 1 FROM blacklisted_tokens WHERE token_hash = ? AND expires_at > datetime("now")';
        const result = await this.get(sql, [tokenHash]);
        return !!result;
    }

    /**
     * Blacklist a token
     */
    async blacklistToken(tokenHash, userId, expiresAt) {
        const sql = 'INSERT INTO blacklisted_tokens (token_hash, user_id, expires_at) VALUES (?, ?, ?)';
        return this.run(sql, [tokenHash, userId, expiresAt]);
    }

    /**
     * Backup the database
     */
    async backup(backupPath) {
        return new Promise((resolve, reject) => {
            const source = fs.createReadStream(this.dbPath);
            const dest = fs.createWriteStream(backupPath);
            source.pipe(dest);
            dest.on('finish', resolve);
            dest.on('error', reject);
        });
    }

    /**
     * Restore the database from backup
     */
    async restore(backupPath) {
        return new Promise((resolve, reject) => {
            const source = fs.createReadStream(backupPath);
            const dest = fs.createWriteStream(this.dbPath);
            source.pipe(dest);
            dest.on('finish', resolve);
            dest.on('error', reject);
        });
    }

    /**
     * Health check for the database
     */
    async healthCheck() {
        try {
            await this.get('SELECT 1');
            return { status: 'ok' };
        } catch (err) {
            return { status: 'error', error: err.message };
        }
    }

    /**
     * Disconnect from database
     */
    async disconnect() {
        return new Promise((resolve) => {
            if (this.db) {
                this.db.close((err) => {
                    if (err) {
                        console.error('Error closing database:', err);
                    } else {
                        console.log('✅ Database connection closed');
                    }
                    this.isConnected = false;
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }

    /**
     * Get database statistics
     */
    async getStats() {
        const stats = {};
        
        // User count
        const userCount = await this.get('SELECT COUNT(*) as count FROM users WHERE is_active = 1');
        stats.activeUsers = userCount.count;

        // Transaction count
        const transactionCount = await this.get('SELECT COUNT(*) as count FROM transactions');
        stats.totalTransactions = transactionCount.count;

        // Recent activity
        const recentActivity = await this.get(`
            SELECT COUNT(*) as count 
            FROM audit_log 
            WHERE created_at > datetime('now', '-24 hours')
        `);
        stats.recentActivity = recentActivity.count;

        return stats;
    }
}

module.exports = DatabaseManager; 