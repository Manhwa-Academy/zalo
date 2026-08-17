import { NextResponse } from 'next/server'
import { getCurrentZaloApi, getCurrentUserId } from '@/lib/multi-user-zalo'
import { UserManager } from '@/lib/user-manager'

export async function POST() {
  try {
    // Get current user ID
    const userId = await getCurrentUserId()
    
    // Get current Zalo API instance
    const zaloApi = await getCurrentZaloApi()
    
    if (!zaloApi) {
      return NextResponse.json(
        { error: 'Chưa đăng nhập Zalo. Vui lòng đăng nhập trước!' },
        { status: 401 }
      )
    }

    // Extract credentials from Zalo API context
    const ctx = zaloApi.getContext ? zaloApi.getContext() : null
    
    if (!ctx || !ctx.cookie) {
      return NextResponse.json(
        { error: 'Không tìm thấy thông tin session' },
        { status: 400 }
      )
    }

    // Serialize cookie data
    let cookieData = ctx.cookie
    if (typeof ctx.cookie.toJSON === 'function') {
      cookieData = ctx.cookie.toJSON()
    }

    // Prepare Zalo credentials
    const credentials = {
      imei: ctx.imei,
      cookie: cookieData,
      userAgent: ctx.userAgent,
      language: ctx.language || 'vi',
    }

    // Get bot settings
    let botSettings = null
    try {
      botSettings = await UserManager.getBotSettings(userId)
      console.log('✅ [Export] Exported bot settings')
    } catch (e) {
      console.warn('⚠️ [Export] Could not export bot settings:', e)
    }

    // Get stored messages from file system
    let messages = []
    try {
      const fs = await import('fs')
      const { dataFilePath } = await import('@/lib/data-dir')
      const messagesFile = dataFilePath('.zalo-messages.json')
      
      if (fs.existsSync(messagesFile)) {
        const data = fs.readFileSync(messagesFile, 'utf-8')
        messages = JSON.parse(data)
        console.log(`✅ [Export] Exported ${messages.length} messages`)
      }
    } catch (e) {
      console.warn('⚠️ [Export] Could not export messages:', e)
    }

    // Get Zalo session (includes userInfo with avatar, etc.)
    let zaloSession = null
    try {
      zaloSession = await UserManager.getZaloSession(userId)
      console.log('✅ [Export] Exported Zalo session info')
    } catch (e) {
      console.warn('⚠️ [Export] Could not export session info:', e)
    }

    console.log('✅ [Export] Successfully exported full account data')

    // Create export metadata with timestamp
    const exportMetadata = {
      exportedAt: new Date().toISOString(),
      exportedAtLocal: new Date().toLocaleString('vi-VN', { 
        timeZone: 'Asia/Ho_Chi_Minh',
        hour12: false 
      }),
      exportTimestamp: Date.now(),
    }

    return NextResponse.json({
      success: true,
      credentials,
      botSettings: botSettings ? {
        enabled: botSettings.enabled,
        autoReplyMessage: botSettings.autoReplyMessage,
        replyScope: botSettings.replyScope,
        whitelist: botSettings.whitelist,
        blacklist: botSettings.blacklist,
        useRandomPreset: botSettings.useRandomPreset,
        presetMessages: botSettings.presetMessages,
        aiEnabled: botSettings.aiEnabled,
        aiPersonality: botSettings.aiPersonality,
        aiMaxLength: botSettings.aiMaxLength,
        aiTriggerMode: botSettings.aiTriggerMode,
      } : null,
      messages: messages.slice(-100), // Export last 100 messages only
      userInfo: zaloSession?.userInfo || null,
      exportMetadata, // Add export metadata
      message: 'Xuất tài khoản thành công!'
    })
  } catch (error: any) {
    console.error('❌ [Export] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Lỗi khi xuất tài khoản' },
      { status: 500 }
    )
  }
}
