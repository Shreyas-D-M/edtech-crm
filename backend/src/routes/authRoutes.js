const express = require('express');
const authController = require('../controllers/authController');
const { requireAdminAuth } = require('../middleware/auth');
const { validateLogin } = require('../middleware/validate');

const router = express.Router();

// Public routes
router.post('/login', validateLogin, authController.login);
router.post('/logout', authController.logout);
router.get('/csrf-token', authController.getCsrfToken);

// Protected routes
router.get('/me', requireAdminAuth, authController.getMe);

module.exports = router;
