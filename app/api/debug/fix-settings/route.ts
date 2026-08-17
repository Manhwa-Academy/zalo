import { NextResponse } from 'next/server'
import { getCurrentUserId } from '@/lib/multi-user-zalo'
import pool from '@/lib/postgres'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const userId = await getCurrentUserId()
    console.log('🔧 [Fix Settings] User ID:', userId)
    
    if (!pool) {
      return NextResponse.json({ 
        success: false, 
        error: 'Database not available' 
      }, { status: 500 })
    }
    
    // Check if user exists in auth_users (not users table!)
    const userCheck = await pool.query(
      'SELECT id FROM auth_users WHERE id = $1',
      [userId]
    )
    
    console.log('🔍 [Fix Settings] User check result:', userCheck.rows.length, 'rows')
    
    if (userCheck.rows.length === 0) {
      console.log('⚠️ [Fix Settings] User not found in auth_users!')
      
      // Try to find the correct user ID from auth_users
      const allUsers = await pool.query(
        'SELECT id, username, email FROM auth_users ORDER BY created_at DESC LIMIT 5'
      )
      
      console.log('📋 [Fix Settings] Available users in auth_users:', 
        allUsers.rows.map(u => ({ id: u.id, username: u.username, email: u.email }))
      )
      
      return NextResponse.json({
        success: false,
        error: 'User ID not found in auth_users table. Please check the console logs for available user IDs.',
        availableUsers: allUsers.rows.map(u => ({ 
          id: u.id, 
          username: u.username,
          email: u.email 
        }))
      }, { status: 400 })
    }
    
    // Insert or update user_settings
    await pool.query(`
      INSERT INTO user_settings (
        user_id,
        notification_sound,
        reply_delay,
        learning_mode,
        auto_mark_read,
        max_reply_length,
        dark_mode,
        animations,
        font_size,
        save_history,
        auto_delete_days,
        ai_enabled,
        ai_personality,
        ai_max_length,
        ai_trigger_mode
      ) VALUES (
        $1, true, 2, false, true, 500, true, true, 'medium', true, 'never',
        true, 'cute', 500, 'smart'
      )
      ON CONFLICT (user_id) DO UPDATE SET
        ai_enabled = true,
        ai_personality = 'cute',
        ai_max_length = 500,
        ai_trigger_mode = 'smart',
        updated_at = CURRENT_TIMESTAMP
    `, [userId])
    
    console.log('✅ [Fix Settings] user_settings created/updated')
    
    // Insert or update bot_settings if not exists
    await pool.query(`
      INSERT INTO bot_settings (
        user_id,
        enabled,
        auto_reply_message,
        reply_delay,
        settings
      ) VALUES (
        $1,
        true,
        'Xin chào! Đây là tin nhắn tự động.',
        2000,
        $2::jsonb
      )
      ON CONFLICT (user_id) DO UPDATE SET
        enabled = true,
        updated_at = CURRENT_TIMESTAMP
    `, [
      userId,
      JSON.stringify({
        replyScope: 'all',
        whitelist: [],
        blacklist: [],
        useRandomPreset: true,
        presetMessages: [
          'E-Eto... tôi là Monica Everett... xin hãy chiếu cố cho tôi từ bây giờ nhé... 🌸✨🥺🤍',
          'U-Um... nếu tôi trốn sau cánh cửa thì xin đừng kéo tôi ra nhé... 🚪🥺💦',
          'Fuee... c-chuyện này khó quá đi mất... (՚﹏՚)💦',
          'A-Anou... đừng nói cho mọi người biết nhé... tôi tin bạn đó... 🥺🌸🤍✨',
          'S-Sono... nếu có thể giúp được mọi người thì tôi rất vui... 🍀🤍✨'
        ]
      })
    ])
    
    console.log('✅ [Fix Settings] bot_settings created/updated')
    
    return NextResponse.json({
      success: true,
      message: 'Settings created successfully! Please reload the page.',
      userId: userId
    })
  } catch (error: any) {
    console.error('❌ [Fix Settings] Error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}
