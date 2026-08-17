import { cookies } from 'next/headers';
import { generateSessionId } from './user-manager';

const SESSION_COOKIE_NAME = 'zalo_user_session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 365; // 1 năm

/**
 * Lấy session ID từ cookie
 * Nếu chưa có → Tạo mới
 */
export function getSessionId(): string {
  const cookieStore = cookies();
  let sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionId) {
    sessionId = generateSessionId();
    console.log(`🆕 [SessionCookie] Generated new session ID: ${sessionId}`);
    setSessionId(sessionId);
  } else {
    // Session exists (silent - reduce logs)
  }

  return sessionId;
}

/**
 * Set session ID vào cookie
 */
export function setSessionId(sessionId: string): void {
  const cookieStore = cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  });
}

/**
 * Xóa session ID
 */
export function clearSessionId(): void {
  const cookieStore = cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
