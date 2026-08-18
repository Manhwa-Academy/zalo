import { NextRequest, NextResponse } from 'next/server'
import { getCurrentZaloApi } from '@/lib/multi-user-zalo'

export const dynamic = 'force-dynamic'

/**
 * POST /api/zalo/change-avatar
 * Change account avatar
 */
export async function POST(req: NextRequest) {
  try {
    const zaloApi = await getCurrentZaloApi()
    if (!zaloApi) {
      return NextResponse.json({ error: 'Bạn chưa đăng nhập Zalo' }, { status: 401 })
    }

    const { avatar, filePath } = await req.json()
    
    if (!avatar && !filePath) {
      return NextResponse.json({ error: 'Thiếu avatar data' }, { status: 400 })
    }
    
    console.log('🖼️ [Change Avatar] Uploading avatar...')
    
    // avatar can be: base64 string, file path, or Buffer
    const result = await zaloApi.changeAccountAvatar(avatar || filePath)
    
    return NextResponse.json({
      success: true,
      message: 'Đã đổi ảnh đại diện',
      data: result
    })
  } catch (error: any) {
    console.error('❌ Change avatar error:', error)
    return NextResponse.json(
      { error: error.message || 'Không thể đổi ảnh đại diện' },
      { status: 500 }
    )
  }
}
