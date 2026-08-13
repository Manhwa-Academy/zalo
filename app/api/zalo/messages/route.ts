import { NextResponse } from 'next/server'
import { getZaloApi } from '@/lib/zalo-instance'

export async function POST(request: Request) {
  try {
    const { threadId, message, threadType } = await request.json()
    
    const zaloApi = getZaloApi()
    
    if (!zaloApi) {
      return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
    }
    
    await zaloApi.sendMessage(
      { msg: message },
      threadId,
      threadType
    )
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Send message error:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to send message' 
    }, { status: 500 })
  }
}
