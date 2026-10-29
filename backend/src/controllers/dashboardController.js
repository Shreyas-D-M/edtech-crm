const dashboardService = require('../services/dashboardService');

/**
 * Protected: Return database-derived dashboard statistics
 */
const getStats = async (req, res, next) => {
  try {
    const stats = await dashboardService.getDashboardStats();
    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStats,
};
