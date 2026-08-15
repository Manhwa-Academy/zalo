/**
 * Reset admin user password
 * Usage: node database/reset-admin.js
 */

const { Client } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function resetAdmin() {
  console.log('🔐 Resetting admin password...\n');

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in .env');
    process.exit(1);
  }

  if (!process.env.ADMIN_PASSWORD) {
    console.error('❌ ADMIN_PASSWORD not set in .env');
    console.error('   Add ADMIN_PASSWORD=your-password to .env file');
    process.exit(1);
  }

  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD;
  const email = process.env.ADMIN_EMAIL || 'admin@example.com';
  const displayName = process.env.ADMIN_DISPLAY_NAME || 'Administrator';

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Check if user exists
    const checkUser = await client.query(
      'SELECT username FROM auth_users WHERE username = $1',
      [username]
    );

    if (checkUser.rows.length === 0) {
      // Create new user
      await client.query(
        `INSERT INTO auth_users (username, password_hash, display_name, email)
         VALUES ($1, $2, $3, $4)`,
        [username, passwordHash, displayName, email]
      );
      console.log('✅ Admin user created!\n');
    } else {
      // Update existing user
      await client.query(
        `UPDATE auth_users 
         SET password_hash = $1, display_name = $2, email = $3, updated_at = CURRENT_TIMESTAMP
         WHERE username = $4`,
        [passwordHash, displayName, email, username]
      );
      console.log('✅ Admin password updated!\n');
    }

    console.log('📋 User Details:');
    console.log(`   Username: ${username}`);
    console.log(`   Display Name: ${displayName}`);
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${'*'.repeat(password.length)}`);
    console.log('\n🎉 You can now login with these credentials!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

resetAdmin();
