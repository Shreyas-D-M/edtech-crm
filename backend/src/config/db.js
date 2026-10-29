const { Pool } = require('pg');
const dotenv = require('dotenv');
const logger = require('../utils/logger');

dotenv.config();

const connectionString = process.env.DATABASE_URL;

let pool = null;

if (!connectionString) {
  logger.warn('DATABASE_URL is not set in environment variables. Database operations will fail until configured.');
} else {
  // Supabase uses SSL; configure SSL appropriately for cloud/local databases
  const isProduction = process.env.NODE_ENV === 'production';
  const isSupabase = connectionString.includes('supabase.com') || connectionString.includes('pooler.supabase.com');

  pool = new Pool({
    connectionString,
    ssl: (isProduction || isSupabase) ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  pool.on('connect', () => {
    logger.debug('New PostgreSQL client connected to database pool');
  });

  pool.on('error', (err) => {
    logger.error('Unexpected error on idle PostgreSQL client pool', { error: err.message });
  });
}

/**
 * Execute a query against the PostgreSQL pool using parameterized values
 * @param {string} text - SQL query text with $1, $2 placeholders
 * @param {Array} params - Array of parameter values
 * @returns {Promise<import('pg').QueryResult>}
 */
const query = async (text, params) => {
  if (!pool) {
    throw new Error('Database pool is not initialized. Please verify DATABASE_URL is configured in .env.');
  }
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    logger.error('Query execution failed', { text, error: error.message });
    throw error;
  }
};

/**
 * Acquire a client from the pool for manual transaction management
 */
const getClient = async () => {
  if (!pool) {
    throw new Error('Database pool is not initialized. Please verify DATABASE_URL is configured in .env.');
  }
  return await pool.connect();
};

/**
 * Test the database connection
 */
const testConnection = async () => {
  if (!pool) return false;
  try {
    const res = await pool.query('SELECT NOW() as current_time');
    logger.info('Database connection established successfully', { timestamp: res.rows[0].current_time });
    return true;
  } catch (err) {
    logger.error('Database connection test failed', { error: err.message });
    return false;
  }
};

/**
 * For test injection or reinitialization
 */
const setPool = (newPool) => {
  pool = newPool;
};

module.exports = {
  pool,
  query,
  getClient,
  testConnection,
  setPool,
};
