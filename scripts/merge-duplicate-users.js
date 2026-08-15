/**
 * Script để merge duplicate users (cùng 1 Zalo account nhưng nhiều database users)
 * 
 * Logic:
 * 1. Tìm tất cả Zalo userId có nhiều hơn 1 database user
 * 2. Với mỗi Zalo userId duplicate:
 *    - Giữ user cũ nhất (created_at sớm nhất)
 *    - Merge tất cả sessions của users khác vào user cũ nhất
 *    - Xóa users duplicate
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false },
});

async function mergeDuplicateUsers() {
  try {
    console.log('🔍 Searching for duplicate Zalo users...\n');

    // Tìm tất cả Zalo userId có nhiều hơn 1 database user
    const duplicatesQuery = `
      SELECT 
        zs.user_info->>'userId' as zalo_user_id,
        zs.user_info->>'displayName' as zalo_name,
        COUNT(DISTINCT u.id) as user_count,
        ARRAY_AGG(u.id ORDER BY u.created_at) as user_ids,
        ARRAY_AGG(u.created_at ORDER BY u.created_at) as created_dates
      FROM zalo_sessions zs
      INNER JOIN users u ON zs.user_id = u.id
      WHERE zs.user_info->>'userId' IS NOT NULL
      GROUP BY zs.user_info->>'userId', zs.user_info->>'displayName'
      HAVING COUNT(DISTINCT u.id) > 1
      ORDER BY user_count DESC
    `;

    const duplicatesResult = await pool.query(duplicatesQuery);

    if (duplicatesResult.rows.length === 0) {
      console.log('✅ No duplicate users found! Database is clean.\n');
      await pool.end();
      return;
    }

    console.log(`⚠️  Found ${duplicatesResult.rows.length} Zalo accounts with duplicate users:\n`);

    for (const row of duplicatesResult.rows) {
      console.log(`📱 Zalo User: ${row.zalo_name} (ID: ${row.zalo_user_id})`);
      console.log(`   Duplicate count: ${row.user_count} users`);
      console.log(`   User IDs: ${row.user_ids.join(', ')}`);
      console.log('');
    }

    console.log('🔧 Starting merge process...\n');

    let totalMerged = 0;
    let totalDeleted = 0;

    for (const row of duplicatesResult.rows) {
      const zaloUserId = row.zalo_user_id;
      const userIds = row.user_ids;
      const primaryUserId = userIds[0]; // Keep the oldest user
      const duplicateUserIds = userIds.slice(1); // Users to merge and delete

      console.log(`\n🔀 Merging Zalo user: ${row.zalo_name}`);
      console.log(`   Primary user (keep): ${primaryUserId}`);
      console.log(`   Duplicate users (merge & delete): ${duplicateUserIds.join(', ')}`);

      try {
        await pool.query('BEGIN');

        // 1. Delete zalo_sessions của duplicate users (vì UNIQUE constraint trên user_id)
        //    Chỉ giữ session của primary user
        for (const dupUserId of duplicateUserIds) {
          await pool.query(
            'DELETE FROM zalo_sessions WHERE user_id = $1',
            [dupUserId]
          );
          console.log(`   ✓ Deleted session from duplicate user ${dupUserId}`);
        }

        // 2. Update bot_settings: merge or move to primary user
        for (const dupUserId of duplicateUserIds) {
          const settingsResult = await pool.query(
            'SELECT * FROM bot_settings WHERE user_id = $1',
            [dupUserId]
          );

          if (settingsResult.rows.length > 0) {
            // Check if primary user already has settings
            const primarySettingsResult = await pool.query(
              'SELECT * FROM bot_settings WHERE user_id = $1',
              [primaryUserId]
            );

            if (primarySettingsResult.rows.length === 0) {
              // Move settings to primary user
              await pool.query(
                'UPDATE bot_settings SET user_id = $1 WHERE user_id = $2',
                [primaryUserId, dupUserId]
              );
              console.log(`   ✓ Moved bot settings from ${dupUserId} to ${primaryUserId}`);
            } else {
              // Delete duplicate settings (keep primary's settings)
              await pool.query('DELETE FROM bot_settings WHERE user_id = $1', [dupUserId]);
              console.log(`   ✓ Deleted duplicate bot settings from ${dupUserId}`);
            }
          }
        }

        // 3. Update message_logs: point all messages to primary user
        for (const dupUserId of duplicateUserIds) {
          const logsResult = await pool.query(
            'UPDATE message_logs SET user_id = $1 WHERE user_id = $2',
            [primaryUserId, dupUserId]
          );
          if (logsResult.rowCount > 0) {
            console.log(`   ✓ Moved ${logsResult.rowCount} message logs from ${dupUserId} to ${primaryUserId}`);
          }
        }

        // 4. Delete duplicate users
        for (const dupUserId of duplicateUserIds) {
          await pool.query('DELETE FROM users WHERE id = $1', [dupUserId]);
          console.log(`   ✓ Deleted duplicate user ${dupUserId}`);
          totalDeleted++;
        }

        await pool.query('COMMIT');
        console.log(`   ✅ Successfully merged ${duplicateUserIds.length} duplicate users`);
        totalMerged++;

      } catch (error) {
        await pool.query('ROLLBACK');
        console.error(`   ❌ Failed to merge ${row.zalo_name}:`, error.message);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary:');
    console.log(`   Zalo accounts merged: ${totalMerged}`);
    console.log(`   Duplicate users deleted: ${totalDeleted}`);
    console.log('='.repeat(60));
    console.log('\n✅ Migration completed!\n');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await pool.end();
  }
}

// Run migration
mergeDuplicateUsers();
