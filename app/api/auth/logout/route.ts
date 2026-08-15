import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AuthManager } from '@/lib/auth-manager';

/**
 * POST /api/auth/logout
 * Logout from current device only
 */
export async function POST(request: NextRequest) {
  const cookieStore = cookies();
  const authToken = cookieStore.get('auth_token');

  if (!authToken?.value) {
    return NextResponse.json({ success: true, message: 'Already logged out' });
  }

  // If database configured, logout session in DB
  if (process.env.DATABASE_URL) {
    try {
      await AuthManager.logoutSession(authToken.value);
      console.log('✅ [Auth] Session logged out from database');
    } catch (error) {
      console.error('❌ [Auth] Logout error:', error);
    }
  }

  // Clear cookie
  cookieStore.delete('auth_token');

  return NextResponse.json({ success: true });
}
