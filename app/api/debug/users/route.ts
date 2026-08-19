import { NextResponse } from 'next/server'
import pool from '@/lib/postgres'

/**
 * Debug API: Hiển thị tất cả users và bot settings
 * Giúp kiểm tra duplicate users và settings conflicts
 */
export async function GET() {
  try {
    if (!pool) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    // Get all users with their Zalo info and bot settings
    const result = await pool.query(`
      SELECT 
        u.id as user_id,
        u.session_id,
        u.created_at as user_created_at,
        u.last_active,
        zs.user_info->>'userId' as zalo_user_id,
        zs.user_info->>'displayName' as zalo_display_name,
        zs.is_active as session_active,
        bs.enabled as bot_enabled,
        bs.updated_at as bot_updated_at
      FROM users u
      LEFT JOIN zalo_sessions zs ON u.id = zs.user_id
      LEFT JOIN bot_settings bs ON u.id = bs.user_id
      ORDER BY u.last_active DESC
    `)

    // Group by Zalo user ID to find duplicates
    const usersByZaloId: Record<string, any[]> = {}
    const usersWithoutZalo: any[] = []

    result.rows.forEach(row => {
      if (row.zalo_user_id) {
        if (!usersByZaloId[row.zalo_user_id]) {
          usersByZaloId[row.zalo_user_id] = []
        }
        usersByZaloId[row.zalo_user_id].push(row)
      } else {
        usersWithoutZalo.push(row)
      }
    })

    // Find duplicates
    const duplicates = Object.entries(usersByZaloId)
      .filter(([_, users]) => users.length > 1)
      .map(([zaloId, users]) => ({
        zaloUserId: zaloId,
        zaloDisplayName: users[0].zalo_display_name,
        duplicateCount: users.length,
        users: users.map(u => ({
          userId: u.user_id,
          sessionId: u.session_id,
          botEnabled: u.bot_enabled,
          lastActive: u.last_active,
        }))
      }))

    return NextResponse.json({
      success: true,
      summary: {
        totalUsers: result.rows.length,
        uniqueZaloAccounts: Object.keys(usersByZaloId).length,
        usersWithoutZalo: usersWithoutZalo.length,
        duplicateZaloAccounts: duplicates.length,
      },
      duplicates,
      allUsers: result.rows,
    })
  } catch (error: any) {
    console.error('❌ [Debug] Users API error:', error)
    return NextResponse.json({ 
      success: false,
      error: error.message 
    }, { status: 500 })
  }
}

/**
 * POST: Merge duplicate users
 * Body: { keepUserId: string, deleteUserIds: string[] }
 */
export async function POST(request: Request) {
  try {
    if (!pool) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const { keepUserId, deleteUserIds } = await request.json()

    if (!keepUserId || !Array.isArray(deleteUserIds) || deleteUserIds.length === 0) {
      return NextResponse.json({ 
        error: 'Invalid request. Need keepUserId and deleteUserIds array' 
      }, { status: 400 })
    }

    const client = await pool.connect()
    
    try {
      await client.query('BEGIN')

      // Move all sessions from deleted users to kept user
      for (const deleteUserId of deleteUserIds) {
        // Update zalo_sessions
        await client.query(
          'UPDATE zalo_sessions SET user_id = $1 WHERE user_id = $2',
          [keepUserId, deleteUserId]
        )

        // Delete duplicate bot_settings (keep the one from keepUserId)
        await client.query(
          'DELETE FROM bot_settings WHERE user_id = $1',
          [deleteUserId]
        )

        // Delete the user
        await client.query(
          'DELETE FROM users WHERE id = $1',
          [deleteUserId]
        )
      }

      await client.query('COMMIT')

      console.log(`✅ [Debug] Merged users: kept ${keepUserId}, deleted ${deleteUserIds.join(', ')}`)

      return NextResponse.json({
        success: true,
        message: `Merged ${deleteUserIds.length} users into ${keepUserId}`,
        keptUserId: keepUserId,
        deletedUserIds: deleteUserIds,
      })
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  } catch (error: any) {
    console.error('❌ [Debug] Merge users error:', error)
    return NextResponse.json({ 
      success: false,
      error: error.message 
    }, { status: 500 })
  }
}
