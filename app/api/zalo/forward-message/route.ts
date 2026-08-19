import { NextResponse } from 'next/server'
import { getCurrentZaloApi } from '@/lib/multi-user-zalo'

/**
 * POST - Forward tin nhắn
 * API: forwardMessage(messageId, threadId, type?)
 */
export async function POST(request: Request) {
  try {
    const zaloApi = await getCurrentZaloApi()
    if (!zaloApi) {
      return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
    }

    const { messageId, threadId, threadType } = await request.json()
    
    if (!messageId || !threadId) {
      return NextResponse.json({ 
        error: 'Missing messageId or threadId' 
      }, { status: 400 })
    }

    console.log('↪️ [Forward Message] Forwarding:', { messageId, threadId, threadType })

    // Forward message - API: forwardMessage(messageId, threadId, type?)
    const result = await zaloApi.forwardMessage(messageId, threadId, threadType || 0)
    
    console.log('✅ [Forward Message] Result:', result)

    return NextResponse.json({ 
      success: true,
      result 
    })
  } catch (error: any) {
    console.error('❌ [Forward Message] Error:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to forward message' 
    }, { status: 500 })
  }
}
