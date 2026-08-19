-- =====================================================
-- Table: messages
-- Lưu tin nhắn Zalo cho multi-device sync
-- =====================================================

CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    msg_id VARCHAR(255) NOT NULL,
    cli_msg_id VARCHAR(255),
    thread_id VARCHAR(255) NOT NULL,
    content TEXT,
    message_type VARCHAR(50) DEFAULT 'text',
    sender_id VARCHAR(255),
    sender_name VARCHAR(255),
    is_self BOOLEAN DEFAULT false,
    timestamp TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    replied BOOLEAN DEFAULT false,
    is_undo BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Unique constraint: same message ID for same user
    UNIQUE(user_id, msg_id)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_messages_msg_id ON messages(msg_id);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_messages_user_thread ON messages(user_id, thread_id, timestamp DESC);

-- Comments
COMMENT ON TABLE messages IS 'Lưu tin nhắn Zalo cho multi-device sync';
COMMENT ON COLUMN messages.msg_id IS 'Message ID từ Zalo';
COMMENT ON COLUMN messages.cli_msg_id IS 'Client message ID';
COMMENT ON COLUMN messages.thread_id IS 'Thread/Conversation ID';
COMMENT ON COLUMN messages.content IS 'Nội dung tin nhắn (text hoặc JSON)';
COMMENT ON COLUMN messages.is_self IS 'Tin nhắn tự gửi hay nhận';
COMMENT ON COLUMN messages.replied IS 'Bot đã reply chưa';
COMMENT ON COLUMN messages.is_undo IS 'Tin nhắn bị thu hồi';
COMMENT ON COLUMN messages.metadata IS 'Metadata bổ sung (avatar, quote, etc)';
