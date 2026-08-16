import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import pool from '@/lib/postgres'
import { AuthManager } from '@/lib/auth-manager'

/**
 * GET - Get user settings
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const authToken = cookieStore.get('auth_token')?.value

    if (!authToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Validate session and get user
    const validation = await AuthManager.validateSession(authToken)

    if (!validation.valid || !validation.user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    const userId = validation.user.id

    // Get user settings
    let settingsResult = await pool?.query(
      'SELECT * FROM user_settings WHERE user_id = $1',
      [userId]
    )

    // If no settings exist, create default settings
    if (!settingsResult || settingsResult.rows.length === 0) {
      await pool?.query(
        `INSERT INTO user_settings (
          user_id, notification_sound, reply_delay, learning_mode, 
          auto_mark_read, max_reply_length, ai_enabled, ai_personality,
          ai_max_length, ai_trigger_mode, dark_mode, animations, 
          font_size, save_history, auto_delete_days
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
        [userId, true, 2, false, true, 500, true, 'friendly', 200, 'smart', true, true, 'medium', true, 'never']
      )

      settingsResult = await pool?.query(
        'SELECT * FROM user_settings WHERE user_id = $1',
        [userId]
      )
    }

    const settings = settingsResult!.rows[0]

    return NextResponse.json({
      success: true,
      settings: {
        notificationSound: settings.notification_sound,
        replyDelay: settings.reply_delay,
        learningMode: settings.learning_mode,
        autoMarkRead: settings.auto_mark_read,
        maxReplyLength: settings.max_reply_length,
        aiEnabled: settings.ai_enabled,
        aiPersonality: settings.ai_personality,
        aiMaxLength: settings.ai_max_length,
        aiTriggerMode: settings.ai_trigger_mode,
        darkMode: settings.dark_mode,
        animations: settings.animations,
        fontSize: settings.font_size,
        saveHistory: settings.save_history,
        autoDeleteDays: settings.auto_delete_days,
      }
    })

  } catch (error: any) {
    console.error('❌ [Settings API] Error:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to get settings' 
    }, { status: 500 })
  }
}

/**
 * POST - Update user settings
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const authToken = cookieStore.get('auth_token')?.value

    if (!authToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Validate session and get user
    const validation = await AuthManager.validateSession(authToken)

    if (!validation.valid || !validation.user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    const userId = validation.user.id
    const body = await request.json()

    // Update settings
    await pool?.query(
      `UPDATE user_settings SET
        notification_sound = $1,
        reply_delay = $2,
        learning_mode = $3,
        auto_mark_read = $4,
        max_reply_length = $5,
        ai_enabled = $6,
        ai_personality = $7,
        ai_max_length = $8,
        ai_trigger_mode = $9,
        dark_mode = $10,
        animations = $11,
        font_size = $12,
        save_history = $13,
        auto_delete_days = $14,
        updated_at = NOW()
      WHERE user_id = $15`,
      [
        body.notificationSound,
        body.replyDelay,
        body.learningMode,
        body.autoMarkRead,
        body.maxReplyLength || 500,
        body.aiEnabled,
        body.aiPersonality || 'friendly',
        body.aiMaxLength || 200,
        body.aiTriggerMode || 'smart',
        body.darkMode,
        body.animations,
        body.fontSize,
        body.saveHistory,
        body.autoDeleteDays,
        userId
      ]
    )

    console.log('✅ [Settings API] Settings updated for user:', userId)

    return NextResponse.json({
      success: true,
      message: 'Settings saved successfully'
    })

  } catch (error: any) {
    console.error('❌ [Settings API] Error:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to save settings' 
    }, { status: 500 })
  }
}
