const { AppError } = require('./errorHandler');

// Allowed enums matching schema constraints
const ALLOWED_USER_TYPES = ['Parent', 'Student', 'School'];
const ALLOWED_CATEGORIES = ['Scholarship', 'Concert', 'Admission', 'General Query'];
const ALLOWED_STATUSES = ['New', 'In Progress', 'Resolved'];

// Email regex pattern (RFC 5322 compliant simplified)
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

// Phone number regex pattern (permits international +, digits, hyphens, spaces, parentheses, min 7 digits)
const PHONE_REGEX = /^[+0-9()\s.-]{7,25}$/;

/**
 * Validate public inquiry submission payload
 */
const validateInquiry = (req, res, next) => {
  const { name, email, phone, user_type, category, message } = req.body;
  const errors = {};

  // Name validation
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.name = 'Full name is required.';
  } else if (name.trim().length < 2) {
    errors.name = 'Full name must be at least 2 characters.';
  } else if (name.trim().length > 100) {
    errors.name = 'Full name cannot exceed 100 characters.';
  }

  // Email validation
  if (!email || typeof email !== 'string' || email.trim().length === 0) {
    errors.email = 'Email address is required.';
  } else if (!EMAIL_REGEX.test(email.trim())) {
    errors.email = 'Please provide a valid email address (e.g., student@example.com).';
  } else if (email.trim().length > 255) {
    errors.email = 'Email cannot exceed 255 characters.';
  }

  // Phone validation
  if (!phone || typeof phone !== 'string' || phone.trim().length === 0) {
    errors.phone = 'Phone number is required.';
  } else {
    const cleanedPhone = phone.trim();
    const digitCount = (cleanedPhone.match(/\d/g) || []).length;
    if (!PHONE_REGEX.test(cleanedPhone) || digitCount < 7 || digitCount > 16) {
      errors.phone = 'Please provide a valid phone number with 7 to 15 digits.';
    }
  }

  // User type validation
  if (!user_type || typeof user_type !== 'string' || user_type.trim().length === 0) {
    errors.user_type = 'Please select a user type (Parent, Student, or School).';
  } else if (!ALLOWED_USER_TYPES.includes(user_type.trim())) {
    errors.user_type = `User type must be one of: ${ALLOWED_USER_TYPES.join(', ')}.`;
  }

  // Category validation
  if (!category || typeof category !== 'string' || category.trim().length === 0) {
    errors.category = 'Please select an inquiry category.';
  } else if (!ALLOWED_CATEGORIES.includes(category.trim())) {
    errors.category = `Category must be one of: ${ALLOWED_CATEGORIES.join(', ')}.`;
  }

  // Message validation
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    errors.message = 'Inquiry message is required.';
  } else if (message.trim().length < 10) {
    errors.message = 'Message must be at least 10 characters long.';
  } else if (message.trim().length > 2000) {
    errors.message = 'Message cannot exceed 2000 characters.';
  }

  if (Object.keys(errors).length > 0) {
    return next(new AppError('Validation failed. Please correct the highlighted errors.', 400, errors));
  }

  // Normalize trimmed values on req.body
  req.body.name = name.trim();
  req.body.email = email.trim().toLowerCase();
  req.body.phone = phone.trim();
  req.body.user_type = user_type.trim();
  req.body.category = category.trim();
  req.body.message = message.trim();

  next();
};

/**
 * Validate admin login credentials payload
 */
const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = {};

  if (!email || typeof email !== 'string' || email.trim().length === 0) {
    errors.email = 'Admin email is required.';
  } else if (!EMAIL_REGEX.test(email.trim())) {
    errors.email = 'Please provide a valid email format.';
  }

  if (!password || typeof password !== 'string' || password.length === 0) {
    errors.password = 'Password is required.';
  }

  if (Object.keys(errors).length > 0) {
    return next(new AppError('Please provide both valid email and password.', 400, errors));
  }

  req.body.email = email.trim().toLowerCase();
  next();
};

/**
 * Validate inquiry status update payload
 */
const validateStatusUpdate = (req, res, next) => {
  const { status } = req.body;

  if (!status || typeof status !== 'string') {
    return next(new AppError('Status is required in request body.', 400, {
      status: `Status must be one of: ${ALLOWED_STATUSES.join(', ')}`
    }));
  }

  if (!ALLOWED_STATUSES.includes(status.trim())) {
    return next(new AppError(`Invalid status. Must be one of: ${ALLOWED_STATUSES.join(', ')}.`, 400, {
      status: `Allowed statuses: ${ALLOWED_STATUSES.join(', ')}`
    }));
  }

  req.body.status = status.trim();
  next();
};

module.exports = {
  validateInquiry,
  validateLogin,
  validateStatusUpdate,
  ALLOWED_USER_TYPES,
  ALLOWED_CATEGORIES,
  ALLOWED_STATUSES,
};
