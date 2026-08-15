import { NextResponse } from 'next/server'
import { getCurrentZaloApi } from '@/lib/multi-user-zalo'
import { markMessageUndone } from '@/lib/zalo-listener-manager'

export async function POST(request: Request) {
  try {
    const { messageId, cliMsgId, threadId, threadType } = await request.json()

    if (!threadId) {
      return NextResponse.json({ error: 'Missing threadId' }, { status: 400 })
    }

    const zaloApi = await getCurrentZaloApi() as any

    if (!zaloApi) {
      return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
    }

    // Determine group vs user strictly based on threadType
    const isGroupDeclared = threadType === 'Group' || threadType === 1
    const mId = String(messageId || cliMsgId || '')
    const cId = String(cliMsgId || messageId || '')

    console.log(`🔄 [Undo API] Recalling message mId: "${mId}", cId: "${cId}" in thread: "${threadId}" (declaredGroup: ${isGroupDeclared})`)

    // Try primary declared mode first, then fallback to alternate mode if code 112/127 occurs
    const groupModes = isGroupDeclared ? [true, false] : [false, true]

    for (const isGroup of groupModes) {
      console.log(`🔄 [Undo API] Testing mode (isGroup: ${isGroup})...`)

      const attempts = [
        // Attempt 1: real cliMsgId + msgId
        { msgId: mId, cliMsgId: cId },
        // Attempt 2: msgId as both
        { msgId: mId, cliMsgId: mId },
        // Attempt 3: cliMsgId as both (if different)
        ...(cId !== mId ? [{ msgId: cId, cliMsgId: cId }] : []),
      ]

      for (let i = 0; i < attempts.length; i++) {
        const attemptPayload = attempts[i]
        try {
          console.log(`🔄 [Undo API] Attempt ${i + 1}/${attempts.length} (isGroup: ${isGroup}) via zaloApi.undo:`, attemptPayload)
          const res = await zaloApi.undo(
            attemptPayload,
            String(threadId),
            isGroup ? 1 : 0
          )
          console.log(`✅ [Undo API] Attempt ${i + 1} (isGroup: ${isGroup}) succeeded:`, res)
          markMessageUndone(mId, cId, String(threadId))
          return NextResponse.json({ success: true, result: res })
        } catch (err: any) {
          console.warn(`⚠️ [Undo API] Attempt ${i + 1} (isGroup: ${isGroup}) failed (code ${err?.code || 'ERR'}): ${err?.message}`)
        }
      }

      // Direct encrypted raw fallback for this group mode
      const ctx = typeof zaloApi.getContext === 'function' ? zaloApi.getContext() : (zaloApi.ctx || null)
      const utils = zaloApi.utils || null
      const zpwServiceMap = zaloApi.zpwServiceMap || zaloApi.api?.zpwServiceMap || null

      if (ctx && utils && zpwServiceMap) {
        const serviceHost = isGroup
          ? zpwServiceMap.group?.[0]
          : zpwServiceMap.chat?.[0]
        const endpoint = isGroup ? '/api/group/undomsg' : '/api/message/undo'
        const serviceURL = utils.makeURL(`${serviceHost}${endpoint}`)

        const rawPayloads = [
          { msgId: mId, cliMsgIdUndo: cId },
          { msgId: mId, cliMsgIdUndo: mId },
        ]

        for (let j = 0; j < rawPayloads.length; j++) {
          const rawP = rawPayloads[j]
          try {
            const params: Record<string, any> = {
              msgId: rawP.msgId,
              clientId: Date.now(),
              cliMsgIdUndo: rawP.cliMsgIdUndo,
              imei: ctx.imei,
            }
            if (isGroup) {
              params.grid = String(threadId)
              params.visibility = 0
            } else {
              params.toid = String(threadId)
            }

            console.log(`🔄 [Undo API] Raw Fallback Attempt ${j + 1} (isGroup: ${isGroup}):`, params)
            const encryptedParams = utils.encodeAES(JSON.stringify(params))
            if (encryptedParams) {
              const response = await utils.request(serviceURL, {
                method: 'POST',
                body: new URLSearchParams({ params: encryptedParams }),
              })
              const result = utils.resolve(response)
              console.log(`✅ [Undo API] Raw Fallback Attempt ${j + 1} (isGroup: ${isGroup}) succeeded:`, result)
              markMessageUndone(mId, cId, String(threadId))
              return NextResponse.json({ success: true, result })
            }
          } catch (rawErr: any) {
            console.warn(`⚠️ [Undo API] Raw Fallback Attempt ${j + 1} (isGroup: ${isGroup}) failed:`, rawErr?.message)
          }
        }
      }
    }

    return NextResponse.json(
      { error: 'Không thể thu hồi tin nhắn trên Zalo. Tin nhắn có thể đã quá 24 giờ hoặc không do bạn gửi.' },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('❌ [Undo API] Final Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to undo message on Zalo server' },
      { status: 500 }
    )
  }
}
