import { NextRequest, NextResponse } from 'next/server'
import { getCurrentZaloApi } from '@/lib/multi-user-zalo'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, threadId, threadType, messages } = body

    const zaloApi = await getCurrentZaloApi()
    if (!zaloApi) {
      return NextResponse.json({ error: 'Chưa đăng nhập Zalo' }, { status: 401 })
    }

    // SEND_TYPING - Gửi trạng thái đang nhập
    if (action === 'send_typing') {
      if (!threadId) {
        return NextResponse.json(
          { error: 'Thiếu threadId' },
          { status: 400 }
        )
      }

      const type = threadType === 'Group' || threadType === 1 ? 1 : 0

      console.log('⌨️ Sending typing event:', { threadId, type })

      const result = await zaloApi.sendTypingEvent(threadId, type)

      console.log('✅ Typing event sent:', result)

      return NextResponse.json({
        success: true,
        data: result,
      })
    }

    // SEND_SEEN - Đánh dấu đã xem tin nhắn
    if (action === 'send_seen') {
      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return NextResponse.json(
          { error: 'Thiếu messages array' },
          { status: 400 }
        )
      }

      const type = threadType === 'Group' || threadType === 1 ? 1 : 0

      console.log('👁️ Sending seen event for', messages.length, 'messages')

      const result = await zaloApi.sendSeenEvent(messages, type)

      console.log('✅ Seen event sent:', result)

      return NextResponse.json({
        success: true,
        data: result,
      })
    }

    return NextResponse.json(
      { error: 'Action không hợp lệ. Sử dụng: send_typing, send_seen' },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('❌ Error sending typing/seen event:', error)
    return NextResponse.json(
      {
        error: 'Không thể gửi event',
        details: error.message || String(error),
      },
      { status: 500 }
    )
  }
}
