import { NextRequest, NextResponse } from 'next/server'
import { getCurrentZaloApi } from '@/lib/multi-user-zalo'

export const dynamic = 'force-dynamic'

/**
 * POST /api/zalo/block-user
 * Block a user
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

    const result = await zaloApi.blockUser(userId)
    
    return NextResponse.json({
      success: true,
      message: 'Đã chặn người dùng',
      data: result
    })
  } catch (error: any) {
    console.error('❌ Block user error:', error)
    return NextResponse.json(
      { error: error.message || 'Không thể chặn người dùng' },
      { status: 500 }
    )
  }
}
