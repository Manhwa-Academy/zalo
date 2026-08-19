import { NextResponse } from 'next/server'
import { getCurrentZaloApi } from '@/lib/multi-user-zalo'
import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

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
      
      // STEP 1: Check if this is a voice message with Cloudinary file
      let cloudinaryId: string | null = null
      try {
        const { getCurrentUserId, getCurrentZaloUserInfo } = await import('@/lib/multi-user-zalo')
        const { getThreadMessages } = await import('@/lib/messages-db')
        const userId = await getCurrentUserId()
        
        if (userId) {
          const messages = await getThreadMessages(userId, String(threadId), 1000)
          const message = messages.find(m => 
            m.msgId === String(messageId) || 
            m.cliMsgId === String(messageId)
          )
          
          if (message && message.content) {
            try {
              const content = typeof message.content === 'string' 
                ? JSON.parse(message.content) 
                : message.content
              
              if (content.type === 'voice' && content.cloudinaryId) {
                cloudinaryId = content.cloudinaryId
                console.log('🎤 Found voice message with Cloudinary ID:', cloudinaryId)
              }
            } catch (e) {
              // Not JSON, skip
            }
          }
        }
      } catch (dbError) {
        console.error('⚠️ Failed to check for Cloudinary file:', dbError)
        // Continue with deletion even if DB check fails
      }
      
      // STEP 2: Delete message via Zalo API
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
      
      // STEP 3: Delete from Cloudinary if it's a voice message
      if (cloudinaryId) {
        try {
          console.log('🗑️ Deleting voice file from Cloudinary:', cloudinaryId)
          const deleteResult = await cloudinary.uploader.destroy(cloudinaryId, {
            resource_type: 'video' // Voice files are stored as 'video' resource type
          })
          
          if (deleteResult.result === 'ok') {
            console.log('✅ Deleted voice file from Cloudinary successfully')
          } else {
            console.warn('⚠️ Cloudinary delete result:', deleteResult)
          }
        } catch (cloudinaryError) {
          console.error('❌ Failed to delete from Cloudinary:', cloudinaryError)
          // Don't fail the request, message is already deleted from Zalo
        }
      }
      
      // STEP 4: Delete from database
      try {
        const { getCurrentUserId } = await import('@/lib/multi-user-zalo')
        const { deleteMessageOnUndo } = await import('@/lib/messages-db')
        const userId = await getCurrentUserId()
        
        if (userId) {
          await deleteMessageOnUndo(userId, String(messageId))
        }
      } catch (dbError) {
        console.error('⚠️ Failed to delete from DB:', dbError)
        // Don't fail the request, message is already deleted from Zalo
      }

      return NextResponse.json({
        success: true,
        message: 'Đã xóa tin nhắn thành công!',
        cloudinaryDeleted: !!cloudinaryId
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
