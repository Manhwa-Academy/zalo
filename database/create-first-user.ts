/**
 * Script to create first admin user with custom password
 * Usage: node -r ts-node/register database/create-first-user.ts
 * Or: npx tsx database/create-first-user.ts
 */

import * as readline from 'readline';
import bcrypt from 'bcryptjs';
import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer);
    });
  });
}

function questionHidden(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    process.stdout.write(prompt);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');

    let password = '';

    const onData = (char: string) => {
      char = char.toString();

      if (char === '\n' || char === '\r' || char === '\u0004') {
        // Enter key pressed
        process.stdin.setRawMode(false);
        process.stdin.pause();
        process.stdin.removeListener('data', onData);
        process.stdout.write('\n');
        resolve(password);
      } else if (char === '\u0003') {
        // Ctrl+C
        process.exit();
      } else if (char === '\u007f') {
        // Backspace
        password = password.slice(0, -1);
        process.stdout.clearLine(0);
        process.stdout.cursorTo(0);
        process.stdout.write(prompt + '*'.repeat(password.length));
      } else {
        password += char;
        process.stdout.write('*');
      }
    };

    process.stdin.on('data', onData);
  });
}

async function createFirstUser() {
  console.log('🔐 Create First Admin User\n');
  console.log('═══════════════════════════════════════\n');

  // Check DATABASE_URL
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in .env file!');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
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

    // Check if admin already exists
    const existingAdmin = await pool.query(
      'SELECT username FROM auth_users WHERE username = $1',
      ['admin']
    );

    if (existingAdmin.rows.length > 0) {
      console.log('⚠️  Admin user already exists!\n');
      const overwrite = await question('Do you want to update the password? (y/n): ');
      
      if (overwrite.toLowerCase() !== 'y') {
        console.log('❌ Cancelled');
        process.exit(0);
      }
    }

    // Get user input
    const username = await question('Username [admin]: ') || 'admin';
    const displayName = await question('Display Name [Administrator]: ') || 'Administrator';
    const email = await question('Email [admin@example.com]: ') || 'admin@example.com';

    console.log('');
    const password = await questionHidden('Password (min 8 chars): ');

    if (password.length < 8) {
      console.error('\n❌ Password must be at least 8 characters!');
      process.exit(1);
    }

    const passwordConfirm = await questionHidden('Confirm Password: ');

    if (password !== passwordConfirm) {
      console.error('\n❌ Passwords do not match!');
      process.exit(1);
    }

    console.log('\n🔄 Creating user...');

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert or update user
    if (existingAdmin.rows.length > 0) {
      await pool.query(
        `UPDATE auth_users 
         SET password_hash = $1, display_name = $2, email = $3, updated_at = CURRENT_TIMESTAMP
         WHERE username = $4`,
        [passwordHash, displayName, email, username]
      );
      console.log('✅ Admin user updated successfully!');
    } else {
      await pool.query(
        `INSERT INTO auth_users (username, password_hash, display_name, email)
         VALUES ($1, $2, $3, $4)`,
        [username, passwordHash, displayName, email]
      );
      console.log('✅ Admin user created successfully!');
    }

    console.log('\n📋 User Details:');
    console.log(`   Username: ${username}`);
    console.log(`   Display Name: ${displayName}`);
    console.log(`   Email: ${email}`);
    console.log('\n🎉 You can now login with these credentials!');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
    rl.close();
  }
}

createFirstUser();
