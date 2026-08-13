import { getBotSettings } from './bot-settings'
import { recordStatMessage } from './bot-stats'

export const messageQueue: any[] = []
export const sseClients: any[] = []
export const knownGroups = new Map<string, any>()

export function broadcastMessage(data: any) {
  messageQueue.push(data)
  if (messageQueue.length > 100) messageQueue.shift()

  sseClients.forEach((client) => {
    try {
      client.controller.enqueue(`data: ${JSON.stringify(data)}\n\n`)
    } catch (e) {}
  })
}

function shouldAutoReply(message: any, settings: any): boolean {
  if (!settings.enabled || !settings.autoReplyMessage?.trim()) return false
  if (message.isSelf) return false

  const threadId = String(message.threadId)
  const isGroup = message.type === 1 || message.type === 'Group'
  const scope = settings.replyScope || 'all'
  const whitelist: string[] = settings.whitelist || []
  const blacklist: string[] = settings.blacklist || []

  // Blacklist check
  if (blacklist.includes(threadId)) {
    console.log(`🚫 Thread ${threadId} is in blacklist. Skipping auto-reply.`)
    return false
  }

  if (scope === 'user_only') {
    if (isGroup) {
      console.log(`ℹ️ Scope is user_only, skipping group thread ${threadId}`)
      return false
    }
    return true
  }

  if (scope === 'group_only') {
    if (!isGroup) {
      console.log(`ℹ️ Scope is group_only, skipping non-group thread ${threadId}`)
      return false
    }
    if (Array.isArray(whitelist) && whitelist.length > 0) {
      const allowed = whitelist.includes(threadId)
      if (!allowed) {
        console.log(`🚫 Group ${threadId} is NOT checked in whitelist (${whitelist.join(', ')}). Skipping auto-reply.`)
      }
      return allowed
    }
    return true
  }

  if (scope === 'whitelist') {
    if (!Array.isArray(whitelist) || whitelist.length === 0) {
      console.log(`🚫 Scope is whitelist, but zero groups checked. Skipping auto-reply.`)
      return false
    }
    const allowed = whitelist.includes(threadId)
    if (!allowed) {
      console.log(`🚫 Group ${threadId} is NOT checked in whitelist. Skipping auto-reply.`)
    }
    return allowed
  }

  return true
}

export function attachListenerToApi(zaloApi: any) {
  if (!zaloApi || !zaloApi.listener) return

  if (zaloApi.__listenerAttached__) {
    console.log('ℹ️ Listener already attached to this zaloApi instance')
    return
  }
  zaloApi.__listenerAttached__ = true

  console.log('🎧 Attaching message listener to zaloApi instance...')

  zaloApi.listener.on('message', async (message: any) => {
    console.log('📨 New message received:', JSON.stringify(message, null, 2))

    const senderId = String(message.data?.uidFrom || message.threadId || message.from || 'Unknown')
    let senderName = message.data?.dName || message.fromName || ''

    if (!senderName && typeof zaloApi.getUserInfo === 'function' && senderId !== 'Unknown') {
      try {
        const uInfo = await zaloApi.getUserInfo(senderId)
        const uObj = uInfo?.data || uInfo
        if (uObj) {
          senderName = uObj[senderId]?.displayName || uObj[senderId]?.name || uObj.displayName || uObj.name || ''
        }
      } catch (e) {}
    }

    if (!senderName) {
      senderName = message.isSelf ? 'Bạn (Chính mình)' : `Người dùng (${senderId.slice(-4)})`
    }

    let contentStr = '[Media/Sticker]'
    if (typeof message.data?.content === 'string') {
      contentStr = message.data.content
    } else if (typeof message.content === 'string') {
      contentStr = message.content
    } else if (message.data?.content?.title) {
      contentStr = message.data.content.title
    }

    const settings = getBotSettings()
    let autoReplied = false

    const isGroupMsg = message.type === 1 || message.type === 'Group'
    if (isGroupMsg) {
      const gId = String(message.threadId)
      knownGroups.set(gId, {
        id: gId,
        name: message.data?.gName || message.gName || knownGroups.get(gId)?.name || `Nhóm ${gId}`,
        totalMember: message.data?.totalMember || message.totalMember || knownGroups.get(gId)?.totalMember || 0,
      })
    }

    const messageData = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      from: senderId,
      fromName: senderName,
      content: contentStr,
      type: isGroupMsg ? 'Group' : 'User',
      threadId: String(message.threadId),
      replied: false,
      isSelf: !!message.isSelf,
    }

    const canReply = shouldAutoReply(message, settings)

    if (canReply) {
      try {
        console.log(`🤖 Auto-replying to thread ${message.threadId}...`)
        await zaloApi.sendMessage(
          { msg: settings.autoReplyMessage },
          message.threadId,
          message.type
        )
        autoReplied = true
        messageData.replied = true
        console.log(`✅ Auto-reply sent to ${messageData.fromName}: "${settings.autoReplyMessage}"`)
      } catch (err: any) {
        console.error('❌ Failed to auto-reply:', err)
      }
    } else if (message.isSelf) {
      console.log('🙈 Ignored auto-reply because message is sent by self')
    }

    try {
      recordStatMessage(autoReplied, message.threadId)
    } catch (e) {}

    broadcastMessage(messageData)
  })

  zaloApi.listener.on('error', (error: any) => {
    console.error('Listener error:', error)
  })

  zaloApi.listener.on('closed', (code: any, reason: any) => {
    console.log(`🔌 Listener closed (code: ${code}, reason: ${reason})`)
  })

  zaloApi.listener.on('disconnected', (code: any, reason: any) => {
    console.log(`🔌 Listener disconnected (code: ${code}, reason: ${reason})`)
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
