import pool from './postgres';
import { v4 as uuidv4 } from 'uuid';

export interface User {
  id: string;
  sessionId: string;
  createdAt: Date;
  lastActive: Date;
}

export interface ZaloSession {
  id: string;
  userId: string;
  sessionData: any;
  userInfo: any;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BotSettings {
  id: string;
  userId: string;
  enabled: boolean;
  autoReplyMessage: string;
  replyDelay: number;
  replyScope?: string; // 'all' | 'user_only' | 'group_only' | 'whitelist'
  whitelist?: string[];
  blacklist?: string[];
  useRandomPreset?: boolean;
  presetMessages?: string[];
  settings: any;
  updatedAt: Date;
}

export class UserManager {
  /**
   * Tạo hoặc lấy user từ sessionId
   */
  static async getOrCreateUser(sessionId: string): Promise<User> {
    if (!pool) throw new Error('Database not configured');

    try {
      // Thử tìm user hiện có
      let result = await pool.query(
        'SELECT * FROM users WHERE session_id = $1',
        [sessionId]
      );

      if (result.rows.length > 0) {
        // Update last_active
        await pool.query(
          'UPDATE users SET last_active = CURRENT_TIMESTAMP WHERE session_id = $1',
          [sessionId]
        );
        
        return {
          id: result.rows[0].id,
          sessionId: result.rows[0].session_id,
          createdAt: result.rows[0].created_at,
          lastActive: new Date(),
        };
      }

      // Tạo user mới
      result = await pool.query(
        `INSERT INTO users (session_id) 
         VALUES ($1) 
         RETURNING *`,
        [sessionId]
      );

      console.log(`✅ [UserManager] Created new user: ${sessionId}`);

      return {
        id: result.rows[0].id,
        sessionId: result.rows[0].session_id,
        createdAt: result.rows[0].created_at,
        lastActive: result.rows[0].last_active,
      };
    } catch (error) {
      console.error('❌ [UserManager] getOrCreateUser failed:', error);
      throw error;
    }
  }

  /**
   * Lưu Zalo session của user
   */
  static async saveZaloSession(
    userId: string,
    sessionData: any,
    userInfo?: any
  ): Promise<void> {
    if (!pool) throw new Error('Database not configured');

    try {
      await pool.query(
        `INSERT INTO zalo_sessions (user_id, session_data, user_info, updated_at)
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
         ON CONFLICT (user_id)
         DO UPDATE SET 
           session_data = $2,
           user_info = $3,
           is_active = true,
           updated_at = CURRENT_TIMESTAMP`,
        [userId, JSON.stringify(sessionData), userInfo ? JSON.stringify(userInfo) : null]
      );

      console.log(`✅ [UserManager] Saved Zalo session for user: ${userId}`);
    } catch (error) {
      console.error('❌ [UserManager] saveZaloSession failed:', error);
      throw error;
    }
  }

  /**
   * Lấy Zalo session của user
   */
  static async getZaloSession(userId: string): Promise<any | null> {
    if (!pool) return null;

    try {
      const result = await pool.query(
        'SELECT session_data, user_info FROM zalo_sessions WHERE user_id = $1 AND is_active = true',
        [userId]
      );

      if (result.rows.length > 0) {
        return {
          sessionData: result.rows[0].session_data,
          userInfo: result.rows[0].user_info,
        };
      }

      return null;
    } catch (error) {
      console.error('❌ [UserManager] getZaloSession failed:', error);
      return null;
    }
  }

  /**
   * Xóa Zalo session của user
   */
  static async deleteZaloSession(userId: string): Promise<void> {
    if (!pool) return;

    try {
      await pool.query(
        'UPDATE zalo_sessions SET is_active = false WHERE user_id = $1',
        [userId]
      );

      console.log(`✅ [UserManager] Deleted Zalo session for user: ${userId}`);
    } catch (error) {
      console.error('❌ [UserManager] deleteZaloSession failed:', error);
    }
  }

  /**
   * Lấy bot settings của user
   */
  static async getBotSettings(userId: string): Promise<BotSettings> {
    if (!pool) {
      return {
        id: '',
        userId,
        enabled: false,
        autoReplyMessage: 'Xin chào! Đây là tin nhắn tự động.',
        replyDelay: 2000,
        replyScope: 'all',
        whitelist: [],
        blacklist: [],
        useRandomPreset: false,
        presetMessages: [],
        settings: {},
        updatedAt: new Date(),
      };
    }

    try {
      let result = await pool.query(
        'SELECT * FROM bot_settings WHERE user_id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        // Tạo settings mặc định
        result = await pool.query(
          `INSERT INTO bot_settings (user_id) 
           VALUES ($1) 
           RETURNING *`,
          [userId]
        );
      }

      const row = result.rows[0];
      
      // Parse settings from JSONB if exists
      const parsedSettings = row.settings || {};
      
      return {
        id: row.id,
        userId: row.user_id,
        enabled: row.enabled,
        autoReplyMessage: row.auto_reply_message,
        replyDelay: row.reply_delay,
        replyScope: parsedSettings.replyScope || 'all',
        whitelist: parsedSettings.whitelist || [],
        blacklist: parsedSettings.blacklist || [],
        useRandomPreset: parsedSettings.useRandomPreset || false,
        presetMessages: parsedSettings.presetMessages || [],
        settings: row.settings,
        updatedAt: row.updated_at,
      };
    } catch (error) {
      console.error('❌ [UserManager] getBotSettings failed:', error);
      throw error;
    }
  }

  /**
   * Cập nhật bot settings của user
   */
  static async updateBotSettings(
    userId: string,
    updates: Partial<Omit<BotSettings, 'id' | 'userId' | 'updatedAt'>>
  ): Promise<void> {
    if (!pool) return;

    try {
      const fields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (updates.enabled !== undefined) {
        fields.push(`enabled = $${paramIndex++}`);
        values.push(updates.enabled);
      }
      if (updates.autoReplyMessage !== undefined) {
        fields.push(`auto_reply_message = $${paramIndex++}`);
        values.push(updates.autoReplyMessage);
      }
      if (updates.replyDelay !== undefined) {
        fields.push(`reply_delay = $${paramIndex++}`);
        values.push(updates.replyDelay);
      }
      if (updates.settings !== undefined) {
        fields.push(`settings = $${paramIndex++}`);
        values.push(JSON.stringify(updates.settings));
      }

      fields.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(userId);

      await pool.query(
        `UPDATE bot_settings SET ${fields.join(', ')} WHERE user_id = $${paramIndex}`,
        values
      );

      console.log(`✅ [UserManager] Updated bot settings for user: ${userId}`);
    } catch (error) {
      console.error('❌ [UserManager] updateBotSettings failed:', error);
      throw error;
    }
  }
}

/**
 * Generate unique session ID
 */
export function generateSessionId(): string {
  return uuidv4();
}
