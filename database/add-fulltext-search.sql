-- =====================================================
-- Add Full-Text Search to zalo_messages
-- PostgreSQL FTS for fast message search
-- =====================================================

-- 1. Add tsvector column for full-text search
ALTER TABLE zalo_messages 
ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- 2. Create function to update search_vector
-- This extracts text from JSON content if needed
CREATE OR REPLACE FUNCTION update_message_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    -- Extract searchable text from content
    -- If content is JSON, try to extract text fields
    -- Otherwise use content as-is
    NEW.search_vector := to_tsvector('simple', 
        COALESCE(
            -- Try to extract from JSON if it's a text message
            CASE 
                WHEN NEW.content ~ '^[^{]' THEN NEW.content  -- Plain text
                WHEN NEW.content::jsonb ? 'text' THEN NEW.content::jsonb->>'text'
                WHEN NEW.content::jsonb ? 'title' THEN NEW.content::jsonb->>'title'
                WHEN NEW.content::jsonb ? 'caption' THEN NEW.content::jsonb->>'caption'
                WHEN NEW.content::jsonb ? 'description' THEN NEW.content::jsonb->>'description'
                ELSE NEW.content  -- Fallback to raw content
            END,
            ''
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create trigger to auto-update search_vector
DROP TRIGGER IF EXISTS trigger_update_message_search_vector ON zalo_messages;
CREATE TRIGGER trigger_update_message_search_vector
    BEFORE INSERT OR UPDATE OF content
    ON zalo_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_message_search_vector();

-- 4. Create GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS idx_zalo_messages_search_vector 
ON zalo_messages USING GIN(search_vector);

-- 5. Update existing messages to populate search_vector
UPDATE zalo_messages
SET content = content  -- This triggers the update function
WHERE search_vector IS NULL;

-- 6. Create search function for convenience
CREATE OR REPLACE FUNCTION search_messages(
    p_user_id UUID,
    p_thread_id VARCHAR(255),
    p_query TEXT,
    p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
    result_id UUID,
    result_msg_id VARCHAR(255),
    result_thread_id VARCHAR(255),
    result_content TEXT,
    result_sender_name VARCHAR(255),
    result_is_self BOOLEAN,
    result_timestamp BIGINT,
    result_rank REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.msg_id,
        m.thread_id,
        m.content,
        m.sender_name,
        m.is_self,
        m.timestamp,
        ts_rank(m.search_vector, plainto_tsquery('simple', p_query))::REAL AS rank
    FROM zalo_messages m
    WHERE 
        m.user_id = p_user_id
        AND m.thread_id = p_thread_id
        AND m.search_vector @@ plainto_tsquery('simple', p_query)
        AND m.message_type NOT IN ('image', 'file', 'sticker', 'link')  -- Skip media
    ORDER BY m.timestamp ASC  -- Oldest first (same as UI)
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Usage Examples
-- =====================================================

/*
-- Search messages in a thread
SELECT * FROM search_messages(
    'user-uuid-here',
    'thread-id-here',
    'gì',
    100
);
-- Returns: result_id, result_msg_id, result_thread_id, result_content, 
--          result_sender_name, result_is_self, result_timestamp, result_rank

-- Direct query with tsquery
SELECT id, content, sender_name, timestamp
FROM zalo_messages
WHERE 
    user_id = 'xxx' 
    AND thread_id = 'yyy'
    AND search_vector @@ plainto_tsquery('simple', 'search term')
ORDER BY timestamp ASC;
*/

-- =====================================================
-- Done! Full-text search enabled
-- =====================================================
