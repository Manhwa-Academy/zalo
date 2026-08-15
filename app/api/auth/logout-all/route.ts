import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { AuthManager } from '@/lib/auth-manager'

/**
 * POST /api/auth/logout-all
 * Logout all devices for the authenticated user
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const authToken = cookieStore.get('auth_token')

    if (!authToken?.value) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // If no database, just clear cookie (backward compatibility)
    if (!process.env.DATABASE_URL) {
      cookieStore.delete('auth_token')
      
      return NextResponse.json({
        success: true,
        message: 'Đã đăng xuất thành công',
        note: 'Hệ thống auth hiện tại chưa hỗ trợ tracking multi-device sessions.',
      })
    }

    // Validate session and get user
    const validation = await AuthManager.validateSession(authToken.value)

    if (!validation.valid || !validation.user) {
      cookieStore.delete('auth_token')
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      )
    }

    // Logout all sessions for this user
    const loggedOutCount = await AuthManager.logoutAllSessions(validation.user.id)

    // Log the action
    const ipAddress = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown'
    const userAgent = request.headers.get('user-agent') || undefined

    await AuthManager.logAuthEvent(
      validation.user.id,
      'logout_all',
      ipAddress,
      userAgent,
      {},
      true
    )

    // Clear current cookie
    cookieStore.delete('auth_token')

    console.log(`🚫 [Auth] Logged out ${loggedOutCount} device(s) for user: ${validation.user.username}`)

    return NextResponse.json({
      success: true,
      message: `Đã đăng xuất ${loggedOutCount} thiết bị thành công`,
      devicesLoggedOut: loggedOutCount,
    })
  } catch (error: any) {
    console.error('❌ [Auth] Logout all devices error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to logout' },
      { status: 500 }
    )
  }
}
