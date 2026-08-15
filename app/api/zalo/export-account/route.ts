import { NextResponse } from 'next/server'
import { getCurrentZaloApi } from '@/lib/multi-user-zalo'

export async function POST() {
  try {
    // Get current Zalo API instance
    const zaloApi = await getCurrentZaloApi()
    
    if (!zaloApi) {
      return NextResponse.json(
        { error: 'Chưa đăng nhập Zalo. Vui lòng đăng nhập trước!' },
        { status: 401 }
      )
    }

    // Extract credentials from Zalo API context
    const ctx = zaloApi.getContext ? zaloApi.getContext() : null
    
    if (!ctx || !ctx.cookie) {
      return NextResponse.json(
        { error: 'Không tìm thấy thông tin session' },
        { status: 400 }
      )
    }

    // Serialize cookie data
    let cookieData = ctx.cookie
    if (typeof ctx.cookie.toJSON === 'function') {
      cookieData = ctx.cookie.toJSON()
    }

    // Prepare credentials for export
    const credentials = {
      imei: ctx.imei,
      cookie: cookieData,
      userAgent: ctx.userAgent,
      language: ctx.language || 'vi',
    }

    console.log('✅ [Export] Successfully exported Zalo credentials')

    return NextResponse.json({
      success: true,
      credentials,
      message: 'Xuất tài khoản thành công!'
    })
  } catch (error: any) {
    console.error('❌ [Export] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Lỗi khi xuất tài khoản' },
      { status: 500 }
    )
  }
}
