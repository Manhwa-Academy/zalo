import { NextResponse } from 'next/server'
import { getCurrentZaloApi } from '@/lib/multi-user-zalo'

export const dynamic = 'force-dynamic'

/**
 * POST /api/zalo/send-bank-card
 * Send bank card information to a conversation
 * 
 * Request body:
 * {
 *   threadId: string,
 *   threadType: 'User' | 'Group' (default: 'User'),
 *   binBank: string (bank code, e.g., 'Techcombank', 'Vietcombank'),
 *   numAccBank: string (account number),
 *   nameAccBank?: string (account holder name, optional)
 * }
 */
export async function POST(request: Request) {
  try {
    const zaloApi = await getCurrentZaloApi() as any
    
    if (!zaloApi) {
      return NextResponse.json({ error: 'Chưa đăng nhập Zalo' }, { status: 401 })
    }

    const { threadId, threadType, binBank, numAccBank, nameAccBank } = await request.json()

    if (!threadId || !binBank || !numAccBank) {
      return NextResponse.json({ 
        error: 'Thiếu threadId, binBank hoặc numAccBank' 
      }, { status: 400 })
    }

    try {
      console.log('💳 Sending bank card:', { threadId, threadType, binBank, numAccBank, nameAccBank })
      
      // Build payload
      const payload = {
        binBank,
        numAccBank,
        ...(nameAccBank && { nameAccBank })
      }
      
      // Map threadType to Zalo ThreadType (0 = User, 1 = Group)
      const type = threadType === 'Group' ? 1 : 0
      
      // Call Zalo API to send bank card
      const result = await zaloApi.sendBankCard(payload, threadId, type)
      
      console.log('✅ Bank card sent:', result)

      return NextResponse.json({
        success: true,
        message: 'Đã gửi thông tin thẻ ngân hàng',
        result
      })
    } catch (error: any) {
      console.error('❌ Send bank card error:', error)
      return NextResponse.json({ 
        error: 'Không thể gửi thông tin thẻ ngân hàng',
        details: error.message 
      }, { status: 500 })
    }
  } catch (error: any) {
    console.error('❌ Send bank card API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
