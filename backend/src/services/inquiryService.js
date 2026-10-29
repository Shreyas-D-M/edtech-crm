const db = require('../config/db');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

/**
 * Create a new customer inquiry in the database
 */
const createInquiry = async ({ name, email, phone, user_type, category, message }) => {
  const insertQuery = `
    INSERT INTO inquiries (name, email, phone, user_type, category, message, status)
    VALUES ($1, $2, $3, $4, $5, $6, 'New')
    RETURNING id, name, email, phone, user_type, category, message, status, created_at, updated_at
  `;

  const values = [name, email, phone, user_type, category, message];

  try {
    const result = await db.query(insertQuery, values);
    const newInquiry = result.rows[0];
    logger.info(`New inquiry created successfully: ID ${newInquiry.id} (${newInquiry.category})`);
    return newInquiry;
  } catch (error) {
    logger.error('Failed to create inquiry in database', { error: error.message });
    throw error;
  }
};

/**
 * Fetch inquiries with filtering, multi-field search, sorting, and pagination
 */
const getInquiries = async ({
  category,
  user_type,
  status,
  search,
  page = 1,
  limit = 10,
  sortBy = 'created_at',
  sortOrder = 'DESC'
}) => {
  // Validate and parse pagination inputs
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
  const offset = (parsedPage - 1) * parsedLimit;

  // Build parameterized conditions
  const conditions = [];
  const params = [];

  // Filter: Category
  if (category && category !== 'All') {
    params.push(category);
    conditions.push(`category = $${params.length}`);
  }

  // Filter: User Type
  if (user_type && user_type !== 'All') {
    params.push(user_type);
    conditions.push(`user_type = $${params.length}`);
  }

  // Filter: Status
  if (status && status !== 'All') {
    params.push(status);
    conditions.push(`status = $${params.length}`);
  }

  // Search: Case-insensitive name or partial phone match
  if (search && search.trim().length > 0) {
    const searchTerm = `%${search.trim()}%`;
    params.push(searchTerm);
    const p1 = params.length;
    // Match name ILIKE or phone LIKE
    conditions.push(`(name ILIKE $${p1} OR phone LIKE $${p1} OR email ILIKE $${p1})`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Sanitize sort column to prevent SQL injection
  const allowedSortColumns = {
    created_at: 'created_at',
    updated_at: 'updated_at',
    name: 'name',
    category: 'category',
    status: 'status',
    user_type: 'user_type',
  };
  const safeSortColumn = allowedSortColumns[sortBy] || 'created_at';
  const safeSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  // Count query
  const countQuery = `SELECT COUNT(*) AS total FROM inquiries ${whereClause}`;
  const countResult = await db.query(countQuery, params);
  const total = parseInt(countResult.rows[0].total, 10);

  // Data query with LIMIT and OFFSET
  const dataParams = [...params];
  dataParams.push(parsedLimit);
  const limitPlaceholder = `$${dataParams.length}`;
  dataParams.push(offset);
  const offsetPlaceholder = `$${dataParams.length}`;

  const dataQuery = `
    SELECT id, name, email, phone, user_type, category, message, status, created_at, updated_at
    FROM inquiries
    ${whereClause}
    ORDER BY ${safeSortColumn} ${safeSortOrder}
    LIMIT ${limitPlaceholder} OFFSET ${offsetPlaceholder}
  `;

  const dataResult = await db.query(dataQuery, dataParams);

  return {
    inquiries: dataResult.rows,
    pagination: {
      total,
      page: parsedPage,
      limit: parsedLimit,
      totalPages: Math.ceil(total / parsedLimit) || 1,
    },
  };
};

/**
 * Fetch a single inquiry by its UUID
 */
const getInquiryById = async (id) => {
  const result = await db.query(
    `SELECT id, name, email, phone, user_type, category, message, status, created_at, updated_at
     FROM inquiries
     WHERE id = $1 LIMIT 1`,
    [id]
  );

  if (result.rows.length === 0) {
    throw new AppError('Inquiry not found.', 404);
  }

  return result.rows[0];
};

/**
 * Update an inquiry's status
 */
const updateInquiryStatus = async (id, status) => {
  const updateQuery = `
    UPDATE inquiries
    SET status = $1
    WHERE id = $2
    RETURNING id, name, email, phone, user_type, category, message, status, created_at, updated_at
  `;

  const result = await db.query(updateQuery, [status, id]);

  if (result.rows.length === 0) {
    throw new AppError('Inquiry not found.', 404);
  }

  const updated = result.rows[0];
  logger.info(`Inquiry ${id} status updated to: ${status}`);
  return updated;
};

module.exports = {
  createInquiry,
  getInquiries,
  getInquiryById,
  updateInquiryStatus,
};
