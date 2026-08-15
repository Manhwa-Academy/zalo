import { NextResponse } from 'next/server'
import { getSessionId } from '@/lib/session-cookie'
import { UserManager } from '@/lib/user-manager'

// Get session info for current user
export async function GET() {
  try {
    const sessionId = getSessionId()
    const user = await UserManager.getOrCreateUser(sessionId)
    const zaloSession = await UserManager.getZaloSession(user.id)
    const botSettings = await UserManager.getBotSettings(user.id)
    
    return NextResponse.json({ 
      success: true,
      user: {
        id: user.id,
        sessionId: user.sessionId,
      },
      hasZaloSession: !!zaloSession,
      zaloSession: zaloSession ? {
        userInfo: zaloSession.userInfo,
      } : null,
      botSettings: {
        enabled: botSettings.enabled,
        autoReplyMessage: botSettings.autoReplyMessage,
        replyDelay: botSettings.replyDelay,
      }
    })
  } catch (error: any) {
    console.error('GET /api/zalo/session error:', error)
    return NextResponse.json({ 
      success: false,
      error: error.message 
    }, { status: 500 })
  }
}

// Delete session for current user
export async function DELETE() {
  try {
    const sessionId = getSessionId()
    const user = await UserManager.getOrCreateUser(sessionId)
    
    await UserManager.deleteZaloSession(user.id)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Session deleted' 
    })
  } catch (error: any) {
    console.error('DELETE /api/zalo/session error:', error)
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 })
  }
}
