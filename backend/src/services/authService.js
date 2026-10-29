const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

/**
 * Authenticate an administrator and return a signed JWT
 */
const loginAdmin = async (email, password) => {
  const result = await db.query(
    'SELECT id, name, email, password_hash, created_at FROM admins WHERE LOWER(email) = LOWER($1) LIMIT 1',
    [email]
  );

  if (result.rows.length === 0) {
    // Avoid revealing whether the email exists
    throw new AppError('Invalid email or password.', 401);
  }

  const admin = result.rows[0];
  const isMatch = await bcrypt.compare(password, admin.password_hash);

  if (!isMatch) {
    throw new AppError('Invalid email or password.', 401);
  }

  const secret = process.env.JWT_SECRET || 'fallback_development_secret_change_in_production';
  const expiresIn = process.env.JWT_EXPIRES_IN || '24h';

  const token = jwt.sign(
    {
      id: admin.id,
      email: admin.email,
      name: admin.name,
    },
    secret,
    { expiresIn }
  );

  logger.info(`Admin successfully authenticated: ${admin.email}`);

  return {
    token,
    admin: {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      createdAt: admin.created_at,
    },
  };
};

/**
 * Fetch administrator profile by ID
 */
const getAdminById = async (id) => {
  const result = await db.query(
    'SELECT id, name, email, created_at FROM admins WHERE id = $1 LIMIT 1',
    [id]
  );

  if (result.rows.length === 0) {
    throw new AppError('Admin account not found.', 404);
  }

  const admin = result.rows[0];
  return {
    id: admin.id,
    name: admin.name,
    email: admin.email,
    createdAt: admin.created_at,
  };
};

module.exports = {
  loginAdmin,
  getAdminById,
};
