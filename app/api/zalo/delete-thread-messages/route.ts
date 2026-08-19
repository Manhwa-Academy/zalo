import { NextResponse } from 'next/server'
import pool from '@/lib/postgres'
import { getCurrentUserId } from '@/lib/multi-user-zalo'

export const dynamic = 'force-dynamic'

/**
 * DELETE /api/zalo/delete-thread-messages
 * Xóa toàn bộ tin nhắn của một thread (conversation)
 * Xóa khỏi TẤT CẢ sessions (multi-device sync)
 */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const threadId = searchParams.get('threadId')
    
    if (!threadId) {
      return NextResponse.json({ 
        error: 'Missing threadId parameter' 
      }, { status: 400 })
    }
    
    const userId = await getCurrentUserId()
    
    if (!userId) {
      return NextResponse.json({ 
        error: 'Not authenticated' 
      }, { status: 401 })
    }
    
    if (!pool) {
      return NextResponse.json({ 
        error: 'Database not available' 
      }, { status: 500 })
    }
    
    console.log(`🗑️ [Delete Thread] Deleting all messages for thread ${threadId}`)
    
    // Get Zalo user ID from current session
    const sessionResult = await pool.query(
      `SELECT user_info FROM zalo_sessions WHERE user_id = $1`,
      [userId]
    )
    
    let zaloUserId: string | null = null
    if (sessionResult.rows.length > 0) {
      const userInfo = sessionResult.rows[0].user_info
      zaloUserId = userInfo?.userId || null
    }
    
    if (!zaloUserId) {
      // Fallback: Delete only from current session
      const result = await pool.query(`
        DELETE FROM zalo_messages
        WHERE user_id = $1 AND thread_id = $2
      `, [userId, threadId])
      
      console.log(`✅ [Delete Thread] Deleted ${result.rowCount} messages from current session`)
      
      return NextResponse.json({
        success: true,
        deletedCount: result.rowCount,
        scope: 'current_session'
      })
    }
    
    // Get all user_ids (sessions) for this Zalo user
    const allSessionsResult = await pool.query(`
      SELECT DISTINCT u.id as user_id
      FROM users u
      JOIN zalo_sessions zs ON zs.user_id = u.id
      WHERE zs.user_info->>'userId' = $1
    `, [zaloUserId])
    
    const sessionUserIds = allSessionsResult.rows.map(r => r.user_id)
    
    console.log(`📱 [Delete Thread] Found ${sessionUserIds.length} sessions for Zalo user ${zaloUserId}`)
    
    // Delete from ALL sessions
    const result = await pool.query(`
      DELETE FROM zalo_messages
      WHERE user_id = ANY($1) AND thread_id = $2
    `, [sessionUserIds, threadId])
    
    console.log(`✅ [Delete Thread] Deleted ${result.rowCount} messages from ${sessionUserIds.length} sessions`)
    
    return NextResponse.json({
      success: true,
      deletedCount: result.rowCount,
      sessionsCount: sessionUserIds.length,
      scope: 'all_sessions'
    })
    
  } catch (error: any) {
    console.error('❌ [Delete Thread] Error:', error)
    return NextResponse.json({ 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}
