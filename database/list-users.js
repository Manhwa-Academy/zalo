/**
 * List all users in database
 * Usage: node database/list-users.js
 */

const { Client } = require('pg');
require('dotenv').config();

async function listUsers() {
  console.log('👥 Listing users...\n');

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

    const result = await client.query(`
      SELECT 
        username, 
        display_name, 
        email,
        created_at,
        last_login,
        is_active
      FROM auth_users
      ORDER BY created_at DESC
    `);

    if (result.rows.length === 0) {
      console.log('📭 No users found in database\n');
      console.log('📋 Create admin user:');
      console.log('   npm run reset-admin\n');
    } else {
      console.log(`✅ Found ${result.rows.length} user(s):\n`);
      result.rows.forEach((user, index) => {
        console.log(`${index + 1}. ${user.username}`);
        console.log(`   Display Name: ${user.display_name || 'N/A'}`);
        console.log(`   Email: ${user.email || 'N/A'}`);
        console.log(`   Created: ${user.created_at}`);
        console.log(`   Last Login: ${user.last_login || 'Never'}`);
        console.log(`   Status: ${user.is_active ? '✅ Active' : '❌ Inactive'}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

listUsers();
