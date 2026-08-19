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
  aiEnabled?: boolean; // NEW: Enable AI-powered replies
  aiPersonality?: string; // NEW: AI personality (friendly, professional, casual, funny, supportive, cute)
  aiMaxLength?: number; // NEW: Max AI response length
  aiTriggerMode?: string; // NEW: 'always' | 'questions' | 'smart' | 'manual'
  geminiApiKey?: string; // NEW: User's personal Gemini API key (optional)
  geminiModel?: string; // NEW: User's preferred Gemini model
  settings: any;
  updatedAt: Date;
}

export class UserManager {
  /**
   * Tìm user theo Zalo userId (để tránh duplicate user cho cùng 1 tài khoản Zalo)
   */
  static async getUserByZaloId(zaloUserId: string): Promise<User | null> {
    if (!pool) throw new Error('Database not configured');

    try {
      const result = await pool.query(
        `SELECT u.* FROM users u
         INNER JOIN zalo_sessions zs ON u.id = zs.user_id
         WHERE zs.user_info->>'userId' = $1
         AND zs.is_active = true
         LIMIT 1`,
        [zaloUserId]
      );

      if (result.rows.length > 0) {
        return {
          id: result.rows[0].id,
          sessionId: result.rows[0].session_id,
          createdAt: result.rows[0].created_at,
          lastActive: result.rows[0].last_active,
        };
      }

      return null;
    } catch (error) {
      console.error('❌ [UserManager] getUserByZaloId failed:', error);
      return null;
    }
  }

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

      // Tạo user mới với ON CONFLICT để tránh race condition
      result = await pool.query(
        `INSERT INTO users (session_id) 
         VALUES ($1) 
         ON CONFLICT (session_id) 
         DO UPDATE SET last_active = CURRENT_TIMESTAMP
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
   * Link sessionId mới với user đã tồn tại (để merge multi-device)
   */
  static async linkSessionToUser(sessionId: string, userId: string): Promise<void> {
    if (!pool) throw new Error('Database not configured');

    try {
      // First, delete any existing user with this session_id to avoid duplicate
      await pool.query(
        'DELETE FROM users WHERE session_id = $1 AND id != $2',
        [sessionId, userId]
      );
      
      // Then update the target user with new session_id
      await pool.query(
        'UPDATE users SET session_id = $1, last_active = CURRENT_TIMESTAMP WHERE id = $2',
        [sessionId, userId]
      );
      console.log(`✅ [UserManager] Linked session ${sessionId} to existing user ${userId}`);
    } catch (error) {
      console.error('❌ [UserManager] linkSessionToUser failed:', error);
      throw error;
    }
  }

  /**
   * Lưu Zalo session của user (dùng UPSERT để tránh duplicate)
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
           session_data = EXCLUDED.session_data,
           user_info = EXCLUDED.user_info,
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
   * Update only userInfo without touching session_data
   */
  static async updateZaloUserInfo(
    userId: string,
    userInfo: any
  ): Promise<void> {
    if (!pool) throw new Error('Database not configured');

    try {
      const result = await pool.query(
        `UPDATE zalo_sessions 
         SET user_info = $2, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $1 AND is_active = true`,
        [userId, JSON.stringify(userInfo)]
      );

      if (result.rowCount === 0) {
        console.warn(`⚠️ [UserManager] No active session found to update userInfo for user: ${userId}`);
      } else {
        console.log(`✅ [UserManager] Updated userInfo for user: ${userId}`);
      }
    } catch (error) {
      console.error('❌ [UserManager] updateZaloUserInfo failed:', error);
      throw error;
    }
  }

  /**
   * Xóa Zalo session của user
   */
  static async deleteZaloSession(userId: string): Promise<void> {
    if (!pool) return;

    try {
      // Delete app_state to force QR login on next attempt
      await pool.query(
        'UPDATE zalo_sessions SET is_active = false, app_state = NULL WHERE user_id = $1',
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
      
      // Load Gemini settings from user_settings table
      let geminiApiKey = ''
      let geminiModel = 'gemini-3.1-flash-lite'
      
      try {
        const userSettingsResult = await pool.query(
          'SELECT gemini_api_key, gemini_model FROM user_settings WHERE user_id = $1',
          [userId]
        )
        
        if (userSettingsResult.rows.length > 0) {
          geminiApiKey = userSettingsResult.rows[0].gemini_api_key || ''
          geminiModel = userSettingsResult.rows[0].gemini_model || 'gemini-3.1-flash-lite'
        }
      } catch (geminiError) {
        console.warn('⚠️ [UserManager] Failed to load Gemini settings, using defaults:', geminiError)
      }
      
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
        aiEnabled: parsedSettings.aiEnabled || false,
        aiPersonality: parsedSettings.aiPersonality || 'friendly',
        aiMaxLength: parsedSettings.aiMaxLength || 200,
        aiTriggerMode: parsedSettings.aiTriggerMode || 'smart',
        geminiApiKey, // User's personal API key from user_settings
        geminiModel, // User's preferred model from user_settings
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
      // Use transaction to ensure atomicity
      const client = await pool.connect()
      
      try {
        await client.query('BEGIN')
        
        // 1. Load existing settings from DB to merge with updates
        const existingResult = await client.query(
          'SELECT settings FROM bot_settings WHERE user_id = $1',
          [userId]
        );
        
        const existingSettings = existingResult.rows[0]?.settings || {};
        
        const fields: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        // Core fields (have dedicated columns)
        if (updates.enabled !== undefined) {
          fields.push(`enabled = $${paramIndex++}`);
          values.push(updates.enabled);
          console.log(`🔧 [UserManager] Updating enabled to: ${updates.enabled}`)
        }
        if (updates.autoReplyMessage !== undefined) {
          fields.push(`auto_reply_message = $${paramIndex++}`);
          values.push(updates.autoReplyMessage);
        }
        if (updates.replyDelay !== undefined) {
          fields.push(`reply_delay = $${paramIndex++}`);
          values.push(updates.replyDelay);
        }

        // Extra fields (save to JSONB settings column)
        const newExtraFields: any = {};
        if (updates.replyScope !== undefined) newExtraFields.replyScope = updates.replyScope;
        if (updates.whitelist !== undefined) newExtraFields.whitelist = updates.whitelist;
        if (updates.blacklist !== undefined) newExtraFields.blacklist = updates.blacklist;
        if (updates.useRandomPreset !== undefined) newExtraFields.useRandomPreset = updates.useRandomPreset;
        if (updates.presetMessages !== undefined) newExtraFields.presetMessages = updates.presetMessages;
        if (updates.aiEnabled !== undefined) newExtraFields.aiEnabled = updates.aiEnabled;
        if (updates.aiPersonality !== undefined) newExtraFields.aiPersonality = updates.aiPersonality;
        if (updates.aiMaxLength !== undefined) newExtraFields.aiMaxLength = updates.aiMaxLength;
        if (updates.aiTriggerMode !== undefined) newExtraFields.aiTriggerMode = updates.aiTriggerMode;
        
        // Merge existing JSONB settings with new updates
        const mergedSettings = { ...existingSettings, ...newExtraFields };
        
        // Always update settings column to preserve all fields
        fields.push(`settings = $${paramIndex++}`);
        values.push(JSON.stringify(mergedSettings));

        fields.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(userId);

        const updateQuery = `UPDATE bot_settings SET ${fields.join(', ')} WHERE user_id = $${paramIndex}`
        console.log(`🔧 [UserManager] Executing query:`, updateQuery)
        console.log(`🔧 [UserManager] With values:`, values)
        
        const result = await client.query(updateQuery, values);

        console.log(`✅ [UserManager] Updated bot settings for user: ${userId}`, {
          rowsAffected: result.rowCount,
          coreFields: { enabled: updates.enabled, autoReplyMessage: updates.autoReplyMessage?.slice(0, 30) },
          extraFields: newExtraFields,
          mergedSettings,
        });
        
        // Verify the update
        const verifyResult = await client.query(
          'SELECT enabled FROM bot_settings WHERE user_id = $1',
          [userId]
        )
        console.log(`🔍 [UserManager] Verified enabled value in DB:`, verifyResult.rows[0]?.enabled)
        
        await client.query('COMMIT')
      } catch (error) {
        await client.query('ROLLBACK')
        throw error
      } finally {
        client.release()
      }
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
