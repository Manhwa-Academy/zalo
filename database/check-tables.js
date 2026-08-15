/**
 * Check if auth tables exist in database
 * Usage: node database/check-tables.js
 */

const { Client } = require('pg');
require('dotenv').config();

async function checkTables() {
  console.log('🔍 Checking auth tables...\n');

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in .env');
    process.exit(1);
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Check tables
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'auth%'
      ORDER BY table_name
    `);

    if (result.rows.length === 0) {
      console.log('❌ No auth tables found!');
      console.log('\n📋 Run migration first:');
      console.log('   npm run migrate:auth\n');
    } else {
      console.log('✅ Found auth tables:');
      result.rows.forEach(row => {
        console.log(`   - ${row.table_name}`);
      });
      console.log('');

      // Check if admin user exists
      const userCheck = await client.query(`
        SELECT COUNT(*) as count FROM auth_users
      `);
      
      const userCount = parseInt(userCheck.rows[0].count);
      console.log(`📊 Users in database: ${userCount}`);
      
      if (userCount === 0) {
        console.log('\n📋 No users found. Create admin user:');
        console.log('   npm run create-admin\n');
      } else {
        console.log('✅ Database is ready!\n');
      }
    }

  } catch (error) {
    if (error.message.includes('does not exist')) {
      console.log('❌ Tables not created yet!');
      console.log('\n📋 Run migration first:');
      console.log('   npm run migrate:auth\n');
    } else {
      console.error('❌ Error:', error.message);
    }
  } finally {
    await client.end();
  }
}

checkTables();
