// Import the Express framework
const express = require('express');
// Import body-parser to parse JSON request bodies
const bodyParser = require('body-parser');
// Import bcrypt for password hashing
const bcrypt = require('bcrypt');
// Import crypto for secure code generation
const crypto = require('crypto');
// Import rate limiting
const rateLimit = require('express-rate-limit');
// Import the Transaction classes from Transaction.js
const { Transaction, UserProfile, ReportGenerator } = require('./Transaction.js');

// Import new modules
const SessionManager = require('./sessionManager');
const AuthMiddleware = require('./authMiddleware');
const Validators = require('./validators');
const ErrorHandler = require('./errorHandler');
const EmailService = require('./emailService');
const config = require('./config');

// Create an instance of an Express application
const app = express();
// Define the port the server will listen on
const PORT = config.server.port;

// Initialize session manager and email service
const sessionManager = new SessionManager();
const authMiddleware = new AuthMiddleware(sessionManager);
const emailService = new EmailService();

// Middleware to parse incoming JSON request bodies
app.use(bodyParser.json());

// CORS middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', config.cors.origin);
    res.header('Access-Control-Allow-Methods', config.cors.methods.join(', '));
    res.header('Access-Control-Allow-Headers', config.cors.allowedHeaders.join(', '));
    next();
});

// Rate limiting for registration and login
const registrationLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 3, // 3 registrations per 10 minutes
    message: { error: 'Too many registration attempts, please try again later' }
});

const loginLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 5, // 5 logins per 5 minutes
    message: { error: 'Too many login attempts, please try again later' }
});

// Apply rate limiting
app.use('/register', registrationLimiter);
app.use('/login', loginLimiter);

// User data storage using a hash table (object) keyed by email
// Each user now has: { password: hashedPassword, userId: uniqueId, profile: UserProfile }
const users = {};

// Store user profiles and transactions (in a real app, this would be in a database)
const userProfiles = {}; // userId -> UserProfile
const userTransactions = {}; // userId -> Transaction[]

// Store registration sessions (in production, use Redis or database)
const registrationSessions = {};

// Generate a unique user ID
function generateUserId() {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Generate secure registration ID
function generateSecureRegistrationId() {
    return 'reg_' + crypto.randomBytes(16).toString('hex');
}

// ===== MULTI-STEP REGISTRATION FLOW =====

// Step 1: Basic Information (Name, Surname, Date of Birth)
app.post('/register/step1', async (req, res) => {
    try {
        const { firstName, lastName, day, month, year } = req.body;
        
        // Validate required fields
        ErrorHandler.validateUserInput(req.body, ['firstName', 'lastName', 'day', 'month', 'year']);
        
        // Enhanced validation with sanitization
        const firstNameValidation = Validators.validateName(firstName);
        const lastNameValidation = Validators.validateName(lastName);
        const dateValidation = Validators.validateDateOfBirth(parseInt(day), parseInt(month), parseInt(year));
        
        if (!firstNameValidation.valid) {
            throw ErrorHandler.errors.VALIDATION_ERROR(firstNameValidation.message);
        }
        
        if (!lastNameValidation.valid) {
            throw ErrorHandler.errors.VALIDATION_ERROR(lastNameValidation.message);
        }
        
        if (!dateValidation.valid) {
            throw ErrorHandler.errors.VALIDATION_ERROR(dateValidation.message);
        }

        // Store in encrypted session
        const registrationId = generateSecureRegistrationId();
        registrationSessions[registrationId] = {
            step: 1,
            firstName: firstNameValidation.sanitized,
            lastName: lastNameValidation.sanitized,
            dateOfBirth: dateValidation.sanitized,
            createdAt: Date.now(),
            auditLog: [`Step 1 completed at ${new Date().toISOString()}`]
        };

        res.json({ 
            success: true, 
            registrationId,
            message: 'Step 1 completed successfully'
        });
    } catch (err) {
        ErrorHandler.logError(err, req);
        if (err.statusCode) {
            res.status(err.statusCode).json({ 
                success: false,
                error: { message: err.message, code: err.errorCode }
            });
        } else {
            res.status(500).json({ 
                success: false,
                error: { message: config.messages.al.serverError }
            });
        }
    }
});

// Step 2: Employment Status
app.post('/register/step2', async (req, res) => {
    try {
        const { registrationId, employmentStatus, jobTitle, monthlySalary } = req.body;
        
        // Validate required fields
        ErrorHandler.validateUserInput(req.body, ['registrationId', 'employmentStatus']);
        
        const session = registrationSessions[registrationId];
        if (!session || session.step !== 1) {
            throw ErrorHandler.errors.VALIDATION_ERROR('Invalid registration session');
        }

        // Enhanced employment validation
        const statusValidation = Validators.validateEmploymentStatus(employmentStatus);
        if (!statusValidation.valid) {
            throw ErrorHandler.errors.VALIDATION_ERROR(statusValidation.message);
        }

        // Update session with audit
        session.step = 2;
        session.employmentStatus = statusValidation.sanitized;
        session.jobTitle = jobTitle ? Validators.sanitizeString(jobTitle) : null;
        session.monthlySalary = monthlySalary ? parseFloat(monthlySalary) : null;
        session.auditLog.push(`Step 2 completed at ${new Date().toISOString()}`);

        res.json({ 
            success: true, 
            message: 'Step 2 completed successfully'
        });
    } catch (err) {
        ErrorHandler.logError(err, req);
        if (err.statusCode) {
            res.status(err.statusCode).json({ 
                success: false,
                error: { message: err.message, code: err.errorCode }
            });
        } else {
            res.status(500).json({ 
                success: false,
                error: { message: config.messages.al.serverError }
            });
        }
    }
});

// Step 3: Account Details (Email, Password, Confirm Password)
app.post('/register/step3', async (req, res) => {
    try {
        const { registrationId, email, password, confirmPassword } = req.body;
        
        // Validate required fields
        ErrorHandler.validateUserInput(req.body, ['registrationId', 'email', 'password', 'confirmPassword']);
        
        const session = registrationSessions[registrationId];
        if (!session || session.step !== 2) {
            throw ErrorHandler.errors.VALIDATION_ERROR('Invalid registration session');
        }

        // Enhanced email validation (includes disposable email check)
        const emailValidation = Validators.validateEmail(email);
        if (!emailValidation.valid) {
            throw ErrorHandler.errors.VALIDATION_ERROR(emailValidation.message);
        }

        // Enhanced password validation (includes weak password and sequential character checks)
        const passwordValidation = Validators.validatePassword(password);
        if (!passwordValidation.valid) {
            throw ErrorHandler.errors.VALIDATION_ERROR(passwordValidation.message);
        }

        if (password !== confirmPassword) {
            throw ErrorHandler.errors.VALIDATION_ERROR('Passwords do not match');
        }

        // Check if email already exists
        if (users[emailValidation.sanitized]) {
            throw ErrorHandler.errors.CONFLICT('Email already registered');
        }

        // Generate secure verification code
        const verificationCode = crypto.randomInt(100000, 999999).toString();
        
        // Update session
        session.step = 3;
        session.email = emailValidation.sanitized;
        session.password = password; // Will be hashed in final step
        session.verificationCode = verificationCode;
        session.codeExpiry = Date.now() + (10 * 60 * 1000); // 10 minutes
        session.auditLog.push(`Step 3 completed at ${new Date().toISOString()}`);

        // Send verification email
        const emailSent = await emailService.sendVerificationCode(emailValidation.sanitized, verificationCode);
        if (!emailSent) {
            throw ErrorHandler.errors.SERVER_ERROR('Failed to send verification email');
        }

        res.json({ 
            success: true, 
            message: 'Verification code sent to your email'
        });
    } catch (err) {
        ErrorHandler.logError(err, req);
        if (err.statusCode) {
            res.status(err.statusCode).json({ 
                success: false,
                error: { message: err.message, code: err.errorCode }
            });
        } else {
            res.status(500).json({ 
                success: false,
                error: { message: config.messages.al.serverError }
            });
        }
    }
});

// Step 4: Verify email and create account
app.post('/register/verify', async (req, res) => {
    try {
        const { registrationId, verificationCode } = req.body;
        
        // Validate required fields
        ErrorHandler.validateUserInput(req.body, ['registrationId', 'verificationCode']);
        
        const session = registrationSessions[registrationId];
        if (!session || session.step !== 3) {
            throw ErrorHandler.errors.VALIDATION_ERROR('Invalid registration session');
        }

        // Check if code is expired
        if (Date.now() > session.codeExpiry) {
            delete registrationSessions[registrationId];
            throw ErrorHandler.errors.VALIDATION_ERROR('Verification code expired');
        }

        // Verify code
        if (session.verificationCode !== verificationCode) {
            throw ErrorHandler.errors.VALIDATION_ERROR('Invalid verification code');
        }

        // Create user account with enhanced security
        const hashedPassword = await bcrypt.hash(session.password, config.security.bcryptRounds);
        const userId = generateUserId();
        
        // Store user with all properties
        users[session.email] = {
            password: hashedPassword,
            userId: userId,
            fullName: `${session.firstName} ${session.lastName}`,
            dateOfBirth: session.dateOfBirth,
            employmentStatus: session.employmentStatus,
            createdAt: new Date(),
            lastLogin: new Date(),
            auditLog: session.auditLog
        };

        // Create user profile if employment data exists
        if (session.jobTitle && session.monthlySalary) {
            const userProfile = new UserProfile(userId, session.jobTitle, session.monthlySalary, 20); // Default 20% savings goal
            userProfiles[userId] = userProfile;
        }

        // Initialize transactions
        userTransactions[userId] = [];

        // Create JWT session with blacklisting capability
        const sessionId = sessionManager.createSession(userId, session.email);

        // Clean up registration session
        delete registrationSessions[registrationId];

        // Add to audit log
        session.auditLog.push(`Account created successfully at ${new Date().toISOString()}`);

        res.json({ 
            success: true,
            message: config.messages.al.registerSuccess,
            userId: userId,
            sessionId: sessionId,
            user: {
                fullName: `${session.firstName} ${session.lastName}`,
                email: session.email,
                employmentStatus: session.employmentStatus
            }
        });
    } catch (err) {
        ErrorHandler.logError(err, req);
        if (err.statusCode) {
            res.status(err.statusCode).json({ 
                success: false,
                error: { message: err.message, code: err.errorCode }
            });
        } else {
            res.status(500).json({ 
                success: false,
                error: { message: config.messages.al.serverError }
            });
        }
    }
});

// Signup endpoint to handle POST requests to /signup
app.post('/signup', async (req, res) => {
  try {
    // Extract data from request body
    const { email, password, fullName, day, month, year, employmentStatus, jobTitle, monthlySalary, savingsGoalPercentage } = req.body;

    // Validate required fields
    ErrorHandler.validateUserInput(req.body, ['email', 'password', 'fullName', 'day', 'month', 'year', 'employmentStatus']);

    // Validate email format
    if (!Validators.validateEmail(email)) {
      throw ErrorHandler.errors.VALIDATION_ERROR('Format i pavlefshëm i email-it');
    }

    // Validate password strength
    if (!Validators.validatePassword(password)) {
      throw ErrorHandler.errors.VALIDATION_ERROR('Fjalëkalimi duhet të ketë të paktën 8 karaktere, 1 shkronjë të madhe dhe 1 numër');
    }

    // Validate name
    if (!Validators.validateName(fullName)) {
      throw ErrorHandler.errors.VALIDATION_ERROR('Emri duhet të ketë të paktën 2 karaktere');
    }

    // Validate date of birth
    if (!Validators.validateDateOfBirth(parseInt(day), parseInt(month), parseInt(year))) {
      throw ErrorHandler.errors.VALIDATION_ERROR('Data e lindjes nuk është e vlefshme');
    }

    // Validate employment status
    if (!Validators.validateEmploymentStatus(employmentStatus)) {
      throw ErrorHandler.errors.VALIDATION_ERROR('Statusi i punësimit nuk është i vlefshëm');
    }

    // Check if the email is already registered
    if (users[email]) {
      throw ErrorHandler.errors.CONFLICT('Ky email është tashmë i regjistruar');
    }

    // Hash the password before storing
    const hashedPassword = await bcrypt.hash(password, config.security.bcryptRounds);
    
    // Generate a unique user ID
    const userId = generateUserId();
    
    // Store the user with hashed password and userId
    users[email] = { 
      password: hashedPassword, 
      userId: userId,
      fullName: fullName,
      dateOfBirth: new Date(parseInt(year), parseInt(month) - 1, parseInt(day)),
      employmentStatus: employmentStatus
    };

    // Create a default user profile if profile data is provided
    if (jobTitle && monthlySalary && savingsGoalPercentage) {
      const profileValidation = Validators.validateUserProfile(jobTitle, monthlySalary, savingsGoalPercentage);
      if (!profileValidation.valid) {
        throw ErrorHandler.errors.VALIDATION_ERROR(profileValidation.message);
      }
      
      const userProfile = new UserProfile(userId, jobTitle, monthlySalary, savingsGoalPercentage);
      userProfiles[userId] = userProfile;
    }

    // Initialize empty transactions array for the user
    userTransactions[userId] = [];

    // Respond with success and user ID
    res.status(201).json({ 
      success: true,
      message: config.messages.al.registerSuccess,
      userId: userId
    });
  } catch (err) {
    ErrorHandler.logError(err, req);
    if (err.statusCode) {
      res.status(err.statusCode).json({ 
        success: false,
        error: { message: err.message, code: err.errorCode }
      });
    } else {
      res.status(500).json({ 
        success: false,
        error: { message: config.messages.al.serverError }
      });
    }
  }
});

// Login endpoint to handle POST requests to /login
app.post('/login', async (req, res) => {
  try {
    // Extract email and password from the request body
    const { email, password } = req.body;

    // Validate required fields
    ErrorHandler.validateUserInput(req.body, ['email', 'password']);

    // Validate email format
    if (!Validators.validateEmail(email)) {
      throw ErrorHandler.errors.VALIDATION_ERROR('Format i pavlefshëm i email-it');
    }

    // Find the user by email
    const user = users[email];
    if (!user) {
      throw ErrorHandler.errors.UNAUTHORIZED(config.messages.al.invalidCredentials);
    }

    // Compare the provided password with the stored hashed password
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      throw ErrorHandler.errors.UNAUTHORIZED(config.messages.al.invalidCredentials);
    }

    // Create a new session for the user
    const sessionId = sessionManager.createSession(user.userId, email);

    // If email and password are correct, send a success response with session ID
    res.json({ 
      success: true,
      message: config.messages.al.loginSuccess,
      userId: user.userId,
      sessionId: sessionId,
      user: {
        fullName: user.fullName,
        email: email,
        employmentStatus: user.employmentStatus
      }
    });
  } catch (err) {
    ErrorHandler.logError(err, req);
    if (err.statusCode) {
      res.status(err.statusCode).json({ 
        success: false,
        error: { message: err.message, code: err.errorCode }
      });
    } else {
      res.status(500).json({ 
        success: false,
        error: { message: config.messages.al.serverError }
      });
    }
  }
});

// Endpoint to create/update user profile
app.post('/profile', async (req, res) => {
  const { email, jobTitle, monthlySalary, savingsGoalPercentage } = req.body;

  // Find the user by email
  const user = users[email];
  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  try {
    // Create or update user profile
    const userProfile = new UserProfile(user.userId, jobTitle, monthlySalary, savingsGoalPercentage);
    userProfiles[user.userId] = userProfile;

    res.json({ 
      message: 'Profile updated successfully',
      profile: userProfile
    });
  } catch (err) {
    res.status(500).json({ message: 'Error updating profile.' });
  }
});

// Endpoint to add a transaction
app.post('/transaction', async (req, res) => {
  const { email, amount, date, type, category, description } = req.body;

  // Find the user by email
  const user = users[email];
  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  try {
    // Create a new transaction
    const transactionId = 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const transaction = new Transaction(transactionId, amount, date, type, category, description, user.userId);
    
    // Add to user's transactions
    userTransactions[user.userId].push(transaction);

    res.json({ 
      message: 'Transaction added successfully',
      transaction: transaction
    });
  } catch (err) {
    res.status(500).json({ message: 'Error adding transaction: ' + err.message });
  }
});

// Endpoint to get user reports
app.get('/reports/:email', async (req, res) => {
  const { email } = req.params;
  const { startDate, endDate } = req.query;

  // Find the user by email
  const user = users[email];
  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  try {
    const userId = user.userId;
    const userProfile = userProfiles[userId];
    const transactions = userTransactions[userId] || [];

    if (!userProfile) {
      return res.status(404).json({ message: 'User profile not found. Please create a profile first.' });
    }

    // Create report generator
    const reportGenerator = new ReportGenerator(transactions, userProfile);

    // Generate reports
    const reports = {
      spendingAnalysis: reportGenerator.generateSpendingAnalysis(new Date(startDate), new Date(endDate)),
      incomeVsExpense: reportGenerator.generateIncomeVsExpenseReport(new Date(startDate), new Date(endDate)),
      budgetVsActual: reportGenerator.generateBudgetVsActualReport(new Date(startDate), new Date(endDate)),
      savingsGrowth: reportGenerator.generateSavingsGrowth(new Date(startDate), new Date(endDate))
    };

    res.json({ reports });
  } catch (err) {
    res.status(500).json({ message: 'Error generating reports: ' + err.message });
  }
});

// Logout endpoint
app.post('/logout', authMiddleware.requireAuth, (req, res) => {
  try {
    const sessionId = req.headers['x-session-id'];
    sessionManager.destroySession(sessionId);
    
    res.json({ 
      success: true,
      message: config.messages.al.logoutSuccess
    });
  } catch (err) {
    ErrorHandler.logError(err, req);
    res.status(500).json({ 
      success: false,
      error: { message: config.messages.al.serverError }
    });
  }
});

// Get user profile endpoint
app.get('/user/profile', authMiddleware.requireAuth, (req, res) => {
  try {
    const user = users[req.user.email];
    const userProfile = userProfiles[req.user.userId];
    
    res.json({
      success: true,
      user: {
        fullName: user.fullName,
        email: req.user.email,
        employmentStatus: user.employmentStatus,
        dateOfBirth: user.dateOfBirth
      },
      profile: userProfile || null
    });
  } catch (err) {
    ErrorHandler.logError(err, req);
    res.status(500).json({ 
      success: false,
      error: { message: config.messages.al.serverError }
    });
  }
});

// Get transaction categories endpoint
app.get('/categories', (req, res) => {
  res.json({
    success: true,
    categories: config.transactionCategories
  });
});

// Get employment statuses endpoint
app.get('/employment-statuses', (req, res) => {
  res.json({
    success: true,
    statuses: config.employmentStatuses
  });
});

// Error handling middleware (duhet të jetë i fundit)
app.use(ErrorHandler.handleError);

// Start the server and listen on the specified port
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Environment: ${config.server.environment}`);
  
  // Cleanup expired sessions every hour
  setInterval(() => {
    sessionManager.cleanupExpiredSessions();
  }, 60 * 60 * 1000);
});

// Export classes for use in other files
module.exports = { Transaction, UserProfile, ReportGenerator };
