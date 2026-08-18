import { NextResponse } from 'next/server'
import pool from '@/lib/postgres'
import { getCurrentUserId, getCurrentZaloApi } from '@/lib/multi-user-zalo'

export const dynamic = 'force-dynamic'

// GET: Fetch user's AI profile
export async function GET() {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    if (!pool) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 })
    }

    // Fetch AI profile from database
    const result = await pool.query(
      'SELECT * FROM user_ai_profiles WHERE user_id = $1',
      [userId]
    )

    if (result.rows.length === 0) {
      // No profile yet - create default one with Zalo info
      const zaloApi = await getCurrentZaloApi() as any
      let zaloUserInfo: any = {}
      
      if (zaloApi && typeof zaloApi.getOwnId === 'function') {
        try {
          const ownId = zaloApi.getOwnId()
          const userInfoRes = await zaloApi.getUserInfo(ownId)
          zaloUserInfo = userInfoRes?.data || userInfoRes || {}
        } catch (e) {
          console.warn('Failed to get Zalo user info:', e)
        }
      }

      const displayName = zaloUserInfo.displayName || zaloUserInfo.zaloName || 'Người dùng'
      const zaloUserId = zaloUserInfo.userId || zaloUserInfo.id || ''

      // Create default profile (pool is already checked above)
      if (!pool) {
        return NextResponse.json({ error: 'Database not available' }, { status: 503 })
      }
      
      const insertResult = await pool.query(
        `INSERT INTO user_ai_profiles (user_id, zalo_user_id, zalo_display_name, nicknames, ai_reply_mode, context_length, remember_context)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [userId, zaloUserId, displayName, [], 'mention_only', 20, true]
      )

      return NextResponse.json({
        success: true,
        profile: insertResult.rows[0]
      })
    }

    return NextResponse.json({
      success: true,
      profile: result.rows[0]
    })
  } catch (error: any) {
    console.error('GET /api/user/ai-profile error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch AI profile' },
      { status: 500 }
    )
  }
}

// POST: Update user's AI profile
export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    if (!pool) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 })
    }

    const body = await request.json()
    const {
      zaloDisplayName,
      nicknames,
      aiReplyMode,
      contextLength,
      rememberContext
    } = body

    // Validate ai_reply_mode
    const validModes = ['mention_only', 'name_detect', 'smart_auto']
    if (aiReplyMode && !validModes.includes(aiReplyMode)) {
      return NextResponse.json(
        { error: 'Invalid ai_reply_mode. Must be one of: mention_only, name_detect, smart_auto' },
        { status: 400 }
      )
    }

    // Validate context_length
    if (contextLength !== undefined && (contextLength < 1 || contextLength > 100)) {
      return NextResponse.json(
        { error: 'context_length must be between 1 and 100' },
        { status: 400 }
      )
    }

    // Update or insert profile (pool is already checked above)
    if (!pool) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 })
    }
    
    const result = await pool.query(
      `INSERT INTO user_ai_profiles (user_id, zalo_display_name, nicknames, ai_reply_mode, context_length, remember_context)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id) DO UPDATE SET
         zalo_display_name = COALESCE($2, user_ai_profiles.zalo_display_name),
         nicknames = COALESCE($3, user_ai_profiles.nicknames),
         ai_reply_mode = COALESCE($4, user_ai_profiles.ai_reply_mode),
         context_length = COALESCE($5, user_ai_profiles.context_length),
         remember_context = COALESCE($6, user_ai_profiles.remember_context),
         updated_at = NOW()
       RETURNING *`,
      [
        userId,
        zaloDisplayName || null,
        nicknames || null,
        aiReplyMode || null,
        contextLength || null,
        rememberContext !== undefined ? rememberContext : null
      ]
    )

    return NextResponse.json({
      success: true,
      profile: result.rows[0]
    })
  } catch (error: any) {
    console.error('POST /api/user/ai-profile error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update AI profile' },
      { status: 500 }
    )
  }
}
