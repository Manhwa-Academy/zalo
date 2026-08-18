import { NextRequest, NextResponse } from 'next/server'
import { getCurrentZaloApi } from '@/lib/multi-user-zalo'

export const dynamic = 'force-dynamic'

/**
 * POST /api/zalo/accept-friend-request
 * Accept a friend request
 */
export async function POST(req: NextRequest) {
  try {
    const zaloApi = await getCurrentZaloApi()
    if (!zaloApi) {
      return NextResponse.json({ error: 'Bạn chưa đăng nhập Zalo' }, { status: 401 })
    }

    const { userId } = await req.json()
    
    if (!userId) {
      return NextResponse.json({ error: 'Thiếu userId' }, { status: 400 })
    }

    const result = await zaloApi.acceptFriendRequest(userId)
    
    return NextResponse.json({
      success: true,
      message: 'Đã chấp nhận lời mời kết bạn',
      data: result
    })
  } catch (error: any) {
    console.error('❌ Accept friend request error:', error)
    return NextResponse.json(
      { error: error.message || 'Không thể chấp nhận lời mời kết bạn' },
      { status: 500 }
    )
  }
}
