import { NextRequest, NextResponse } from 'next/server'
import { getCurrentZaloApi } from '@/lib/multi-user-zalo'

export const dynamic = 'force-dynamic'

/**
 * POST /api/zalo/update-profile
 * Update user profile information
 */
export async function POST(req: NextRequest) {
  try {
    const zaloApi = await getCurrentZaloApi()
    if (!zaloApi) {
      return NextResponse.json({ error: 'Bạn chưa đăng nhập Zalo' }, { status: 401 })
    }

    const data = await req.json()
    
    console.log('📝 [Update Profile] Data:', data)
    
    const result = await zaloApi.updateProfile(data)
    
    return NextResponse.json({
      success: true,
      message: 'Đã cập nhật profile',
      data: result
    })
  } catch (error: any) {
    console.error('❌ Update profile error:', error)
    return NextResponse.json(
      { error: error.message || 'Không thể cập nhật profile' },
      { status: 500 }
    )
  }
}
