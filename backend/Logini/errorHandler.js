class ErrorHandler {
    // Klasa për gabimet e personalizuara
    static createError(message, statusCode = 500, errorCode = 'INTERNAL_ERROR') {
        const error = new Error(message);
        error.statusCode = statusCode;
        error.errorCode = errorCode;
        return error;
    }

    // Middleware për të kapur gabimet
    static handleError(err, req, res, next) {
        console.error('Error:', err);

        // Nëse gabimi ka tashmë statusCode, përdore atë
        const statusCode = err.statusCode || 500;
        const message = err.message || 'Gabim i brendshëm i serverit';
        const errorCode = err.errorCode || 'INTERNAL_ERROR';

        // Përgjigja e gabimit
        res.status(statusCode).json({
            success: false,
            error: {
                message: message,  
                code: errorCode,
                timestamp: new Date().toISOString()
            }
        });
    }

    // Gabimet e zakonshme
    static errors = {
        VALIDATION_ERROR: (message) => ErrorHandler.createError(message, 400, 'VALIDATION_ERROR'),
        UNAUTHORIZED: (message = 'Kërkohet autentifikim') => ErrorHandler.createError(message, 401, 'UNAUTHORIZED'),
        FORBIDDEN: (message = 'Nuk keni leje për këtë veprim') => ErrorHandler.createError(message, 403, 'FORBIDDEN'),
        NOT_FOUND: (message = 'Burimi nuk u gjet') => ErrorHandler.createError(message, 404, 'NOT_FOUND'),
        CONFLICT: (message = 'Konflikt me të dhënat ekzistuese') => ErrorHandler.createError(message, 409, 'CONFLICT'),
        RATE_LIMIT_EXCEEDED: (message = 'Kërkesa ka tejkaluar limitin') => ErrorHandler.createError(message, 429, 'RATE_LIMIT_EXCEEDED'),
        INTERNAL_ERROR: (message = 'Gabim i brendshëm i serverit') => ErrorHandler.createError(message, 500, 'INTERNAL_ERROR'),
        SERVER_ERROR: (message = 'Gabim i serverit') => ErrorHandler.createError(message, 500, 'SERVER_ERROR'),
        SERVICE_UNAVAILABLE: (message = 'Shërbimi nuk është i disponueshëm') => ErrorHandler.createError(message, 503, 'SERVICE_UNAVAILABLE')
    };

    // Validimi i gabimeve specifike për aplikacionin
    static validateUserInput(data, requiredFields) {
        const missingFields = [];
        
        for (const field of requiredFields) {
            if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
                missingFields.push(field);
            }
        }

        if (missingFields.length > 0) {
            throw ErrorHandler.errors.VALIDATION_ERROR(
                `Fushat e munguara: ${missingFields.join(', ')}`
            );
        }
    }

    // Logging i gabimeve
    static logError(error, req = null) {
        const errorLog = {
            timestamp: new Date().toISOString(),
            error: {
                message: error.message,
                stack: error.stack,
                code: error.errorCode || 'UNKNOWN'
            },
            request: req ? {
                method: req.method,
                url: req.url,
                ip: req.ip,
                userAgent: req.get('User-Agent')
            } : null
        };

        console.error('Error Log:', JSON.stringify(errorLog, null, 2));
        
        // Këtu mund të shtoni logjikë për të ruajtur gabimet në database
        // ose për t'i dërguar në një shërbim monitoring
    }
}

module.exports = ErrorHandler; 