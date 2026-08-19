import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * POST /api/bank/lookup-account
 * Lookup account name from bank account number using VietQR free API
 * 
 * Request body:
 * {
 *   bin: string (bank BIN code),
 *   accountNumber: string
 * }
 */
export async function POST(request: Request) {
  try {
    const { bin, accountNumber } = await request.json()

    if (!bin || !accountNumber) {
      return NextResponse.json({ 
        error: 'Thiếu bin hoặc accountNumber' 
      }, { status: 400 })
    }

    console.log('🔍 [Lookup API] Request:', { bin, accountNumber })

    // Lấy API credentials từ environment variables
    const clientId = process.env.VIETQR_CLIENT_ID
    const apiKey = process.env.VIETQR_API_KEY
    const endpoint = process.env.VIETQR_API_ENDPOINT || 'https://api.vietqr.io/v2/lookup'

    // Chuẩn bị headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    // Nếu có API key, thêm authentication headers
    if (clientId && apiKey) {
      console.log('🔐 [Lookup API] Using authenticated API with key:', clientId.substring(0, 10) + '...')
      headers['x-client-id'] = clientId
      headers['x-api-key'] = apiKey
    } else {
      console.log('🆓 [Lookup API] Using free API (no authentication)')
    }

    // Thử gọi API chính
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({ bin, accountNumber })
      })

      console.log(`📥 [Lookup API] Response status: ${response.status}`)

      if (!response.ok) {
        const errorText = await response.text()
        console.log(`❌ [Lookup API] Error response:`, errorText)
        throw new Error(`API returned ${response.status}: ${errorText}`)
      }

      const data = await response.json()
      console.log(`📥 [Lookup API] Response data:`, data)

      // Parse response theo format VietQR: { code: "00", data: { accountName: "..." } }
      if (data.code === '00' && data.data?.accountName) {
        return NextResponse.json({
          success: true,
          accountName: data.data.accountName
        })
      }

      // Parse response theo format alternative: { success: true, accountName: "..." }
      if (data.success && data.accountName) {
        return NextResponse.json({
          success: true,
          accountName: data.accountName
        })
      }

      // Không tìm thấy tên
      return NextResponse.json({
        success: false,
        error: data.desc || data.message || 'Không tìm thấy tên chủ tài khoản'
      }, { status: 404 })

    } catch (primaryError: any) {
      console.error(`❌ [Lookup API] Primary endpoint failed:`, primaryError.message)
      
      // Nếu có API key mà bị lỗi, có thể là hết quota hoặc key không hợp lệ
      if (clientId && apiKey) {
        console.warn('⚠️ [Lookup API] Authenticated API failed. API key may be invalid or quota exceeded.')
        return NextResponse.json({
          success: false,
          error: 'API key không hợp lệ hoặc đã hết quota. Vui lòng kiểm tra lại.'
        }, { status: 401 })
      }

      // Nếu đang dùng free API và bị lỗi, có thể do rate limit
      console.log('⚠️ [Lookup API] Free API may be rate limited. Consider upgrading to paid plan.')
      
      return NextResponse.json({
        success: false,
        error: 'API miễn phí có thể bị giới hạn. Vui lòng đăng ký API key để sử dụng ổn định hơn.'
      }, { status: 429 })
    }

  } catch (error: any) {
    console.error('❌ [Lookup API] Unexpected error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Lỗi không xác định' 
      },
      { status: 500 }
    )
  }
}
