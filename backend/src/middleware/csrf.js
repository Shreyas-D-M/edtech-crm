const crypto = require('crypto');
const { AppError } = require('./errorHandler');

/**
 * Generate a cryptographically secure random token for CSRF defense
 */
const generateCsrfToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Set the CSRF token cookie on the response
 * Note: httpOnly is false so the client application can read it and send it in the X-CSRF-Token header
 */
const setCsrfCookie = (res, token) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie('csrf_token', token, {
    httpOnly: false,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000,
    path: '/',
  });
};

/**
 * Middleware: Verify CSRF token for state-changing requests using cookie authentication
 */
const csrfProtection = (req, res, next) => {
  // Safe HTTP methods don't require CSRF checks
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // If request uses Bearer token authorization header, it's not vulnerable to browser CSRF
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    return next();
  }

  // If an auth cookie is present, check CSRF token
  if (req.cookies && req.cookies.token) {
    const cookieToken = req.cookies.csrf_token;
    const headerToken = req.headers['x-csrf-token'];

    if (!headerToken || !cookieToken || headerToken !== cookieToken) {
      return next(new AppError('Invalid or missing CSRF token. Request rejected.', 403));
    }
  }

  next();
};

module.exports = {
  generateCsrfToken,
  setCsrfCookie,
  csrfProtection,
};
