import fs from 'fs'
import { dataFilePath } from './data-dir'
import { saveMessage } from './messages-db' // ✅ NEW: Database save
import { getCurrentUserId } from './multi-user-zalo' // ✅ NEW: Get current user
import { saveMessageToAllSessions } from './sync-sessions' // 🆕 NEW: Multi-device sync

// NOTE: In multi-user setup, each user has their own zaloApi instance
// The listener manager is global but should be refactored per-user in future
// For now, it works with the current user's settings

const MESSAGES_FILE = dataFilePath('.zalo-messages.json')

export let sseClients: { id: number; controller: ReadableStreamDefaultController; zaloUserId?: string }[] = []
let clientCounter = 0

// In-memory message store loaded from file
export let messageQueue: any[] = loadStoredMessages()

// Cache for group metadata (id -> { name, totalMember })
export const knownGroups = new Map<string, { id: string; name: string; totalMember: number }>()

function loadStoredMessages(): any[] {
  try {
    if (fs.existsSync(MESSAGES_FILE)) {
      const data = fs.readFileSync(MESSAGES_FILE, 'utf-8')
      const parsed = JSON.parse(data)
      if (Array.isArray(parsed)) return parsed
    }
  } catch (e) {
    console.error('Failed to load stored messages:', e)
  }
  return []
}

function saveStoredMessages() {
  try {
    // Limit stored messages to last 500 to avoid file ballooning
    const trimmed = messageQueue.slice(-500)
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(trimmed, null, 2), 'utf-8')
  } catch (e) {
    console.error('Failed to save stored messages:', e)
  }
}

export function clearStoredMessages() {
  messageQueue.length = 0
  try {
    if (fs.existsSync(MESSAGES_FILE)) {
      fs.writeFileSync(MESSAGES_FILE, JSON.stringify([], null, 2), 'utf-8')
    }
  } catch (e) {
    console.error('Failed to clear stored messages:', e)
  }
}

export function broadcastMessage(data: any, zaloUserId?: string) {
  // Deduplicate incoming messages before storing or broadcasting
  // Only check by msgId/cliMsgId, NOT by content (to allow duplicate stickers/text)
  const exists = messageQueue.some(
    (m) =>
      (m.msgId && data.msgId && String(m.msgId) === String(data.msgId)) ||
      (m.cliMsgId && data.cliMsgId && String(m.cliMsgId) === String(data.cliMsgId)) ||
      (m.id && data.id && String(m.id) === String(data.id))
  )

  if (exists) {
    console.log('🔄 [Listener] Duplicate message detected, skipping:', {
      msgId: data.msgId,
      cliMsgId: data.cliMsgId
    })
    return
  }

  messageQueue.push(data)
  saveStoredMessages()

  // ✅ Save to database (async, non-blocking) with multi-device sync
  saveToDatabaseAsync(data, zaloUserId).catch(err => {
    console.error('❌ Failed to save message to database:', err)
  })

  // 🔒 FILTER: Only broadcast to clients with matching zaloUserId
  const targetClients = zaloUserId 
    ? sseClients.filter(c => c.zaloUserId === zaloUserId)
    : sseClients // Fallback: broadcast to all if no zaloUserId provided

  console.log(`📡 [Broadcast] Sending to ${targetClients.length}/${sseClients.length} clients (zaloUserId: ${zaloUserId || 'none'})`)

  targetClients.forEach((client) => {
    try {
      client.controller.enqueue(`data: ${JSON.stringify(data)}\n\n`)
    } catch (e) {}
  })
}

/**
 * Save message to database (async helper)
 * 🆕 NOW SYNCS ACROSS ALL SESSIONS OF THE SAME ZALO USER
 */
async function saveToDatabaseAsync(data: any, zaloUserId?: string) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return
    }

    const messageData = {
      msgId: data.msgId,
      cliMsgId: data.cliMsgId,
      threadId: data.threadId,
      content: data.content,
      messageType: data.type || 'text',
      senderId: data.from,
      senderName: data.fromName,
      isSelf: data.isSelf || false,
      timestamp: data.timestamp ? new Date(data.timestamp).getTime() : Date.now(),
      replied: data.replied || false,
      isUndo: data.isUndo || false,
      avatar: data.avatar,
      quote: data.quote
    }

    // 🆕 If we have Zalo user ID, save to ALL sessions (multi-device sync)
    if (zaloUserId) {
      await saveMessageToAllSessions(zaloUserId, messageData)
    } else {
      // Fallback: Save to current session only
      await saveMessage(userId, messageData)
    }
  } catch (error) {
    // Silent error - database save failed
    throw error
  }
}

export function markMessageUndone(msgId: string, cliMsgId: string, threadId: string, zaloUserId?: string) {
  const mIdStr = String(msgId || '')
  const cIdStr = String(cliMsgId || '')
  const tIdStr = String(threadId || '')

  // Try multiple matching strategies with expanded fields
  let targetMsg = messageQueue.find(
    (m) => {
      const matches = 
        // Try msgId
        (mIdStr && m.msgId && String(m.msgId) === mIdStr) ||
        (mIdStr && m.id && String(m.id) === mIdStr) ||
        (mIdStr && (m as any).globalMsgId && String((m as any).globalMsgId) === mIdStr) ||
        // Try cliMsgId
        (cIdStr && m.cliMsgId && String(m.cliMsgId) === cIdStr) ||
        (cIdStr && m.id && String(m.id) === cIdStr) ||
        // Try matching in content (for link messages that might have msgId in content)
        (mIdStr && typeof m.content === 'string' && m.content.includes(mIdStr))
      
      return matches
    }
  )

  if (targetMsg) {
    targetMsg.content = '🔄 Tin nhắn đã được thu hồi'
    targetMsg.isUndo = true
  } else {
    // Fallback: Find latest message in this thread (not just self messages)
    const threadMessages = messageQueue.filter((m) => String(m.threadId) === tIdStr)
    
    if (threadMessages.length > 0) {
      // Get the most recent message (last in array)
      targetMsg = threadMessages[threadMessages.length - 1]
      targetMsg.content = '🔄 Tin nhắn đã được thu hồi'
      targetMsg.isUndo = true
    }
  }

  // Save to file
  saveStoredMessages()

  // ✅ DELETE from database instead of marking
  deleteFromDatabaseAsync(mIdStr, cIdStr).catch(err => {
    console.error('❌ Failed to delete undone message from database:', err)
  })

  if (targetMsg) {
    // 🔒 FILTER: Only broadcast to clients with matching zaloUserId
    const targetClients = zaloUserId 
      ? sseClients.filter(c => c.zaloUserId === zaloUserId)
      : sseClients // Fallback: broadcast to all if no zaloUserId provided

    console.log(`📡 [Undo Broadcast] Sending to ${targetClients.length}/${sseClients.length} clients (zaloUserId: ${zaloUserId || 'none'})`)

    targetClients.forEach((client) => {
      try {
        client.controller.enqueue(`data: ${JSON.stringify(targetMsg)}\n\n`)
      } catch (e) {}
    })
  }
}

/**
 * Delete undone message from database (async helper)
 */
async function deleteFromDatabaseAsync(msgId: string, cliMsgId: string) {
  try {
    const { getCurrentUserId } = await import('./multi-user-zalo')
    const { deleteMessageOnUndo } = await import('./messages-db')
    
    const userId = await getCurrentUserId()
    if (!userId) {
      return
    }

    // Try to delete by msgId first, then cliMsgId
    if (msgId) {
      await deleteMessageOnUndo(userId, msgId)
    } else if (cliMsgId) {
      await deleteMessageOnUndo(userId, cliMsgId)
    }
    
    console.log('✅ [Undo] Deleted message from database')
  } catch (error) {
    console.error('❌ [Undo] Failed to delete from database:', error)
    throw error
  }
}

export function addSseClient(controller: ReadableStreamDefaultController, zaloUserId?: string): number {
  const id = ++clientCounter
  
  // Limit max connections to 3 per user to prevent memory leak
  const MAX_CLIENTS = 3
  if (sseClients.length >= MAX_CLIENTS) {
    const oldestClient = sseClients.shift()
    if (oldestClient) {
      try {
        oldestClient.controller.close()
      } catch (e) {}
    }
  }
  
  sseClients.push({ id, controller, zaloUserId })
  console.log(`✅ [SSE] Client ${id} connected (zaloUserId: ${zaloUserId || 'none'})`)

  // 🔒 FILTER: Only send messages that belong to this zaloUserId
  try {
    const filteredMessages = zaloUserId
      ? messageQueue.filter(msg => {
          // Only include messages from this Zalo user's threads
          // This is a basic filter - messages are saved with proper user_id in DB
          return true // For now, send all messages (DB will handle proper filtering)
        })
      : messageQueue

    filteredMessages.forEach((msg) => {
      controller.enqueue(`data: ${JSON.stringify(msg)}\n\n`)
    })
  } catch (e) {}

  return id
}

export function removeSseClient(id: number) {
  sseClients = sseClients.filter((c) => c.id !== id)
}

export function getStoredMessagesForThread(threadId: string): any[] {
  const tid = String(threadId)
  return messageQueue.filter((m) => String(m.threadId) === tid || String(m.from) === tid)
}

// Helper to get bot settings - load from BOTH user_settings AND bot_configs tables
async function getBotSettingsAsync() {
  try {
    const { getCurrentUserId } = await import('./multi-user-zalo')
    const pool = (await import('./postgres')).default
    
    if (!pool) {
      console.warn('⚠️ Database pool not available, using default settings')
      return getDefaultSettings()
    }
    
    const userId = await getCurrentUserId()
    console.log('🔍 [Settings] Looking for user_id:', userId)
    console.log('🔍 [Settings] user_id length:', userId.length, 'chars')
    
    // Load from user_settings table (AI settings)
    const userSettingsResult = await pool.query(
      'SELECT * FROM user_settings WHERE user_id = $1',
      [userId]
    )
    
    // Load from bot_settings table (bot auto-reply settings)
    const botConfigResult = await pool.query(
      'SELECT * FROM bot_settings WHERE user_id = $1',
      [userId]
    )
    
    console.log('📊 [Settings] user_settings rows:', userSettingsResult.rows.length)
    console.log('📊 [Settings] bot_settings rows:', botConfigResult.rows.length)
    
    // DEBUG: List all available user_ids in database
    if (userSettingsResult.rows.length === 0) {
      const allUsers = await pool.query('SELECT user_id FROM user_settings LIMIT 5')
      console.log('🔍 [Settings] Available user_ids in database:', 
        allUsers.rows.map(r => r.user_id))
    }
    
    // Merge settings from both tables
    let finalSettings = {
      enabled: true, // Bot enabled by default if user is logged in
      autoReplyMessage: 'Xin chào! Đây là tin nhắn tự động.',
      replyDelay: 5000, // Default 5 seconds in milliseconds
      replyScope: 'all',
      whitelist: [],
      groupWhitelist: [],
      userWhitelist: [],
      blacklist: [],
      useRandomPreset: true,
      presetMessages: [
        'E-Eto... tôi là Monica Everett... xin hãy chiếu cố cho tôi từ bây giờ nhé... 🌸✨🥺🤍',
        'U-Um... nếu tôi trốn sau cánh cửa thì xin đừng kéo tôi ra nhé... 🚪🥺💦',
        'Fuee... c-chuyện này khó quá đi mất... (՚﹏՚)💦',
        'A-Anou... đừng nói cho mọi người biết nhé... tôi tin bạn đó... 🥺🌸🤍✨',
        'S-Sono... nếu có thể giúp được mọi người thì tôi rất vui... 🍀🤍✨',
      ],
      aiEnabled: false,
      aiPersonality: 'cute',
      aiMaxLength: 500,
      aiTriggerMode: 'smart',
      geminiApiKey: '',
      geminiModel: 'gemini-3.1-flash-lite',
    }
    
    // Override with user_settings (AI settings)
    if (userSettingsResult.rows.length > 0) {
      const dbSettings = userSettingsResult.rows[0]
      console.log('✅ [Settings] Loaded user_settings from database:', {
        aiEnabled: dbSettings.ai_enabled,
        aiPersonality: dbSettings.ai_personality,
        aiTriggerMode: dbSettings.ai_trigger_mode,
        aiMaxLength: dbSettings.ai_max_length
      })
      
      finalSettings.aiEnabled = dbSettings.ai_enabled ?? false
      finalSettings.aiPersonality = dbSettings.ai_personality || 'cute'
      finalSettings.aiMaxLength = dbSettings.ai_max_length || 500
      finalSettings.aiTriggerMode = dbSettings.ai_trigger_mode || 'smart'
      finalSettings.geminiApiKey = dbSettings.gemini_api_key || ''
      finalSettings.geminiModel = dbSettings.gemini_model || 'gemini-3.1-flash-lite'
    }
    
    // Override with bot_settings (bot behavior settings)
    if (botConfigResult.rows.length > 0) {
      const botConfig = botConfigResult.rows[0]
      const configSettings = botConfig.settings || {}
      
      console.log('✅ [Settings] Loaded bot_settings from database:', {
        enabled: botConfig.enabled,
        replyDelay: botConfig.reply_delay,
        replyScope: configSettings.replyScope,
        whitelist: configSettings.whitelist?.length || 0,
        groupWhitelist: configSettings.groupWhitelist?.length || 0,
        userWhitelist: configSettings.userWhitelist?.length || 0,
        blacklist: configSettings.blacklist?.length || 0,
        useRandomPreset: configSettings.useRandomPreset
      })
      
      finalSettings.enabled = botConfig.enabled ?? true
      finalSettings.autoReplyMessage = botConfig.auto_reply_message || finalSettings.autoReplyMessage
      finalSettings.replyDelay = botConfig.reply_delay || 5000 // Default 5 seconds in milliseconds
      finalSettings.replyScope = configSettings.replyScope || 'all'
      finalSettings.whitelist = Array.isArray(configSettings.whitelist) ? configSettings.whitelist : []
      finalSettings.groupWhitelist = Array.isArray(configSettings.groupWhitelist) ? configSettings.groupWhitelist : []
      finalSettings.userWhitelist = Array.isArray(configSettings.userWhitelist) ? configSettings.userWhitelist : []
      finalSettings.blacklist = Array.isArray(configSettings.blacklist) ? configSettings.blacklist : []
      finalSettings.useRandomPreset = configSettings.useRandomPreset ?? true
      
      if (Array.isArray(configSettings.presetMessages) && configSettings.presetMessages.length > 0) {
        finalSettings.presetMessages = configSettings.presetMessages
      }
    }
    
    console.log('🎯 [Settings] Final merged settings:', {
      enabled: finalSettings.enabled,
      replyScope: finalSettings.replyScope,
      aiEnabled: finalSettings.aiEnabled,
      aiPersonality: finalSettings.aiPersonality,
      useRandomPreset: finalSettings.useRandomPreset
    })
    
    return finalSettings
  } catch (e) {
    console.error('❌ Failed to load settings from database:', e)
    return getDefaultSettings()
  }
}

function getDefaultSettings() {
  return {
    enabled: false,
    autoReplyMessage: 'Xin chào! Đây là tin nhắn tự động.',
    replyDelay: 5000, // Default 5 seconds in milliseconds
    replyScope: 'all',
    whitelist: [],
    groupWhitelist: [],
    userWhitelist: [],
    blacklist: [],
    useRandomPreset: false,
    presetMessages: [],
    aiEnabled: false,
    aiPersonality: 'friendly',
    aiMaxLength: 200,
    aiTriggerMode: 'smart',
    geminiApiKey: '',
    geminiModel: 'gemini-3.1-flash-lite',
  }
}

async function shouldAutoReply(threadId: string, isGroupMsg: boolean): Promise<boolean> {
  const settings = await getBotSettingsAsync()
  if (!settings || !settings.enabled) {
    return false
  }

  const scope = settings.replyScope || 'all'

  // 🔥 NEW LOGIC: Support group and user whitelists separately
  const groupWhitelist: string[] = Array.isArray(settings.groupWhitelist) ? settings.groupWhitelist : []
  const userWhitelist: string[] = Array.isArray(settings.userWhitelist) ? settings.userWhitelist : []
  const blacklist: string[] = Array.isArray(settings.blacklist) ? settings.blacklist : []
  
  // Fallback to old whitelist for backwards compatibility
  const legacyWhitelist: string[] = Array.isArray(settings.whitelist) ? settings.whitelist : []
  
  // 1. Check blacklist first (highest priority - always block)
  if (blacklist.includes(threadId)) {
    console.log(`🚫 [Auto-Reply] Blocked by blacklist: ${threadId}`)
    return false
  }
  
  // 2. If whitelist mode (groups), check groupWhitelist
  if (scope === 'whitelist') {
    const effectiveGroupWhitelist = groupWhitelist.length > 0 ? groupWhitelist : legacyWhitelist
    
    if (effectiveGroupWhitelist.length === 0) {
      console.log(`⚠️ [Auto-Reply] Whitelist mode but no groups selected`)
      return false
    }
    
    // Only apply to group messages
    if (!isGroupMsg) {
      console.log(`⏩ [Auto-Reply] Whitelist mode (groups only), skipping 1-1 chat`)
      return false
    }
    
    const isInWhitelist = effectiveGroupWhitelist.includes(threadId)
    console.log(`🔍 [Auto-Reply] Group whitelist check: threadId=${threadId}, inWhitelist=${isInWhitelist}`)
    return isInWhitelist
  }
  
  // 3. If user_whitelist mode, check userWhitelist
  if (scope === 'user_whitelist') {
    const effectiveUserWhitelist = userWhitelist.length > 0 ? userWhitelist : legacyWhitelist
    
    if (effectiveUserWhitelist.length === 0) {
      console.log(`⚠️ [Auto-Reply] User whitelist mode but no users selected`)
      return false
    }
    
    // Only apply to 1-1 chats
    if (isGroupMsg) {
      console.log(`⏩ [Auto-Reply] User whitelist mode (1-1 only), skipping group`)
      return false
    }
    
    const isInWhitelist = effectiveUserWhitelist.includes(threadId)
    console.log(`🔍 [Auto-Reply] User whitelist check: threadId=${threadId}, inWhitelist=${isInWhitelist}`)
    return isInWhitelist
  }
  
  // 4. Check scope restrictions
  if (scope === 'user_only' && isGroupMsg) {
    console.log(`⏩ [Auto-Reply] User-only mode, skipping group`)
    return false
  }
  if (scope === 'group_only' && !isGroupMsg) {
    console.log(`⏩ [Auto-Reply] Group-only mode, skipping 1-1 chat`)
    return false
  }
  
  // 5. Default: reply to all (if enabled and not blacklisted)
  console.log(`✅ [Auto-Reply] Allowed (scope=${scope}, isGroup=${isGroupMsg})`)
  return true
}

async function getReplyText(messageContent?: string, senderName?: string, threadId?: string, senderId?: string, quote?: any): Promise<string> {
  const settings = await getBotSettingsAsync()
  
  console.log(`🤖 [AI Reply] Settings:`, {
    aiEnabled: settings.aiEnabled,
    aiTriggerMode: settings.aiTriggerMode,
    messageContent: messageContent?.substring(0, 50)
  })
  
  // ========================================
  // 🆕 AI PERSONAL ASSISTANT CHECK
  // ========================================
  // Check if this message should trigger AI personal assistant
  // (when user is mentioned or replied to)
  
  if (settings.aiEnabled && messageContent && threadId) {
    try {
      const { shouldAIReplyForUser, generateAIReplyForUser, buildEnhancedConversationHistory } = await import('./ai-reply')
      const pool = (await import('./postgres')).default
      const { getCurrentUserId } = await import('./multi-user-zalo')
      
      const userId = await getCurrentUserId()
      
      if (userId && pool) {
        // Load user's AI profile
        const profileResult = await pool.query(
          'SELECT * FROM user_ai_profiles WHERE user_id = $1',
          [userId]
        )
        
        if (profileResult.rows.length > 0) {
          const profile = profileResult.rows[0]
          const userProfile = {
            userId: profile.user_id,
            zaloUserId: profile.zalo_user_id || '',
            zaloDisplayName: profile.zalo_display_name || '',
            nicknames: profile.nicknames || [],
            aiReplyMode: profile.ai_reply_mode || 'mention_only',
            contextLength: profile.context_length || 20,
            rememberContext: profile.remember_context !== false,
          }
          
          console.log(`👤 [AI Personal] Checking if should reply for: ${userProfile.zaloDisplayName}`)
          
          // Check if should reply on behalf of user
          const shouldReply = await shouldAIReplyForUser(
            messageContent,
            senderName || '',
            senderId || '',
            userProfile,
            quote
          )
          
          if (shouldReply) {
            console.log(`✅ [AI Personal] Replying on behalf of ${userProfile.zaloDisplayName}`)
            
            // Build enhanced conversation history
            const conversationHistory = buildEnhancedConversationHistory(
              messageQueue,
              threadId,
              userProfile.contextLength
            )
            
            // Generate AI reply on behalf of user
            const aiResult = await generateAIReplyForUser(
              messageContent,
              senderName || 'Người dùng',
              userProfile,
              conversationHistory,
              settings,
              undefined // TODO: Add media content if needed
            )
            
            if (!aiResult.error && aiResult.reply) {
              console.log(`✅ [AI Personal] Generated reply: "${aiResult.reply.substring(0, 80)}..."`)
              return aiResult.reply
            } else {
              console.error(`❌ [AI Personal] Error:`, aiResult.error)
            }
          }
        }
      }
    } catch (error) {
      console.error(`❌ [AI Personal] Exception:`, error)
      // Continue to normal AI reply if personal assistant fails
    }
  }
  
  // ========================================
  // NORMAL AI REPLY (existing logic)
  // ========================================
  
  // Check if AI is enabled
  if (settings.aiEnabled && messageContent) {
    const { generateAIReply, shouldUseAIReply, buildConversationHistory, detectPersonality } = await import('./ai-reply')
    
    // Check if we should use AI for this message
    const aiTriggerMode = settings.aiTriggerMode || 'smart'
    let useAI = false
    
    if (aiTriggerMode === 'always') {
      console.log(`✅ [AI Reply] Mode = ALWAYS → Using AI for all messages`)
      useAI = true
    } else if (aiTriggerMode === 'questions') {
      useAI = messageContent.includes('?')
      console.log(`❓ [AI Reply] Mode = QUESTIONS → useAI: ${useAI}`)
    } else if (aiTriggerMode === 'smart') {
      useAI = shouldUseAIReply(messageContent)
      console.log(`🧠 [AI Reply] Mode = SMART → useAI: ${useAI}`)
    }
    
    if (useAI) {
      console.log(`🚀 [AI Reply] Generating AI response for: "${messageContent?.substring(0, 50)}..."`)
      
      try {
        // Build conversation history if threadId provided
        const conversationHistory = threadId 
          ? buildConversationHistory(messageQueue, threadId, 5)
          : []
        
        // Detect personality from settings or use configured
        const personality = settings.aiPersonality || detectPersonality(settings.autoReplyMessage || '')
        
        // Get preset messages for style learning
        const presetMessages = Array.isArray(settings.presetMessages) && settings.presetMessages.length > 0
          ? settings.presetMessages
          : []
        
        console.log(`🎨 [AI Reply] Using personality: ${personality}, maxLength: ${settings.aiMaxLength}`)
        
        const aiResult = await generateAIReply({
          message: messageContent,
          senderName: senderName || 'Người dùng',
          conversationHistory,
          personality,
          maxLength: settings.aiMaxLength || 200,
          presetMessages, // AI will learn style from these
          apiKey: settings.geminiApiKey || undefined, // User's API key (fallback to system key if empty)
          model: settings.geminiModel || 'gemini-3.1-flash-lite', // User's preferred model
        })
        
        if (!aiResult.error && aiResult.reply) {
          console.log(`✅ [AI Reply] Generated: "${aiResult.reply.substring(0, 80)}..."`)
          return aiResult.reply // ✅ RETURN IMMEDIATELY - Don't fallback to preset
        } else {
          console.error(`❌ [AI Reply] Error:`, aiResult.error)
          
          // If mode is "always", return error message instead of fallback
          if (aiTriggerMode === 'always') {
            return aiResult.reply || 'Xin lỗi, AI đang gặp sự cố. Vui lòng thử lại sau! 🙏'
          }
          // Otherwise, fallback to preset (for smart/questions mode)
        }
      } catch (error) {
        console.error(`❌ [AI Reply] Exception:`, error)
        
        // If mode is "always", return error message instead of fallback
        if (aiTriggerMode === 'always') {
          return 'Xin lỗi, AI đang gặp sự cố. Vui lòng thử lại sau! 🙏'
        }
        // Otherwise, fallback to preset (for smart/questions mode)
      }
    } else {
      console.log(`⏩ [AI Reply] Skipping AI (useAI = false), using preset messages`)
    }
  } else {
    console.log(`⏩ [AI Reply] AI disabled or no message content, using preset messages`)
  }
  
  // Fallback to preset/normal message
  console.log(`📝 [Preset] Using preset messages (random: ${settings.useRandomPreset})`)
  
  if (settings.useRandomPreset && Array.isArray(settings.presetMessages) && settings.presetMessages.length > 0) {
    const validPresets = settings.presetMessages.filter((msg) => msg && typeof msg === 'string' && msg.trim().length > 0)
    if (validPresets.length > 0) {
      const randomIndex = Math.floor(Math.random() * validPresets.length)
      const selectedPreset = validPresets[randomIndex]
      console.log(`✅ [Preset] Selected random preset: "${selectedPreset.substring(0, 50)}..."`)
      return selectedPreset
    }
  }
  
  console.log(`✅ [Preset] Using default auto-reply message`)
  return settings.autoReplyMessage || 'Xin chào! Tôi đang bận, sẽ phản hồi bạn sớm nhất có thể. 🙏'
}

export function attachListenerToApi(zaloApi: any) {
  if (!zaloApi || !zaloApi.listener) return

  // 🆕 Increase max listeners to prevent warning
  if (typeof zaloApi.listener.setMaxListeners === 'function') {
    zaloApi.listener.setMaxListeners(20) // Increase from default 10 to 20
  }

  // Always force selfListen = true on both listener and context
  zaloApi.listener.selfListen = true
  if (zaloApi.ctx?.options) {
    zaloApi.ctx.options.selfListen = true
  }

  // Remove existing listeners to prevent duplicate or stale HMR callbacks
  zaloApi.listener.removeAllListeners('message')
  zaloApi.listener.removeAllListeners('undo')
  zaloApi.listener.removeAllListeners('typing')
  zaloApi.listener.removeAllListeners('read_receipt')

  zaloApi.listener.on('undo', (undoData: any) => {
    // 🆕 Get Zalo user ID for filtering broadcasts
    const zaloUserId = typeof zaloApi.getOwnId === 'function' ? String(zaloApi.getOwnId()) : ''
    
    // Parse undo data - can be array or single object
    let undoEvents = []
    if (Array.isArray(undoData)) {
      undoEvents = undoData
    } else if (undoData?.data && Array.isArray(undoData.data)) {
      undoEvents = undoData.data
    } else {
      undoEvents = [undoData]
    }

    // Process each undo event
    for (const event of undoEvents) {
      // IMPORTANT: In undo events, the actual message IDs are in content object!
      const contentData = event?.content || event?.data?.content || {}
      
      // Try to get message IDs from content first (most reliable)
      let mId = String(contentData?.globalMsgId || contentData?.msgId || '')
      let cId = String(contentData?.cliMsgId || contentData?.clientMsgId || '')
      
      // Fallback to event-level IDs if not found in content
      if (!mId) mId = String(event?.globalDelMsgId || event?.msgId || event?.data?.msgId || '')
      if (!cId) cId = String(event?.clientDelMsgId || event?.cliMsgId || event?.data?.cliMsgId || '')
      
      // Thread ID
      const tId = String(contentData?.destId || event?.destId || event?.threadId || event?.grid || event?.data?.threadId || event?.idTo || event?.data?.idTo || '')
      
      if (tId && (mId || cId)) {
        markMessageUndone(mId, cId, tId, zaloUserId)
      }
    }
  })

  // 🆕 Listen for reaction events
  zaloApi.listener.on('reaction', (reactionData: any) => {
    console.log('👍 [Listener] Received reaction event:', reactionData)
    
    // 🆕 Get Zalo user ID for filtering broadcasts
    const zaloUserId = typeof zaloApi.getOwnId === 'function' ? String(zaloApi.getOwnId()) : ''
    
    try {
      // Extract reaction data
      const msgId = String(reactionData?.msgId || reactionData?.data?.msgId || '')
      const cliMsgId = String(reactionData?.cliMsgId || reactionData?.data?.cliMsgId || '')
      const threadId = String(reactionData?.threadId || reactionData?.data?.threadId || '')
      const userId = String(reactionData?.userId || reactionData?.data?.userId || reactionData?.uidFrom || '')
      const userName = reactionData?.userName || reactionData?.data?.userName || reactionData?.dName || ''
      const icon = reactionData?.icon || reactionData?.data?.icon || reactionData?.react || ''
      
      if (!msgId && !cliMsgId) {
        console.warn('⚠️ [Listener] Reaction event missing message ID')
        return
      }
      
      // Broadcast reaction update
      const reactionUpdate = {
        type: 'reaction',
        msgId,
        cliMsgId,
        threadId,
        userId,
        userName,
        icon,
        timestamp: Date.now(),
      }
      
      // 🔒 FILTER: Only broadcast to clients with matching zaloUserId
      const targetClients = zaloUserId 
        ? sseClients.filter(c => c.zaloUserId === zaloUserId)
        : sseClients // Fallback: broadcast to all if no zaloUserId provided

      console.log(`📡 [Reaction Broadcast] Sending to ${targetClients.length}/${sseClients.length} clients (zaloUserId: ${zaloUserId || 'none'})`)
      
      targetClients.forEach((client) => {
        try {
          client.controller.enqueue(`data: ${JSON.stringify(reactionUpdate)}\n\n`)
        } catch (e) {
          console.error('Failed to send reaction update to client:', e)
        }
      })
      
      console.log('✅ [Listener] Broadcasted reaction update to clients')
    } catch (error) {
      console.error('❌ [Listener] Error processing reaction event:', error)
    }
  })

  zaloApi.listener.on('message', async (message: any) => {
    console.log('📨 [Listener] Received message:', {
      isSelf: message.isSelf,
      from: message.data?.uidFrom || message.from,
      content: message.data?.content || message.content,
      type: message.type
    })

    // 🆕 Get Zalo user ID for multi-device sync
    const zaloUserId = typeof zaloApi.getOwnId === 'function' ? String(zaloApi.getOwnId()) : ''
    console.log('🔑 [Listener] Zalo User ID:', zaloUserId)

    const senderId = String(message.data?.uidFrom || message.threadId || message.from || 'Unknown')
    let senderName = message.data?.dName || message.data?.displayName || message.fromName || ''
    let senderAvatar = message.data?.avatar || message.data?.avt || message.avatar || message.data?.avatarUrl || ''

    // If sender info is missing, try to fetch from getUserInfo API
    if ((!senderName || !senderAvatar) && typeof zaloApi.getUserInfo === 'function' && senderId !== 'Unknown') {
      try {
        const uInfoRes = await zaloApi.getUserInfo(senderId)
        const uData = uInfoRes?.data || uInfoRes?.[senderId] || uInfoRes
        if (uData) {
          if (!senderName) senderName = uData.displayName || uData.zaloName || uData.name || ''
          if (!senderAvatar) {
            senderAvatar = uData.avatar || uData.avatarUrl || uData.avt || uData.avatar_240 || uData.avatar_120 || uData.thumb || ''
          }
        }
      } catch (e) {
        // Silent error - getUserInfo failed
      }
    }

    if (!senderName) {
      senderName = message.isSelf ? 'Bạn (Chính mình)' : `Người dùng (${senderId.slice(-4)})`
    }

    const isGroupMsg = message.type === 1 || message.type === 'Group'
    if (isGroupMsg) {
      const gId = String(message.threadId)
      knownGroups.set(gId, {
        id: gId,
        name: message.data?.gName || message.gName || knownGroups.get(gId)?.name || `Nhóm ${gId}`,
        totalMember: message.data?.totalMember || message.totalMember || knownGroups.get(gId)?.totalMember || 0,
      })
    }

    const ownId = typeof zaloApi.getOwnId === 'function' ? String(zaloApi.getOwnId()) : ''

    let targetThreadId = ''
    if (isGroupMsg) {
      // GROUP: Always use grid or threadId
      targetThreadId = String(message.data?.grid || message.threadId || '')
      console.log('🏢 [Listener] Group message - threadId:', targetThreadId)
    } else {
      // 1-1 CHAT: Determine other party
      if (message.isSelf) {
        // Self-sent message: use idTo (recipient)
        targetThreadId = String(message.data?.idTo || message.data?.to || message.idTo || message.to || '')
        
        // Validate: Don't use ownId as targetThreadId
        if (ownId && (targetThreadId === ownId || targetThreadId === '0' || targetThreadId === 'undefined' || !targetThreadId)) {
          targetThreadId = String(message.data?.idTo || message.idTo || '')
        }
        
        console.log('💬 [Listener] Self-sent 1-1 message - recipient:', targetThreadId)
      } else {
        // Received message: use uidFrom (sender)
        targetThreadId = String(message.data?.uidFrom || message.from || message.uidFrom || '')
        console.log('💬 [Listener] Received 1-1 message - sender:', targetThreadId)
      }
    }

    // Final validation: Reject invalid threadIds
    if (!targetThreadId || targetThreadId === '0' || targetThreadId === 'undefined') {
      console.warn('⚠️ [Listener] Invalid threadId detected, using senderId as fallback:', senderId)
      targetThreadId = senderId
    }
    
    console.log('✅ [Listener] Final threadId:', targetThreadId, '| Type:', isGroupMsg ? 'Group' : '1-1')

    const realMsgId = message.data?.msgId || message.msgId || message.data?.cliMsgId || message.cliMsgId || Date.now()
    const realCliMsgId = message.data?.cliMsgId || message.cliMsgId || message.data?.msgId || message.msgId || Date.now()

    let rawContent = message.data?.content || message.content || ''
    if (typeof rawContent === 'object' && rawContent !== null) {
      if (rawContent.catId || rawContent.cateId || rawContent.id || rawContent.type === 'sticker') {
        const catId = rawContent.catId || rawContent.cateId || 1
        const stkId = rawContent.id || rawContent.stickerId || rawContent.stkId || '10065'
        // ALWAYS use correct Zalo sticker CDN - use alternative API endpoint for better compatibility
        const stkUrl = `https://zalo-api.zadn.vn/api/emoticon/sticker/webpc?eid=${stkId}&size=130&version=1`
        rawContent = JSON.stringify({
          type: 'sticker',
          id: stkId,
          catId: catId,
          url: stkUrl,
        })
      } else if (
        // Link preview detection - prioritize over image detection
        rawContent.type === 'link' || 
        rawContent.link || 
        (rawContent.href && rawContent.title) ||
        (rawContent.url && rawContent.title && rawContent.description) ||
        (rawContent.href && /^https?:\/\//.test(rawContent.href) && rawContent.thumb && rawContent.title)
      ) {
        // Link preview - extract actual link and metadata
        const linkUrl = rawContent.href || rawContent.url || rawContent.link || ''
        const linkTitle = rawContent.title || rawContent.name || linkUrl || ''
        const linkThumb = rawContent.thumb || rawContent.thumbnail || rawContent.image || ''
        const linkDesc = rawContent.description || rawContent.desc || ''
        
        rawContent = JSON.stringify({
          type: 'link',
          url: linkUrl,
          title: linkTitle,
          description: linkDesc,
          thumbnail: linkThumb,
        })
      } else if (rawContent.type === 'image' || rawContent.photoUrl || rawContent.imageUrl || 
                 (rawContent.href && !rawContent.title) || // href without title = image URL
                 (rawContent.thumb && !rawContent.title) || // thumb without title = image URL
                 (rawContent.url && !rawContent.title && !rawContent.description)) { // url without title/desc = image URL
        // Image/GIF content - preserve URL
        const imgUrl = rawContent.url || rawContent.href || rawContent.thumb || rawContent.photoUrl || rawContent.imageUrl || rawContent.hdUrl || ''
        const imgName = rawContent.name || rawContent.fileName || ''
        
        // Try to extract Giphy ID if this is a Giphy GIF filename
        let giphyId = rawContent.giphyId || ''
        if (!giphyId && imgName && imgName.startsWith('giphy_')) {
          giphyId = imgName.replace('giphy_', '').replace(/\.(gif|png|jpe?g|webp)$/i, '')
        }
        
        // 🆕 Download and cache media to prevent URL expiration
        if (imgUrl && imgName) {
          import('./download-and-cache-media').then(({ downloadAndCacheMedia }) => {
            getCurrentUserId().then(userId => {
              const mediaType = imgName.endsWith('.gif') ? 'gif' : 'image'
              downloadAndCacheMedia(imgUrl, imgName, userId, mediaType).catch(err => {
                console.warn('⚠️ [Listener] Failed to cache media:', err)
              })
            })
          })
        }
        
        rawContent = JSON.stringify({
          type: 'image',
          name: imgName,
          url: imgUrl,
          caption: rawContent.caption || rawContent.description || '',
          giphyId: giphyId, // Preserve Giphy ID for cache lookup
        })
      } else if (
        rawContent.type === 'file' || 
        rawContent.type === 'video' ||
        rawContent.fileName || 
        rawContent.fileUrl || 
        rawContent.fileSize ||
        (rawContent.name && /\.(mp4|avi|mov|pdf|doc|docx|xls|xlsx|ppt|pptx|zip|rar|apk|txt|py|js|ts|json|csv)$/i.test(rawContent.name))
      ) {
        // File attachment - preserve file metadata (including videos, documents, archives, code files)
        const fileName = rawContent.fileName || rawContent.name || rawContent.title || 'File'
        const fileUrl = rawContent.fileUrl || rawContent.url || rawContent.href || rawContent.downloadUrl || ''
        const fileSize = rawContent.fileSize || rawContent.size || rawContent.fsize || 0
        
        // 🆕 Download and cache file to prevent URL expiration
        if (fileUrl && fileName) {
          import('./download-and-cache-media').then(({ downloadAndCacheMedia }) => {
            getCurrentUserId().then(userId => {
              downloadAndCacheMedia(fileUrl, fileName, userId, 'file').catch(err => {
                console.warn('⚠️ [Listener] Failed to cache file:', err)
              })
            })
          })
        }
        
        rawContent = JSON.stringify({
          type: 'file',
          name: fileName,
          url: fileUrl,
          size: fileSize,
          caption: rawContent.caption || rawContent.description || '',
        })
      } else if (
        rawContent.type === 'call' ||
        rawContent.type === 'audio_call' ||
        rawContent.type === 'video_call' ||
        rawContent.type === 'voice_call' ||
        rawContent.callType ||
        rawContent.duration !== undefined ||
        rawContent.status ||
        (rawContent.msg && (rawContent.msg.includes('cuộc gọi') || rawContent.msg.includes('phút') || rawContent.msg.includes('giây')))
      ) {
        // Call bubble message - preserve call metadata
        const callType = rawContent.callType || rawContent.type || 'call'
        const duration = rawContent.duration || 0
        const status = rawContent.status || 'completed'
        const direction = rawContent.direction || (message.isSelf ? 'outgoing' : 'incoming')
        const msg = rawContent.msg || rawContent.message || rawContent.text || ''
        
        rawContent = JSON.stringify({
          type: 'call',
          callType: callType,
          duration: duration,
          status: status,
          direction: direction,
          message: msg,
          threadId: targetThreadId, // Save threadId for "Gọi lại" button
        })
      } else {
        try {
          rawContent = JSON.stringify(rawContent)
        } catch (e) {
          rawContent = '[Nội dung đặc biệt]'
        }
      }
    } else if (typeof rawContent !== 'string') {
      rawContent = String(rawContent || '')
    }

    // Check if rawContent is a call message in text format
    // Format: "Cuộc gọi [thoại/video] [đi/đến]\n0 phút 10 giây" or similar
    if (typeof rawContent === 'string' && 
        (rawContent.includes('Cuộc gọi') || rawContent.includes('cuộc gọi')) &&
        (rawContent.includes('phút') || rawContent.includes('giây'))) {
      
      // Parse the text to extract call information
      const isVideo = rawContent.includes('video')
      const isOutgoing = rawContent.includes('đi')
      const isIncoming = rawContent.includes('đến')
      
      // Extract duration - look for pattern like "0 phút 10 giây" or "30 giây"
      let duration = 0
      const minuteMatch = rawContent.match(/(\d+)\s*phút/)
      const secondMatch = rawContent.match(/(\d+)\s*giây/)
      
      if (minuteMatch) {
        duration += parseInt(minuteMatch[1]) * 60
      }
      if (secondMatch) {
        duration += parseInt(secondMatch[1])
      }
      
      // Convert to structured JSON
      rawContent = JSON.stringify({
        type: 'call',
        callType: isVideo ? 'video_call' : 'audio_call',
        duration: duration,
        direction: isOutgoing ? 'outgoing' : (isIncoming ? 'incoming' : 'outgoing'),
        status: duration > 0 ? 'completed' : 'missed',
        message: '', // Original message already parsed
        threadId: targetThreadId, // Save threadId for "Gọi lại" button
      })
    }

    // If rawContent is just a filename (e.g., "giphy_xxx.gif"), try to reconstruct with cached URL
    if (typeof rawContent === 'string' && /\.(gif|png|jpe?g|webp)$/i.test(rawContent) && !rawContent.includes('{')) {
      // This is just a filename - try to get cached URL
      // Note: Can't access fs here (client-side), will be handled by frontend cache lookup
    }

    // Get timestamp from Zalo message (in milliseconds) or use current time
    let msgTimestamp: number
    const rawTs = message.data?.ts || message.ts || message.data?.sendTime || message.sendTime || message.data?.timestamp || message.timestamp
    
    if (rawTs) {
      const tsNum = Number(rawTs)
      
      // Detect if timestamp is in seconds or milliseconds
      // Timestamps in seconds are typically < 10,000,000,000 (before year 2286)
      // Timestamps in milliseconds are typically > 1,000,000,000,000
      if (tsNum > 0 && tsNum < 10000000000) {
        // Timestamp is in SECONDS - convert to milliseconds
        msgTimestamp = tsNum * 1000
      } else if (tsNum >= 10000000000) {
        // Timestamp is already in MILLISECONDS - use as-is
        msgTimestamp = tsNum
      } else {
        // Invalid timestamp - use current time
        msgTimestamp = Date.now()
      }
    } else {
      msgTimestamp = Date.now()  // Fallback to current time
    }
    
    // Log the final timestamp for debugging

    // Parse quote/reply data if present
    let quote: any = undefined
    const quoteData = message.data?.quote || message.quote || message.data?.replyTo || message.replyTo || message.data?.refMsg || message.refMsg
    if (quoteData) {
      console.log('📎 [Listener] Found quote data:', JSON.stringify(quoteData, null, 2))
      quote = {
        id: quoteData.globalMsgId || quoteData.msgId || quoteData.id || quoteData.cliMsgId,
        msgId: quoteData.globalMsgId || quoteData.msgId || quoteData.id,
        fromName: quoteData.fromD || quoteData.fromName || quoteData.dName || 'Người dùng',
        content: quoteData.msg || (typeof quoteData.content === 'string' 
          ? quoteData.content 
          : (quoteData.message || '[Media]'))
      }
      console.log('✅ [Listener] Parsed quote:', quote)
    } else {
      // DEBUG: Log full message structure to see if quote is somewhere else
      if (message.data || message.quote || message.replyTo) {
   
      }
    }

    const messageData = {
      id: realMsgId,
      msgId: String(realMsgId),
      cliMsgId: String(realCliMsgId),
      globalMsgId: String(message.data?.globalMsgId || message.globalMsgId || realMsgId),
      timestamp: new Date(msgTimestamp).toISOString(),
      from: senderId,
      fromName: senderName,
      avatar: senderAvatar,
      content: rawContent,
      type: isGroupMsg ? 'Group' : 'User',
      threadId: targetThreadId,
      replied: false,
      isSelf: !!message.isSelf,
      quote: quote,
    }

    let autoReplied = false

    // 🆕 Check if this is a reaction-only event (no text content)
    let isReactionOnly = false
    try {
      const parsedContent = JSON.parse(rawContent)
      if (parsedContent.type === 'reaction') {
        isReactionOnly = true
      }
    } catch {
      // Not JSON, check if it's empty or just emoji (simple check)
      const trimmed = rawContent.trim()
      // Check if empty or very short (likely emoji/reaction)
      if (!trimmed || trimmed.length <= 3) {
        isReactionOnly = true
      }
    }

    // Perform auto-reply logic ONLY for incoming messages not sent by self
    console.log('🤖 [Auto-Reply Check]:', {
      isSelf: message.isSelf,
      threadId: targetThreadId,
      isGroup: isGroupMsg,
      isReactionOnly,
      shouldReply: await shouldAutoReply(targetThreadId, isGroupMsg)
    })
    
    if (!message.isSelf && await shouldAutoReply(targetThreadId, isGroupMsg)) {
      console.log('✅ [Auto-Reply] Conditions met, generating reply...')
      try {
        // Extract text content from message for AI
        let textContent = rawContent
        try {
          const parsed = JSON.parse(rawContent)
          if (parsed.type === 'sticker') textContent = '[sticker]'
          else if (parsed.type === 'image') textContent = parsed.caption || '[hình ảnh]'
          else if (parsed.type === 'file') textContent = `[file: ${parsed.name}]`
        } catch {
          // rawContent is plain text
        }
        
        // Get bot settings for delay
        const settings = await getBotSettingsAsync()
        const replyDelay = settings.replyDelay || 5000 // Default 5 seconds (in milliseconds)
        
        // 🆕 If this is a reaction only, force use preset message (skip AI)
        let replyText
        if (isReactionOnly) {
          console.log('👍 [Auto-Reply] Reaction detected → Using random preset message')
          
          // Use first 5 preset messages for reactions (or all if less than 5)
          if (Array.isArray(settings.presetMessages) && settings.presetMessages.length > 0) {
            const validPresets = settings.presetMessages.filter((msg: string) => msg && typeof msg === 'string' && msg.trim().length > 0)
            
            if (validPresets.length > 0) {
              // Take first 5 messages (or all if less than 5)
              const reactionPresets = validPresets.slice(0, 5)
              const randomIndex = Math.floor(Math.random() * reactionPresets.length)
              replyText = reactionPresets[randomIndex]
              console.log(`✅ [Auto-Reply] Selected reaction reply ${randomIndex + 1}/${reactionPresets.length}: ${replyText.slice(0, 50)}...`)
            } else {
              replyText = 'Cảm ơn bạn! 🙏'
            }
          } else {
            replyText = 'Cảm ơn bạn! 🙏'
          }
        } else {
          // Normal message → Use AI or preset based on settings
          replyText = await getReplyText(textContent, senderName, targetThreadId, senderId, quote)
        }
        
        // ⏱️ DELAY before sending to make it look more natural and avoid being detected as bot
        console.log(`⏱️ [Auto-Reply] Waiting ${replyDelay}ms before sending reply...`)
        await new Promise(resolve => setTimeout(resolve, replyDelay))
        console.log(`✅ [Auto-Reply] Delay completed, sending reply now`)
        
        const threadTypeParam = isGroupMsg ? 1 : 0
        const sendResult = await zaloApi.sendMessage(
          { msg: replyText },
          targetThreadId,
          threadTypeParam
        )
        autoReplied = true
        messageData.replied = true
        
        // 🆕 DON'T broadcast immediately - let the listener event handle it
        // This prevents duplicate messages (immediate broadcast + listener event)
        // The listener will receive the message with isSelf=true and broadcast it
        console.log('✅ [Auto-Reply] Message sent, waiting for listener event to broadcast...')
        
        // If you want immediate UI update, uncomment below (but may cause duplicates):
        // broadcastMessage({ ... }, zaloUserId)
      } catch (err: any) {
        // Silent error - auto-reply failed
        console.error('❌ [Auto-Reply] Failed:', err)
      }
    }

    try {
      const recordStatMessage = (global as any).recordStatMessage
      if (typeof recordStatMessage === 'function') {
        recordStatMessage(autoReplied, message.threadId)
      }
    } catch (e) {}

    // 🆕 Pass zaloUserId for multi-device sync
    broadcastMessage(messageData, zaloUserId)
  })

  // 🆕 Typing event listener - broadcast typing indicators
  zaloApi.listener.on('typing', (typingData: any) => {
    console.log('⌨️ [Listener] Received typing event:', typingData)
    
    try {
      // Parse typing event
      const threadId = String(typingData.threadId || typingData.idFrom || '')
      const userId = String(typingData.userId || typingData.uidFrom || '')
      const userName = typingData.userName || typingData.displayName || typingData.dName || `User ${userId.slice(-4)}`
      const isTyping = typingData.isTyping !== false // Default to true
      
      if (!threadId) {
        console.warn('⚠️ [Typing] Missing threadId, skipping')
        return
      }
      
      // Broadcast typing event to all SSE clients
      const typingEvent = {
        type: 'typing',
        threadId,
        userId,
        userName,
        isTyping,
        timestamp: Date.now(),
      }
      
      sseClients.forEach((client) => {
        try {
          client.controller.enqueue(`data: ${JSON.stringify(typingEvent)}\n\n`)
        } catch (e) {
          console.error('Failed to send typing event to client:', e)
        }
      })
      
      console.log(`✅ [Typing] Broadcasted: ${userName} ${isTyping ? 'is typing' : 'stopped typing'} in ${threadId}`)
    } catch (error) {
      console.error('❌ [Typing] Error processing typing event:', error)
    }
  })

  // 🆕 Read receipt (seen) event listener - broadcast seen events
  zaloApi.listener.on('read_receipt', (seenData: any) => {
    console.log('👁️ [Listener] Received seen event:', seenData)
    
    try {
      // Check if this is a Group or User seen event
      const isGroup = seenData.type === 1 || seenData.type === 'Group' || !!seenData.data?.seenUids || !!seenData.seenUids
      
      if (isGroup) {
        // ========================================
        // GROUP SEEN MESSAGE
        // ========================================
        const groupId = String(seenData.data?.groupId || seenData.threadId || seenData.groupId || '')
        const msgId = String(seenData.data?.msgId || seenData.msgId || '')
        const seenUids = seenData.data?.seenUids || seenData.seenUids || []
        
        if (!groupId || !msgId) {
          console.warn('⚠️ [Seen] Missing groupId or msgId for group seen event')
          return
        }
        
        console.log(`👥 [Seen] Group event: ${seenUids.length} users saw message ${msgId} in group ${groupId}`)
        
        // Fetch user info for all seen users (if we don't have their names yet)
        const getUsersInfo = async () => {
          try {
            if (seenUids.length > 0 && typeof zaloApi.getUserInfo === 'function') {
              const uRes = await zaloApi.getUserInfo(seenUids.slice(0, 30)) // Batch max 30
              const uData = uRes?.data || uRes
              
              const seenBy = seenUids.map((uid: string) => {
                const userItem = uData?.[uid] || uData?.[`${uid}_0`]
                return {
                  userId: uid,
                  userName: userItem?.displayName || userItem?.zaloName || userItem?.name || `User ${uid.slice(-4)}`,
                  avatar: userItem?.avatar || userItem?.avatar_240 || userItem?.avatar_120 || '',
                  seenAt: Date.now()
                }
              })
              
              // Broadcast group seen event to all SSE clients
              const seenEvent = {
                type: 'group_seen',
                threadId: groupId,
                msgId,
                seenBy,
                timestamp: Date.now(),
              }
              
              sseClients.forEach((client) => {
                try {
                  client.controller.enqueue(`data: ${JSON.stringify(seenEvent)}\n\n`)
                } catch (e) {
                  console.error('Failed to send group seen event to client:', e)
                }
              })
              
              console.log(`✅ [Seen] Broadcasted group seen: ${seenBy.length} users read message ${msgId}`)
            }
          } catch (error) {
            console.error('❌ [Seen] Error fetching users info for group seen:', error)
          }
        }
        
        getUsersInfo() // Run async
        
      } else {
        // ========================================
        // USER (1:1) SEEN MESSAGE
        // ========================================
        const threadId = String(seenData.data?.idTo || seenData.threadId || seenData.idFrom || '')
        const userId = String(seenData.data?.idTo || seenData.userId || seenData.uidFrom || '')
        const msgId = String(seenData.data?.msgId || seenData.msgId || '')
        const realMsgId = String(seenData.data?.realMsgId || seenData.realMsgId || msgId)
        
        if (!threadId) {
          console.warn('⚠️ [Seen] Missing threadId for user seen event')
          return
        }
        
        console.log(`👤 [Seen] User event: User ${userId} saw message ${msgId} in thread ${threadId}`)
        
        // Broadcast user seen event to all SSE clients
        const seenEvent = {
          type: 'user_seen',
          threadId,
          userId,
          msgId,
          realMsgId,
          timestamp: Date.now(),
        }
        
        sseClients.forEach((client) => {
          try {
            client.controller.enqueue(`data: ${JSON.stringify(seenEvent)}\n\n`)
          } catch (e) {
            console.error('Failed to send user seen event to client:', e)
          }
        })
        
        console.log(`✅ [Seen] Broadcasted user seen: ${userId} read message in ${threadId}`)
      }
      
    } catch (error) {
      console.error('❌ [Seen] Error processing seen event:', error)
    }
  })

  // Track reconnection state to prevent duplicate reconnects
  let isReconnecting = false
  let reconnectTimer: NodeJS.Timeout | null = null

  zaloApi.listener.on('closed', (code: any, reason: any) => {
    // ONLY reconnect if closed unexpectedly (NOT normal closure 1000)
    // Code 1000 = NORMAL_CLOSURE (intentional close, don't reconnect)
    // Code 1006 = ABNORMAL_CLOSURE (unexpected disconnect, should reconnect)
    if (code && code !== 1000 && !isReconnecting) {
      isReconnecting = true
      
      // Clear any existing reconnect timer
      if (reconnectTimer) {
        clearTimeout(reconnectTimer)
      }
      
      reconnectTimer = setTimeout(() => {
        try {
          // Check if listener is already running before attempting to start
          if (typeof zaloApi.listener.isRunning === 'function' && zaloApi.listener.isRunning()) {
            isReconnecting = false
            reconnectTimer = null
            return
          }
          
          zaloApi.listener.start({ retryOnClose: true })
          isReconnecting = false
          reconnectTimer = null
        } catch (e: any) {
          isReconnecting = false
          reconnectTimer = null
          
          // If "Already started", listener is actually fine
          if (e?.message?.includes('Already started') || e?.message?.includes('already')) {
            // Listener already running - no action needed
          }
        }
      }, 3000)
    }
  })

  zaloApi.listener.on('disconnected', (code: any, reason: any) => {
    // Don't reconnect here - let 'closed' event handle it to avoid duplicate reconnects
  })

  try {
    zaloApi.listener.start({ retryOnClose: true })
  } catch (err: any) {
    if (err?.message?.includes('Already started') || err?.message?.includes('already')) {
      // Listener already active
    } else {
      console.error('Failed to start listener:', err)
    }
  }
}
