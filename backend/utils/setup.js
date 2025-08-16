/**
 * Setup script for Elioti Financial Platform
 * Initializes configuration and environment variables
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

class Setup {
    constructor() {
        this.envFile = '.env';
        this.configFile = 'config.js';
    }

    async run() {
        console.log('🚀 Elioti Financial Platform Setup');
        console.log('=====================================\n');

        try {
            // Check if .env file exists
            if (fs.existsSync(this.envFile)) {
                console.log('⚠️  .env file already exists. Do you want to overwrite it? (y/N)');
                const answer = await this.question('> ');
                if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
                    console.log('Setup cancelled.');
                    process.exit(0);
                }
            }

            // Generate secure JWT secret
            const jwtSecret = crypto.randomBytes(64).toString('hex');
            
            // Generate database encryption key
            const dbEncryptionKey = crypto.randomBytes(32).toString('hex');

            // Get user input
            const port = await this.question('Enter server port (default: 3000): ') || '3000';
            const host = await this.question('Enter server host (default: localhost): ') || 'localhost';
            const environment = await this.question('Enter environment (development/production, default: development): ') || 'development';
            const corsOrigin = await this.question('Enter CORS origin (default: *): ') || '*';

            // Create .env file
            const envContent = `# Elioti Financial Platform Environment Variables
# Generated on ${new Date().toISOString()}

# Server Configuration
PORT=${port}
HOST=${host}
NODE_ENV=${environment}

# Security
JWT_SECRET=${jwtSecret}
DB_ENCRYPTION_KEY=${dbEncryptionKey}

# CORS
CORS_ORIGIN=${corsOrigin}

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log

# Database (for future use)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=elioti_db
DB_USER=postgres
DB_PASSWORD=

# Additional Security (optional)
# SESSION_SECRET=${crypto.randomBytes(32).toString('hex')}
# API_KEY=${crypto.randomBytes(32).toString('hex')}
`;

            fs.writeFileSync(this.envFile, envContent);

            // Create logs directory
            const logsDir = 'logs';
            if (!fs.existsSync(logsDir)) {
                fs.mkdirSync(logsDir);
                console.log('✅ Created logs directory');
            }

            // Create data directory
            const dataDir = 'data';
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir);
                console.log('✅ Created data directory');
            }

            // Update config.js with environment variables
            this.updateConfig();

            console.log('\n✅ Setup completed successfully!');
            console.log('\n📋 Next steps:');
            console.log('1. Install dependencies: npm install');
            console.log('2. Start the server: npm start');
            console.log('3. For development: npm run dev');
            console.log('\n🔐 Security notes:');
            console.log('- JWT secret and database encryption key have been generated');
            console.log('- Store these securely in production');
            console.log('- Consider using a secrets management service in production');
            console.log('\n🌐 API endpoints:');
            console.log('- POST /auth/register - User registration');
            console.log('- POST /auth/login - User login');
            console.log('- POST /auth/logout - User logout');
            console.log('- GET /user/profile - Get user profile');
            console.log('- POST /transaction - Create transaction');
            console.log('- GET /transaction - Get transactions');

        } catch (error) {
            console.error('❌ Setup failed:', error.message);
            process.exit(1);
        } finally {
            rl.close();
        }
    }

    question(prompt) {
        return new Promise((resolve) => {
            rl.question(prompt, resolve);
        });
    }

    updateConfig() {
        try {
            const configPath = path.join(__dirname, 'config.js');
            let configContent = fs.readFileSync(configPath, 'utf8');

            // Update JWT secret to use environment variable
            configContent = configContent.replace(
                /jwtSecret: process\.env\.JWT_SECRET \|\| 'your-secret-key-change-in-production'/,
                "jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production'"
            );

            // Add database encryption key
            if (!configContent.includes('encryptionKey')) {
                configContent = configContent.replace(
                    /database: \{/,
                    `database: {
        encryptionKey: process.env.DB_ENCRYPTION_KEY || 'your-db-encryption-key-change-in-production',`
                );
            }

            fs.writeFileSync(configPath, configContent);
            console.log('✅ Updated config.js with environment variables');

        } catch (error) {
            console.warn('⚠️  Could not update config.js:', error.message);
        }
    }
}

// Run setup if this file is executed directly
if (require.main === module) {
    const setup = new Setup();
    setup.run();
}

module.exports = Setup; 