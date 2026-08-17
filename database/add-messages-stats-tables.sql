-- =====================================================
-- Add Messages & Stats Tables
-- Migrate from JSON files to PostgreSQL
-- =====================================================

-- =====================================================
-- Table: zalo_messages
-- Lưu toàn bộ tin nhắn chi tiết (thay thế .zalo-messages.json)
-- =====================================================
CREATE TABLE IF NOT EXISTS zalo_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Message metadata
    msg_id VARCHAR(255),                    -- msgId từ Zalo
    cli_msg_id VARCHAR(255),                -- cliMsgId (client message ID)
    thread_id VARCHAR(255) NOT NULL,        -- Thread/Conversation ID
    
    -- Message content
    content TEXT,                           -- Nội dung tin nhắn (text hoặc JSON)
    message_type VARCHAR(50) DEFAULT 'text', -- Type: text, image, sticker, file, link
    
    -- Sender info
    sender_id VARCHAR(255),                 -- ID người gửi
    sender_name VARCHAR(255),               -- Tên người gửi
    is_self BOOLEAN DEFAULT false,          -- Tin nhắn từ chính mình?
    
    -- Timestamps
    timestamp BIGINT,                       -- Unix timestamp (milliseconds)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Bot tracking
    replied BOOLEAN DEFAULT false,          -- Bot đã reply chưa?
    is_undo BOOLEAN DEFAULT false,          -- Tin nhắn đã bị thu hồi?
    
    -- Extra metadata
    metadata JSONB DEFAULT '{}'::jsonb      -- Dữ liệu bổ sung (avatar, quote, etc.)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_zalo_messages_user_id ON zalo_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_zalo_messages_thread_id ON zalo_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_zalo_messages_msg_id ON zalo_messages(msg_id);
CREATE INDEX IF NOT EXISTS idx_zalo_messages_cli_msg_id ON zalo_messages(cli_msg_id);
CREATE INDEX IF NOT EXISTS idx_zalo_messages_timestamp ON zalo_messages(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_zalo_messages_created_at ON zalo_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_zalo_messages_is_self ON zalo_messages(is_self);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_zalo_messages_user_thread ON zalo_messages(user_id, thread_id);

-- Unique constraint to prevent duplicate messages
CREATE UNIQUE INDEX IF NOT EXISTS idx_zalo_messages_unique 
ON zalo_messages(user_id, thread_id, msg_id) 
WHERE msg_id IS NOT NULL;

-- Comments
COMMENT ON TABLE zalo_messages IS 'Lưu toàn bộ tin nhắn Zalo (thay thế .zalo-messages.json)';
COMMENT ON COLUMN zalo_messages.msg_id IS 'msgId từ Zalo API';
COMMENT ON COLUMN zalo_messages.cli_msg_id IS 'Client message ID (optimistic message)';
COMMENT ON COLUMN zalo_messages.content IS 'Nội dung tin nhắn (text hoặc JSON cho media)';
COMMENT ON COLUMN zalo_messages.replied IS 'Bot đã tự động reply chưa?';
COMMENT ON COLUMN zalo_messages.is_undo IS 'Tin nhắn đã bị thu hồi?';

-- =====================================================
-- Table: zalo_stats
-- Lưu thống kê bot (thay thế .zalo-stats.json)
-- =====================================================
CREATE TABLE IF NOT EXISTS zalo_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Overall stats
    total_received INTEGER DEFAULT 0,       -- Tổng tin nhắn nhận được
    total_sent INTEGER DEFAULT 0,           -- Tổng tin nhắn gửi đi
    total_auto_replied INTEGER DEFAULT 0,   -- Tổng tin nhắn auto-reply
    
    -- Period stats (daily)
    stats_date DATE DEFAULT CURRENT_DATE,   -- Ngày thống kê
    received_today INTEGER DEFAULT 0,       -- Tin nhận hôm nay
    sent_today INTEGER DEFAULT 0,           -- Tin gửi hôm nay
    auto_replied_today INTEGER DEFAULT 0,   -- Auto-reply hôm nay
    
    -- Thread-level stats
    thread_id VARCHAR(255),                 -- Thread ID (optional, cho stats từng thread)
    thread_name VARCHAR(255),               -- Tên thread
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Unique constraint: 1 user chỉ có 1 row stats tổng (thread_id = NULL)
    -- Và có thể có nhiều rows cho từng thread
    UNIQUE(user_id, thread_id, stats_date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_zalo_stats_user_id ON zalo_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_zalo_stats_thread_id ON zalo_stats(thread_id);
CREATE INDEX IF NOT EXISTS idx_zalo_stats_stats_date ON zalo_stats(stats_date DESC);
CREATE INDEX IF NOT EXISTS idx_zalo_stats_updated_at ON zalo_stats(updated_at DESC);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_zalo_stats_user_date ON zalo_stats(user_id, stats_date);

-- Comments
COMMENT ON TABLE zalo_stats IS 'Lưu thống kê bot (thay thế .zalo-stats.json)';
COMMENT ON COLUMN zalo_stats.total_received IS 'Tổng tin nhắn nhận được (all time)';
COMMENT ON COLUMN zalo_stats.total_sent IS 'Tổng tin nhắn gửi đi (all time)';
COMMENT ON COLUMN zalo_stats.total_auto_replied IS 'Tổng tin nhắn auto-reply (all time)';
COMMENT ON COLUMN zalo_stats.stats_date IS 'Ngày thống kê (cho daily stats)';

-- Trigger to update updated_at
DROP TRIGGER IF EXISTS update_zalo_stats_updated_at ON zalo_stats;
CREATE TRIGGER update_zalo_stats_updated_at
    BEFORE UPDATE ON zalo_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Useful Queries
-- =====================================================

-- 1. Lấy toàn bộ tin nhắn của 1 thread
/*
SELECT * FROM zalo_messages
WHERE user_id = 'xxx' AND thread_id = 'yyy'
ORDER BY timestamp DESC
LIMIT 100;
*/

-- 2. Lấy thống kê tổng của user
/*
SELECT * FROM zalo_stats
WHERE user_id = 'xxx' AND thread_id IS NULL AND stats_date = CURRENT_DATE;
*/

-- 3. Lấy stats theo thread
/*
SELECT thread_name, total_received, total_sent, total_auto_replied
FROM zalo_stats
WHERE user_id = 'xxx' AND thread_id IS NOT NULL
ORDER BY total_received DESC;
*/

-- 4. Cleanup old messages (older than 30 days)
/*
DELETE FROM zalo_messages 
WHERE created_at < NOW() - INTERVAL '30 days';
*/

-- =====================================================
-- Done! Tables created successfully
-- =====================================================
