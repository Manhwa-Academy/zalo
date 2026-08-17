import fs from 'fs'
import { dataFilePath } from './data-dir'
import { saveMessage } from './messages-db' // ✅ NEW: Database save
import { getCurrentUserId } from './multi-user-zalo' // ✅ NEW: Get current user

// NOTE: In multi-user setup, each user has their own zaloApi instance
// The listener manager is global but should be refactored per-user in future
// For now, it works with the current user's settings

const MESSAGES_FILE = dataFilePath('.zalo-messages.json')

export let sseClients: { id: number; controller: ReadableStreamDefaultController }[] = []
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

export function broadcastMessage(data: any) {
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

  // ✅ Save to database (async, non-blocking)
  saveToDatabaseAsync(data).catch(err => {
    console.error('❌ Failed to save message to database:', err)
  })

  sseClients.forEach((client) => {
    try {
      client.controller.enqueue(`data: ${JSON.stringify(data)}\n\n`)
    } catch (e) {}
  })
}

/**
 * Save message to database (async helper)
 */
async function saveToDatabaseAsync(data: any) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return
    }

    await saveMessage(userId, {
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
    })
  } catch (error) {
    // Silent error - database save failed
    throw error
  }
}

export function markMessageUndone(msgId: string, cliMsgId: string, threadId: string) {
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

  if (targetMsg) {
    // Broadcast the updated message
    sseClients.forEach((client) => {
      try {
        client.controller.enqueue(`data: ${JSON.stringify(targetMsg)}\n\n`)
      } catch (e) {}
    })
  }
}

export function addSseClient(controller: ReadableStreamDefaultController): number {
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
  
  sseClients.push({ id, controller })

  // Instantly push initial batch of stored messages to newly connected SSE client
  try {
    messageQueue.forEach((msg) => {
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
      replyScope: 'all',
      whitelist: [],
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
        replyScope: configSettings.replyScope,
        whitelist: configSettings.whitelist?.length || 0,
        blacklist: configSettings.blacklist?.length || 0,
        useRandomPreset: configSettings.useRandomPreset
      })
      
      finalSettings.enabled = botConfig.enabled ?? true
      finalSettings.autoReplyMessage = botConfig.auto_reply_message || finalSettings.autoReplyMessage
      finalSettings.replyScope = configSettings.replyScope || 'all'
      finalSettings.whitelist = Array.isArray(configSettings.whitelist) ? configSettings.whitelist : []
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
    replyScope: 'all',
    whitelist: [],
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

  if (scope === 'user_only' && isGroupMsg) return false
  if (scope === 'group_only' && !isGroupMsg) return false

  if (scope === 'whitelist') {
    const whitelist: string[] = Array.isArray(settings.whitelist) ? settings.whitelist : []
    if (whitelist.length === 0) return false
    return whitelist.includes(threadId)
  }

  const blacklist: string[] = Array.isArray(settings.blacklist) ? settings.blacklist : []
  if (blacklist.includes(threadId)) {
    return false
  }

  return true
}

async function getReplyText(messageContent?: string, senderName?: string, threadId?: string): Promise<string> {
  const settings = await getBotSettingsAsync()
  
  console.log(`🤖 [AI Reply] Settings:`, {
    aiEnabled: settings.aiEnabled,
    aiTriggerMode: settings.aiTriggerMode,
    messageContent: messageContent?.substring(0, 50)
  })
  
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

  // Always force selfListen = true on both listener and context
  zaloApi.listener.selfListen = true
  if (zaloApi.ctx?.options) {
    zaloApi.ctx.options.selfListen = true
  }

  // Remove existing listeners to prevent duplicate or stale HMR callbacks
  zaloApi.listener.removeAllListeners('message')
  zaloApi.listener.removeAllListeners('undo')

  zaloApi.listener.on('undo', (undoData: any) => {
    
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
        markMessageUndone(mId, cId, tId)
      }
    }
  })

  zaloApi.listener.on('message', async (message: any) => {
    console.log('📨 [Listener] Received message:', {
      isSelf: message.isSelf,
      from: message.data?.uidFrom || message.from,
      content: message.data?.content || message.content,
      type: message.type
    })

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
      targetThreadId = String(message.data?.grid || message.threadId || '')
    } else {
      if (message.isSelf) {
        targetThreadId = String(message.data?.idTo || message.data?.to || message.idTo || message.to || senderId || '')
        if (ownId && (targetThreadId === ownId || targetThreadId === '0' || targetThreadId === 'undefined')) {
          targetThreadId = String(message.data?.idTo || message.idTo || senderId || '')
        }
      } else {
        targetThreadId = String(message.data?.uidFrom || message.from || message.uidFrom || senderId || '')
      }
    }

    if (!targetThreadId || targetThreadId === '0' || targetThreadId === 'undefined') {
      targetThreadId = senderId
    }

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
        (rawContent.name && /\.(mp4|avi|mov|pdf|doc|docx|xls|xlsx|ppt|pptx|zip|rar|txt|py|js|ts|json|csv)$/i.test(rawContent.name))
      ) {
        // File attachment - preserve file metadata (including videos, documents, archives, code files)
        const fileName = rawContent.fileName || rawContent.name || rawContent.title || 'File'
        const fileUrl = rawContent.fileUrl || rawContent.url || rawContent.href || rawContent.downloadUrl || ''
        const fileSize = rawContent.fileSize || rawContent.size || rawContent.fsize || 0
        
        rawContent = JSON.stringify({
          type: 'file',
          name: fileName,
          url: fileUrl,
          size: fileSize,
          caption: rawContent.caption || rawContent.description || '',
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

    // Perform auto-reply logic ONLY for incoming messages not sent by self
    console.log('🤖 [Auto-Reply Check]:', {
      isSelf: message.isSelf,
      threadId: targetThreadId,
      isGroup: isGroupMsg,
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
        
        const replyText = await getReplyText(textContent, senderName, targetThreadId)
        const threadTypeParam = isGroupMsg ? 1 : 0
        await zaloApi.sendMessage(
          { msg: replyText },
          targetThreadId,
          threadTypeParam
        )
        autoReplied = true
        messageData.replied = true
      } catch (err: any) {
        // Silent error - auto-reply failed
      }
    }

    try {
      const recordStatMessage = (global as any).recordStatMessage
      if (typeof recordStatMessage === 'function') {
        recordStatMessage(autoReplied, message.threadId)
      }
    } catch (e) {}

    broadcastMessage(messageData)
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
