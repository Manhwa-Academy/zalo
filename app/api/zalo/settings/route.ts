import { NextResponse } from 'next/server'
import { getCurrentBotSettings, updateCurrentBotSettings } from '@/lib/multi-user-zalo'

export async function GET() {
  try {
    const settings = await getCurrentBotSettings()
    
    console.log('📖 [Settings] GET request - Current settings:', {
      enabled: settings.enabled,
      userId: settings.userId,
      timestamp: new Date().toISOString()
    })
    
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
      updatedAt: settings.updatedAt || new Date().toISOString(), // Add timestamp for cache control
    })
  } catch (error: any) {
    console.error('❌ [Settings] GET /api/zalo/settings error:', error)
    return NextResponse.json({ 
      success: false,
      error: error.message 
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const updates = await request.json()
    
    console.log('📝 [Settings] Received update request:', {
      enabled: updates.enabled,
      timestamp: new Date().toISOString()
    })
    
    // Update settings
    await updateCurrentBotSettings(updates)
    
    // Force reload from database to ensure we get the latest
    const settings = await getCurrentBotSettings()
    
    console.log('✅ [Settings] Updated and verified bot settings:', {
      enabled: settings.enabled,
      userId: settings.userId,
      timestamp: new Date().toISOString()
    })
    
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
      updatedAt: new Date().toISOString(), // Add timestamp to help with caching
    })
  } catch (error: any) {
    console.error('❌ [Settings] POST /api/zalo/settings error:', error)
    return NextResponse.json({ 
      success: false,
      error: error.message 
    }, { status: 500 })
  }
}


