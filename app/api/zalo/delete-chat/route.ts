import { NextResponse } from 'next/server'
import { getCurrentZaloApi } from '@/lib/multi-user-zalo'

/**
 * DELETE - Xóa hội thoại
 */
export async function DELETE(request: Request) {
  try {
    const zaloApi = await getCurrentZaloApi()
    if (!zaloApi) {
      return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
    }

    const { threadId } = await request.json()
    
    if (!threadId) {
      return NextResponse.json({ 
        error: 'Missing threadId' 
      }, { status: 400 })
    }

    console.log('🗑️ [Delete Chat] Deleting conversation:', threadId)

    // Delete chat
    const result = await zaloApi.deleteChat(threadId)
    
    console.log('✅ [Delete Chat] Result:', result)

    return NextResponse.json({ 
      success: true,
      threadId,
      result 
    })
  } catch (error: any) {
    console.error('❌ [Delete Chat] Error deleting conversation:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to delete conversation' 
    }, { status: 500 })
  }
}

/**
 * POST - Xóa hội thoại (alternative method for better compatibility)
 */
export async function POST(request: Request) {
  try {
    const zaloApi = await getCurrentZaloApi()
    if (!zaloApi) {
      return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
    }

    const { threadId } = await request.json()
    
    if (!threadId) {
      return NextResponse.json({ 
        error: 'Missing threadId' 
      }, { status: 400 })
    }

    console.log('🗑️ [Delete Chat] Deleting conversation:', threadId)

    // Delete chat
    const result = await zaloApi.deleteChat(threadId)
    
    console.log('✅ [Delete Chat] Result:', result)

    return NextResponse.json({ 
      success: true,
      threadId,
      result 
    })
  } catch (error: any) {
    console.error('❌ [Delete Chat] Error deleting conversation:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to delete conversation' 
    }, { status: 500 })
  }
}
