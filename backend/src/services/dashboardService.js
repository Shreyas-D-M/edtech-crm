const db = require('../config/db');

/**
 * Compute real-time dashboard figures directly from PostgreSQL inquiries table
 */
const getDashboardStats = async () => {
  const query = `
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE status = 'New')::int AS new_count,
      COUNT(*) FILTER (WHERE status = 'In Progress')::int AS in_progress_count,
      COUNT(*) FILTER (WHERE status = 'Resolved')::int AS resolved_count
    FROM inquiries;
  `;

  const result = await db.query(query);
  const row = result.rows[0] || {};

  return {
    total: row.total || 0,
    new: row.new_count || 0,
    inProgress: row.in_progress_count || 0,
    resolved: row.resolved_count || 0,
  };
};

module.exports = {
  getDashboardStats,
};
