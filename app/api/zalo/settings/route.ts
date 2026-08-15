import { NextResponse } from 'next/server'
import { getCurrentBotSettings, updateCurrentBotSettings } from '@/lib/multi-user-zalo'

export async function GET() {
  try {
    const settings = await getCurrentBotSettings()
    
    // Return full settings object for frontend compatibility
    return NextResponse.json({
      enabled: settings.enabled ?? false,
      autoReplyMessage: settings.autoReplyMessage || 'Xin chào! Tôi đang bận, sẽ phản hồi bạn sớm nhất có thể. 🙏',
      replyDelay: settings.replyDelay || 2000,
      replyScope: settings.replyScope || 'all',
      whitelist: Array.isArray(settings.whitelist) ? settings.whitelist : [],
      blacklist: Array.isArray(settings.blacklist) ? settings.blacklist : [],
      useRandomPreset: settings.useRandomPreset ?? false,
      presetMessages: Array.isArray(settings.presetMessages) ? settings.presetMessages : [],
      aiEnabled: settings.aiEnabled ?? false,
      aiPersonality: settings.aiPersonality || 'friendly',
      aiMaxLength: settings.aiMaxLength || 200,
      aiTriggerMode: settings.aiTriggerMode || 'smart',
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
    
    // Return full settings object for frontend compatibility
    return NextResponse.json({ 
      success: true,
      enabled: settings.enabled ?? false,
      autoReplyMessage: settings.autoReplyMessage || 'Xin chào! Tôi đang bận, sẽ phản hồi bạn sớm nhất có thể. 🙏',
      replyDelay: settings.replyDelay || 2000,
      replyScope: settings.replyScope || 'all',
      whitelist: Array.isArray(settings.whitelist) ? settings.whitelist : [],
      blacklist: Array.isArray(settings.blacklist) ? settings.blacklist : [],
      useRandomPreset: settings.useRandomPreset ?? false,
      presetMessages: Array.isArray(settings.presetMessages) ? settings.presetMessages : [],
      aiEnabled: settings.aiEnabled ?? false,
      aiPersonality: settings.aiPersonality || 'friendly',
      aiMaxLength: settings.aiMaxLength || 200,
      aiTriggerMode: settings.aiTriggerMode || 'smart',
    })
  } catch (error: any) {
    console.error('POST /api/zalo/settings error:', error)
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 })
  }
}


