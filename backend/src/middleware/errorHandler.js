const logger = require('../utils/logger');

/**
 * Custom application error class
 */
class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Centralized express error-handling middleware
 */
const errorHandler = (err, req, res, next) => {
  const isProduction = process.env.NODE_ENV === 'production';
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let details = err.details || null;

  // Handle PostgreSQL specific errors
  if (err.code) {
    switch (err.code) {
      case '23505': // unique_violation
        statusCode = 409;
        message = 'A record with this identifier already exists.';
        break;
      case '23514': // check_violation
        statusCode = 400;
        message = 'Invalid value submitted. Data violates system constraints.';
        break;
      case '22P02': // invalid_text_representation (e.g. invalid UUID)
        statusCode = 400;
        message = 'Invalid input format or identifier.';
        break;
      case '28P01': // invalid_password
      case '3D000': // database does not exist
      case 'ECONNREFUSED':
      case 'ENOTFOUND':
        statusCode = 503;
        message = 'Database service temporarily unavailable. Please verify connection credentials.';
        break;
      default:
        if (statusCode === 500 && isProduction) {
          message = 'A database error occurred. Please try again later.';
        }
        break;
    }
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token.';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication session has expired. Please log in again.';
  }

  logger.error(`${req.method} ${req.originalUrl} - ${statusCode} - ${message}`, {
    statusCode,
    error: err.message,
    stack: !isProduction ? err.stack : undefined,
  });

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(details ? { details } : {}),
    ...(!isProduction && err.stack ? { stack: err.stack } : {})
  });
};

module.exports = {
  AppError,
  errorHandler,
};
