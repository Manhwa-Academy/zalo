import { NextResponse } from 'next/server'
import { getCurrentUserId, getCurrentBotSettings, getCurrentZaloUserInfo } from '@/lib/multi-user-zalo'
import { UserManager } from '@/lib/user-manager'
import fs from 'fs'
import path from 'path'

/**
 * GET - Export backup (settings + messages + user info)
 */
export async function GET() {
  try {
    const userId = await getCurrentUserId()
    
    // 1. Get bot settings
    const settings = await getCurrentBotSettings()
    
    // 2. Get user info
    const userInfo = await getCurrentZaloUserInfo()
    
    // 3. Get message logs from file
    let messages: any[] = []
    try {
      const messagesFilePath = path.join(process.cwd(), '.zalo-messages.json')
      if (fs.existsSync(messagesFilePath)) {
        const raw = fs.readFileSync(messagesFilePath, 'utf-8')
        messages = JSON.parse(raw)
      }
    } catch (e) {
      console.warn('⚠️ Could not read messages file:', e)
    }
    
    // 4. Create backup object
    const backup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      userId,
      userInfo: {
        displayName: userInfo?.displayName,
        phoneNumber: userInfo?.phoneNumber,
        userId: userInfo?.userId,
        avatar: userInfo?.avatar,
      },
      botSettings: {
        enabled: settings.enabled,
        autoReplyMessage: settings.autoReplyMessage,
        replyDelay: settings.replyDelay,
        replyScope: settings.replyScope,
        whitelist: settings.whitelist,
        blacklist: settings.blacklist,
        useRandomPreset: settings.useRandomPreset,
        presetMessages: settings.presetMessages,
      },
      messages: messages.slice(0, 500), // Limit to last 500 messages
      stats: {
        totalMessages: messages.length,
        exportedMessages: Math.min(messages.length, 500),
      },
    }
    
    console.log(`📦 [Backup] Created backup for user ${userId}: ${messages.length} messages`)
    
    return NextResponse.json({
      success: true,
      backup,
    })
  } catch (error: any) {
    console.error('❌ [Backup] Export failed:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to create backup',
    }, { status: 500 })
  }
}

/**
 * POST - Import/Restore from backup
 */
export async function POST(request: Request) {
  try {
    const { backup, restoreSettings, restoreMessages } = await request.json()
    
    if (!backup || backup.version !== '1.0') {
      return NextResponse.json({
        success: false,
        error: 'Invalid backup format or version',
      }, { status: 400 })
    }
    
    const userId = await getCurrentUserId()
    const results = {
      settings: false,
      messages: false,
      errors: [] as string[],
    }
    
    // 1. Restore bot settings
    if (restoreSettings && backup.botSettings) {
      try {
        await UserManager.updateBotSettings(userId, {
          enabled: backup.botSettings.enabled,
          autoReplyMessage: backup.botSettings.autoReplyMessage,
          replyDelay: backup.botSettings.replyDelay,
          replyScope: backup.botSettings.replyScope,
          whitelist: backup.botSettings.whitelist,
          blacklist: backup.botSettings.blacklist,
          useRandomPreset: backup.botSettings.useRandomPreset,
          presetMessages: backup.botSettings.presetMessages,
        })
        results.settings = true
        console.log(`✅ [Backup] Restored settings for user ${userId}`)
      } catch (e: any) {
        results.errors.push(`Settings restore failed: ${e.message}`)
      }
    }
    
    // 2. Restore messages (merge with existing)
    if (restoreMessages && Array.isArray(backup.messages)) {
      try {
        const messagesFilePath = path.join(process.cwd(), '.zalo-messages.json')
        
        // Read existing messages
        let existingMessages: any[] = []
        if (fs.existsSync(messagesFilePath)) {
          try {
            const raw = fs.readFileSync(messagesFilePath, 'utf-8')
            existingMessages = JSON.parse(raw)
          } catch (e) {}
        }
        
        // Merge: Add backup messages that don't exist yet (check by msgId or cliMsgId)
        const existingIds = new Set(
          existingMessages.map(m => String(m.msgId || m.cliMsgId || m.id))
        )
        
        const newMessages = backup.messages.filter((m: any) => {
          const id = String(m.msgId || m.cliMsgId || m.id)
          return !existingIds.has(id)
        })
        
        const mergedMessages = [...existingMessages, ...newMessages]
        
        // Write back
        fs.writeFileSync(
          messagesFilePath,
          JSON.stringify(mergedMessages, null, 2),
          'utf-8'
        )
        
        results.messages = true
        console.log(`✅ [Backup] Restored ${newMessages.length} new messages (total: ${mergedMessages.length})`)
      } catch (e: any) {
        results.errors.push(`Messages restore failed: ${e.message}`)
      }
    }
    
    return NextResponse.json({
      success: results.settings || results.messages,
      results,
      message: `Restored: ${results.settings ? 'Settings' : ''} ${results.messages ? 'Messages' : ''}`.trim(),
    })
  } catch (error: any) {
    console.error('❌ [Backup] Import failed:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to restore backup',
    }, { status: 500 })
  }
}
