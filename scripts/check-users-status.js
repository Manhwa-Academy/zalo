/**
 * Script để kiểm tra trạng thái của tất cả users trong database
 * - Users có Zalo session
 * - Users không có Zalo session
 * - Duplicate Zalo accounts
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false },
});

async function checkUsersStatus() {
  try {
    console.log('🔍 Checking all users in database...\n');

    // 1. Get all users with their Zalo info
    const allUsersQuery = `
      SELECT 
        u.id as user_id,
        u.session_id,
        u.created_at,
        u.last_active,
        zs.user_info->>'userId' as zalo_user_id,
        zs.user_info->>'displayName' as zalo_name,
        zs.is_active as has_active_session,
        bs.enabled as bot_enabled
      FROM users u
      LEFT JOIN zalo_sessions zs ON u.id = zs.user_id
      LEFT JOIN bot_settings bs ON u.id = bs.user_id
      ORDER BY u.created_at DESC
    `;

    const result = await pool.query(allUsersQuery);
    
    console.log(`📊 Total users in database: ${result.rows.length}\n`);
    console.log('='.repeat(80));

    // Group by Zalo session status
    const usersWithZalo = result.rows.filter(r => r.zalo_user_id);
    const usersWithoutZalo = result.rows.filter(r => !r.zalo_user_id);

    console.log(`\n✅ Users WITH Zalo session: ${usersWithZalo.length}`);
    console.log('='.repeat(80));
    
    usersWithZalo.forEach((row, idx) => {
      console.log(`\n${idx + 1}. User ID: ${row.user_id}`);
      console.log(`   Zalo Name: ${row.zalo_name || 'N/A'}`);
      console.log(`   Zalo ID: ${row.zalo_user_id}`);
      console.log(`   Session Active: ${row.has_active_session ? 'Yes' : 'No'}`);
      console.log(`   Bot Enabled: ${row.bot_enabled ? 'Yes' : 'No'}`);
      console.log(`   Created: ${row.created_at}`);
      console.log(`   Last Active: ${row.last_active}`);
    });

    console.log(`\n\n⚠️  Users WITHOUT Zalo session: ${usersWithoutZalo.length}`);
    console.log('='.repeat(80));
    
    usersWithoutZalo.forEach((row, idx) => {
      console.log(`\n${idx + 1}. User ID: ${row.user_id}`);
      console.log(`   Session ID: ${row.session_id.substring(0, 20)}...`);
      console.log(`   Bot Enabled: ${row.bot_enabled ? 'Yes' : 'No'}`);
      console.log(`   Created: ${row.created_at}`);
      console.log(`   Last Active: ${row.last_active}`);
      console.log(`   📝 Note: This user never logged in to Zalo`);
    });

    // 2. Check for duplicate Zalo accounts
    console.log('\n\n🔍 Checking for duplicate Zalo accounts...');
    console.log('='.repeat(80));

    const duplicatesQuery = `
      SELECT 
        zs.user_info->>'userId' as zalo_user_id,
        zs.user_info->>'displayName' as zalo_name,
        COUNT(DISTINCT u.id) as user_count,
        ARRAY_AGG(u.id ORDER BY u.created_at) as user_ids
      FROM zalo_sessions zs
      INNER JOIN users u ON zs.user_id = u.id
      WHERE zs.user_info->>'userId' IS NOT NULL
      GROUP BY zs.user_info->>'userId', zs.user_info->>'displayName'
      ORDER BY user_count DESC
    `;

    const duplicates = await pool.query(duplicatesQuery);

    if (duplicates.rows.length === 0) {
      console.log('\n✅ No Zalo accounts found (no one has logged in yet)');
    } else {
      const hasDuplicates = duplicates.rows.some(r => r.user_count > 1);
      
      if (hasDuplicates) {
        console.log('\n⚠️  Found duplicate Zalo accounts:');
        duplicates.rows.forEach(row => {
          if (row.user_count > 1) {
            console.log(`\n❌ ${row.zalo_name} (${row.zalo_user_id})`);
            console.log(`   Has ${row.user_count} users: ${row.user_ids.join(', ')}`);
          }
        });
      } else {
        console.log('\n✅ No duplicate Zalo accounts! All users are unique.');
        duplicates.rows.forEach(row => {
          console.log(`   ✓ ${row.zalo_name || 'Unknown'} (${row.zalo_user_id})`);
        });
      }
    }

    // 3. Summary
    console.log('\n\n' + '='.repeat(80));
    console.log('📊 SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total users: ${result.rows.length}`);
    console.log(`Users with Zalo session: ${usersWithZalo.length}`);
    console.log(`Users without Zalo session: ${usersWithoutZalo.length} (never logged in)`);
    console.log(`Unique Zalo accounts: ${duplicates.rows.length}`);
    console.log(`Duplicate Zalo accounts: ${duplicates.rows.filter(r => r.user_count > 1).length}`);
    
    if (usersWithoutZalo.length > 0) {
      console.log('\n💡 TIP: You can safely delete users without Zalo sessions if needed.');
      console.log('   These are users who visited the site but never logged in.');
    }

    console.log('\n');

  } catch (error) {
    console.error('❌ Check failed:', error);
  } finally {
    await pool.end();
  }
}

// Run check
checkUsersStatus();
