import { NextResponse } from 'next/server'
import { getCurrentZaloApi } from '@/lib/multi-user-zalo'
import { getStoredMessagesForThread } from '@/lib/zalo-listener-manager'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const threadId = searchParams.get('threadId')
    const type = searchParams.get('type') // 'Group' | 'User'

    if (!threadId) {
      return NextResponse.json({ error: 'Missing threadId' }, { status: 400 })
    }

    const zaloApi = await getCurrentZaloApi() as any
    if (!zaloApi) {
      return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
    }

    const memberAvatars: Record<string, { name: string; avatar: string }> = {}
    const memberMap = new Map<string, { id: string; name: string; avatar: string }>()

    // 1. If Group, try fetching group info
    if (type === 'Group') {
      try {
        let rawGInfo: any = null
        if (zaloApi.ctx && zaloApi.utils && zaloApi.api?.zpwServiceMap?.group?.[0]) {
          const serviceURL = zaloApi.utils.makeURL(`${zaloApi.api.zpwServiceMap.group[0]}/api/group/getmg-v2`)
          const params = { gridVerMap: JSON.stringify({ [threadId]: -1 }) }
          const encryptedParams = zaloApi.utils.encodeAES(JSON.stringify(params))
          if (encryptedParams) {
            const response = await zaloApi.utils.request(serviceURL, {
              method: 'POST',
              body: new URLSearchParams({ params: encryptedParams }),
            })
            rawGInfo = zaloApi.utils.resolve(response)
          }
        }
        if (!rawGInfo?.gridInfoMap?.[threadId] && typeof zaloApi.getGroupInfo === 'function') {
          rawGInfo = await zaloApi.getGroupInfo(threadId)
        }

        const gridInfoMap = rawGInfo?.gridInfoMap || rawGInfo?.data?.gridInfoMap || {}
        const groupObj = gridInfoMap[threadId] || gridInfoMap[String(threadId)] || Object.values(gridInfoMap)[0] || rawGInfo

        if (groupObj) {
          const mems = groupObj.memInfo || groupObj.members || groupObj.memMap || groupObj.mem_info || groupObj.memberList || []
          const processMem = (m: any, fallbackId?: string) => {
            const uid = String(m.id || m.uid || m.userId || fallbackId || '')
            const name = m.dName || m.displayName || m.name || m.zaloName || ''
            const avatar = m.avatar || m.avatarUrl || m.avt || m.avatar_120 || m.avatar_240 || m.thumb || m.avatar_0 || ''
            if (uid && uid !== 'undefined' && uid !== '0') {
              memberAvatars[uid] = { name, avatar }
              memberMap.set(uid, { id: uid, name, avatar })
            }
          }

          if (Array.isArray(mems)) {
            mems.forEach((m: any) => processMem(m))
          } else if (typeof mems === 'object' && mems !== null) {
            Object.keys(mems).forEach((uid) => processMem(mems[uid], uid))
          }
        }
      } catch (e: any) {
        // Silent error - getGroupInfo failed
      }
    }

    // 2. Get locally stored persistent messages for this thread
    const localMsgs = getStoredMessagesForThread(threadId)
    let fetchedMsgs: any[] = []

    // 3. Fetch API history from Zalo
    if (type === 'Group' && typeof zaloApi.getGroupChatHistory === 'function') {
      // GROUP CHAT HISTORY
      try {
        const res = await zaloApi.getGroupChatHistory(threadId, 100) // Tăng từ 50 → 100
        const groupMsgs = res?.groupMsgs || res?.data?.groupMsgs || []

        fetchedMsgs = groupMsgs.map((m: any) => {
          const raw = m.data || m
          let contentStr = ''

          // Parse content properly for stickers, images, files
          if (raw.content && typeof raw.content === 'object') {
            // Sticker
            if (raw.content.catId || raw.content.cateId || raw.content.id || raw.content.type === 'sticker') {
              const catId = raw.content.catId || raw.content.cateId || 1
              const stkId = raw.content.id || raw.content.stickerId || raw.content.stkId || '10065'
              // Use Zalo API endpoint for stickers instead of static CDN
              const stkUrl = `https://zalo-api.zadn.vn/api/emoticon/sticker/webpc?eid=${stkId}&size=130&version=1`
              contentStr = JSON.stringify({
                type: 'sticker',
                id: stkId,
                catId: catId,
                url: stkUrl,
              })
            }
            // Image/Photo
            else if (raw.content.type === 'image' || raw.content.photoUrl || raw.content.imageUrl || raw.content.href || raw.content.thumb || raw.content.url) {
              const imgUrl = raw.content.url || raw.content.href || raw.content.thumb || raw.content.photoUrl || raw.content.imageUrl || ''
              const imgName = raw.content.name || raw.content.fileName || ''
              
              // Check if this is actually a video/file by extension
              const hasFileExtension = /\.(mp4|avi|mov|pdf|doc|docx|xls|xlsx|ppt|pptx|zip|rar|txt|py|js|ts|json|csv|mkv|flv|wmv|mp3|wav|ogg)$/i.test(imgName)
              
              if (hasFileExtension) {
                // This is actually a file, not an image
                contentStr = JSON.stringify({
                  type: 'file',
                  name: imgName,
                  size: raw.content.fileSize || raw.content.size || 0,
                  url: imgUrl,
                  caption: raw.content.caption || raw.content.description || '',
                })
              } else {
                // This is an image/GIF
                // Try to extract Giphy ID if this is a Giphy GIF filename
                let giphyId = raw.content.giphyId || ''
                if (!giphyId && imgName && imgName.startsWith('giphy_')) {
                  giphyId = imgName.replace('giphy_', '').replace(/\.(gif|png|jpe?g|webp)$/i, '')
                }
                
                contentStr = JSON.stringify({
                  type: 'image',
                  name: imgName,
                  url: imgUrl,
                  caption: raw.content.caption || raw.content.description || '',
                  giphyId: giphyId, // Preserve Giphy ID for cache lookup
                })
              }
            }
            // File attachment
            else if (
              raw.content.type === 'file' || 
              raw.content.type === 'video' ||
              raw.content.fileName ||
              raw.content.fileUrl ||
              raw.content.fileSize ||
              (raw.content.name && /\.(mp4|avi|mov|pdf|doc|docx|xls|xlsx|ppt|pptx|zip|rar|txt|py|js|ts|json|csv)$/i.test(raw.content.name))
            ) {
              contentStr = JSON.stringify({
                type: 'file',
                name: raw.content.fileName || raw.content.name || 'File',
                size: raw.content.fileSize || raw.content.size || 0,
                url: raw.content.fileUrl || raw.content.url || '',
                caption: raw.content.caption || raw.content.description || '',
              })
              console.log(`📎 [History] Parsed file attachment: ${raw.content.fileName || raw.content.name} (${raw.content.fileSize || raw.content.size || 0} bytes)`)
            }
            // Generic content
            else {
              contentStr = raw.content.title || raw.content.description || raw.content.msg || '[Nội dung/Media]'
            }
          } else if (typeof raw.content === 'string') {
            contentStr = raw.content
          } else if (typeof raw.msg === 'string') {
            contentStr = raw.msg
          } else {
            contentStr = '[Media/Sticker]'
          }

          const uidFrom = String(raw.uidFrom || raw.from || '')
          const memInfo = memberAvatars[uidFrom]

          const senderName = raw.dName || raw.displayName || memInfo?.name || (m.isSelf ? 'Bạn (Chính mình)' : `Thành viên (${uidFrom.slice(-4)})`)
          const senderAvatar = raw.avatar || raw.avt || memInfo?.avatar || ''

          if (uidFrom && uidFrom !== 'Unknown') {
            if (!memberMap.has(uidFrom)) {
              memberMap.set(uidFrom, { id: uidFrom, name: senderName, avatar: senderAvatar })
            }
            if (!memberAvatars[uidFrom]) {
              memberAvatars[uidFrom] = { name: senderName, avatar: senderAvatar }
            }
          }

          let timestampStr = new Date().toISOString()
          if (raw.ts) {
            const numTs = Number(raw.ts)
            timestampStr = numTs > 100000000000 ? new Date(numTs).toISOString() : new Date(numTs * 1000).toISOString()
          }

          // Parse quote/reply data if present
          let quote: any = undefined
          if (raw.quote || raw.replyTo || raw.refMsg) {
            const quoteData = raw.quote || raw.replyTo || raw.refMsg
            quote = {
              id: quoteData.msgId || quoteData.id || quoteData.cliMsgId,
              msgId: quoteData.msgId || quoteData.id,
              fromName: quoteData.fromName || quoteData.dName || 'Người dùng',
              content: typeof quoteData.content === 'string' 
                ? quoteData.content 
                : (quoteData.msg || quoteData.message || '[Media]')
            }
          }

          return {
            id: raw.msgId || raw.cliMsgId || (Date.now() + Math.random()),
            msgId: raw.msgId || raw.cliMsgId,
            cliMsgId: raw.cliMsgId || raw.msgId || raw.cliMsgIdUndo,
            threadId: String(threadId),
            from: uidFrom,
            fromName: senderName,
            avatar: senderAvatar,
            content: contentStr,
            timestamp: timestampStr,
            type: 'Group',
            isSelf: !!m.isSelf,
            quote: quote,
          }
        })
      } catch (err: any) {
        // Silent error - getGroupChatHistory failed
      }
    } else if (type === 'User' && typeof zaloApi.getChatHistory === 'function') {
      // USER (1-1) CHAT HISTORY
      try {
        const res = await zaloApi.getChatHistory(threadId, 100, 0) // Tăng từ 50 → 100
        const userMsgs = res?.data || res?.messages || []

        fetchedMsgs = userMsgs.map((m: any) => {
          const raw = m.data || m
          let contentStr = ''

          // Parse content properly for stickers, images, files
          if (raw.content && typeof raw.content === 'object') {
            // Sticker
            if (raw.content.catId || raw.content.cateId || raw.content.id || raw.content.type === 'sticker') {
              const catId = raw.content.catId || raw.content.cateId || 1
              const stkId = raw.content.id || raw.content.stickerId || raw.content.stkId || '10065'
              const stkUrl = `https://zalo-api.zadn.vn/api/emoticon/sticker/webpc?eid=${stkId}&size=130&version=1`
              
              let giphyId = ''
              if (raw.content.name && raw.content.name.startsWith('giphy_')) {
                giphyId = raw.content.name.replace('giphy_', '').replace(/\.(gif|png|jpe?g|webp)$/i, '')
              }
              
              contentStr = JSON.stringify({
                type: 'sticker',
                id: stkId,
                catId: catId,
                url: stkUrl,
              })
            }
            // Image/Photo
            else if (raw.content.type === 'image' || raw.content.photoUrl || raw.content.imageUrl || raw.content.href || raw.content.thumb || raw.content.url) {
              const imgUrl = raw.content.url || raw.content.href || raw.content.thumb || raw.content.photoUrl || raw.content.imageUrl || ''
              const imgName = raw.content.name || raw.content.fileName || ''
              
              // Check if this is actually a video/file by extension
              const hasFileExtension = /\.(mp4|avi|mov|pdf|doc|docx|xls|xlsx|ppt|pptx|zip|rar|txt|py|js|ts|json|csv|mkv|flv|wmv|mp3|wav|ogg)$/i.test(imgName)
              
              if (hasFileExtension) {
                // This is actually a file, not an image
                contentStr = JSON.stringify({
                  type: 'file',
                  name: imgName,
                  size: raw.content.fileSize || raw.content.size || 0,
                  url: imgUrl,
                  caption: raw.content.caption || raw.content.description || '',
                })
              } else {
                // This is an image/GIF
                let giphyId = ''
                if (imgName && imgName.startsWith('giphy_')) {
                  giphyId = imgName.replace('giphy_', '').replace(/\.(gif|png|jpe?g|webp)$/i, '')
                }
                
                contentStr = JSON.stringify({
                  type: 'image',
                  name: imgName,
                  url: imgUrl,
                  caption: raw.content.caption || raw.content.description || '',
                  giphyId: giphyId,
                })
              }
            }
            // File attachment
            else if (
              raw.content.type === 'file' || 
              raw.content.type === 'video' ||
              raw.content.fileName ||
              raw.content.fileUrl ||
              raw.content.fileSize ||
              (raw.content.name && /\.(mp4|avi|mov|pdf|doc|docx|xls|xlsx|ppt|pptx|zip|rar|txt|py|js|ts|json|csv)$/i.test(raw.content.name))
            ) {
              contentStr = JSON.stringify({
                type: 'file',
                name: raw.content.fileName || raw.content.name || 'File',
                size: raw.content.fileSize || raw.content.size || 0,
                url: raw.content.fileUrl || raw.content.url || '',
                caption: raw.content.caption || raw.content.description || '',
              })
              console.log(`📎 [History] Parsed file attachment: ${raw.content.fileName || raw.content.name} (${raw.content.fileSize || raw.content.size || 0} bytes)`)
            }
            // Generic content
            else {
              contentStr = raw.content.title || raw.content.description || raw.content.msg || '[Nội dung/Media]'
            }
          } else if (typeof raw.content === 'string') {
            contentStr = raw.content
          } else if (typeof raw.msg === 'string') {
            contentStr = raw.msg
          } else {
            contentStr = '[Media/Sticker]'
          }

          const uidFrom = String(raw.uidFrom || raw.from || raw.fromId || '')
          const senderName = raw.dName || raw.displayName || raw.fromName || (m.isSelf ? 'Bạn (Chính mình)' : `Người dùng (${uidFrom.slice(-4)})`)
          const senderAvatar = raw.avatar || raw.avt || raw.avatarUrl || ''

          let timestampStr = new Date().toISOString()
          if (raw.ts) {
            const numTs = Number(raw.ts)
            timestampStr = numTs > 100000000000 ? new Date(numTs).toISOString() : new Date(numTs * 1000).toISOString()
          }

          // Parse quote/reply data if present
          let quote: any = undefined
          if (raw.quote || raw.replyTo || raw.refMsg) {
            const quoteData = raw.quote || raw.replyTo || raw.refMsg
            quote = {
              id: quoteData.msgId || quoteData.id || quoteData.cliMsgId,
              msgId: quoteData.msgId || quoteData.id,
              fromName: quoteData.fromName || quoteData.dName || 'Người dùng',
              content: typeof quoteData.content === 'string' 
                ? quoteData.content 
                : (quoteData.msg || quoteData.message || '[Media]')
            }
          }

          return {
            id: raw.msgId || raw.cliMsgId || (Date.now() + Math.random()),
            msgId: raw.msgId || raw.cliMsgId,
            cliMsgId: raw.cliMsgId || raw.msgId,
            threadId: String(threadId),
            from: uidFrom,
            fromName: senderName,
            avatar: senderAvatar,
            content: contentStr,
            timestamp: timestampStr,
            type: 'User',
            isSelf: !!m.isSelf,
            quote: quote,
          }
        })
      } catch (err: any) {
        // Silent error - getChatHistory failed
      }
    }

    // 4. Merge local persistent messages with fetched history & deduplicate
    const combinedMap = new Map<string | number, any>()
    fetchedMsgs.forEach((m) => combinedMap.set(m.id, m))
    localMsgs.forEach((m) => {
      if (m.from && m.fromName && !memberMap.has(m.from)) {
        memberMap.set(m.from, { id: m.from, name: m.fromName, avatar: m.avatar || '' })
      }
      const key = m.id || `${m.timestamp}_${m.content}`
      combinedMap.set(key, m)
    })

    const finalMessages = Array.from(combinedMap.values())

    // 5. Batch fetch missing avatars for all senders & members using getUserInfo
    const uidsMissingAvatars = new Set<string>()
    memberMap.forEach((m, uid) => {
      if (!m.avatar) {
        uidsMissingAvatars.add(uid)
      }
    })

    if (uidsMissingAvatars.size > 0 && typeof zaloApi.getUserInfo === 'function') {
      try {
        const batch = Array.from(uidsMissingAvatars).slice(0, 30)
        const uRes = await zaloApi.getUserInfo(batch)
        const uData = uRes?.data || uRes?.changed_profiles || uRes
        if (uData && typeof uData === 'object') {
          batch.forEach((uid) => {
            const rawKey = uid.endsWith('_0') ? uid : `${uid}_0`
            const userItem = uData[uid] || uData[rawKey] || uData[uid.replace('_0', '')]
            if (userItem) {
              const avt = userItem.avatar || userItem.avatar_240 || userItem.avatar_120 || userItem.avt || ''
              const name = userItem.displayName || userItem.name || userItem.zaloName || ''
              if (avt) {
                const existing = memberMap.get(uid)
                if (existing) {
                  existing.avatar = avt
                  if (name) existing.name = name
                }
                memberAvatars[uid] = { name: name || existing?.name || '', avatar: avt }
              }
            }
          })
        }
      } catch (e: any) {
        // Silent error - getUserInfo failed
      }
    }

    // Attach resolved avatars back to finalMessages
    finalMessages.forEach((m) => {
      const resolved = memberMap.get(m.from) || memberAvatars[m.from]
      if (resolved?.avatar) {
        m.avatar = resolved.avatar
      }
      if (resolved?.name && (m.fromName.startsWith('Thành viên') || !m.fromName)) {
        m.fromName = resolved.name
      }
    })

    finalMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

    const membersList = Array.from(memberMap.values())
    const avatarDict: Record<string, string> = {}

    membersList.forEach((m) => {
      if (m.avatar) {
        avatarDict[m.id] = m.avatar
        if (m.name) avatarDict[m.name] = m.avatar
      }
    })

    return NextResponse.json({
      success: true,
      messages: finalMessages,
      members: membersList,
      memberAvatars: avatarDict,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
