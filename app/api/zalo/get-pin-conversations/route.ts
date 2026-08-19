import { NextResponse } from 'next/server'
import { getCurrentZaloApi } from '@/lib/multi-user-zalo'

export const dynamic = 'force-dynamic'

/**
 * GET /api/zalo/get-pin-conversations
 * Get list of pinned conversations from Zalo server
 */
export async function GET(request: Request) {
  try {
    const zaloApi = await getCurrentZaloApi() as any
    
    if (!zaloApi) {
      return NextResponse.json({ error: 'Chưa đăng nhập Zalo' }, { status: 401 })
    }

    try {
      console.log('📌 Getting pinned conversations from Zalo...')
      
      // Call Zalo API to get pinned conversations
      const result = await zaloApi.getPinConversations()
      
      if (!result) {
        console.error('❌ Get pin conversations error: no result')
        return NextResponse.json({ 
          error: 'Không thể lấy danh sách ghim',
          conversations: [],
          version: 0
        }, { status: 500 })
      }

      console.log('✅ Got pinned conversations:', result)

      return NextResponse.json({
        success: true,
        conversations: result.conversations || [],
        version: result.version || 0
      })
    } catch (error: any) {
      console.error('❌ Get pin conversations error:', error)
      return NextResponse.json({ 
        error: 'Không thể lấy danh sách ghim',
        details: error.message,
        conversations: [],
        version: 0
      }, { status: 500 })
    }
  } catch (error: any) {
    console.error('❌ Get pin conversations API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
