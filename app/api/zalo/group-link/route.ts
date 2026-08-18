import { NextRequest, NextResponse } from 'next/server'
import { getCurrentZaloApi } from '@/lib/multi-user-zalo'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, groupId } = body

    if (!groupId) {
      return NextResponse.json(
        { error: 'Thiếu groupId' },
        { status: 400 }
      )
    }

    const zaloApi = await getCurrentZaloApi()
    if (!zaloApi) {
      return NextResponse.json({ error: 'Chưa đăng nhập Zalo' }, { status: 401 })
    }

    // GET - Lấy thông tin link nhóm hiện tại
    if (action === 'get_link') {
      console.log('📤 Getting group link detail for:', groupId)
      
      const result = await zaloApi.getGroupLinkDetail(groupId)
      
      console.log('✅ Group link detail:', result)
      
      return NextResponse.json({
        success: true,
        data: {
          link: result.link || null,
          enabled: result.enabled === 1,
          expirationDate: result.expiration_date || null,
        },
      })
    }

    // ENABLE - Tạo/bật link mời nhóm
    if (action === 'enable_link') {
      console.log('📤 Enabling group link for:', groupId)
      
      const result = await zaloApi.enableGroupLink(groupId)
      
      console.log('✅ Group link enabled:', result)
      
      return NextResponse.json({
        success: true,
        data: {
          link: result.link,
          enabled: result.enabled === 1,
          expirationDate: result.expiration_date,
        },
      })
    }

    // DISABLE - Tắt link mời nhóm
    if (action === 'disable_link') {
      console.log('📤 Disabling group link for:', groupId)
      
      const result = await zaloApi.disableGroupLink(groupId)
      
      console.log('✅ Group link disabled:', result)
      
      return NextResponse.json({
        success: true,
        data: result,
      })
    }

    return NextResponse.json(
      { error: 'Action không hợp lệ. Sử dụng: get_link, enable_link, disable_link' },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('❌ Error managing group link:', error)
    return NextResponse.json(
      {
        error: 'Không thể quản lý link nhóm',
        details: error.message || String(error),
      },
      { status: 500 }
    )
  }
}
