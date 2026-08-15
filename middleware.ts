import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Cho phép /api/health không cần auth (cho cronjob ping)
  if (pathname === '/api/health') {
    return NextResponse.next()
  }

  // Cho phép /api/auth/* (login/logout/check)
  if (pathname.startsWith('/api/auth/')) {
    return NextResponse.next()
  }

  // Các API routes khác: kiểm tra auth cookie
  if (pathname.startsWith('/api/')) {
    const authToken = request.cookies.get('auth_token')
    
    if (!authToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/api/:path*',
}
