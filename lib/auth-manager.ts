import pool from './postgres';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

export interface AuthUser {
  id: string;
  username: string;
  displayName?: string;
  email?: string;
  createdAt: Date;
  lastLogin?: Date;
}

export interface AuthSession {
  id: string;
  userId: string;
  sessionToken: string;
  deviceInfo: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  expiresAt: Date;
  lastActive: Date;
  isActive: boolean;
}

export interface SessionValidationResult {
  valid: boolean;
  user?: AuthUser;
  session?: AuthSession;
  expiresAt?: Date;
}

export class AuthManager {
  /**
   * Create a new user (for registration)
   */
  static async createUser(
    username: string,
    password: string,
    displayName?: string,
    email?: string
  ): Promise<AuthUser> {
    if (!pool) throw new Error('Database not configured');

    try {
      // Hash password with bcrypt
      const passwordHash = await bcrypt.hash(password, 10);

      const result = await pool.query(
        `INSERT INTO auth_users (username, password_hash, display_name, email)
         VALUES ($1, $2, $3, $4)
         RETURNING id, username, display_name, email, created_at`,
        [username, passwordHash, displayName, email]
      );

      console.log(`✅ [AuthManager] Created user: ${username}`);

      return {
        id: result.rows[0].id,
        username: result.rows[0].username,
        displayName: result.rows[0].display_name,
        email: result.rows[0].email,
        createdAt: result.rows[0].created_at,
      };
    } catch (error: any) {
      if (error.code === '23505') {
        // Unique violation
        throw new Error('Username already exists');
      }
      console.error('❌ [AuthManager] createUser failed:', error);
      throw error;
    }
  }

  /**
   * Authenticate user with username + password
   */
  static async authenticateUser(
    username: string,
    password: string
  ): Promise<AuthUser | null> {
    if (!pool) throw new Error('Database not configured');

    try {
      const result = await pool.query(
        `SELECT id, username, password_hash, display_name, email, created_at
         FROM auth_users
         WHERE username = $1 AND is_active = true`,
        [username]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const user = result.rows[0];

      // Verify password
      const passwordMatch = await bcrypt.compare(password, user.password_hash);

      if (!passwordMatch) {
        return null;
      }

      // Update last_login
      await pool.query(
        'UPDATE auth_users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
        [user.id]
      );

      console.log(`✅ [AuthManager] Authenticated user: ${username}`);

      return {
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        email: user.email,
        createdAt: user.created_at,
        lastLogin: new Date(),
      };
    } catch (error) {
      console.error('❌ [AuthManager] authenticateUser failed:', error);
      throw error;
    }
  }

  /**
   * Create a new session for user (after successful login)
   * Auto-cleanup old sessions to prevent accumulation
   */
  static async createSession(
    userId: string,
    deviceInfo?: any,
    ipAddress?: string,
    userAgent?: string,
    expiryDays: number = 7 // Default 7 days
  ): Promise<string> {
    if (!pool) throw new Error('Database not configured');

    try {
      // Step 1: Cleanup old sessions first
      // Delete expired sessions
      await pool.query(
        `DELETE FROM auth_sessions 
         WHERE user_id = $1 AND expires_at < NOW()`,
        [userId]
      );

      // Delete inactive sessions older than 24 hours
      await pool.query(
        `DELETE FROM auth_sessions 
         WHERE user_id = $1 
         AND is_active = false 
         AND last_active < NOW() - INTERVAL '24 hours'`,
        [userId]
      );

      // Keep only 3 most recent active sessions per user
      await pool.query(
        `DELETE FROM auth_sessions
         WHERE user_id = $1
         AND id NOT IN (
           SELECT id FROM auth_sessions
           WHERE user_id = $2
           AND is_active = true
           ORDER BY last_active DESC
           LIMIT 3
         )`,
        [userId, userId]
      );

      // Step 2: Generate unique session token
      const sessionToken = uuidv4() + '-' + Date.now();

      // Calculate expiry
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiryDays);

      // Step 3: Create new session
      await pool.query(
        `INSERT INTO auth_sessions 
         (user_id, session_token, device_info, ip_address, user_agent, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          userId,
          sessionToken,
          JSON.stringify(deviceInfo || {}),
          ipAddress,
          userAgent,
          expiresAt,
        ]
      );

      console.log(`✅ [AuthManager] Created session for user: ${userId}`);

      return sessionToken;
    } catch (error) {
      console.error('❌ [AuthManager] createSession failed:', error);
      throw error;
    }
  }

  /**
   * Validate session token and return user info
   */
  static async validateSession(
    sessionToken: string
  ): Promise<SessionValidationResult> {
    if (!pool) {
      return { valid: false };
    }

    try {
      console.log(`🔍 [AuthManager] Validating session token: ${sessionToken.substring(0, 30)}...`);
      
      // Query the function which returns a composite type
      const result = await pool.query(
        `SELECT * FROM validate_session($1)`,
        [sessionToken]
      );

      console.log(`🔍 [AuthManager] DB validation result:`, result.rows[0]);

      if (result.rows.length === 0) {
        console.log(`❌ [AuthManager] No validation result from DB`);
        return { valid: false };
      }

      const validation = result.rows[0];

      // Check the 'valid' column
      if (!validation.valid) {
        console.log(`❌ [AuthManager] Session invalid`);
        return { valid: false };
      }

      console.log(`✅ [AuthManager] Session valid for user: ${validation.username}`);

      return {
        valid: true,
        user: {
          id: validation.user_id,
          username: validation.username,
          displayName: validation.display_name,
          createdAt: new Date(),
        },
        expiresAt: new Date(validation.expires_at),
      };
    } catch (error) {
      console.error('❌ [AuthManager] validateSession failed:', error);
      return { valid: false };
    }
  }

  /**
   * Logout a specific session
   */
  static async logoutSession(sessionToken: string): Promise<boolean> {
    if (!pool) return false;

    try {
      const result = await pool.query(
        `SELECT logout_session($1) as success`,
        [sessionToken]
      );

      const success = result.rows[0]?.success || false;

      if (success) {
        console.log(`✅ [AuthManager] Logged out session: ${sessionToken}`);
      }

      return success;
    } catch (error) {
      console.error('❌ [AuthManager] logoutSession failed:', error);
      return false;
    }
  }

  /**
   * Logout all sessions for a user (all devices)
   */
  static async logoutAllSessions(userId: string): Promise<number> {
    if (!pool) return 0;

    try {
      const result = await pool.query(
        `SELECT logout_all_devices($1) as count`,
        [userId]
      );

      const count = result.rows[0]?.count || 0;

      console.log(`✅ [AuthManager] Logged out ${count} sessions for user: ${userId}`);

      return count;
    } catch (error) {
      console.error('❌ [AuthManager] logoutAllSessions failed:', error);
      return 0;
    }
  }

  /**
   * Get all active sessions for a user
   */
  static async getActiveSessions(userId: string): Promise<AuthSession[]> {
    if (!pool) return [];

    try {
      const result = await pool.query(
        `SELECT 
          id, user_id, session_token, device_info, ip_address, user_agent,
          created_at, expires_at, last_active, is_active
         FROM auth_sessions
         WHERE user_id = $1 
           AND is_active = true 
           AND expires_at > CURRENT_TIMESTAMP
         ORDER BY last_active DESC`,
        [userId]
      );

      return result.rows.map((row) => ({
        id: row.id,
        userId: row.user_id,
        sessionToken: row.session_token,
        deviceInfo: row.device_info,
        ipAddress: row.ip_address,
        userAgent: row.user_agent,
        createdAt: row.created_at,
        expiresAt: row.expires_at,
        lastActive: row.last_active,
        isActive: row.is_active,
      }));
    } catch (error) {
      console.error('❌ [AuthManager] getActiveSessions failed:', error);
      return [];
    }
  }

  /**
   * Get active sessions count for a user
   */
  static async getActiveSessionsCount(userId: string): Promise<number> {
    if (!pool) return 0;

    try {
      const result = await pool.query(
        `SELECT get_user_active_sessions_count($1) as count`,
        [userId]
      );

      return result.rows[0]?.count || 0;
    } catch (error) {
      console.error('❌ [AuthManager] getActiveSessionsCount failed:', error);
      return 0;
    }
  }

  /**
   * Cleanup expired sessions (called periodically)
   */
  static async cleanupExpiredSessions(): Promise<void> {
    if (!pool) return;

    try {
      await pool.query('SELECT cleanup_expired_sessions()');
      console.log('✅ [AuthManager] Cleaned up expired sessions');
    } catch (error) {
      console.error('❌ [AuthManager] cleanupExpiredSessions failed:', error);
    }
  }

  /**
   * Get user by ID
   */
  static async getUserById(userId: string): Promise<AuthUser | null> {
    if (!pool) return null;

    try {
      const result = await pool.query(
        `SELECT id, username, display_name, email, created_at, last_login
         FROM auth_users
         WHERE id = $1 AND is_active = true`,
        [userId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const user = result.rows[0];

      return {
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        email: user.email,
        createdAt: user.created_at,
        lastLogin: user.last_login,
      };
    } catch (error) {
      console.error('❌ [AuthManager] getUserById failed:', error);
      return null;
    }
  }

  /**
   * Update user password
   */
  static async updatePassword(
    userId: string,
    newPassword: string
  ): Promise<boolean> {
    if (!pool) return false;

    try {
      const passwordHash = await bcrypt.hash(newPassword, 10);

      await pool.query(
        'UPDATE auth_users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [passwordHash, userId]
      );

      console.log(`✅ [AuthManager] Updated password for user: ${userId}`);

      return true;
    } catch (error) {
      console.error('❌ [AuthManager] updatePassword failed:', error);
      return false;
    }
  }

  /**
   * Log authentication event (for audit)
   * Keeps only latest login and logout record per user to avoid clutter
   */
  static async logAuthEvent(
    userId: string,
    action: 'login' | 'logout' | 'logout_all' | 'session_expired',
    ipAddress?: string,
    userAgent?: string,
    deviceInfo?: any,
    success: boolean = true,
    errorMessage?: string
  ): Promise<void> {
    if (!pool) return;

    try {
      // Strategy: Keep only 1 latest record per action type
      // Delete old records of same action type for this user
      await pool.query(
        `DELETE FROM auth_login_history 
         WHERE user_id = $1 
         AND action = $2
         AND created_at < NOW() - INTERVAL '1 minute'`,
        [userId, action]
      );

      // Insert new record
      await pool.query(
        `INSERT INTO auth_login_history 
         (user_id, action, ip_address, user_agent, device_info, success, error_message)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          userId,
          action,
          ipAddress,
          userAgent,
          JSON.stringify(deviceInfo || {}),
          success,
          errorMessage,
        ]
      );
    } catch (error) {
      console.error('❌ [AuthManager] logAuthEvent failed:', error);
    }
  }
}

/**
 * Helper to extract device info from request
 */
export function getDeviceInfo(userAgent?: string): any {
  if (!userAgent) return {};

  // Simple device detection
  const isMobile = /Mobile|Android|iPhone|iPad/i.test(userAgent);
  const isTablet = /iPad|Android(?!.*Mobile)/i.test(userAgent);
  const isDesktop = !isMobile && !isTablet;

  let browser = 'Unknown';
  if (userAgent.includes('Chrome')) browser = 'Chrome';
  else if (userAgent.includes('Firefox')) browser = 'Firefox';
  else if (userAgent.includes('Safari')) browser = 'Safari';
  else if (userAgent.includes('Edge')) browser = 'Edge';

  let os = 'Unknown';
  if (userAgent.includes('Windows')) os = 'Windows';
  else if (userAgent.includes('Mac OS')) os = 'macOS';
  else if (userAgent.includes('Linux')) os = 'Linux';
  else if (userAgent.includes('Android')) os = 'Android';
  else if (userAgent.includes('iOS') || userAgent.includes('iPhone')) os = 'iOS';

  return {
    type: isDesktop ? 'Desktop' : isTablet ? 'Tablet' : 'Mobile',
    browser,
    os,
    userAgent,
  };
}
