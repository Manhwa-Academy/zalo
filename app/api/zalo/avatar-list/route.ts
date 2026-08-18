import { NextRequest, NextResponse } from 'next/server'
import { getCurrentZaloApi } from '@/lib/multi-user-zalo'

export const dynamic = 'force-dynamic'

/**
 * GET /api/zalo/avatar-list
 * Get list of avatars used before
 */
export async function GET(req: NextRequest) {
  try {
    const zaloApi = await getCurrentZaloApi()
    if (!zaloApi) {
      return NextResponse.json({ error: 'Bạn chưa đăng nhập Zalo' }, { status: 401 })
    }

    const avatarList = await zaloApi.getAvatarList()
    
    console.log('📋 [Avatar List] Fetched:', avatarList?.length || 0, 'avatars')
    
    // Parse avatar list
    const avatars = Array.isArray(avatarList) 
      ? avatarList 
      : (avatarList?.data ? (Array.isArray(avatarList.data) ? avatarList.data : Object.values(avatarList.data)) : [])
    
    return NextResponse.json({
      success: true,
      avatars: avatars.map((avatar: any) => ({
        id: avatar.id || avatar.avatarId || avatar.avt_id || '',
        url: avatar.url || avatar.avatar || avatar.src || '',
        thumbnail: avatar.thumbnail || avatar.thumb || avatar.url || '',
        createdTime: avatar.createdTime || avatar.time || avatar.created || 0,
        isUsing: avatar.isUsing || avatar.is_using || false
      })),
      count: avatars.length
    })
  } catch (error: any) {
    console.error('❌ Get avatar list error:', error)
    return NextResponse.json(
      { error: error.message || 'Không thể lấy danh sách avatar' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/zalo/avatar-list
 * Reuse or delete avatar
 */
export async function POST(req: NextRequest) {
  try {
    const zaloApi = await getCurrentZaloApi()
    if (!zaloApi) {
      return NextResponse.json({ error: 'Bạn chưa đăng nhập Zalo' }, { status: 401 })
    }

    const { action, avatarId } = await req.json()
    
    if (!avatarId) {
      return NextResponse.json({ error: 'Thiếu avatarId' }, { status: 400 })
    }
    
    if (action === 'reuse') {
      // Reuse old avatar
      console.log('🔄 [Avatar] Reusing avatar:', avatarId)
      const result = await zaloApi.reuseAvatar(avatarId)
      
      return NextResponse.json({
        success: true,
        message: 'Đã đổi sang avatar cũ',
        data: result
      })
    } else if (action === 'delete') {
      // Delete avatar
      console.log('🗑️ [Avatar] Deleting avatar:', avatarId)
      const result = await zaloApi.deleteAvatar(avatarId)
      
      return NextResponse.json({
        success: true,
        message: 'Đã xóa avatar',
        data: result
      })
    } else {
      return NextResponse.json({ error: 'Action không hợp lệ' }, { status: 400 })
    }
  } catch (error: any) {
    console.error('❌ Avatar action error:', error)
    return NextResponse.json(
      { error: error.message || 'Không thể thực hiện action' },
      { status: 500 }
    )
  }
}
