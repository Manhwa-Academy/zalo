/**
 * List all active sessions
 * Usage: node database/list-sessions.js
 */

const { Client } = require('pg');
require('dotenv').config();

async function listSessions() {
  console.log('📱 Listing active sessions...\n');

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
        s.id,
        u.username,
        s.device_info->>'type' as device_type,
        s.device_info->>'browser' as browser,
        s.device_info->>'os' as os,
        s.ip_address,
        s.created_at,
        s.last_active,
        s.expires_at,
        s.is_active
      FROM auth_sessions s
      JOIN auth_users u ON s.user_id = u.id
      WHERE s.is_active = true
      ORDER BY s.last_active DESC
    `);

    if (result.rows.length === 0) {
      console.log('📭 No active sessions found\n');
      console.log('📋 Login to create a session:');
      console.log('   http://localhost:3000\n');
    } else {
      console.log(`✅ Found ${result.rows.length} active session(s):\n`);
      result.rows.forEach((session, index) => {
        console.log(`${index + 1}. ${session.username}`);
        console.log(`   Device: ${session.device_type || 'Unknown'} - ${session.browser || 'Unknown'}`);
        console.log(`   OS: ${session.os || 'Unknown'}`);
        console.log(`   IP: ${session.ip_address || 'N/A'}`);
        console.log(`   Last Active: ${session.last_active}`);
        console.log(`   Expires: ${session.expires_at}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

listSessions();
