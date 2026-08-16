-- Add AI settings columns to user_settings table
ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS ai_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS ai_personality VARCHAR(50) DEFAULT 'friendly',
ADD COLUMN IF NOT EXISTS ai_max_length INTEGER DEFAULT 200,
ADD COLUMN IF NOT EXISTS ai_trigger_mode VARCHAR(50) DEFAULT 'smart';
