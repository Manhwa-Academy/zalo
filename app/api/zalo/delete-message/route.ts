import { NextResponse } from 'next/server'
import { getCurrentZaloApi } from '@/lib/multi-user-zalo'

export const dynamic = 'force-dynamic'

// POST /api/zalo/delete-message - Delete message on client side (only visible to you)
export async function POST(request: Request) {
  try {
    const zaloApi = await getCurrentZaloApi() as any
    
    if (!zaloApi) {
      return NextResponse.json({ error: 'Chưa đăng nhập Zalo' }, { status: 401 })
    }

    const { messageId, threadId, threadType } = await request.json()

    if (!messageId || !threadId) {
      return NextResponse.json({ 
        error: 'Thiếu messageId hoặc threadId' 
      }, { status: 400 })
    }

    try {
      console.log('🗑️ Deleting message:', { messageId, threadId, threadType })
      
      // Call API to delete message
      // Note: This deletes message only on your side (like "Delete for me" on Zalo App)
      const result = await zaloApi.deleteMessage(
        String(messageId),
        String(threadId),
        threadType || 0 // 0 = User, 1 = Group
      )
      
      if (!result || result.error) {
        console.error('❌ Delete message error:', result?.error)
        return NextResponse.json({ 
          error: 'Không thể xóa tin nhắn',
          details: result?.error 
        }, { status: 500 })
      }

      console.log('✅ Deleted message successfully:', result)

      return NextResponse.json({
        success: true,
        message: 'Đã xóa tin nhắn thành công!'
      })
    } catch (error: any) {
      console.error('❌ Delete message error:', error)
      return NextResponse.json({ 
        error: 'Không thể xóa tin nhắn',
        details: error.message 
      }, { status: 500 })
    }
  } catch (error: any) {
    console.error('❌ Delete message API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
