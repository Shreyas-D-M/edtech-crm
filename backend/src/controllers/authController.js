const authService = require('../services/authService');
const { generateCsrfToken, setCsrfCookie } = require('../middleware/csrf');

/**
 * Handle admin login request
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { token, admin } = await authService.loginAdmin(email, password);

    const isProduction = process.env.NODE_ENV === 'production';

    // 1. Set HTTP-only JWT authentication cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: '/',
    });

    // 2. Set CSRF cookie for subsequent mutation protection
    const csrfToken = generateCsrfToken();
    setCsrfCookie(res, csrfToken);

    res.status(200).json({
      success: true,
      message: 'Authentication successful.',
      admin,
      csrfToken,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handle admin logout request
 */
const logout = async (req, res) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
  };

  res.clearCookie('token', cookieOptions);
  res.clearCookie('csrf_token', { ...cookieOptions, httpOnly: false });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
};

/**
 * Return currently authenticated administrator profile
 */
const getMe = async (req, res, next) => {
  try {
    const admin = await authService.getAdminById(req.admin.id);
    res.status(200).json({
      success: true,
      admin,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate and return fresh CSRF token
 */
const getCsrfToken = async (req, res) => {
  const token = generateCsrfToken();
  setCsrfCookie(res, token);
  res.status(200).json({
    success: true,
    csrfToken: token,
  });
};

module.exports = {
  login,
  logout,
  getMe,
  getCsrfToken,
};
