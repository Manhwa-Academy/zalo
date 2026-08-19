import { NextResponse } from 'next/server'
import { getCurrentZaloApi } from '@/lib/multi-user-zalo'

export const dynamic = 'force-dynamic'

/**
 * POST /api/zalo/send-card
 * Send contact card (business card) to a conversation
 * 
 * Request body:
 * {
 *   threadId: string,
 *   threadType: 'User' | 'Group' (default: 'User'),
 *   userId: string (ID of the user to share card of),
 *   phoneNumber?: string (phone number, optional),
 *   ttl?: number (time to live, optional)
 * }
 */
export async function POST(request: Request) {
  try {
    const zaloApi = await getCurrentZaloApi() as any
    
    if (!zaloApi) {
      return NextResponse.json({ error: 'Chưa đăng nhập Zalo' }, { status: 401 })
    }

    const { threadId, threadType, userId, phoneNumber, ttl } = await request.json()

    if (!threadId || !userId) {
      return NextResponse.json({ 
        error: 'Thiếu threadId hoặc userId' 
      }, { status: 400 })
    }

    try {
      console.log('📇 Sending contact card:', { threadId, threadType, userId, phoneNumber, ttl })
      
      // Build options
      const options: any = {
        userId
      }
      
      if (phoneNumber) options.phoneNumber = phoneNumber
      if (ttl) options.ttl = ttl
      
      // Map threadType to Zalo ThreadType (0 = User, 1 = Group)
      const type = threadType === 'Group' ? 1 : 0
      
      // Call Zalo API to send contact card
      const result = await zaloApi.sendCard(options, threadId, type)
      
      console.log('✅ Contact card sent:', result)

      return NextResponse.json({
        success: true,
        message: 'Đã gửi danh thiếp',
        msgId: result?.msgId,
        result
      })
    } catch (error: any) {
      console.error('❌ Send card error:', error)
      return NextResponse.json({ 
        error: 'Không thể gửi danh thiếp',
        details: error.message 
      }, { status: 500 })
    }
  } catch (error: any) {
    console.error('❌ Send card API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
