import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AuthManager, getDeviceInfo } from '@/lib/auth-manager';

/**
 * POST /api/auth/login
 * Login with username + password, create session in database
 */
export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    // Get request metadata
    const ipAddress = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown';
    const userAgent = request.headers.get('user-agent') || undefined;
    const deviceInfo = getDeviceInfo(userAgent);

    // Check if database is configured
    if (!process.env.DATABASE_URL) {
      // Fallback to simple auth (backward compatibility)
      const validUser = process.env.AUTH_USERNAME || 'admin';
      const validPass = process.env.AUTH_PASSWORD || 'changeme';

      if (username === validUser && password === validPass) {
        const authToken = Buffer.from(`${username}:${Date.now()}`).toString('base64');
        
        console.log('⚠️ [Auth] Using simple auth (no database)');
        console.log(`✅ [Auth] Simple auth token created: ${authToken.substring(0, 20)}...`);

        // Create response with cookie
        const response = NextResponse.json({ success: true });
        
        response.cookies.set('auth_token', authToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7, // 7 days
          path: '/',
        });

        return response;
      }

      return NextResponse.json(
        { success: false, message: 'Tên người dùng hoặc mật khẩu không đúng' },
        { status: 401 }
      );
    }

    // Database-based authentication
    try {
      // Authenticate user
      const user = await AuthManager.authenticateUser(username, password);

      if (!user) {
        // Log failed attempt
        console.log(`❌ [Auth] Failed login attempt for: ${username}`);
        
        return NextResponse.json(
          { success: false, message: 'Tên người dùng hoặc mật khẩu không đúng' },
          { status: 401 }
        );
      }

      // Create session in database
      const sessionToken = await AuthManager.createSession(
        user.id,
        deviceInfo,
        ipAddress,
        userAgent,
        7 // 7 days expiry
      );

      // Log successful login
      await AuthManager.logAuthEvent(
        user.id,
        'login',
        ipAddress,
        userAgent,
        deviceInfo,
        true
      );

      // Set session cookie
      const cookieStore = cookies();
      cookieStore.set('auth_token', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      });

      console.log(`✅ [Auth] User logged in: ${username} (${deviceInfo.type} - ${deviceInfo.browser})`);
      console.log(`✅ [Auth] Session token set in cookie: ${sessionToken.substring(0, 20)}...`);

      // Create response with cookie header (backup method)
      const response = NextResponse.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          email: user.email,
        },
      });

      // Also set cookie in response headers (double ensure)
      response.cookies.set('auth_token', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      });

      return response;
    } catch (error: any) {
      console.error('❌ [Auth] Login error:', error);
      
      return NextResponse.json(
        { success: false, message: 'Lỗi server' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ [Auth] Login request error:', error);
    
    return NextResponse.json(
      { success: false, message: 'Lỗi server' },
      { status: 500 }
    );
  }
}
