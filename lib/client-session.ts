/**
 * Client-side session tracking
 * Lưu sessionId vào localStorage để track user
 */

'use client';

const SESSION_KEY = 'zalo_user_session';

/**
 * Lấy session ID từ localStorage
 * Nếu chưa có → Tạo mới
 */
export function getClientSessionId(): string {
  if (typeof window === 'undefined') return '';
  
  let sessionId = localStorage.getItem(SESSION_KEY);
  
  if (!sessionId) {
    sessionId = generateSessionId();
    localStorage.setItem(SESSION_KEY, sessionId);
  }
  
  return sessionId;
}

/**
 * Xóa session ID
 */
export function clearClientSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SESSION_KEY);
}

/**
 * Generate unique session ID
 */
function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Hook để sử dụng trong React components
 */
export function useClientSession() {
  const sessionId = getClientSessionId();
  
  return {
    sessionId,
    clearSession: clearClientSession,
  };
}
