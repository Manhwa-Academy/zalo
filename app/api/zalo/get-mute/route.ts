import { NextResponse } from 'next/server'
import { getCurrentZaloApi } from '@/lib/multi-user-zalo'

export const dynamic = 'force-dynamic'

/**
 * GET /api/zalo/get-mute
 * Get list of muted threads from Zalo server
 */
export async function GET(request: Request) {
  try {
    const zaloApi = await getCurrentZaloApi() as any
    
    if (!zaloApi) {
      return NextResponse.json({ error: 'Chưa đăng nhập Zalo' }, { status: 401 })
    }

    try {
      console.log('🔕 Getting muted threads from Zalo...')
      
      // Call Zalo API to get muted threads
      const result = await zaloApi.getMute()
      
      if (!result) {
        console.error('❌ Get mute error: no result')
        return NextResponse.json({ 
          error: 'Không thể lấy danh sách tắt thông báo',
          chatEntries: [],
          groupChatEntries: []
        }, { status: 500 })
      }

      console.log('✅ Got muted threads:', result)

      return NextResponse.json({
        success: true,
        chatEntries: result.chatEntries || [],
        groupChatEntries: result.groupChatEntries || []
      })
    } catch (error: any) {
      console.error('❌ Get mute error:', error)
      return NextResponse.json({ 
        error: 'Không thể lấy danh sách tắt thông báo',
        details: error.message,
        chatEntries: [],
        groupChatEntries: []
      }, { status: 500 })
    }
  } catch (error: any) {
    console.error('❌ Get mute API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
