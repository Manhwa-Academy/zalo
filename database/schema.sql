-- =====================================================
-- Zalo Multi-User Bot Database Schema
-- Database: PostgreSQL (Neon)
-- =====================================================

-- Drop existing tables if needed (uncomment to reset)
-- DROP TABLE IF EXISTS bot_settings CASCADE;
-- DROP TABLE IF EXISTS zalo_sessions CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;

-- =====================================================
-- Table: users
-- Lưu thông tin người dùng (mỗi user có sessionId unique)
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index để tăng tốc query
CREATE INDEX IF NOT EXISTS idx_users_session_id ON users(session_id);
CREATE INDEX IF NOT EXISTS idx_users_last_active ON users(last_active);

-- Comment
COMMENT ON TABLE users IS 'Lưu thông tin người dùng bot';
COMMENT ON COLUMN users.id IS 'ID unique của user';
COMMENT ON COLUMN users.session_id IS 'Session ID từ cookie/localStorage';
COMMENT ON COLUMN users.created_at IS 'Ngày tạo user';
COMMENT ON COLUMN users.last_active IS 'Lần cuối active';

-- =====================================================
-- Table: zalo_sessions
-- Lưu session Zalo của từng user
-- =====================================================
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

-- Index để tăng tốc query
CREATE INDEX IF NOT EXISTS idx_zalo_sessions_user_id ON zalo_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_zalo_sessions_is_active ON zalo_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_zalo_sessions_updated_at ON zalo_sessions(updated_at);

-- Comment
COMMENT ON TABLE zalo_sessions IS 'Lưu session Zalo (credentials) của từng user';
COMMENT ON COLUMN zalo_sessions.session_data IS 'Zalo credentials (cookie, imei, userAgent)';
COMMENT ON COLUMN zalo_sessions.user_info IS 'Thông tin Zalo user (displayName, avatar, etc)';
COMMENT ON COLUMN zalo_sessions.is_active IS 'Session còn active không';

-- =====================================================
-- Table: bot_settings
-- Cài đặt bot của từng user
-- =====================================================
CREATE TABLE IF NOT EXISTS bot_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    enabled BOOLEAN DEFAULT false,
    auto_reply_message TEXT DEFAULT 'Xin chào! Đây là tin nhắn tự động.',
    reply_delay INTEGER DEFAULT 2000,
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Index để tăng tốc query
CREATE INDEX IF NOT EXISTS idx_bot_settings_user_id ON bot_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_bot_settings_enabled ON bot_settings(enabled);

-- Comment
COMMENT ON TABLE bot_settings IS 'Cài đặt bot của từng user';
COMMENT ON COLUMN bot_settings.enabled IS 'Bot có đang bật không';
COMMENT ON COLUMN bot_settings.auto_reply_message IS 'Tin nhắn tự động';
COMMENT ON COLUMN bot_settings.reply_delay IS 'Delay trước khi reply (ms)';
COMMENT ON COLUMN bot_settings.settings IS 'Các settings khác (JSON)';

-- =====================================================
-- Table: message_logs (Optional - để log tin nhắn)
-- =====================================================
CREATE TABLE IF NOT EXISTS message_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    thread_id VARCHAR(255) NOT NULL,
    sender_id VARCHAR(255) NOT NULL,
    message_text TEXT,
    message_type VARCHAR(50) DEFAULT 'text',
    is_from_bot BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index
CREATE INDEX IF NOT EXISTS idx_message_logs_user_id ON message_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_message_logs_thread_id ON message_logs(thread_id);
CREATE INDEX IF NOT EXISTS idx_message_logs_created_at ON message_logs(created_at);

-- Comment
COMMENT ON TABLE message_logs IS 'Log tin nhắn (optional)';

-- =====================================================
-- Function: Update updated_at timestamp
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger cho zalo_sessions
DROP TRIGGER IF EXISTS update_zalo_sessions_updated_at ON zalo_sessions;
CREATE TRIGGER update_zalo_sessions_updated_at
    BEFORE UPDATE ON zalo_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger cho bot_settings
DROP TRIGGER IF EXISTS update_bot_settings_updated_at ON bot_settings;
CREATE TRIGGER update_bot_settings_updated_at
    BEFORE UPDATE ON bot_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Seed Data (Optional - test data)
-- =====================================================
-- Uncomment để tạo test user
-- INSERT INTO users (session_id) VALUES ('test-session-123');

-- =====================================================
-- Useful Queries
-- =====================================================

-- 1. Xem tất cả users và sessions
/*
SELECT 
    u.id as user_id,
    u.session_id,
    u.last_active,
    zs.user_info->>'displayName' as zalo_name,
    zs.is_active as has_zalo_session,
    bs.enabled as bot_enabled
FROM users u
LEFT JOIN zalo_sessions zs ON u.id = zs.user_id
LEFT JOIN bot_settings bs ON u.id = bs.user_id
ORDER BY u.last_active DESC;
*/

-- 2. Xem active bots
/*
SELECT 
    u.session_id,
    zs.user_info->>'displayName' as zalo_name,
    bs.auto_reply_message
FROM users u
JOIN zalo_sessions zs ON u.id = zs.user_id AND zs.is_active = true
JOIN bot_settings bs ON u.id = bs.user_id AND bs.enabled = true;
*/

-- 3. Cleanup inactive sessions (older than 30 days)
/*
UPDATE zalo_sessions 
SET is_active = false 
WHERE updated_at < NOW() - INTERVAL '30 days';
*/

-- 4. Delete old users (no activity for 90 days)
/*
DELETE FROM users 
WHERE last_active < NOW() - INTERVAL '90 days'
AND id NOT IN (
    SELECT user_id FROM zalo_sessions WHERE is_active = true
);
*/

-- =====================================================
-- Grants (if needed)
-- =====================================================
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO neondb_owner;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO neondb_owner;

-- =====================================================
-- Done! Schema created successfully
-- =====================================================
