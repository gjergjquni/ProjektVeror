// Konfigurimi i aplikacionit
const config = {
    // Konfigurimi i serverit
    server: {
        port: process.env.PORT || 3000,
        host: process.env.HOST || 'localhost',
        environment: process.env.NODE_ENV || 'development'
    },

    // Konfigurimi i sigurisë
    security: {
        bcryptRounds: 10,
        sessionTimeout: 24 * 60 * 60 * 1000, // 24 orë
        jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
        passwordMinLength: 8
    },

    // Konfigurimi i validimit
    validation: {
        emailMaxLength: 254,
        nameMaxLength: 50,
        descriptionMaxLength: 200,
        transactionAmountMax: 999999999.99,
        minAge: 13,
        maxAge: 100
    },

    // Konfigurimi i raportimit
    reporting: {
        maxDateRange: 365, // ditë
        defaultDateRange: 30, // ditë
        maxTransactionsPerRequest: 1000
    },

    // Konfigurimi i email
    email: {
        service: 'gmail',
        from: process.env.EMAIL_USER || 'noreply@elioti.com',
        verificationCodeExpiry: 10 * 60 * 1000 // 10 minutes
    },

    // Konfigurimi i kategorive të transaksioneve
    transactionCategories: {
        income: [
            'Paga',
            'Freelance',
            'Investime',
            'Dhuratë',
            'Të tjera'
        ],
        expense: [
            'Ushqim',
            'Transport',
            'Fatura',
            'Argetim',
            'Blerje',
            'Shëndetësi',
            'Edukim',
            'Të tjera'
        ]
    },

    // Konfigurimi i statusit të punësimit
    employmentStatuses: [
        'i punësuar',
        'i papunë', 
        'student',
        'pensioner',
        'biznesmen'
    ],

    // Konfigurimi i mesazheve
    messages: {
        al: {
            // Mesazhet në shqip
            welcome: 'Mirë se vini në Elioti!',
            loginSuccess: 'Kyçja u krye me sukses!',
            registerSuccess: 'Regjistrimi u krye me sukses!',
            logoutSuccess: 'Dilja u krye me sukses!',
            invalidCredentials: 'Email ose fjalëkalimi i gabuar',
            emailExists: 'Ky email është tashmë i regjistruar',
            sessionExpired: 'Sesioni ka skaduar, ju lutem kyçuni përsëri',
            accessDenied: 'Nuk keni leje për këtë veprim',
            validationError: 'Të dhënat e dhëna nuk janë të vlefshme',
            serverError: 'Gabim i brendshëm i serverit',
            notFound: 'Burimi i kërkuar nuk u gjet'
        }
    },

    // Konfigurimi i database (për të ardhmen)
    database: {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        name: process.env.DB_NAME || 'elioti_db',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || ''
    },

    // Konfigurimi i logging
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        file: process.env.LOG_FILE || 'logs/app.log',
        maxSize: '10m',
        maxFiles: 5
    },

    // Konfigurimi i CORS
    cors: {
        origin: process.env.CORS_ORIGIN || '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'x-session-id']
    }
};

// Funksione ndihmëse për konfigurimin
config.isDevelopment = () => config.server.environment === 'development';
config.isProduction = () => config.server.environment === 'production';
config.isTest = () => config.server.environment === 'test';

// Validimi i konfigurimit
config.validate = () => {
    const errors = [];
    
    if (!config.security.jwtSecret || config.security.jwtSecret === 'your-secret-key-change-in-production') {
        errors.push('JWT_SECRET duhet të konfigurohet në production');
    }
    
    if (config.server.port < 1 || config.server.port > 65535) {
        errors.push('Porti duhet të jetë mes 1 dhe 65535');
    }
    
    if (errors.length > 0) {
        throw new Error(`Konfigurimi i pavlefshëm: ${errors.join(', ')}`);
    }
};

module.exports = config; 