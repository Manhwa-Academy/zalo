import { Pool } from 'pg';

if (!process.env.DATABASE_URL) {
  console.warn('⚠️ DATABASE_URL not set, session storage will be disabled');
}

const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false,
      },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    })
  : null;

// Tạo bảng cho multi-user system
async function initDatabase() {
  if (!pool) return;

  try {
    await pool.query(`
      -- Bảng users: Lưu thông tin người dùng
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      -- Bảng zalo_sessions: Lưu session Zalo của từng user
      CREATE TABLE IF NOT EXISTS zalo_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        session_data JSONB NOT NULL,
        user_info JSONB,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id)
      );
      
      -- Bảng bot_settings: Cài đặt bot của từng user
      CREATE TABLE IF NOT EXISTS bot_settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        enabled BOOLEAN DEFAULT false,
        auto_reply_message TEXT DEFAULT 'Xin chào! Đây là tin nhắn tự động.',
        reply_delay INTEGER DEFAULT 2000,
        settings JSONB DEFAULT '{}'::jsonb,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id)
      );
      
      -- Index để tăng performance
      CREATE INDEX IF NOT EXISTS idx_users_session_id ON users(session_id);
      CREATE INDEX IF NOT EXISTS idx_zalo_sessions_user_id ON zalo_sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_zalo_sessions_is_active ON zalo_sessions(is_active);
      CREATE INDEX IF NOT EXISTS idx_bot_settings_user_id ON bot_settings(user_id);
    `);
    console.log('✅ [Postgres] Multi-user database initialized');
  } catch (error) {
    console.error('❌ [Postgres] Init failed:', error);
  }
}

// Init khi module được load
if (pool) {
  initDatabase().catch(console.error);
}

export default pool;
