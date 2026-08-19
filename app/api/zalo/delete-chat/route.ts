import { NextResponse } from 'next/server'
import { getCurrentZaloApi } from '@/lib/multi-user-zalo'

export const dynamic = 'force-dynamic'

/**
 * DELETE /api/zalo/delete-chat
 * Delete entire conversation (only visible to you, like "Delete conversation" in Zalo app)
 */
export async function POST(request: Request) {
  try {
    const zaloApi = await getCurrentZaloApi() as any
    
    if (!zaloApi) {
      return NextResponse.json({ error: 'Chưa đăng nhập Zalo' }, { status: 401 })
    }

    const { threadId, threadType } = await request.json()

    if (!threadId) {
      return NextResponse.json({ 
        error: 'Thiếu threadId' 
      }, { status: 400 })
    }

    try {
      console.log('🗑️ Deleting chat:', { threadId, threadType })
      
      // Call API to delete chat
      // Note: This deletes the chat only on your side (like "Delete conversation" on Zalo App)
      // Messages are not deleted from Zalo server
      const result = await zaloApi.deleteChat(
        String(threadId),
        threadType || 0 // 0 = User, 1 = Group
      )
      
      if (!result || result.error) {
        console.error('❌ Delete chat error:', result?.error)
        return NextResponse.json({ 
          error: 'Không thể xóa cuộc trò chuyện',
          details: result?.error 
        }, { status: 500 })
      }

      console.log('✅ Deleted chat successfully:', result)

      // ✅ Also delete all messages from database (all sessions)
      try {
        const deleteMessagesUrl = new URL('/api/zalo/delete-thread-messages', request.url)
        deleteMessagesUrl.searchParams.set('threadId', String(threadId))
        
        const deleteMessagesResponse = await fetch(deleteMessagesUrl.toString(), {
          method: 'DELETE',
          headers: request.headers,
        })
        
        if (deleteMessagesResponse.ok) {
          const deleteResult = await deleteMessagesResponse.json()
          console.log(`✅ Deleted ${deleteResult.deletedCount} messages from database (${deleteResult.scope})`)
        } else {
          console.warn('⚠️ Failed to delete messages from database')
        }
      } catch (dbError) {
        console.error('❌ Error deleting messages from database:', dbError)
        // Don't fail the request - chat is already deleted from Zalo
      }

      return NextResponse.json({
        success: true,
        message: 'Đã xóa cuộc trò chuyện thành công!'
      })
    } catch (error: any) {
      console.error('❌ Delete chat error:', error)
      return NextResponse.json({ 
        error: 'Không thể xóa cuộc trò chuyện',
        details: error.message 
      }, { status: 500 })
    }
  } catch (error: any) {
    console.error('❌ Delete chat API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
