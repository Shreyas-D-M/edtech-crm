const inquiryService = require('../services/inquiryService');

/**
 * Public: Submit a new inquiry
 */
const submitInquiry = async (req, res, next) => {
  try {
    const newInquiry = await inquiryService.createInquiry(req.body);
    res.status(201).json({
      success: true,
      message: 'Thank you! Your inquiry has been received. Our team will contact you shortly.',
      data: newInquiry,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Protected: List inquiries with filters and search
 */
const listInquiries = async (req, res, next) => {
  try {
    const result = await inquiryService.getInquiries(req.query);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Protected: Get single inquiry by ID
 */
const getInquiry = async (req, res, next) => {
  try {
    const inquiry = await inquiryService.getInquiryById(req.params.id);
    res.status(200).json({
      success: true,
      data: inquiry,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Protected: Update status of an inquiry
 */
const updateStatus = async (req, res, next) => {
  try {
    const updated = await inquiryService.updateInquiryStatus(req.params.id, req.body.status);
    res.status(200).json({
      success: true,
      message: `Inquiry status updated to "${req.body.status}".`,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitInquiry,
  listInquiries,
  getInquiry,
  updateStatus,
};
