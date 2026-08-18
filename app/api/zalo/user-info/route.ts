import { NextRequest, NextResponse } from 'next/server'
import { getCurrentZaloApi } from '@/lib/multi-user-zalo'

export const dynamic = 'force-dynamic'

/**
 * GET /api/zalo/user-info?userId=xxx
 * Fetch user information by userId
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: 'userId là bắt buộc' }, { status: 400 })
    }

    const zaloApi = await getCurrentZaloApi()
    if (!zaloApi) {
      return NextResponse.json({ error: 'Bạn chưa đăng nhập Zalo' }, { status: 401 })
    }

    console.log('👤 [User Info] Fetching info for userId:', userId)

    // Get user info from Zalo API
    const userInfoResponse = await zaloApi.getUserInfo(userId)
    
    console.log('👤 [User Info] Response:', userInfoResponse)
    
    // Extract user data - API can return in different formats
    let userData = null
    
    // Try different response formats
    if (userInfoResponse?.changed_profiles && userInfoResponse.changed_profiles[userId]) {
      // Format: { changed_profiles: { userId: {...} } }
      userData = userInfoResponse.changed_profiles[userId]
    } else if (userInfoResponse?.data?.changed_profiles && userInfoResponse.data.changed_profiles[userId]) {
      // Format: { data: { changed_profiles: { userId: {...} } } }
      userData = userInfoResponse.data.changed_profiles[userId]
    } else if (userInfoResponse?.data) {
      userData = userInfoResponse.data
    } else if (userInfoResponse?.[userId]) {
      userData = userInfoResponse[userId]
    } else if (userInfoResponse?.profile) {
      userData = userInfoResponse.profile
    } else {
      userData = userInfoResponse
    }
    
    if (!userData || typeof userData !== 'object') {
      return NextResponse.json(
        { error: 'Không tìm thấy thông tin người dùng' },
        { status: 404 }
      )
    }
    
    console.log('✅ [User Info] Extracted data:', userData)
    
    return NextResponse.json({
      success: true,
      userInfo: userData
    })
  } catch (error: any) {
    console.error('❌ Fetch user info error:', error)
    return NextResponse.json(
      { error: error.message || 'Không thể lấy thông tin người dùng' },
      { status: 500 }
    )
  }
}
