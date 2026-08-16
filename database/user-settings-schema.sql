-- Create user_settings table
CREATE TABLE IF NOT EXISTS user_settings (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  
  -- Notification settings
  notification_sound BOOLEAN DEFAULT true,
  
  -- Auto reply settings
  reply_delay INTEGER DEFAULT 2,
  learning_mode BOOLEAN DEFAULT false,
  auto_mark_read BOOLEAN DEFAULT true,
  max_reply_length INTEGER DEFAULT 500,
  
  -- AI settings
  ai_enabled BOOLEAN DEFAULT true,
  ai_personality VARCHAR(50) DEFAULT 'friendly',
  ai_max_length INTEGER DEFAULT 200,
  ai_trigger_mode VARCHAR(50) DEFAULT 'smart',
  
  -- Display settings
  dark_mode BOOLEAN DEFAULT true,
  animations BOOLEAN DEFAULT true,
  font_size VARCHAR(20) DEFAULT 'medium',
  
  -- Data & Privacy settings
  save_history BOOLEAN DEFAULT true,
  auto_delete_days VARCHAR(20) DEFAULT 'never',
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_settings_updated_at
BEFORE UPDATE ON user_settings
FOR EACH ROW
EXECUTE FUNCTION update_user_settings_updated_at();
