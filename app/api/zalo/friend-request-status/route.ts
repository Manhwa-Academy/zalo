import { NextRequest, NextResponse } from 'next/server'
import { getCurrentZaloApi } from '@/lib/multi-user-zalo'

export const dynamic = 'force-dynamic'

/**
 * GET /api/zalo/friend-request-status?userId=xxx
 * Check friend request status with a user
 */
export async function GET(req: NextRequest) {
  try {
    const zaloApi = await getCurrentZaloApi()
    if (!zaloApi) {
      return NextResponse.json({ error: 'Bạn chưa đăng nhập Zalo' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: 'Thiếu userId' }, { status: 400 })
    }

    // Check if getFriendRequestStatus method exists
    if (typeof zaloApi.getFriendRequestStatus !== 'function') {
      return NextResponse.json({ 
        success: true,
        status: 'unknown',
        message: 'Không thể kiểm tra trạng thái'
      }, { status: 200 })
    }

    const result = await zaloApi.getFriendRequestStatus(userId)
    
    // Parse status
    let status = 'none' // none, pending, friends, blocked
    let message = ''
    
    if (result) {
      if (result.isFriend || result.status === 'friend') {
        status = 'friends'
        message = 'Đã là bạn bè'
      } else if (result.isPending || result.status === 'pending') {
        status = 'pending'
        message = 'Đã gửi lời mời kết bạn'
      } else if (result.isBlocked || result.status === 'blocked') {
        status = 'blocked'
        message = 'Đã chặn người dùng này'
      } else {
        status = 'none'
        message = 'Chưa kết bạn'
      }
    }
    
    return NextResponse.json({
      success: true,
      userId,
      status,
      message,
      data: result
    })
  } catch (error: any) {
    console.error('❌ Get friend request status error:', error)
    return NextResponse.json(
      { 
        error: error.message || 'Không thể kiểm tra trạng thái',
        status: 'error'
      },
      { status: 500 }
    )
  }
}
