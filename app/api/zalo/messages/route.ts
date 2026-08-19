import { NextResponse } from 'next/server'
import { getCurrentZaloApi, getCurrentUserId } from '@/lib/multi-user-zalo'
import { broadcastMessage } from '@/lib/zalo-listener-manager'
import { imageMetadataGetter } from '@/lib/image-metadata-getter'
import { saveMediaToCache } from '@/lib/media-cache-db'
import fs from 'fs'
import path from 'path'
import os from 'os'

export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId()
    const userIdOrNull = userId || null
    
    let threadId = ''
    let message = ''
    let threadType = 0
    let sticker: any = null
    let filePaths: string[] = []
    let fileInfo: any = null
    let explicitFileName: string = '' // NEW: Explicit filename from form
    let giphyId: string = '' // NEW: Giphy ID for caching
    let quote: any = null // NEW: Quote/reply data

    const contentType = request.headers.get('content-type') || ''
    
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      threadId = (formData.get('threadId') as string) || ''
      message = (formData.get('message') as string) || ''
      threadType = Number(formData.get('threadType') || 0)
      explicitFileName = (formData.get('fileName') as string) || '' // NEW
      giphyId = (formData.get('giphyId') as string) || '' // NEW: Get Giphy ID from form
      
      const quoteRaw = formData.get('quote') as string
      if (quoteRaw) {
        try { quote = JSON.parse(quoteRaw) } catch (e) {}
      }
      
      const stickerRaw = formData.get('sticker') as string
      if (stickerRaw) {
        try { sticker = JSON.parse(stickerRaw) } catch (e) {}
      }

      const file = formData.get('file') as File | null
      if (file && file.size > 0) {
        const tempDir = os.tmpdir()
        const safeName = (explicitFileName || file.name).replace(/[^a-zA-Z0-9._-]/g, '_')
        const filePath = path.join(tempDir, `zalo_upload_${Date.now()}_${safeName}`)
        const arrayBuffer = await file.arrayBuffer()
        fs.writeFileSync(filePath, Buffer.from(arrayBuffer))
        filePaths.push(filePath)
        fileInfo = {
          name: explicitFileName || file.name, // Use explicit filename
          size: file.size,
          type: file.type,
        }
      }
    } else {
      const body = await request.json().catch(() => ({}))
      threadId = body.threadId || ''
      message = body.message || ''
      threadType = Number(body.threadType || 0)
      sticker = body.sticker || null
      quote = body.quote || null
    }

    if (!threadId) {
      return NextResponse.json({ error: 'Missing threadId' }, { status: 400 })
    }

    const zaloApi = await getCurrentZaloApi() as any
    if (!zaloApi) {
      return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
    }

    // 🆕 Get Zalo user ID for multi-device sync
    const zaloUserId = typeof zaloApi.getOwnId === 'function' 
      ? String(zaloApi.getOwnId()) 
      : ''
    console.log('🔑 [Messages] Zalo User ID:', zaloUserId)

    // Ensure imageMetadataGetter is injected into active zaloApi context
    const ctx = typeof zaloApi.getContext === 'function' ? zaloApi.getContext() : (zaloApi.ctx || zaloApi.context)
    if (ctx) {
      if (!ctx.options) ctx.options = {}
      ctx.options.imageMetadataGetter = imageMetadataGetter
    }
    if (zaloApi.ctx) {
      if (!zaloApi.ctx.options) zaloApi.ctx.options = {}
      zaloApi.ctx.options.imageMetadataGetter = imageMetadataGetter
    }

    let sendRes: any = null

    // 1. Send Sticker
    if (sticker && typeof zaloApi.sendSticker === 'function') {
      const cateId = Number(sticker.cateId || sticker.catId || 1)
      const id = String(sticker.id)
      const stkType = Number(sticker.type || 1)
      sendRes = await zaloApi.sendSticker(
        { id, cateId, type: stkType },
        threadId,
        threadType
      )
    } 
    // 2. Send Attachment (Image or File)
    else if (filePaths.length > 0 && typeof zaloApi.sendMessage === 'function') {
      sendRes = await zaloApi.sendMessage(
        { msg: message, attachments: filePaths },
        threadId,
        threadType
      )
    } 
    // 3. Send Text Message
    else {
      // 🆕 Check if message contains URL and parse link preview
      const urlRegex = /(https?:\/\/[^\s]+)/gi
      const urls = message.match(urlRegex)
      
      if (urls && urls.length > 0 && typeof zaloApi.parseLink === 'function') {
        try {
          console.log(`🔗 [Send Message] Detected URL, parsing link preview: ${urls[0]}`)
          const linkData = await zaloApi.parseLink(urls[0])
          
          if (linkData?.data) {
            console.log(`✅ [Send Message] Link preview parsed:`, {
              title: linkData.data.title?.slice(0, 50),
              thumb: linkData.data.thumb?.slice(0, 50)
            })
            
            // Send message with link preview data
            sendRes = await zaloApi.sendMessage(
              {
                msg: message,
                quote: quote,
                linkData: linkData.data // Include parsed link preview
              },
              threadId,
              threadType
            )
          } else {
            // Fallback: Send as normal text if parse failed
            console.warn(`⚠️ [Send Message] Link parse failed, sending as text`)
            sendRes = await zaloApi.sendMessage(
              { msg: message, quote: quote },
              threadId,
              threadType
            )
          }
        } catch (error) {
          console.error(`❌ [Send Message] Link parse error:`, error)
          // Fallback: Send as normal text
          sendRes = await zaloApi.sendMessage(
            { msg: message, quote: quote },
            threadId,
            threadType
          )
        }
      } else {
        // Normal text message (no URL detected)
        sendRes = await zaloApi.sendMessage(
          { msg: message, quote: quote },
          threadId,
          threadType
        )
      }
    }

    const rawMsgData = sendRes?.message?.data || sendRes?.message || sendRes?.data || sendRes || {}
    const msgId = rawMsgData.msgId || rawMsgData.globalMsgId || rawMsgData.globalId || Date.now()
    const cliMsgId = rawMsgData.cliMsgId || rawMsgData.clientId || rawMsgData.clientMsgId || Date.now()
    const globalMsgId = rawMsgData.globalMsgId || rawMsgData.msgId || msgId

    console.log('📤 [Send Message] API Response:', {
      msgId,
      cliMsgId,
      globalMsgId,
      rawMsgData: JSON.stringify(rawMsgData).slice(0, 200),
    })

    // Determine message content format for frontend SSE broadcast
    let sentContent: any = message
    if (sticker) {
      const cateId = sticker.cateId || sticker.catId || 1
      const stkId = sticker.id
      const stkUrl = sticker.url || `https://stk.zaloapp.com/static/stickers/${cateId}/${stkId}.png`
      sentContent = JSON.stringify({
        type: 'sticker',
        id: stkId,
        catId: cateId,
        url: stkUrl,
      })
    } else if (fileInfo) {
      // Get URL from response if available
      const uploadedUrl = rawMsgData?.href || rawMsgData?.url || rawMsgData?.thumb || ''
      
      if (fileInfo.type.startsWith('image/')) {
        // For Giphy GIFs and images, save to database cache
        let finalUrl = uploadedUrl
        
        // Extract Giphy ID from filename if not provided
        if (!giphyId && fileInfo.name && fileInfo.name.startsWith('giphy_')) {
          giphyId = fileInfo.name.replace('giphy_', '').replace(/\.(gif|png|jpe?g|webp)$/i, '')
        }
        
        sentContent = JSON.stringify({
          type: 'image',
          name: fileInfo.name, // Always include filename
          caption: message,
          url: finalUrl,
          giphyId: giphyId || undefined,
        })
        
        // Save to database cache (works for both Giphy and regular images)
        if (finalUrl && fileInfo.name) {
          await saveMediaToCache(
            userIdOrNull,
            fileInfo.name,
            finalUrl,
            fileInfo.name.endsWith('.gif') ? 'gif' : 'image',
            giphyId || undefined
          )
          console.log(`💾 [Messages] Saved to DB cache: ${fileInfo.name} (Giphy ID: ${giphyId || 'N/A'})`)
        }
      } else {
        sentContent = JSON.stringify({
          type: 'file',
          name: fileInfo.name,
          size: fileInfo.size,
          caption: message,
        })
      }
    }

    const sentMsg = {
      id: msgId,
      msgId: String(msgId),
      cliMsgId: String(cliMsgId),
      globalMsgId: String(globalMsgId),
      timestamp: new Date().toISOString(),
      from: 'Self',
      fromName: 'Bạn (Chính mình)',
      content: sentContent,
      type: threadType === 1 ? 'Group' : 'User',
      threadId: String(threadId),
      replied: false,
      isSelf: true,
      quote: quote || undefined, // Add quote data if present
    }

    // 🆕 Pass zaloUserId for multi-device sync
    broadcastMessage(sentMsg, zaloUserId)

    console.log('📢 [Send Message] Broadcasting message to SSE clients:', {
      id: sentMsg.id,
      msgId: sentMsg.msgId,
      cliMsgId: sentMsg.cliMsgId,
      globalMsgId: sentMsg.globalMsgId,
      contentPreview: String(sentMsg.content).slice(0, 50),
    })

    // Clean up temporary upload files
    filePaths.forEach((p) => {
      try { if (fs.existsSync(p)) fs.unlinkSync(p) } catch (e) {}
    })

    return NextResponse.json({ success: true, message: sentMsg })
  } catch (error: any) {
    console.error('Send message error:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to send message' 
    }, { status: 500 })
  }
}
