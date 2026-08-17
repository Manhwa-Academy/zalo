import fs from 'fs'
import { dataFilePath } from './data-dir'

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
  const exists = messageQueue.some(
    (m) =>
      (m.msgId && data.msgId && String(m.msgId) === String(data.msgId)) ||
      (m.cliMsgId && data.cliMsgId && String(m.cliMsgId) === String(data.cliMsgId)) ||
      (m.id && data.id && String(m.id) === String(data.id)) ||
      (m.content === data.content && String(m.threadId) === String(data.threadId) && Math.abs(new Date(m.timestamp).getTime() - new Date(data.timestamp).getTime()) < 5000)
  )

  if (exists) {
    console.log('⚠️ Skipping duplicate message broadcast:', data.id || data.msgId, data.content)
    return
  }

  messageQueue.push(data)
  saveStoredMessages()

  sseClients.forEach((client) => {
    try {
      client.controller.enqueue(`data: ${JSON.stringify(data)}\n\n`)
    } catch (e) {}
  })
}

export function markMessageUndone(msgId: string, cliMsgId: string, threadId: string) {
  const mIdStr = String(msgId || '')
  const cIdStr = String(cliMsgId || '')
  const tIdStr = String(threadId || '')

  console.log(`🔍 [markMessageUndone] Searching for message with:`)
  console.log(`   msgId: "${mIdStr}"`)
  console.log(`   cliMsgId: "${cIdStr}"`)
  console.log(`   threadId: "${tIdStr}"`)
  console.log(`   Total messages in queue: ${messageQueue.length}`)

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
      
      if (matches) {
        console.log(`✅ Found matching message:`, {
          id: m.id,
          msgId: m.msgId,
          cliMsgId: m.cliMsgId,
          content: String(m.content).slice(0, 100)
        })
      }
      return matches
    }
  )

  if (targetMsg) {
    console.log(`✅ [markMessageUndone] Found target message, marking as undone`)
    targetMsg.content = '🔄 Tin nhắn đã được thu hồi'
    targetMsg.isUndo = true
  } else {
    console.log(`⚠️ [markMessageUndone] Message not found by ID, trying to find latest message in thread "${tIdStr}"`)
    
    // Fallback: Find latest message in this thread (not just self messages)
    const threadMessages = messageQueue.filter((m) => String(m.threadId) === tIdStr)
    console.log(`   Found ${threadMessages.length} messages in this thread`)
    
    if (threadMessages.length > 0) {
      // Get the most recent message (last in array)
      targetMsg = threadMessages[threadMessages.length - 1]
      console.log(`✅ [markMessageUndone] Using latest message in thread:`, {
        id: targetMsg.id,
        content: String(targetMsg.content).slice(0, 100),
        timestamp: targetMsg.timestamp
      })
      targetMsg.content = '🔄 Tin nhắn đã được thu hồi'
      targetMsg.isUndo = true
    } else {
      console.log(`❌ [markMessageUndone] No messages found in thread "${tIdStr}"`)
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
    console.log(`📢 [markMessageUndone] Broadcasted undo message to ${sseClients.length} SSE clients`)
  } else {
    console.log(`❌ [markMessageUndone] Could not find any message to mark as undone`)
  }
}

export function addSseClient(controller: ReadableStreamDefaultController): number {
  const id = ++clientCounter
  
  // Limit max connections to 3 per user to prevent memory leak
  const MAX_CLIENTS = 3
  if (sseClients.length >= MAX_CLIENTS) {
    console.warn(`⚠️ [SSE] Max clients (${MAX_CLIENTS}) reached, removing oldest client`)
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

  console.log(`🔍 [SSE] New client connected (ID: ${id}), total clients: ${sseClients.length}`)
  return id
}

export function removeSseClient(id: number) {
  sseClients = sseClients.filter((c) => c.id !== id)
}

export function getStoredMessagesForThread(threadId: string): any[] {
  const tid = String(threadId)
  return messageQueue.filter((m) => String(m.threadId) === tid || String(m.from) === tid)
}

// Helper to get bot settings - returns default if not available
async function getBotSettingsAsync() {
  try {
    const { getCurrentBotSettings } = await import('./multi-user-zalo')
    return await getCurrentBotSettings()
  } catch (e) {
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
  
  // Check if AI is enabled
  if (settings.aiEnabled && messageContent) {
    const { generateAIReply, shouldUseAIReply, buildConversationHistory, detectPersonality } = await import('./ai-reply')
    
    // Check if we should use AI for this message
    const aiTriggerMode = settings.aiTriggerMode || 'smart'
    let useAI = false
    
    if (aiTriggerMode === 'always') {
      useAI = true
    } else if (aiTriggerMode === 'questions') {
      useAI = messageContent.includes('?')
    } else if (aiTriggerMode === 'smart') {
      useAI = shouldUseAIReply(messageContent)
    }
    
    if (useAI) {
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
          console.log(`🤖 [AI] Generated reply (${aiResult.tokensUsed} tokens): ${aiResult.reply.slice(0, 50)}...`)
          return aiResult.reply // ✅ RETURN IMMEDIATELY - Don't fallback to preset
        } else {
          console.warn(`⚠️ [AI] Failed, fallback to normal: ${aiResult.error}`)
          // Only fallback on error, continue to preset logic below
        }
      } catch (error) {
        console.error('❌ [AI] Error generating reply:', error)
        // Only fallback on error, continue to preset logic below
      }
    } else {
      console.log(`⚠️ [AI] Not triggered - mode: ${aiTriggerMode}, message: "${messageContent.slice(0, 50)}..."`)
    }
  }
  
  // Fallback to preset/normal message
  if (settings.useRandomPreset && Array.isArray(settings.presetMessages) && settings.presetMessages.length > 0) {
    const validPresets = settings.presetMessages.filter((msg) => msg && typeof msg === 'string' && msg.trim().length > 0)
    if (validPresets.length > 0) {
      const randomIndex = Math.floor(Math.random() * validPresets.length)
      return validPresets[randomIndex]
    }
  }
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

  console.log('🎧 Attaching message & undo listeners to zaloApi instance (selfListen = true)...')

  zaloApi.listener.on('undo', (undoData: any) => {
    console.log('↩️ Received undo event from Zalo:', JSON.stringify(undoData, null, 2))
    
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
      
      console.log(`🔄 Processing undo event:`)
      console.log(`   Original msgId (from content.globalMsgId): ${mId}`)
      console.log(`   Original cliMsgId (from content.cliMsgId): ${cId}`)
      console.log(`   ThreadId (from content.destId): ${tId}`)
      
      if (tId && (mId || cId)) {
        markMessageUndone(mId, cId, tId)
      } else {
        console.log(`⚠️ Could not extract message IDs from undo event`)
      }
    }
  })

  zaloApi.listener.on('message', async (message: any) => {
    console.log('📨 New message received:', JSON.stringify(message, null, 2))
    console.log('🔍 Content type:', typeof message.data?.content, 'Value:', message.data?.content)
    console.log('🔍 Message data:', JSON.stringify(message.data, null, 2))

    const senderId = String(message.data?.uidFrom || message.threadId || message.from || 'Unknown')
    let senderName = message.data?.dName || message.data?.displayName || message.fromName || ''
    let senderAvatar = message.data?.avatar || message.data?.avt || message.avatar || message.data?.avatarUrl || ''

    // If sender info is missing, try to fetch from getUserInfo API
    if ((!senderName || !senderAvatar) && typeof zaloApi.getUserInfo === 'function' && senderId !== 'Unknown') {
      try {
        console.log(`🔍 [Listener] Fetching user info for ${senderId}...`)
        const uInfoRes = await zaloApi.getUserInfo(senderId)
        const uData = uInfoRes?.data || uInfoRes?.[senderId] || uInfoRes
        if (uData) {
          if (!senderName) senderName = uData.displayName || uData.zaloName || uData.name || ''
          if (!senderAvatar) {
            senderAvatar = uData.avatar || uData.avatarUrl || uData.avt || uData.avatar_240 || uData.avatar_120 || uData.thumb || ''
          }
          console.log(`✅ [Listener] Got user info: ${senderName}, avatar: ${senderAvatar ? 'YES' : 'NO'}`)
        }
      } catch (e) {
        console.error(`❌ [Listener] Failed to get user info for ${senderId}:`, e)
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
        console.log(`🔗 [Listener] Parsed link preview: ${linkTitle} - ${linkUrl}`)
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
        console.log(`📎 [Listener] Parsed file attachment: ${fileName} (${fileSize} bytes)`)
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
      console.log(`🔍 [Listener] Detected media filename: "${rawContent}", checking cache...`)
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
        console.log(`⏰ Timestamp from Zalo (seconds): ${tsNum} → ${msgTimestamp} ms`)
      } else if (tsNum >= 10000000000) {
        // Timestamp is already in MILLISECONDS - use as-is
        msgTimestamp = tsNum
        console.log(`⏰ Timestamp from Zalo (milliseconds): ${msgTimestamp} ms`)
      } else {
        // Invalid timestamp - use current time
        msgTimestamp = Date.now()
        console.log(`⚠️ Invalid timestamp from Zalo: ${rawTs}, using current time`)
      }
    } else {
      msgTimestamp = Date.now()  // Fallback to current time
      console.log(`⚠️ No timestamp from Zalo, using current time`)
    }
    
    // Log the final timestamp for debugging
    console.log(`📅 Final timestamp: ${new Date(msgTimestamp).toISOString()} (${new Date(msgTimestamp).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })})`)

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
    }

    console.log('📥 [Listener] Message data prepared:', {
      id: messageData.id,
      msgId: messageData.msgId,
      cliMsgId: messageData.cliMsgId,
      globalMsgId: messageData.globalMsgId,
      from: messageData.from,
      fromName: messageData.fromName,
      avatar: messageData.avatar ? messageData.avatar.slice(0, 50) + '...' : 'NO AVATAR',
      isSelf: messageData.isSelf,
      contentPreview: String(messageData.content).slice(0, 50),
    })

    let autoReplied = false

    // Perform auto-reply logic ONLY for incoming messages not sent by self
    if (!message.isSelf && await shouldAutoReply(targetThreadId, isGroupMsg)) {
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
        console.log(`🤖 Auto-replying to thread ${targetThreadId} with: "${replyText}"...`)
        const threadTypeParam = isGroupMsg ? 1 : 0
        await zaloApi.sendMessage(
          { msg: replyText },
          targetThreadId,
          threadTypeParam
        )
        autoReplied = true
        messageData.replied = true
        console.log(`✅ Auto-reply sent to ${messageData.fromName} in thread ${targetThreadId}: "${replyText}"`)
      } catch (err: any) {
        console.error('❌ Failed to auto-reply:', err)
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
    console.log(`🔌 Listener closed (code: ${code}, reason: ${reason})`)
    
    // ONLY reconnect if closed unexpectedly (NOT normal closure 1000)
    // Code 1000 = NORMAL_CLOSURE (intentional close, don't reconnect)
    // Code 1006 = ABNORMAL_CLOSURE (unexpected disconnect, should reconnect)
    if (code && code !== 1000 && !isReconnecting) {
      console.log(`⚠️ Abnormal closure detected (code: ${code}), will reconnect in 3s...`)
      isReconnecting = true
      
      // Clear any existing reconnect timer
      if (reconnectTimer) {
        clearTimeout(reconnectTimer)
      }
      
      reconnectTimer = setTimeout(() => {
        try {
          // Check if listener is already running before attempting to start
          if (typeof zaloApi.listener.isRunning === 'function' && zaloApi.listener.isRunning()) {
            console.log('ℹ️ Listener is already running, no need to reconnect')
            isReconnecting = false
            reconnectTimer = null
            return
          }
          
          console.log('🔄 Reconnecting listener after abnormal closure...')
          zaloApi.listener.start({ retryOnClose: true })
          console.log('✅ Listener reconnected successfully')
          isReconnecting = false
          reconnectTimer = null
        } catch (e: any) {
          console.error('❌ Failed to reconnect listener:', e?.message || e)
          isReconnecting = false
          reconnectTimer = null
          
          // If "Already started", listener is actually fine
          if (e?.message?.includes('Already started') || e?.message?.includes('already')) {
            console.log('✅ Listener is already running (caught by error), no action needed')
          }
        }
      }, 3000)
    } else if (isReconnecting) {
      console.log('ℹ️ Reconnect already scheduled, skipping')
    } else {
      console.log('ℹ️ Normal closure (code 1000), no reconnect needed')
    }
  })

  zaloApi.listener.on('disconnected', (code: any, reason: any) => {
    console.log(`🔌 Listener disconnected (code: ${code}, reason: ${reason})`)
    
    // Don't reconnect here - let 'closed' event handle it to avoid duplicate reconnects
    if (code && code !== 1000) {
      console.log(`ℹ️ Abnormal disconnect (code: ${code}), waiting for 'closed' event to handle reconnect`)
    } else {
      console.log('ℹ️ Normal disconnect (code 1000), no action needed')
    }
  })

  try {
    zaloApi.listener.start({ retryOnClose: true })
    console.log('🚀 zaloApi.listener started successfully!')
  } catch (err: any) {
    if (err?.message?.includes('Already started') || err?.message?.includes('already')) {
      console.log('ℹ️ Listener is already active')
    } else {
      console.error('Failed to start listener:', err)
    }
  }
}
