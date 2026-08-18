import { NextRequest, NextResponse } from 'next/server'
import { getCurrentZaloApi } from '@/lib/multi-user-zalo'

/**
 * API Route: Get QR Code for Zalo User
 * GET /api/zalo/qr-code?userId=xxx
 * POST /api/zalo/qr-code { userId: string | string[] }
 */

export async function GET(req: NextRequest) {
  try {
    const api = await getCurrentZaloApi()
    if (!api) {
      return NextResponse.json(
        { error: 'Chưa đăng nhập Zalo' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    console.log('🔍 [Get QR] Request for userId:', userId || 'current user')

    // Get QR code
    const qrData = await api.getQR(userId || undefined)

    console.log('✅ [Get QR] Success:', Object.keys(qrData))

    return NextResponse.json({
      success: true,
      data: qrData
    })
  } catch (error: any) {
    console.error('❌ [Get QR] Error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Không thể lấy mã QR'
      },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const api = await getCurrentZaloApi()
    if (!api) {
      return NextResponse.json(
        { error: 'Chưa đăng nhập Zalo' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { userId } = body

    console.log('🔍 [Get QR] POST Request for userId:', userId || 'current user')

    // Get QR code
    const qrData = await api.getQR(userId || undefined)

    console.log('✅ [Get QR] Success:', Object.keys(qrData))

    return NextResponse.json({
      success: true,
      data: qrData
    })
  } catch (error: any) {
    console.error('❌ [Get QR] Error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Không thể lấy mã QR'
      },
      { status: 500 }
    )
  }
}
