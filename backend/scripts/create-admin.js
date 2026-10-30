/**
 * CLI Script: Create or update the initial system administrator
 * 
 * Usage:
 *   node scripts/create-admin.js
 *   node scripts/create-admin.js "<name>" "<email>" "<password>"
 * 
 * Reads credentials from arguments or falls back to:
 *   ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD from .env
 */

const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('\x1b[31m[ERROR] DATABASE_URL is not defined in .env.\x1b[0m');
  console.error('Please configure your Supabase connection string in backend/.env before running this script.');
  process.exit(1);
}

const args = process.argv.slice(2);
const name = args[0] || process.env.ADMIN_NAME || 'System Administrator';
const email = (args[1] || process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const password = args[2] || process.env.ADMIN_PASSWORD;

if (!email || !password) {
  console.error('\x1b[31m[ERROR] Admin email and password are required.\x1b[0m');
  console.log('\nUsage:');
  console.log('  node scripts/create-admin.js "<name>" "<email>" "<password>"');
  console.log('Or define ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD in your backend/.env file.\n');
  process.exit(1);
}

if (password.length < 8) {
  console.error('\x1b[31m[ERROR] Password must be at least 8 characters long for security.\x1b[0m');
  process.exit(1);
}

const isProduction = process.env.NODE_ENV === 'production';
const isSupabase = connectionString.includes('supabase.co') || connectionString.includes('supabase.com') || connectionString.includes('pooler.supabase.com');

const pool = new Pool({
  connectionString,
  ssl: (isProduction || isSupabase) ? { rejectUnauthorized: false } : false,
});

async function run() {
  console.log('\x1b[36m=====================================================\x1b[0m');
  console.log('\x1b[36m      EdTech CRM - Initial Admin Setup Utility       \x1b[0m');
  console.log('\x1b[36m=====================================================\x1b[0m\n');
  console.log(`Target Email: ${email}`);
  console.log(`Admin Name:   ${name}\n`);

  try {
    // 1. Verify schema existence
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'admins'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.error('\x1b[31m[ERROR] The "admins" table does not exist in the database.\x1b[0m');
      console.log('Please execute backend/database/schema.sql in your Supabase SQL Editor first.\n');
      process.exit(1);
    }

    // 2. Hash password with bcrypt salt rounds = 10
    console.log('Generating secure bcrypt password hash...');
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 3. Check if admin with target email already exists
    const existing = await pool.query(
      'SELECT id, name, email FROM admins WHERE LOWER(email) = LOWER($1)',
      [email]
    );

    if (existing.rows.length > 0) {
      console.log(`Admin account with email "${email}" already exists. Updating credentials...`);
      await pool.query(
        'UPDATE admins SET name = $1, password_hash = $2 WHERE LOWER(email) = LOWER($3)',
        [name, passwordHash, email]
      );
      console.log('\x1b[32m✔ Admin account updated successfully!\x1b[0m');
      console.log(`ID: ${existing.rows[0].id}`);
    } else {
      // Check if a placeholder account exists that should be replaced in-place
      const placeholder = await pool.query(
        "SELECT id, email FROM admins WHERE LOWER(email) IN ('your_email@example.com', 'admin@edtech.com') LIMIT 1"
      );

      if (placeholder.rows.length > 0) {
        console.log(`Replacing existing placeholder account (${placeholder.rows[0].email}) with "${email}"...`);
        await pool.query(
          'UPDATE admins SET name = $1, email = $2, password_hash = $3 WHERE id = $4',
          [name, email, passwordHash, placeholder.rows[0].id]
        );
        console.log('\x1b[32m✔ Placeholder admin successfully replaced with actual credentials!\x1b[0m');
        console.log(`ID: ${placeholder.rows[0].id}`);
      } else {
        console.log('Inserting new administrator record...');
        const insertResult = await pool.query(
          'INSERT INTO admins (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, created_at',
          [name, email, passwordHash]
        );
        console.log('\x1b[32m✔ Admin account created successfully!\x1b[0m');
        console.log(`ID: ${insertResult.rows[0].id}`);
        console.log(`Created At: ${insertResult.rows[0].created_at}`);
      }
    }

    // 4. Safely clean up any dangling placeholder accounts (never touches inquiries or actual accounts)
    await pool.query(
      "DELETE FROM admins WHERE LOWER(email) = 'your_email@example.com' AND LOWER(email) != LOWER($1)",
      [email]
    );

    console.log('\n\x1b[32mYou can now log in at the admin portal using these credentials.\x1b[0m\n');
  } catch (error) {
    console.error('\x1b[31m[ERROR] Failed to setup admin account:\x1b[0m', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
