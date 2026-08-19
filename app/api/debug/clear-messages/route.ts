import { NextResponse } from 'next/server'
import pool from '@/lib/postgres'
import { getCurrentUserId } from '@/lib/multi-user-zalo'

export const dynamic = 'force-dynamic'

/**
 * DELETE /api/debug/clear-messages
 * Xóa toàn bộ messages trong bảng zalo_messages
 * ⚠️ CHỈ DÙNG ĐỂ DEBUG - XÓA TẤT CẢ DỮ LIỆU
 */
export async function DELETE(request: Request) {
  try {
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
    
    const { searchParams } = new URL(request.url)
    const threadId = searchParams.get('threadId')
    const confirm = searchParams.get('confirm')
    
    if (confirm !== 'yes') {
      return NextResponse.json({ 
        error: 'Cần xác nhận bằng cách thêm ?confirm=yes' 
      }, { status: 400 })
    }
    
    let result
    
    if (threadId) {
      // Xóa messages của một thread cụ thể (all sessions)
      console.log(`🗑️ [Clear Messages] Clearing messages for thread ${threadId}`)
      
      // Get Zalo user ID
      const sessionResult = await pool.query(
        `SELECT user_info FROM zalo_sessions WHERE user_id = $1`,
        [userId]
      )
      
      let zaloUserId: string | null = null
      if (sessionResult.rows.length > 0) {
        const userInfo = sessionResult.rows[0].user_info
        zaloUserId = userInfo?.userId || null
      }
      
      if (zaloUserId) {
        // Get all sessions
        const allSessionsResult = await pool.query(`
          SELECT DISTINCT u.id as user_id
          FROM users u
          JOIN zalo_sessions zs ON zs.user_id = u.id
          WHERE zs.user_info->>'userId' = $1
        `, [zaloUserId])
        
        const sessionUserIds = allSessionsResult.rows.map(r => r.user_id)
        
        // Delete from all sessions
        result = await pool.query(`
          DELETE FROM zalo_messages
          WHERE user_id = ANY($1) AND thread_id = $2
        `, [sessionUserIds, threadId])
        
        console.log(`✅ [Clear Messages] Deleted ${result.rowCount} messages from thread ${threadId}`)
      } else {
        // Fallback: Delete from current session only
        result = await pool.query(`
          DELETE FROM zalo_messages
          WHERE user_id = $1 AND thread_id = $2
        `, [userId, threadId])
        
        console.log(`✅ [Clear Messages] Deleted ${result.rowCount} messages from thread ${threadId} (current session only)`)
      }
    } else {
      // Xóa TẤT CẢ messages (tất cả threads, tất cả sessions)
      console.log(`🗑️ [Clear Messages] Clearing ALL messages`)
      
      result = await pool.query(`DELETE FROM zalo_messages`)
      
      console.log(`✅ [Clear Messages] Deleted ${result.rowCount} messages from ALL threads`)
    }
    
    return NextResponse.json({
      success: true,
      deletedCount: result.rowCount,
      threadId: threadId || 'all'
    })
    
  } catch (error: any) {
    console.error('❌ [Clear Messages] Error:', error)
    return NextResponse.json({ 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}
