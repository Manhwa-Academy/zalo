import { NextRequest, NextResponse } from 'next/server'
import { getCurrentZaloApi } from '@/lib/multi-user-zalo'

export const dynamic = 'force-dynamic'

/**
 * GET /api/zalo/account-info
 * Fetch account information
 */
export async function GET(req: NextRequest) {
  try {
    const zaloApi = await getCurrentZaloApi()
    if (!zaloApi) {
      return NextResponse.json({ error: 'Bạn chưa đăng nhập Zalo' }, { status: 401 })
    }

    const accountInfo = await zaloApi.fetchAccountInfo()
    
    console.log('📋 [Account Info] Fetched:', accountInfo)
    
    // Extract profile data from response
    // API can return data in different formats: { profile: {...} } or direct {...}
    const profileData = accountInfo?.profile || accountInfo?.data?.profile || accountInfo
    
    return NextResponse.json({
      success: true,
      accountInfo: profileData
    })
  } catch (error: any) {
    console.error('❌ Fetch account info error:', error)
    return NextResponse.json(
      { error: error.message || 'Không thể lấy thông tin tài khoản' },
      { status: 500 }
    )
  }
}
