/**
 * Non-interactive CLI script to create user (for production deployment)
 * Usage: 
 *   node -r tsx/register database/create-user-cli.ts --username=admin --password=secret --email=admin@example.com
 * Or with environment variables:
 *   ADMIN_USERNAME=admin ADMIN_PASSWORD=secret ADMIN_EMAIL=admin@example.com npx tsx database/create-user-cli.ts
 */

import bcrypt from 'bcryptjs';
import pg from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

interface UserArgs {
  username: string;
  password: string;
  displayName?: string;
  email?: string;
}

function parseArgs(): UserArgs {
  const args = process.argv.slice(2);
  
  // Check environment variables first
  const envUsername = process.env.ADMIN_USERNAME;
  const envPassword = process.env.ADMIN_PASSWORD;
  const envDisplayName = process.env.ADMIN_DISPLAY_NAME;
  const envEmail = process.env.ADMIN_EMAIL;

  // Parse command line arguments
  const cliArgs: any = {};
  args.forEach(arg => {
    const [key, value] = arg.replace(/^--/, '').split('=');
    cliArgs[key] = value;
  });

  const username = cliArgs.username || envUsername || 'admin';
  const password = cliArgs.password || envPassword;
  const displayName = cliArgs.displayName || cliArgs['display-name'] || envDisplayName || 'Administrator';
  const email = cliArgs.email || envEmail || 'admin@example.com';

  if (!password) {
    console.error('❌ Error: Password is required!');
    console.error('');
    console.error('Usage:');
    console.error('  npx tsx database/create-user-cli.ts --username=admin --password=secret --email=admin@example.com');
    console.error('');
    console.error('Or with environment variables:');
    console.error('  ADMIN_PASSWORD=secret npx tsx database/create-user-cli.ts');
    console.error('');
    process.exit(1);
  }

  return { username, password, displayName, email };
}

async function createUser() {
  console.log('🔐 Creating User (Non-Interactive Mode)\n');

  // Check DATABASE_URL
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in .env file!');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    // Parse arguments
    const { username, password, displayName, email } = parseArgs();

    console.log('📋 User Details:');
    console.log(`   Username: ${username}`);
    console.log(`   Display Name: ${displayName}`);
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${'*'.repeat(password.length)}`);
    console.log('');

    // Validate password length
    if (password.length < 8) {
      console.error('❌ Password must be at least 8 characters!');
      process.exit(1);
    }

    // Test connection
    await pool.query('SELECT NOW()');
    console.log('✅ Database connected\n');

    // Check if tables exist
    const tableCheck = await pool.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'auth_users'
      )`
    );

    if (!tableCheck.rows[0].exists) {
      console.error('❌ Table auth_users not found!');
      console.error('   Please run migration first: npm run migrate:auth:win');
      process.exit(1);
    }

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT username FROM auth_users WHERE username = $1',
      [username]
    );

    if (existingUser.rows.length > 0) {
      console.log('⚠️  User already exists! Updating password...\n');
      
      const passwordHash = await bcrypt.hash(password, 10);
      
      await pool.query(
        `UPDATE auth_users 
         SET password_hash = $1, display_name = $2, email = $3, updated_at = CURRENT_TIMESTAMP
         WHERE username = $4`,
        [passwordHash, displayName, email, username]
      );
      
      console.log('✅ User updated successfully!');
    } else {
      console.log('🔄 Creating new user...\n');
      
      const passwordHash = await bcrypt.hash(password, 10);
      
      await pool.query(
        `INSERT INTO auth_users (username, password_hash, display_name, email)
         VALUES ($1, $2, $3, $4)`,
        [username, passwordHash, displayName, email]
      );
      
      console.log('✅ User created successfully!');
    }

    console.log('\n🎉 You can now login with these credentials!');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

createUser();
