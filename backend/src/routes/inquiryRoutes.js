const express = require('express');
const inquiryController = require('../controllers/inquiryController');
const { requireAdminAuth } = require('../middleware/auth');
const { csrfProtection } = require('../middleware/csrf');
const { validateInquiry, validateStatusUpdate } = require('../middleware/validate');

const router = express.Router();

// Public inquiry creation endpoint
router.post('/', validateInquiry, inquiryController.submitInquiry);

// Protected inquiry management endpoints
router.get('/', requireAdminAuth, inquiryController.listInquiries);
router.get('/:id', requireAdminAuth, inquiryController.getInquiry);
router.patch(
  '/:id/status',
  requireAdminAuth,
  csrfProtection,
  validateStatusUpdate,
  inquiryController.updateStatus
);

module.exports = router;
