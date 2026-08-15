-- =====================================================
-- Migration: Add media_cache table
-- Purpose: Store media URLs (Giphy GIFs, images) to prevent expiration
-- =====================================================

-- Create media_cache table
CREATE TABLE IF NOT EXISTS media_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    file_name VARCHAR(500) NOT NULL,
    original_url TEXT NOT NULL,
    media_type VARCHAR(50) DEFAULT 'image',
    giphy_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_media_cache_file_name ON media_cache(file_name);
CREATE INDEX IF NOT EXISTS idx_media_cache_giphy_id ON media_cache(giphy_id);
CREATE INDEX IF NOT EXISTS idx_media_cache_user_id ON media_cache(user_id);
CREATE INDEX IF NOT EXISTS idx_media_cache_created_at ON media_cache(created_at);

-- Unique constraint: same filename for same user
CREATE UNIQUE INDEX IF NOT EXISTS idx_media_cache_unique_file 
ON media_cache(user_id, file_name);

-- Comments
COMMENT ON TABLE media_cache IS 'Cache media URLs (Giphy GIFs, images) to prevent Zalo CDN expiration';
COMMENT ON COLUMN media_cache.file_name IS 'Original filename (e.g., giphy_xxx.gif)';
COMMENT ON COLUMN media_cache.original_url IS 'Original media URL (Giphy, direct URL, etc.)';
COMMENT ON COLUMN media_cache.media_type IS 'Type: image, gif, video, file';
COMMENT ON COLUMN media_cache.giphy_id IS 'Giphy ID if this is a Giphy GIF';

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_media_cache_updated_at ON media_cache;
CREATE TRIGGER update_media_cache_updated_at
    BEFORE UPDATE ON media_cache
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Migration complete!
-- =====================================================
