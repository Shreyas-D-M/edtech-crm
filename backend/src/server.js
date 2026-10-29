const app = require('./app');
const db = require('./config/db');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 5001;

const server = app.listen(PORT, async () => {
  logger.info(`EdTech CRM Backend Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
  
  // Verify database connection at startup
  const dbConnected = await db.testConnection();
  if (dbConnected) {
    logger.info('Database connection verified and ready.');
  } else {
    logger.warn('Initial database connection test failed or DATABASE_URL not yet configured. Please check .env.');
  }
});

// Graceful shutdown handling
const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received. Initiating graceful shutdown...`);
  server.close(async () => {
    logger.info('HTTP server closed.');
    if (db.pool) {
      try {
        await db.pool.end();
        logger.info('PostgreSQL pool closed.');
      } catch (err) {
        logger.error('Error closing database pool', { error: err.message });
      }
    }
    process.exit(0);
  });

  // Force shutdown after timeout
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
