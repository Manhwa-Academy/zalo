import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AuthManager } from '@/lib/auth-manager';

/**
 * GET /api/auth/sessions
 * Get all active sessions (devices) for current user
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const authToken = cookieStore.get('auth_token');

    if (!authToken?.value) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // If no database, return empty list
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        sessions: [],
        count: 0,
        note: 'Database not configured',
      });
    }

    // Validate session and get user
    const validation = await AuthManager.validateSession(authToken.value);

    if (!validation.valid || !validation.user) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    // Get all active sessions for this user
    const sessions = await AuthManager.getActiveSessions(validation.user.id);

    // Format sessions for client (hide full session token)
    const formattedSessions = sessions.map((session) => ({
      id: session.id,
      deviceInfo: session.deviceInfo,
      ipAddress: session.ipAddress,
      createdAt: session.createdAt,
      lastActive: session.lastActive,
      expiresAt: session.expiresAt,
      isCurrent: session.sessionToken === authToken.value,
    }));

    return NextResponse.json({
      sessions: formattedSessions,
      count: formattedSessions.length,
    });
  } catch (error: any) {
    console.error('❌ [Auth] Get sessions error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get sessions' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/auth/sessions/:sessionId
 * Logout a specific session by ID
 */
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const authToken = cookieStore.get('auth_token');

    if (!authToken?.value) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 400 }
      );
    }

    // Get sessionId from query params
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('id');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      );
    }

    // Validate current session
    const validation = await AuthManager.validateSession(authToken.value);

    if (!validation.valid || !validation.user) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    // Get all sessions to verify ownership
    const sessions = await AuthManager.getActiveSessions(validation.user.id);
    const targetSession = sessions.find((s) => s.id === sessionId);

    if (!targetSession) {
      return NextResponse.json(
        { error: 'Session not found or access denied' },
        { status: 404 }
      );
    }

    // Logout the specific session
    await AuthManager.logoutSession(targetSession.sessionToken);

    console.log(`✅ [Auth] Logged out session ${sessionId} for user: ${validation.user.username}`);

    return NextResponse.json({
      success: true,
      message: 'Đã đăng xuất thiết bị thành công',
    });
  } catch (error: any) {
    console.error('❌ [Auth] Delete session error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete session' },
      { status: 500 }
    );
  }
}
