import { NextRequest, NextResponse } from 'next/server';
import { AuthManager, getDeviceInfo } from '@/lib/auth-manager';

/**
 * POST /api/auth/register
 * Register new user (can be disabled in production)
 * 
 * SECURITY NOTE: In production, you should:
 * 1. Disable this endpoint OR
 * 2. Require invite code/token OR
 * 3. Add email verification OR
 * 4. Add captcha verification
 */

const REGISTRATION_ENABLED = process.env.REGISTRATION_ENABLED === 'true';
const REQUIRE_INVITE_CODE = process.env.REQUIRE_INVITE_CODE === 'true';
const VALID_INVITE_CODE = process.env.INVITE_CODE || 'CHANGE_ME';

export async function POST(request: NextRequest) {
  try {
    // Check if registration is enabled
    if (!REGISTRATION_ENABLED) {
      return NextResponse.json(
        { error: 'Registration is disabled. Contact administrator.' },
        { status: 403 }
      );
    }

    // Check if database is configured
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { username, password, displayName, email, inviteCode } = body;

    // Validate required fields
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Validate username format
    if (!/^[a-zA-Z0-9_-]{3,20}$/.test(username)) {
      return NextResponse.json(
        { error: 'Username must be 3-20 characters (letters, numbers, _ or -)' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Check invite code if required
    if (REQUIRE_INVITE_CODE) {
      if (!inviteCode || inviteCode !== VALID_INVITE_CODE) {
        return NextResponse.json(
          { error: 'Invalid or missing invite code' },
          { status: 403 }
        );
      }
    }

    // Validate email format (if provided)
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    try {
      // Create user
      const user = await AuthManager.createUser(
        username,
        password,
        displayName || username,
        email
      );

      console.log(`✅ [Registration] New user registered: ${username}`);

      // Auto-login: Create session
      const ipAddress = request.headers.get('x-forwarded-for') || 
                        request.headers.get('x-real-ip') || 
                        'unknown';
      const userAgent = request.headers.get('user-agent') || undefined;
      const deviceInfo = getDeviceInfo(userAgent);

      const sessionToken = await AuthManager.createSession(
        user.id,
        deviceInfo,
        ipAddress,
        userAgent,
        7 // 7 days expiry
      );

      // Log registration
      await AuthManager.logAuthEvent(
        user.id,
        'login',
        ipAddress,
        userAgent,
        deviceInfo,
        true
      );

      // Set session cookie
      const response = NextResponse.json({
        success: true,
        message: 'Registration successful',
        user: {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          email: user.email,
        },
      });

      response.cookies.set('auth_token', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      });

      return response;
    } catch (error: any) {
      if (error.message === 'Username already exists') {
        return NextResponse.json(
          { error: 'Username already taken' },
          { status: 409 }
        );
      }
      throw error;
    }
  } catch (error: any) {
    console.error('❌ [Registration] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Registration failed' },
      { status: 500 }
    );
  }
}
