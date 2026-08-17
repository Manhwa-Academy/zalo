-- Add Gemini API settings to user_settings table
-- Each user can have their own API key and model preference

ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS gemini_api_key TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS gemini_model VARCHAR(100) DEFAULT 'gemini-3.1-flash-lite';

-- Add comment
COMMENT ON COLUMN user_settings.gemini_api_key IS 'User personal Gemini API key (optional, fallback to system key)';
COMMENT ON COLUMN user_settings.gemini_model IS 'Preferred Gemini model (gemini-3.1-flash-lite, gemini-2.5-flash-lite, etc.)';

-- Show current settings
SELECT 
  user_id,
  gemini_api_key IS NOT NULL as has_api_key,
  gemini_model,
  updated_at
FROM user_settings;
