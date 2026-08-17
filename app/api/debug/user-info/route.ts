import { NextResponse } from 'next/server'
import { getCurrentUserId } from '@/lib/multi-user-zalo'
import pool from '@/lib/postgres'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const userId = await getCurrentUserId()
    
    if (!pool) {
      return NextResponse.json({ 
        success: false, 
        error: 'Database not available' 
      }, { status: 500 })
    }
    
    // Get user info from database
    const userResult = await pool.query(
      'SELECT id, session_id, created_at FROM users WHERE id = $1',
      [userId]
    )
    
    // Check if user_settings exists
    const settingsResult = await pool.query(
      'SELECT COUNT(*) as count FROM user_settings WHERE user_id = $1',
      [userId]
    )
    
    // Check if bot_settings exists
    const botSettingsResult = await pool.query(
      'SELECT COUNT(*) as count FROM bot_settings WHERE user_id = $1',
      [userId]
    )
    
    const userInfo = userResult.rows[0] || {}
    
    return NextResponse.json({
      success: true,
      debug: {
        userId: userId,
        userIdLength: userId.length,
        sessionId: (userInfo.session_id || 'N/A').substring(0, 20) + '...', // Truncate for security
        hasUserSettings: parseInt(settingsResult.rows[0]?.count || '0') > 0,
        hasBotSettings: parseInt(botSettingsResult.rows[0]?.count || '0') > 0,
        createdAt: userInfo.created_at || 'N/A'
      }
    })
  } catch (error: any) {
    console.error('❌ [Debug] Error getting user info:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}
