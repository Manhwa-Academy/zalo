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

  // Try multiple matching strategies
  let targetMsg = messageQueue.find(
    (m) => {
      // Log each message being checked for debugging
      const matches = 
        (mIdStr && m.msgId && String(m.msgId) === mIdStr) ||
        (cIdStr && m.cliMsgId && String(m.cliMsgId) === cIdStr) ||
        (mIdStr && m.id && String(m.id) === mIdStr) ||
        (cIdStr && m.id && String(m.id) === cIdStr) ||
        // Try matching globalMsgId field too
        (mIdStr && (m as any).globalMsgId && String((m as any).globalMsgId) === mIdStr)
      
      if (matches) {
        console.log(`✅ Found matching message:`, m)
      }
      return matches
    }
  )

  if (targetMsg) {
    console.log(`✅ [markMessageUndone] Found target message by ID, marking as undone`)
    targetMsg.content = '🔄 Tin nhắn đã được thu hồi'
    targetMsg.isUndo = true
  } else {
    console.log(`⚠️ [markMessageUndone] Message not found by ID, trying to find latest self message in thread "${tIdStr}"`)
    
    // If not found in queue, update latest self message in that thread
    const threadMessages = messageQueue.filter((m) => String(m.threadId) === tIdStr && m.isSelf)
    console.log(`   Found ${threadMessages.length} self messages in this thread`)
    
    if (threadMessages.length > 0) {
      targetMsg = threadMessages[threadMessages.length - 1]
      console.log(`✅ [markMessageUndone] Using latest self message:`, targetMsg)
      targetMsg.content = '🔄 Tin nhắn đã được thu hồi'
      targetMsg.isUndo = true
    } else {
      console.log(`❌ [markMessageUndone] No self messages found in thread "${tIdStr}"`)
    }
  }

  saveStoredMessages()

  if (targetMsg) {
    // Broadcast the updated message preserving isSelf and sender info
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

async function getReplyText(): Promise<string> {
  const settings = await getBotSettingsAsync()
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
      const mId = String(event?.globalDelMsgId || event?.msgId || event?.data?.msgId || '')
      const cId = String(event?.clientDelMsgId || event?.cliMsgId || event?.data?.cliMsgId || '')
      const tId = String(event?.destId || event?.threadId || event?.grid || event?.data?.threadId || event?.uidTo || '')
      
      if (tId) {
        console.log(`🔄 Processing undo: msgId=${mId}, cliMsgId=${cId}, threadId=${tId}`)
        markMessageUndone(mId, cId, tId)
      }
    }
  })

  zaloApi.listener.on('message', async (message: any) => {
    console.log('📨 New message received:', JSON.stringify(message, null, 2))
    console.log('🔍 Content type:', typeof message.data?.content, 'Value:', message.data?.content)
    console.log('🔍 Message data:', JSON.stringify(message.data, null, 2))

    const senderId = String(message.data?.uidFrom || message.threadId || message.from || 'Unknown')
    let senderName = message.data?.dName || message.fromName || ''
    let senderAvatar = message.data?.avatar || message.data?.avt || message.avatar || ''

    if ((!senderName || !senderAvatar) && typeof zaloApi.getUserInfo === 'function' && senderId !== 'Unknown') {
      try {
        const uInfoRes = await zaloApi.getUserInfo(senderId)
        const uData = uInfoRes?.data || uInfoRes?.[senderId] || uInfoRes
        if (uData) {
          if (!senderName) senderName = uData.displayName || uData.zaloName || uData.name || ''
          if (!senderAvatar) senderAvatar = uData.avatar || uData.avatarUrl || uData.avt || ''
        }
      } catch (e) {}
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
      } else if (rawContent.type === 'image' || rawContent.photoUrl || rawContent.imageUrl || rawContent.href || rawContent.thumb || rawContent.url) {
        // Image/GIF content - preserve URL
        const imgUrl = rawContent.url || rawContent.href || rawContent.thumb || rawContent.photoUrl || rawContent.imageUrl || rawContent.hdUrl || ''
        const imgName = rawContent.name || rawContent.fileName || ''
        rawContent = JSON.stringify({
          type: 'image',
          name: imgName,
          url: imgUrl,
          caption: rawContent.caption || rawContent.description || '',
        })
      } else if (rawContent.type === 'file' || rawContent.fileName || rawContent.fileUrl || rawContent.fileSize) {
        // File attachment - preserve file metadata
        const fileName = rawContent.fileName || rawContent.name || 'File'
        const fileUrl = rawContent.fileUrl || rawContent.url || rawContent.href || ''
        const fileSize = rawContent.fileSize || rawContent.size || 0
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
      isSelf: messageData.isSelf,
      contentPreview: String(messageData.content).slice(0, 50),
    })

    let autoReplied = false

    // Perform auto-reply logic ONLY for incoming messages not sent by self
    if (!message.isSelf && await shouldAutoReply(targetThreadId, isGroupMsg)) {
      try {
        const replyText = await getReplyText()
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

  zaloApi.listener.on('closed', (code: any, reason: any) => {
    console.log(`🔌 Listener closed (code: ${code}, reason: ${reason})`)
    
    // ONLY reconnect if closed unexpectedly (NOT normal closure 1000)
    // Code 1000 = NORMAL_CLOSURE (intentional close, don't reconnect)
    // Code 1006 = ABNORMAL_CLOSURE (unexpected disconnect, should reconnect)
    if (code && code !== 1000) {
      console.log(`⚠️ Abnormal closure detected (code: ${code}), will reconnect in 3s...`)
      setTimeout(() => {
        try {
          if (zaloApi?.listener && !zaloApi.listener.isRunning?.()) {
            console.log('🔄 Reconnecting listener after abnormal closure...')
            zaloApi.listener.start({ retryOnClose: true })
          }
        } catch (e) {
          console.error('❌ Failed to reconnect listener:', e)
        }
      }, 3000)
    } else {
      console.log('ℹ️ Normal closure (code 1000), no reconnect needed')
    }
  })

  zaloApi.listener.on('disconnected', (code: any, reason: any) => {
    console.log(`🔌 Listener disconnected (code: ${code}, reason: ${reason})`)
    
    // ONLY reconnect if disconnected unexpectedly (NOT normal closure 1000)
    if (code && code !== 1000) {
      console.log(`⚠️ Abnormal disconnect detected (code: ${code}), will reconnect in 3s...`)
      setTimeout(() => {
        try {
          if (zaloApi?.listener && !zaloApi.listener.isRunning?.()) {
            console.log('🔄 Reconnecting listener after abnormal disconnect...')
            zaloApi.listener.start({ retryOnClose: true })
          }
        } catch (e) {
          console.error('❌ Failed to reconnect listener:', e)
        }
      }, 3000)
    } else {
      console.log('ℹ️ Normal disconnect (code 1000), no reconnect needed')
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
