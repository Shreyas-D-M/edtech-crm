const jwt = require('jsonwebtoken');
const { AppError } = require('./errorHandler');
const logger = require('../utils/logger');

/**
 * Authentication middleware for verifying admin JWT tokens
 * Checks both HTTP-only cookie and Authorization Bearer header
 */
const requireAdminAuth = (req, res, next) => {
  let token = null;

  // 1. Try to read token from HTTP-only cookie
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  // 2. Fallback to Authorization: Bearer header for API/testing clients
  else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('Authentication required. Please log in to access this resource.', 401));
  }

  const secret = process.env.JWT_SECRET || 'fallback_development_secret_change_in_production';

  try {
    const decoded = jwt.verify(token, secret);
    req.admin = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
    };
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Your session has expired. Please log in again.', 401));
    }
    logger.warn('Invalid JWT token received', { error: error.message });
    return next(new AppError('Invalid or corrupted session token. Please log in again.', 401));
  }
};

module.exports = {
  requireAdminAuth,
};
