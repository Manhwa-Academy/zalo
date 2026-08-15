import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AuthManager } from '@/lib/auth-manager';

/**
 * GET /api/auth/check
 * Validate session and return user info
 */
export async function GET(request: NextRequest) {
  const cookieStore = cookies();
  const authToken = cookieStore.get('auth_token');

  console.log(`🔍 [Auth Check] Cookie received: ${authToken?.value ? authToken.value.substring(0, 20) + '...' : 'NO COOKIE'}`);

  if (!authToken?.value) {
    console.log('❌ [Auth Check] No auth token found in cookies');
    return NextResponse.json({ authenticated: false });
  }

  // If no database, use simple validation (backward compatibility)
  if (!process.env.DATABASE_URL) {
    console.log('✅ [Auth Check] Simple auth - authenticated');
    return NextResponse.json({ authenticated: true });
  }

  // Validate session with database
  try {
    const validation = await AuthManager.validateSession(authToken.value);

    if (!validation.valid) {
      // Invalid or expired session - clear cookie
      console.log('❌ [Auth Check] Invalid or expired session, clearing cookie');
      const response = NextResponse.json({ authenticated: false });
      response.cookies.delete('auth_token');
      return response;
    }

    console.log(`✅ [Auth Check] Valid session for user: ${validation.user?.username}`);
    return NextResponse.json({
      authenticated: true,
      user: validation.user,
      expiresAt: validation.expiresAt,
    });
  } catch (error) {
    console.error('❌ [Auth] Session validation error:', error);
    return NextResponse.json({ authenticated: false });
  }
}
