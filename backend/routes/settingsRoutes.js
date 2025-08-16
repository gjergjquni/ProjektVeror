// backend/settingsRoutes.js

const Validators = require('../utils/validators');
const ErrorHandler = require('../middleware/errorHandler');

class SettingsRoutes {
    async handle(req, res, context) {
        const { authMiddleware, parsedUrl } = context;

        // All settings routes require a user to be logged in
        authMiddleware.requireAuth(req, res, async () => {
            const pathname = parsedUrl.pathname;
            const method = req.method.toUpperCase();

            // Settings routing logic
            if (pathname === '/settings/profile' && method === 'GET') {
                return await this.getProfileSettings(req, res, context);
            }
            if (pathname === '/settings/profile' && method === 'PUT') {
                return await this.updateProfileSettings(req, res, context);
            }
            if (pathname === '/settings/account' && method === 'GET') {
                return await this.getAccountSettings(req, res, context);
            }
            if (pathname === '/settings/account' && method === 'PUT') {
                return await this.updateAccountSettings(req, res, context);
            }
            if (pathname === '/settings/notifications' && method === 'GET') {
                return await this.getNotificationSettings(req, res, context);
            }
            if (pathname === '/settings/notifications' && method === 'PUT') {
                return await this.updateNotificationSettings(req, res, context);
            }
            if (pathname === '/settings/privacy' && method === 'GET') {
                return await this.getPrivacySettings(req, res, context);
            }
            if (pathname === '/settings/privacy' && method === 'PUT') {
                return await this.updatePrivacySettings(req, res, context);
            }
            if (pathname === '/settings/currency' && method === 'GET') {
                return await this.getCurrencySettings(req, res, context);
            }
            if (pathname === '/settings/currency' && method === 'PUT') {
                return await this.updateCurrencySettings(req, res, context);
            }
            if (pathname === '/settings/export' && method === 'POST') {
                return await this.exportUserData(req, res, context);
            }
            if (pathname === '/settings/delete-account' && method === 'DELETE') {
                return await this.deleteAccount(req, res, context);
            }
            
            this.sendError(res, 404, 'Settings endpoint not found');
        });
    }

    // --- GET PROFILE SETTINGS ---
    async getProfileSettings(req, res, { databaseManager }) {
        try {
            const userId = req.user.userId;
            
            const profile = await databaseManager.get(
                'SELECT id, username, email, first_name, last_name, phone, date_of_birth, profile_picture, bio, timezone FROM users WHERE id = ?',
                [userId]
            );

            if (!profile) {
                return this.sendError(res, 404, 'User profile not found');
            }

            this.sendSuccess(res, 200, { profile });
        } catch (error) {
            ErrorHandler.logError(error, req);
            this.sendError(res, 500, 'Failed to retrieve profile settings');
        }
    }

    // --- UPDATE PROFILE SETTINGS ---
    async updateProfileSettings(req, res, { databaseManager }) {
        try {
            const userId = req.user.userId;
            const { firstName, lastName, phone, dateOfBirth, bio, timezone } = req.body;

            // Validation
            if (firstName && firstName.length > 50) {
                return this.sendError(res, 400, 'First name must be less than 50 characters');
            }
            if (lastName && lastName.length > 50) {
                return this.sendError(res, 400, 'Last name must be less than 50 characters');
            }
            if (bio && bio.length > 500) {
                return this.sendError(res, 400, 'Bio must be less than 500 characters');
            }

            // Update profile fields
            const updateFields = [];
            const updateValues = [];
            
            if (firstName !== undefined) {
                updateFields.push('first_name = ?');
                updateValues.push(firstName);
            }
            if (lastName !== undefined) {
                updateFields.push('last_name = ?');
                updateValues.push(lastName);
            }
            if (phone !== undefined) {
                updateFields.push('phone = ?');
                updateValues.push(phone);
            }
            if (dateOfBirth !== undefined) {
                updateFields.push('date_of_birth = ?');
                updateValues.push(dateOfBirth);
            }
            if (bio !== undefined) {
                updateFields.push('bio = ?');
                updateValues.push(bio);
            }
            if (timezone !== undefined) {
                updateFields.push('timezone = ?');
                updateValues.push(timezone);
            }

            if (updateFields.length === 0) {
                return this.sendError(res, 400, 'No valid fields to update');
            }

            updateValues.push(userId);
            const sql = `UPDATE users SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
            
            const result = await databaseManager.run(sql, updateValues);

            if (result.affectedRows === 0) {
                return this.sendError(res, 404, 'Profile not found');
            }

            this.sendSuccess(res, 200, { message: 'Profile settings updated successfully' });
        } catch (error) {
            ErrorHandler.logError(error, req);
            this.sendError(res, 500, 'Failed to update profile settings');
        }
    }

    // --- GET ACCOUNT SETTINGS ---
    async getAccountSettings(req, res, { databaseManager }) {
        try {
            const userId = req.user.userId;
            
            const account = await databaseManager.get(
                'SELECT id, username, email, two_factor_enabled, last_login, account_status, created_at FROM users WHERE id = ?',
                [userId]
            );

            if (!account) {
                return this.sendError(res, 404, 'Account not found');
            }

            // Remove sensitive information
            delete account.email; // Don't expose full email in response
            
            this.sendSuccess(res, 200, { account });
        } catch (error) {
            ErrorHandler.logError(error, req);
            this.sendError(res, 500, 'Failed to retrieve account settings');
        }
    }

    // --- UPDATE ACCOUNT SETTINGS ---
    async updateAccountSettings(req, res, { databaseManager }) {
        try {
            const userId = req.user.userId;
            const { username, twoFactorEnabled } = req.body;

            // Validation
            if (username && (username.length < 3 || username.length > 30)) {
                return this.sendError(res, 400, 'Username must be between 3 and 30 characters');
            }

            // Check if username is already taken
            if (username) {
                const existingUser = await databaseManager.get(
                    'SELECT id FROM users WHERE username = ? AND id != ?',
                    [username, userId]
                );
                if (existingUser) {
                    return this.sendError(res, 409, 'Username is already taken');
                }
            }

            const updateFields = [];
            const updateValues = [];
            
            if (username !== undefined) {
                updateFields.push('username = ?');
                updateValues.push(username);
            }
            if (twoFactorEnabled !== undefined) {
                updateFields.push('two_factor_enabled = ?');
                updateValues.push(twoFactorEnabled ? 1 : 0);
            }

            if (updateFields.length === 0) {
                return this.sendError(res, 400, 'No valid fields to update');
            }

            updateValues.push(userId);
            const sql = `UPDATE users SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
            
            const result = await databaseManager.run(sql, updateValues);

            if (result.affectedRows === 0) {
                return this.sendError(res, 404, 'Account not found');
            }

            this.sendSuccess(res, 200, { message: 'Account settings updated successfully' });
        } catch (error) {
            ErrorHandler.logError(error, req);
            this.sendError(res, 500, 'Failed to update account settings');
        }
    }

    // --- GET NOTIFICATION SETTINGS ---
    async getNotificationSettings(req, res, { databaseManager }) {
        try {
            const userId = req.user.userId;
            
            // Get notification preferences from user_settings table
            const settings = await databaseManager.get(
                'SELECT email_notifications, push_notifications, sms_notifications, transaction_alerts, goal_reminders, weekly_reports, marketing_emails FROM user_settings WHERE user_id = ?',
                [userId]
            );

            if (!settings) {
                // Create default settings if none exist
                const defaultSettings = {
                    email_notifications: 1,
                    push_notifications: 1,
                    sms_notifications: 0,
                    transaction_alerts: 1,
                    goal_reminders: 1,
                    weekly_reports: 1,
                    marketing_emails: 0
                };
                
                await databaseManager.run(
                    'INSERT INTO user_settings (user_id, email_notifications, push_notifications, sms_notifications, transaction_alerts, goal_reminders, weekly_reports, marketing_emails) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                    [userId, ...Object.values(defaultSettings)]
                );
                
                return this.sendSuccess(res, 200, { settings: defaultSettings });
            }

            this.sendSuccess(res, 200, { settings });
        } catch (error) {
            ErrorHandler.logError(error, req);
            this.sendError(res, 500, 'Failed to retrieve notification settings');
        }
    }

    // --- UPDATE NOTIFICATION SETTINGS ---
    async updateNotificationSettings(req, res, { databaseManager }) {
        try {
            const userId = req.user.userId;
            const { emailNotifications, pushNotifications, smsNotifications, transactionAlerts, goalReminders, weeklyReports, marketingEmails } = req.body;

            const updateFields = [];
            const updateValues = [];
            
            if (emailNotifications !== undefined) {
                updateFields.push('email_notifications = ?');
                updateValues.push(emailNotifications ? 1 : 0);
            }
            if (pushNotifications !== undefined) {
                updateFields.push('push_notifications = ?');
                updateValues.push(pushNotifications ? 1 : 0);
            }
            if (smsNotifications !== undefined) {
                updateFields.push('sms_notifications = ?');
                updateValues.push(smsNotifications ? 1 : 0);
            }
            if (transactionAlerts !== undefined) {
                updateFields.push('transaction_alerts = ?');
                updateValues.push(transactionAlerts ? 1 : 0);
            }
            if (goalReminders !== undefined) {
                updateFields.push('goal_reminders = ?');
                updateValues.push(goalReminders ? 1 : 0);
            }
            if (weeklyReports !== undefined) {
                updateFields.push('weekly_reports = ?');
                updateValues.push(weeklyReports ? 1 : 0);
            }
            if (marketingEmails !== undefined) {
                updateFields.push('marketing_emails = ?');
                updateValues.push(marketingEmails ? 1 : 0);
            }

            if (updateFields.length === 0) {
                return this.sendError(res, 400, 'No valid fields to update');
            }

            updateValues.push(userId);
            
            // Check if settings exist, if not create them
            const existingSettings = await databaseManager.get(
                'SELECT user_id FROM user_settings WHERE user_id = ?',
                [userId]
            );

            if (existingSettings) {
                const sql = `UPDATE user_settings SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`;
                await databaseManager.run(sql, updateValues);
            } else {
                // Create new settings record
                const insertFields = ['user_id', ...updateFields.map(field => field.split(' = ')[0])];
                const insertValues = [userId, ...updateValues.slice(0, -1)]; // Remove userId from updateValues
                const sql = `INSERT INTO user_settings (${insertFields.join(', ')}) VALUES (${insertFields.map(() => '?').join(', ')})`;
                await databaseManager.run(sql, insertValues);
            }

            this.sendSuccess(res, 200, { message: 'Notification settings updated successfully' });
        } catch (error) {
            ErrorHandler.logError(error, req);
            this.sendError(res, 500, 'Failed to update notification settings');
        }
    }

    // --- GET PRIVACY SETTINGS ---
    async getPrivacySettings(req, res, { databaseManager }) {
        try {
            const userId = req.user.userId;
            
            const privacy = await databaseManager.get(
                'SELECT profile_visibility, transaction_visibility, goal_visibility, allow_friend_requests, show_online_status FROM user_privacy WHERE user_id = ?',
                [userId]
            );

            if (!privacy) {
                // Create default privacy settings
                const defaultPrivacy = {
                    profile_visibility: 'friends',
                    transaction_visibility: 'private',
                    goal_visibility: 'friends',
                    allow_friend_requests: 1,
                    show_online_status: 1
                };
                
                await databaseManager.run(
                    'INSERT INTO user_privacy (user_id, profile_visibility, transaction_visibility, goal_visibility, allow_friend_requests, show_online_status) VALUES (?, ?, ?, ?, ?, ?)',
                    [userId, ...Object.values(defaultPrivacy)]
                );
                
                return this.sendSuccess(res, 200, { privacy: defaultPrivacy });
            }

            this.sendSuccess(res, 200, { privacy });
        } catch (error) {
            ErrorHandler.logError(error, req);
            this.sendError(res, 500, 'Failed to retrieve privacy settings');
        }
    }

    // --- UPDATE PRIVACY SETTINGS ---
    async updatePrivacySettings(req, res, { databaseManager }) {
        try {
            const userId = req.user.userId;
            const { profileVisibility, transactionVisibility, goalVisibility, allowFriendRequests, showOnlineStatus } = req.body;

            // Validation
            const validVisibilities = ['public', 'friends', 'private'];
            if (profileVisibility && !validVisibilities.includes(profileVisibility)) {
                return this.sendError(res, 400, 'Invalid profile visibility setting');
            }
            if (transactionVisibility && !validVisibilities.includes(transactionVisibility)) {
                return this.sendError(res, 400, 'Invalid transaction visibility setting');
            }
            if (goalVisibility && !validVisibilities.includes(goalVisibility)) {
                return this.sendError(res, 400, 'Invalid goal visibility setting');
            }

            const updateFields = [];
            const updateValues = [];
            
            if (profileVisibility !== undefined) {
                updateFields.push('profile_visibility = ?');
                updateValues.push(profileVisibility);
            }
            if (transactionVisibility !== undefined) {
                updateFields.push('transaction_visibility = ?');
                updateValues.push(transactionVisibility);
            }
            if (goalVisibility !== undefined) {
                updateFields.push('goal_visibility = ?');
                updateValues.push(goalVisibility);
            }
            if (allowFriendRequests !== undefined) {
                updateFields.push('allow_friend_requests = ?');
                updateValues.push(allowFriendRequests ? 1 : 0);
            }
            if (showOnlineStatus !== undefined) {
                updateFields.push('show_online_status = ?');
                updateValues.push(showOnlineStatus ? 1 : 0);
            }

            if (updateFields.length === 0) {
                return this.sendError(res, 400, 'No valid fields to update');
            }

            updateValues.push(userId);
            
            // Check if privacy settings exist, if not create them
            const existingPrivacy = await databaseManager.get(
                'SELECT user_id FROM user_privacy WHERE user_id = ?',
                [userId]
            );

            if (existingPrivacy) {
                const sql = `UPDATE user_privacy SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`;
                await databaseManager.run(sql, updateValues);
            } else {
                // Create new privacy record
                const insertFields = ['user_id', ...updateFields.map(field => field.split(' = ')[0])];
                const insertValues = [userId, ...updateValues.slice(0, -1)];
                const sql = `INSERT INTO user_privacy (${insertFields.join(', ')}) VALUES (${insertFields.map(() => '?').join(', ')})`;
                await databaseManager.run(sql, insertValues);
            }

            this.sendSuccess(res, 200, { message: 'Privacy settings updated successfully' });
        } catch (error) {
            ErrorHandler.logError(error, req);
            this.sendError(res, 500, 'Failed to update privacy settings');
        }
    }

    // --- GET CURRENCY SETTINGS ---
    async getCurrencySettings(req, res, { databaseManager }) {
        try {
            const userId = req.user.userId;
            
            const currency = await databaseManager.get(
                'SELECT preferred_currency, currency_format, decimal_places FROM user_currency WHERE user_id = ?',
                [userId]
            );

            if (!currency) {
                // Create default currency settings
                const defaultCurrency = {
                    preferred_currency: 'USD',
                    currency_format: 'symbol',
                    decimal_places: 2
                };
                
                await databaseManager.run(
                    'INSERT INTO user_currency (user_id, preferred_currency, currency_format, decimal_places) VALUES (?, ?, ?, ?)',
                    [userId, ...Object.values(defaultCurrency)]
                );
                
                return this.sendSuccess(res, 200, { currency: defaultCurrency });
            }

            this.sendSuccess(res, 200, { currency });
        } catch (error) {
            ErrorHandler.logError(error, req);
            this.sendError(res, 500, 'Failed to retrieve currency settings');
        }
    }

    // --- UPDATE CURRENCY SETTINGS ---
    async updateCurrencySettings(req, res, { databaseManager }) {
        try {
            const userId = req.user.userId;
            const { preferredCurrency, currencyFormat, decimalPlaces } = req.body;

            // Validation
            const validCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY'];
            if (preferredCurrency && !validCurrencies.includes(preferredCurrency)) {
                return this.sendError(res, 400, 'Invalid currency code');
            }
            
            const validFormats = ['symbol', 'code', 'name'];
            if (currencyFormat && !validFormats.includes(currencyFormat)) {
                return this.sendError(res, 400, 'Invalid currency format');
            }
            
            if (decimalPlaces !== undefined && (decimalPlaces < 0 || decimalPlaces > 4)) {
                return this.sendError(res, 400, 'Decimal places must be between 0 and 4');
            }

            const updateFields = [];
            const updateValues = [];
            
            if (preferredCurrency !== undefined) {
                updateFields.push('preferred_currency = ?');
                updateValues.push(preferredCurrency);
            }
            if (currencyFormat !== undefined) {
                updateFields.push('currency_format = ?');
                updateValues.push(currencyFormat);
            }
            if (decimalPlaces !== undefined) {
                updateFields.push('decimal_places = ?');
                updateValues.push(decimalPlaces);
            }

            if (updateFields.length === 0) {
                return this.sendError(res, 400, 'No valid fields to update');
            }

            updateValues.push(userId);
            
            // Check if currency settings exist, if not create them
            const existingCurrency = await databaseManager.get(
                'SELECT user_id FROM user_currency WHERE user_id = ?',
                [userId]
            );

            if (existingCurrency) {
                const sql = `UPDATE user_currency SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`;
                await databaseManager.run(sql, updateValues);
            } else {
                // Create new currency record
                const insertFields = ['user_id', ...updateFields.map(field => field.split(' = ')[0])];
                const insertValues = [userId, ...updateValues.slice(0, -1)];
                const sql = `INSERT INTO user_currency (${insertFields.join(', ')}) VALUES (${insertFields.map(() => '?').join(', ')})`;
                await databaseManager.run(sql, insertValues);
            }

            this.sendSuccess(res, 200, { message: 'Currency settings updated successfully' });
        } catch (error) {
            ErrorHandler.logError(error, req);
            this.sendError(res, 500, 'Failed to update currency settings');
        }
    }

    // --- EXPORT USER DATA ---
    async exportUserData(req, res, { databaseManager }) {
        try {
            const userId = req.user.userId;
            const { exportType } = req.body; // 'json', 'csv', 'pdf'

            if (!exportType || !['json', 'csv', 'pdf'].includes(exportType)) {
                return this.sendError(res, 400, 'Invalid export type. Must be json, csv, or pdf');
            }

            // Gather all user data
            const userData = await this.gatherUserData(databaseManager, userId);
            
            // For now, return JSON data. In production, you'd generate actual files
            this.sendSuccess(res, 200, { 
                message: 'Data export initiated successfully',
                exportType,
                data: userData
            });
        } catch (error) {
            ErrorHandler.logError(error, req);
            this.sendError(res, 500, 'Failed to export user data');
        }
    }

    // --- DELETE ACCOUNT ---
    async deleteAccount(req, res, { databaseManager }) {
        try {
            const userId = req.user.userId;
            const { password, confirmation } = req.body;

            if (!password || !confirmation) {
                return this.sendError(res, 400, 'Password and confirmation are required');
            }

            if (confirmation !== 'DELETE') {
                return this.sendError(res, 400, 'Confirmation must be exactly "DELETE"');
            }

            // Verify password (you'd implement actual password verification here)
            const user = await databaseManager.get(
                'SELECT password_hash FROM users WHERE id = ?',
                [userId]
            );

            if (!user) {
                return this.sendError(res, 404, 'User not found');
            }

            // In production, verify password hash here
            // if (!await bcrypt.compare(password, user.password_hash)) {
            //     return this.sendError(res, 401, 'Invalid password');
            // }

            // Soft delete - mark account as deleted
            await databaseManager.run(
                'UPDATE users SET account_status = "deleted", deleted_at = CURRENT_TIMESTAMP WHERE id = ?',
                [userId]
            );

            // Log the deletion
            await databaseManager.run(
                'INSERT INTO account_deletions (user_id, deletion_reason, deleted_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
                [userId, 'User requested account deletion']
            );

            this.sendSuccess(res, 200, { message: 'Account deleted successfully' });
        } catch (error) {
            ErrorHandler.logError(error, req);
            this.sendError(res, 500, 'Failed to delete account');
        }
    }

    // --- HELPER FUNCTION TO GATHER USER DATA ---
    async gatherUserData(databaseManager, userId) {
        try {
            const userData = {};

            // Basic user info
            userData.profile = await databaseManager.get(
                'SELECT username, email, first_name, last_name, created_at FROM users WHERE id = ?',
                [userId]
            );

            // Transactions
            userData.transactions = await databaseManager.all(
                'SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC',
                [userId]
            );

            // Goals
            userData.goals = await databaseManager.all(
                'SELECT * FROM goals WHERE user_id = ? ORDER BY created_at DESC',
                [userId]
            );

            // Settings
            userData.settings = await databaseManager.get(
                'SELECT * FROM user_settings WHERE user_id = ?',
                [userId]
            );

            return userData;
        } catch (error) {
            throw new Error(`Failed to gather user data: ${error.message}`);
        }
    }

    // --- HELPER FUNCTIONS ---
    sendSuccess(res, statusCode, data) {
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, ...data }));
    }

    sendError(res, statusCode, message) {
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: { message, code: statusCode } }));
    }
}

module.exports = new SettingsRoutes();
