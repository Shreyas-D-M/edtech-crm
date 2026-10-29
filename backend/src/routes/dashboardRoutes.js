const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const { requireAdminAuth } = require('../middleware/auth');

const router = express.Router();

// Protected dashboard stats endpoint
router.get('/stats', requireAdminAuth, dashboardController.getStats);

module.exports = router;
