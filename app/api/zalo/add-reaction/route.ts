import { NextRequest, NextResponse } from 'next/server'
import { getCurrentZaloApi } from '@/lib/multi-user-zalo'
import { Reactions } from 'zca-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { messageId, cliMsgId, threadId, threadType, icon } = body

    // Validate required fields
    if (!messageId || !threadId || !threadType) {
      return NextResponse.json(
        { error: 'Thiếu thông tin bắt buộc: messageId, threadId, threadType' },
        { status: 400 }
      )
    }

    // Get Zalo API instance
    const zaloApi = await getCurrentZaloApi()
    if (!zaloApi) {
      return NextResponse.json({ error: 'Chưa đăng nhập Zalo' }, { status: 401 })
    }

    // Convert thread type to enum
    const type = threadType === 'Group' || threadType === 1 ? 1 : 0

    // Prepare destination object
    const destination = {
      data: {
        msgId: String(messageId),
        cliMsgId: String(cliMsgId || messageId),
      },
      threadId: String(threadId),
      type: type as 0 | 1,
    }

    // Map icon string to Reactions enum
    let reactionIcon: Reactions = icon as Reactions
    
    // If icon is not provided, remove reaction (empty icon)
    if (!icon) {
      reactionIcon = Reactions.NONE
    }

    console.log('📤 Adding reaction:', {
      messageId,
      threadId,
      threadType: type === 1 ? 'Group' : 'User',
      icon: reactionIcon,
    })

    // Call zca-js API
    const result = await zaloApi.addReaction(reactionIcon, destination)

    console.log('✅ Reaction added successfully:', result)

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error: any) {
    console.error('❌ Error adding reaction:', error)
    return NextResponse.json(
      {
        error: 'Không thể thêm reaction',
        details: error.message || String(error),
      },
      { status: 500 }
    )
  }
}
