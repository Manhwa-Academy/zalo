import { NextResponse } from 'next/server'
import { getCurrentZaloApi } from '@/lib/multi-user-zalo'

export const dynamic = 'force-dynamic'

/**
 * POST /api/zalo/set-mute
 * Mute or unmute a conversation on Zalo server
 * 
 * Request body:
 * {
 *   threadId: string | string[],
 *   threadType: 'User' | 'Group' (default: 'User'),
 *   action: 'MUTE' | 'UNMUTE',
 *   duration?: number | 'ONE_HOUR' | 'FOUR_HOURS' | 'FOREVER' | 'UNTIL_8AM'
 * }
 */
export async function POST(request: Request) {
  try {
    const zaloApi = await getCurrentZaloApi() as any
    
    if (!zaloApi) {
      return NextResponse.json({ error: 'Chưa đăng nhập Zalo' }, { status: 401 })
    }

    const { threadId, threadType, action, duration } = await request.json()

    if (!threadId || !action) {
      return NextResponse.json({ 
        error: 'Thiếu threadId hoặc action' 
      }, { status: 400 })
    }

    // Validate action
    if (!['MUTE', 'UNMUTE'].includes(action)) {
      return NextResponse.json({ 
        error: 'action phải là "MUTE" hoặc "UNMUTE"' 
      }, { status: 400 })
    }

    try {
      console.log('🔕 Setting mute:', { threadId, threadType, action, duration })
      
      // Map duration to Zalo API values
      let muteDuration: number | string | undefined
      if (action === 'MUTE') {
        if (duration === 'ONE_HOUR') {
          muteDuration = 3600
        } else if (duration === 'FOUR_HOURS') {
          muteDuration = 14400
        } else if (duration === 'FOREVER') {
          muteDuration = -1
        } else if (duration === 'UNTIL_8AM') {
          muteDuration = 'until8AM'
        } else if (typeof duration === 'number') {
          muteDuration = duration
        } else {
          // Default: FOREVER
          muteDuration = -1
        }
      }
      
      // Map action to Zalo API MuteAction enum
      const muteAction = action === 'MUTE' ? 1 : 3 // 1 = MUTE, 3 = UNMUTE
      
      // Build params object
      const params: any = {
        action: muteAction
      }
      
      if (action === 'MUTE' && muteDuration !== undefined) {
        params.duration = muteDuration
      }
      
      // Map threadType to Zalo ThreadType (0 = User, 1 = Group)
      const type = threadType === 'Group' ? 1 : 0
      
      // Call Zalo API to set mute
      const result = await zaloApi.setMute(params, threadId, type)
      
      console.log('✅ Set mute result:', result)

      return NextResponse.json({
        success: true,
        message: action === 'MUTE' ? 'Đã tắt thông báo' : 'Đã bật lại thông báo',
        result
      })
    } catch (error: any) {
      console.error('❌ Set mute error:', error)
      return NextResponse.json({ 
        error: 'Không thể thay đổi cài đặt thông báo',
        details: error.message 
      }, { status: 500 })
    }
  } catch (error: any) {
    console.error('❌ Set mute API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
