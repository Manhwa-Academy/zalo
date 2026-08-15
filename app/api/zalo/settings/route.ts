import { NextResponse } from 'next/server'
import { getCurrentBotSettings, updateCurrentBotSettings } from '@/lib/multi-user-zalo'

export async function GET() {
  try {
    const settings = await getCurrentBotSettings()
    return NextResponse.json({
      success: true,
      settings: {
        enabled: settings.enabled,
        autoReplyMessage: settings.autoReplyMessage,
        replyDelay: settings.replyDelay,
      }
    })
  } catch (error: any) {
    console.error('GET /api/zalo/settings error:', error)
    return NextResponse.json({ 
      success: false,
      error: error.message 
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const updates = await request.json()
    await updateCurrentBotSettings(updates)
    const settings = await getCurrentBotSettings()
    
    console.log('⚙️ Updated bot settings for current user:', settings)
    
    return NextResponse.json({ 
      success: true, 
      settings: {
        enabled: settings.enabled,
        autoReplyMessage: settings.autoReplyMessage,
        replyDelay: settings.replyDelay,
      }
    })
  } catch (error: any) {
    console.error('POST /api/zalo/settings error:', error)
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 })
  }
}


