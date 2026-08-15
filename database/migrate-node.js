/**
 * Node.js migration script (no psql needed)
 * Usage: node database/migrate-node.js
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
  console.log('🚀 Starting auth sessions migration...\n');

  // Check DATABASE_URL
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in .env file!');
    process.exit(1);
  }

  console.log('✅ Found DATABASE_URL');
  console.log('📋 Applying auth sessions schema...\n');

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('sslmode=require') || 
         process.env.DATABASE_URL.includes('sslmode=verify-full')
      ? { rejectUnauthorized: false }
      : undefined,
  });

  try {
    // Connect to database
    await client.connect();
    console.log('✅ Connected to database\n');

    // Read SQL file
    const sqlPath = path.join(__dirname, 'auth-sessions-schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Execute SQL
    await client.query(sql);

    console.log('✅ Migration completed successfully!\n');
    console.log('📝 Next steps:');
    console.log('  1. Create admin user: npm run create-admin');
    console.log('  2. Start server: npm run dev');
    console.log('  3. Login at http://localhost:3000\n');
    console.log('🔒 SECURITY NOTE:');
    console.log('  - Use strong password for admin user');
    console.log('  - Enable HTTPS in production\n');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
