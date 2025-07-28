/**
 * Database Manager for SQLite
 * Handles database connections and operations
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

        // CORRECTED: Use a dynamic path that always works
        this.dbPath = path.resolve(__dirname, 'sqlite', 'mydatabase.db');
        
        this.queryQueue = [];
    }

    async connect() {
        return new Promise((resolve, reject) => {
            try {
                // Ensure the /sqlite directory exists
                const dataDir = path.dirname(this.dbPath);
                if (!fs.existsSync(dataDir)) {
                    fs.mkdirSync(dataDir, { recursive: true });
                }

                this.db = new sqlite3.Database(this.dbPath, (err) => {
                    if (err) {
                        return reject(new Error(`Database connection failed: ${err.message}`));
                    }
                    
                    this.db.run('PRAGMA foreign_keys = ON', (pragmaErr) => {
                        if (pragmaErr) return reject(pragmaErr);

                        this.initializeSchema()
                            .then(() => {
                                this.isConnected = true;
                                this.emit('connect');
                                console.log('✅ Database connected and schema is ready.');
                                resolve();
                            })
                            .catch((e) => reject(e));
                    });
                });
            } catch (error) {
                this.emit('error', error);
                reject(error);
            }
        });
    }

    async initializeSchema() {
        const schema = `
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL,
                full_name TEXT NOT NULL, date_of_birth TEXT NOT NULL, employment_status TEXT NOT NULL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                last_login TEXT, is_active INTEGER DEFAULT 1
            );
            CREATE TABLE IF NOT EXISTS user_profiles (
                id TEXT PRIMARY KEY, user_id TEXT NOT NULL, job_title TEXT, monthly_salary REAL,
                savings_goal_percentage REAL DEFAULT 20, created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
            CREATE TABLE IF NOT EXISTS transactions (
                id TEXT PRIMARY KEY, user_id TEXT NOT NULL, amount REAL NOT NULL,
                type TEXT NOT NULL CHECK (type IN ('income', 'expense')), category TEXT NOT NULL,
                description TEXT, transaction_date TEXT NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
            CREATE TABLE IF NOT EXISTS blacklisted_tokens (
                token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL, expires_at TEXT NOT NULL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
            CREATE TABLE IF NOT EXISTS audit_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT, action TEXT NOT NULL,
                details TEXT, ip_address TEXT, user_agent TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
            );
            CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
            CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
        `;
        // Use this.db.exec for multiple statements
        return new Promise((resolve, reject) => {
            this.db.exec(schema, (err) => {
                if (err) return reject(err);
                resolve();
            });
        });
    }

    async run(sql, params = []) {
        return new Promise((resolve, reject) => {
            if (!this.isConnected) return reject(new Error('Database not connected'));
            this.db.run(sql, params, function (err) {
                if (err) return reject(err);
                resolve({ lastID: this.lastID, changes: this.changes });
            });
        });
    }

    async get(sql, params = []) {
        return new Promise((resolve, reject) => {
            if (!this.isConnected) return reject(new Error('Database not connected'));
            this.db.get(sql, params, (err, row) => {
                if (err) return reject(err);
                resolve(row);
            });
        });
    }

    async all(sql, params = []) {
        return new Promise((resolve, reject) => {
            if (!this.isConnected) return reject(new Error('Database not connected'));
            this.db.all(sql, params, (err, rows) => {
                if (err) return reject(err);
                resolve(rows);
            });
        });
    }

    async disconnect() {
        return new Promise((resolve) => {
            if (this.db) {
                this.db.close((err) => {
                    this.isConnected = false;
                    if (err) console.error('Error closing database:', err);
                    else console.log('✅ Database connection closed');
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }
    
    // All other helper methods like transaction, logAuditEvent, etc. can remain the same
}

module.exports = DatabaseManager;