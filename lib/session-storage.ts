import pool from './postgres';

export interface SessionData {
  key: string;
  data: any;
  updatedAt: Date;
}

export class SessionStorage {
  /**
   * Lưu session vào Postgres
   */
  static async save(key: string, data: any): Promise<void> {
    if (!pool) {
      console.warn('⚠️ [SessionStorage] Postgres not configured');
      return;
    }

    try {
      await pool.query(
        `INSERT INTO sessions (key, data, updated_at)
         VALUES ($1, $2, CURRENT_TIMESTAMP)
         ON CONFLICT (key) 
         DO UPDATE SET data = $2, updated_at = CURRENT_TIMESTAMP`,
        [key, JSON.stringify(data)]
      );

      console.log(`✅ [SessionStorage] Saved session: ${key}`);
    } catch (error) {
      console.error('❌ [SessionStorage] Save failed:', error);
      throw error;
    }
  }

  /**
   * Đọc session từ Postgres
   */
  static async load(key: string): Promise<any | null> {
    if (!pool) {
      console.warn('⚠️ [SessionStorage] Postgres not configured');
      return null;
    }

    try {
      const result = await pool.query(
        'SELECT data FROM sessions WHERE key = $1',
        [key]
      );

      if (result.rows.length > 0) {
        console.log(`✅ [SessionStorage] Loaded session: ${key}`);
        return result.rows[0].data;
      }

      console.log(`⚠️ [SessionStorage] No session found: ${key}`);
      return null;
    } catch (error) {
      console.error('❌ [SessionStorage] Load failed:', error);
      return null;
    }
  }

  /**
   * Xóa session khỏi Postgres
   */
  static async delete(key: string): Promise<void> {
    if (!pool) {
      console.warn('⚠️ [SessionStorage] Postgres not configured');
      return;
    }

    try {
      await pool.query('DELETE FROM sessions WHERE key = $1', [key]);
      console.log(`✅ [SessionStorage] Deleted session: ${key}`);
    } catch (error) {
      console.error('❌ [SessionStorage] Delete failed:', error);
      throw error;
    }
  }

  /**
   * Kiểm tra session có tồn tại không
   */
  static async exists(key: string): Promise<boolean> {
    if (!pool) {
      console.warn('⚠️ [SessionStorage] Postgres not configured');
      return false;
    }

    try {
      const result = await pool.query(
        'SELECT COUNT(*) FROM sessions WHERE key = $1',
        [key]
      );
      return parseInt(result.rows[0].count) > 0;
    } catch (error) {
      console.error('❌ [SessionStorage] Exists check failed:', error);
      return false;
    }
  }
}
