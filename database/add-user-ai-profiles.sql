-- Migration: Add user_ai_profiles table for personalized AI settings
-- This allows each user to configure how AI responds on their behalf

CREATE TABLE IF NOT EXISTS user_ai_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  zalo_user_id TEXT,                    -- Zalo user ID for matching messages
  zalo_display_name TEXT NOT NULL,      -- Display name from Zalo (e.g., "Hoàng Kiều Phong")
  nicknames TEXT[] DEFAULT '{}',        -- Alternative names/nicknames (e.g., ["Phong", "HKP"])
  ai_reply_mode TEXT DEFAULT 'mention_only' CHECK (ai_reply_mode IN ('mention_only', 'name_detect', 'smart_auto')),
  context_length INTEGER DEFAULT 20,    -- Number of messages to read for context
  remember_context BOOLEAN DEFAULT true, -- Whether AI should remember previous conversations
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for fast lookup by zalo_user_id
CREATE INDEX IF NOT EXISTS idx_user_ai_profiles_zalo_user_id ON user_ai_profiles(zalo_user_id);

-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_user_ai_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_ai_profiles_updated_at
  BEFORE UPDATE ON user_ai_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_ai_profiles_updated_at();

-- Add comment
COMMENT ON TABLE user_ai_profiles IS 'Stores personalized AI reply settings for each user, allowing AI to respond on their behalf when mentioned or replied to';
