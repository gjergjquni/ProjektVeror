/**
 * Enhanced Validators for Financial Application
 * Provides comprehensive input validation and sanitization
 */

const crypto = require('crypto');
const config = require('./config');

class Validators {
    /**
     * Enhanced email validation with security checks
     */
    static validateEmail(email) {
        if (!email || typeof email !== 'string') {
            return { valid: false, message: 'Email is required and must be a string' };
        }

        // Trim and normalize email
        email = email.trim().toLowerCase();

        // Check length
        if (email.length > config.validation.emailMaxLength) {
            return { valid: false, message: `Email must be less than ${config.validation.emailMaxLength} characters` };
        }

        // Enhanced email regex with security considerations
        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        
        if (!emailRegex.test(email)) {
            return { valid: false, message: 'Invalid email format' };
        }

        // Check for common disposable email domains
        const disposableDomains = ['tempmail.com', '10minutemail.com', 'guerrillamail.com'];
        const domain = email.split('@')[1];
        if (disposableDomains.includes(domain)) {
            return { valid: false, message: 'Disposable email addresses are not allowed' };
        }

        return { valid: true, sanitized: email };
    }

    /**
     * Enhanced password validation with security requirements
     */
    static validatePassword(password) {
        if (!password || typeof password !== 'string') {
            return { valid: false, message: 'Password is required and must be a string' };
        }

        const errors = [];

        // Check minimum length
        if (password.length < config.security.passwordMinLength) {
            errors.push(`Password must be at least ${config.security.passwordMinLength} characters long`);
        }

        // Check maximum length (prevent DoS attacks)
        if (password.length > 128) {
            errors.push('Password must be less than 128 characters');
        }

        // Check for required character types
        if (!/(?=.*[a-z])/.test(password)) {
            errors.push('Password must contain at least one lowercase letter');
        }

        if (!/(?=.*[A-Z])/.test(password)) {
            errors.push('Password must contain at least one uppercase letter');
        }

        if (!/(?=.*\d)/.test(password)) {
            errors.push('Password must contain at least one number');
        }

        if (!/(?=.*[@$!%*?&])/.test(password)) {
            errors.push('Password must contain at least one special character (@$!%*?&)');
        }

        // Check for common weak passwords
        const weakPasswords = ['password', '123456', 'qwerty', 'admin', 'letmein'];
        if (weakPasswords.includes(password.toLowerCase())) {
            errors.push('Password is too common, please choose a stronger password');
        }

        // Check for sequential characters
        if (/(.)\1{2,}/.test(password)) {
            errors.push('Password cannot contain more than 2 consecutive identical characters');
        }

        if (errors.length > 0) {
            return { valid: false, message: errors.join(', ') };
        }

        return { valid: true };
    }

    /**
     * Enhanced name validation with sanitization
     */
    static validateName(name) {
        if (!name || typeof name !== 'string') {
            return { valid: false, message: 'Name is required and must be a string' };
        }

        // Trim and normalize
        name = name.trim();

        // Check length
        if (name.length < 2) {
            return { valid: false, message: 'Name must be at least 2 characters long' };
        }

        if (name.length > config.validation.nameMaxLength) {
            return { valid: false, message: `Name must be less than ${config.validation.nameMaxLength} characters` };
        }

        // Check for valid characters (letters, spaces, hyphens, apostrophes)
        if (!/^[a-zA-ZÀ-ÿ\s\-']+$/.test(name)) {
            return { valid: false, message: 'Name can only contain letters, spaces, hyphens, and apostrophes' };
        }

        // Check for excessive spaces
        if (/\s{2,}/.test(name)) {
            return { valid: false, message: 'Name cannot contain multiple consecutive spaces' };
        }

        // Capitalize properly
        const sanitized = name.replace(/\s+/g, ' ').trim();
        const capitalized = sanitized.replace(/\b\w/g, l => l.toUpperCase());

        return { valid: true, sanitized: capitalized };
    }

    /**
     * Enhanced date of birth validation
     */
    static validateDateOfBirth(day, month, year) {
        // Convert to numbers
        day = parseInt(day);
        month = parseInt(month);
        year = parseInt(year);

        // Check if all are valid numbers
        if (isNaN(day) || isNaN(month) || isNaN(year)) {
            return { valid: false, message: 'Invalid date values' };
        }

        const currentYear = new Date().getFullYear();
        const minYear = currentYear - config.validation.maxAge;
        const maxYear = currentYear - config.validation.minAge;

        if (year < minYear || year > maxYear) {
            return { valid: false, message: `Age must be between ${config.validation.minAge} and ${config.validation.maxAge} years` };
        }

        // Validate date
        const date = new Date(year, month - 1, day);
        if (date.getDate() !== day || 
            date.getMonth() !== month - 1 || 
            date.getFullYear() !== year) {
            return { valid: false, message: 'Invalid date' };
        }

        // Check if date is in the future
        if (date > new Date()) {
            return { valid: false, message: 'Date of birth cannot be in the future' };
        }

        return { valid: true, sanitized: date.toISOString().split('T')[0] };
    }

    /**
     * Enhanced employment status validation
     */
    static validateEmploymentStatus(status) {
        if (!status || typeof status !== 'string') {
            return { valid: false, message: 'Employment status is required' };
        }

        const validStatuses = config.employmentStatuses;
        const normalizedStatus = status.trim().toLowerCase();

        if (!validStatuses.includes(normalizedStatus)) {
            return { valid: false, message: `Invalid employment status. Must be one of: ${validStatuses.join(', ')}` };
        }

        return { valid: true, sanitized: normalizedStatus };
    }

    /**
     * Enhanced transaction validation
     */
    static validateTransaction(amount, type, category, description) {
        const errors = [];

        // Validate amount
        amount = parseFloat(amount);
        if (isNaN(amount) || amount <= 0) {
            errors.push('Amount must be a positive number');
        } else if (amount > config.validation.transactionAmountMax) {
            errors.push(`Amount cannot exceed ${config.validation.transactionAmountMax}`);
        }

        // Validate type
        if (!['income', 'expense'].includes(type)) {
            errors.push('Transaction type must be "income" or "expense"');
        }

        // Validate category
        if (!category || typeof category !== 'string' || category.trim().length === 0) {
            errors.push('Category is required');
        } else {
            const validCategories = [...config.transactionCategories.income, ...config.transactionCategories.expense];
            if (!validCategories.includes(category.trim())) {
                errors.push(`Invalid category. Must be one of: ${validCategories.join(', ')}`);
            }
        }

        // Validate description
        if (description && typeof description === 'string') {
            if (description.length > config.validation.descriptionMaxLength) {
                errors.push(`Description must be less than ${config.validation.descriptionMaxLength} characters`);
            }
        }

        if (errors.length > 0) {
            return { valid: false, message: errors.join(', ') };
        }

        return { 
            valid: true, 
            sanitized: {
                amount: parseFloat(amount.toFixed(2)),
                type: type,
                category: category.trim(),
                description: description ? description.trim() : null
            }
        };
    }

    /**
     * Enhanced user profile validation
     */
    static validateUserProfile(jobTitle, monthlySalary, savingsGoalPercentage) {
        const errors = [];

        // Validate job title
        if (!jobTitle || typeof jobTitle !== 'string' || jobTitle.trim().length === 0) {
            errors.push('Job title is required');
        } else if (jobTitle.trim().length > 100) {
            errors.push('Job title must be less than 100 characters');
        }

        // Validate monthly salary
        monthlySalary = parseFloat(monthlySalary);
        if (isNaN(monthlySalary) || monthlySalary <= 0) {
            errors.push('Monthly salary must be a positive number');
        } else if (monthlySalary > 999999) {
            errors.push('Monthly salary cannot exceed 999,999');
        }

        // Validate savings goal percentage
        savingsGoalPercentage = parseFloat(savingsGoalPercentage);
        if (isNaN(savingsGoalPercentage) || savingsGoalPercentage < 0 || savingsGoalPercentage > 100) {
            errors.push('Savings goal percentage must be between 0 and 100');
        }

        if (errors.length > 0) {
            return { valid: false, message: errors.join(', ') };
        }

        return { 
            valid: true, 
            sanitized: {
                jobTitle: jobTitle.trim(),
                monthlySalary: parseFloat(monthlySalary.toFixed(2)),
                savingsGoalPercentage: parseFloat(savingsGoalPercentage.toFixed(1))
            }
        };
    }

    /**
     * Enhanced date range validation
     */
    static validateDateRange(startDate, endDate) {
        const errors = [];

        // Parse dates
        const start = new Date(startDate);
        const end = new Date(endDate);
        const now = new Date();

        if (isNaN(start.getTime())) {
            errors.push('Invalid start date format');
        }

        if (isNaN(end.getTime())) {
            errors.push('Invalid end date format');
        }

        if (errors.length === 0) {
            if (start > end) {
                errors.push('Start date must be before end date');
            }

            if (end > now) {
                errors.push('End date cannot be in the future');
            }

            // Check if date range is too large
            const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
            if (daysDiff > config.reporting.maxDateRange) {
                errors.push(`Date range cannot exceed ${config.reporting.maxDateRange} days`);
            }
        }

        if (errors.length > 0) {
            return { valid: false, message: errors.join(', ') };
        }

        return { 
            valid: true, 
            sanitized: {
                startDate: start.toISOString().split('T')[0],
                endDate: end.toISOString().split('T')[0]
            }
        };
    }

    /**
     * Sanitize and validate input strings
     */
    static sanitizeString(input, maxLength = 255) {
        if (!input || typeof input !== 'string') {
            return null;
        }

        // Remove HTML tags and dangerous characters
        let sanitized = input
            .replace(/<[^>]*>/g, '') // Remove HTML tags
            .replace(/[<>\"'&]/g, '') // Remove dangerous characters
            .trim();

        // Limit length
        if (sanitized.length > maxLength) {
            sanitized = sanitized.substring(0, maxLength);
        }

        return sanitized || null;
    }

    /**
     * Validate and sanitize numeric input
     */
    static validateNumber(value, min = null, max = null) {
        const num = parseFloat(value);
        
        if (isNaN(num)) {
            return { valid: false, message: 'Value must be a valid number' };
        }

        if (min !== null && num < min) {
            return { valid: false, message: `Value must be at least ${min}` };
        }

        if (max !== null && num > max) {
            return { valid: false, message: `Value must be at most ${max}` };
        }

        return { valid: true, sanitized: num };
    }

    /**
     * Generate secure random string
     */
    static generateSecureId(length = 32) {
        return crypto.randomBytes(length).toString('hex');
    }

    /**
     * Validate JWT token format
     */
    static validateJWTFormat(token) {
        if (!token || typeof token !== 'string') {
            return false;
        }

        const parts = token.split('.');
        if (parts.length !== 3) {
            return false;
        }

        // Check if parts are base64url encoded
        const base64UrlRegex = /^[A-Za-z0-9_-]+$/;
        return parts.every(part => base64UrlRegex.test(part));
    }
}

module.exports = Validators; 