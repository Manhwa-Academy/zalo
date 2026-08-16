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
      max: 10, // Maximum 10 connections
      min: 2, // Keep at least 2 connections alive
      idleTimeoutMillis: 30000, // Close idle connections after 30s
      connectionTimeoutMillis: 10000, // Wait up to 10s for connection (increased from 2s for Render.com)
      statement_timeout: 10000, // Query timeout 10s
      query_timeout: 10000, // Query timeout 10s
    })
  : null;

// Handle pool errors (only log actual errors, not normal operations)
if (pool) {
  pool.on('error', (err) => {
    console.error('❌ [Postgres] Unexpected pool error:', err.message)
  })
  
  // Removed 'connect' and 'remove' event logs to reduce noise
}

// Retry helper for database queries with exponential backoff
export async function queryWithRetry<T = any>(
  queryText: string,
  params?: any[],
  maxRetries = 3
): Promise<T> {
  if (!pool) {
    throw new Error('Database pool not initialized')
  }

  let lastError: Error | null = null
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await pool.query(queryText, params)
      if (attempt > 1) {
        console.log(`✅ [Postgres] Query succeeded on attempt ${attempt}`)
      }
      return result as T
    } catch (error: any) {
      lastError = error
      
      // Don't retry on syntax errors or constraint violations
      if (
        error.code === '42601' || // syntax_error
        error.code === '23505' || // unique_violation
        error.code === '23503'    // foreign_key_violation
      ) {
        throw error
      }
      
      // Log retry attempt
      console.warn(
        `⚠️ [Postgres] Query failed (attempt ${attempt}/${maxRetries}):`,
        error.message
      )
      
      // Wait before retry with exponential backoff
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000) // Max 5s
        console.log(`⏳ [Postgres] Retrying in ${delay}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }
  
  // All retries failed
  throw lastError || new Error('Query failed after retries')
}

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
