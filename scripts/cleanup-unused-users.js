/**
 * Script để xóa users không có Zalo session (chưa bao giờ login)
 * 
 * An toàn:
 * - Chỉ xóa users không có zalo_sessions
 * - Xóa luôn bot_settings và message_logs của users đó
 * - Giữ lại tất cả users đã login Zalo
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false },
});

async function cleanupUnusedUsers() {
  try {
    console.log('🧹 Starting cleanup of unused users...\n');

    // 1. Tìm users không có Zalo session
    const findUnusedQuery = `
      SELECT 
        u.id,
        u.session_id,
        u.created_at,
        u.last_active,
        bs.id as has_bot_settings,
        (SELECT COUNT(*) FROM message_logs WHERE user_id = u.id) as message_count
      FROM users u
      LEFT JOIN zalo_sessions zs ON u.id = zs.user_id
      LEFT JOIN bot_settings bs ON u.id = bs.user_id
      WHERE zs.id IS NULL
      ORDER BY u.created_at DESC
    `;

    const unusedUsers = await pool.query(findUnusedQuery);

    if (unusedUsers.rows.length === 0) {
      console.log('✅ No unused users found! Database is already clean.\n');
      await pool.end();
      return;
    }

    console.log(`⚠️  Found ${unusedUsers.rows.length} unused users (never logged in to Zalo):\n`);

    unusedUsers.rows.forEach((user, idx) => {
      console.log(`${idx + 1}. User ID: ${user.id}`);
      console.log(`   Session ID: ${user.session_id.substring(0, 30)}...`);
      console.log(`   Created: ${user.created_at}`);
      console.log(`   Last Active: ${user.last_active}`);
      console.log(`   Has bot settings: ${user.has_bot_settings ? 'Yes' : 'No'}`);
      console.log(`   Message logs: ${user.message_count}`);
      console.log('');
    });

    console.log('🗑️  Starting deletion process...\n');

    let deletedUsers = 0;
    let deletedSettings = 0;
    let deletedMessages = 0;

    for (const user of unusedUsers.rows) {
      try {
        await pool.query('BEGIN');

        // 1. Delete message_logs (if any)
        const messagesResult = await pool.query(
          'DELETE FROM message_logs WHERE user_id = $1',
          [user.id]
        );
        if (messagesResult.rowCount > 0) {
          console.log(`   ✓ Deleted ${messagesResult.rowCount} message logs for user ${user.id}`);
          deletedMessages += messagesResult.rowCount;
        }

        // 2. Delete bot_settings (if any)
        const settingsResult = await pool.query(
          'DELETE FROM bot_settings WHERE user_id = $1',
          [user.id]
        );
        if (settingsResult.rowCount > 0) {
          console.log(`   ✓ Deleted bot settings for user ${user.id}`);
          deletedSettings++;
        }

        // 3. Delete user
        await pool.query('DELETE FROM users WHERE id = $1', [user.id]);
        console.log(`   ✓ Deleted user ${user.id}`);
        deletedUsers++;

        await pool.query('COMMIT');

      } catch (error) {
        await pool.query('ROLLBACK');
        console.error(`   ❌ Failed to delete user ${user.id}:`, error.message);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Cleanup Summary:');
    console.log('='.repeat(60));
    console.log(`Users deleted: ${deletedUsers}`);
    console.log(`Bot settings deleted: ${deletedSettings}`);
    console.log(`Message logs deleted: ${deletedMessages}`);
    console.log('='.repeat(60));

    if (deletedUsers === unusedUsers.rows.length) {
      console.log('\n✅ Cleanup completed successfully!\n');
    } else {
      console.log(`\n⚠️  Cleanup completed with ${unusedUsers.rows.length - deletedUsers} failures\n`);
    }

    // Verify remaining users
    console.log('🔍 Verifying remaining users...\n');
    const remainingUsersResult = await pool.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(zs.id) as users_with_zalo
      FROM users u
      LEFT JOIN zalo_sessions zs ON u.id = zs.user_id
    `);

    const stats = remainingUsersResult.rows[0];
    console.log(`📊 Remaining users: ${stats.total_users}`);
    console.log(`   With Zalo session: ${stats.users_with_zalo}`);
    console.log(`   Without Zalo session: ${stats.total_users - stats.users_with_zalo}`);
    console.log('');

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  } finally {
    await pool.end();
  }
}

// Run cleanup
cleanupUnusedUsers();
