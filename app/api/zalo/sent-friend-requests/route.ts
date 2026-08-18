import { NextRequest, NextResponse } from 'next/server'
import { getCurrentZaloApi } from '@/lib/multi-user-zalo'

export const dynamic = 'force-dynamic'

/**
 * GET /api/zalo/sent-friend-requests
 * Get list of sent friend requests
 */
export async function GET(req: NextRequest) {
  try {
    const zaloApi = await getCurrentZaloApi()
    if (!zaloApi) {
      return NextResponse.json({ error: 'Bạn chưa đăng nhập Zalo' }, { status: 401 })
    }

    const result = await zaloApi.getSentFriendRequest()
    
    // Convert object to array for easier frontend handling
    const requests = Object.entries(result || {}).map(([userId, info]: [string, any]) => ({
      userId,
      zaloName: info.zaloName || '',
      displayName: info.displayName || '',
      avatar: info.avatar || '',
      message: info.fReqInfo?.message || '',
      time: info.fReqInfo?.time || 0,
    }))
    
    return NextResponse.json({
      success: true,
      requests,
      count: requests.length
    })
  } catch (error: any) {
    console.error('❌ Get sent friend requests error:', error)
    return NextResponse.json(
      { error: error.message || 'Không thể lấy danh sách lời mời đã gửi' },
      { status: 500 }
    )
  }
}
