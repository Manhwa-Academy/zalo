-- Create user_settings for the current user (aeb707c3-4acc-4211-b197-d335e5cae10b)
-- Run this in your PostgreSQL database

-- Insert user_settings with AI enabled
INSERT INTO user_settings (
    user_id,
    notification_sound,
    reply_delay,
    learning_mode,
    auto_mark_read,
    max_reply_length,
    dark_mode,
    animations,
    font_size,
    save_history,
    auto_delete_days,
    ai_enabled,
    ai_personality,
    ai_max_length,
    ai_trigger_mode,
    gemini_model
) VALUES (
    'aeb707c3-4acc-4211-b197-d335e5cae10b',
    true,
    2,
    false,
    true,
    500,
    true,
    true,
    'medium',
    true,
    'never',
    true,  -- AI enabled
    'cute', -- AI personality
    500,    -- AI max length
    'smart', -- AI trigger mode (smart = only reply to questions and messages with keywords)
    'gemini-3.1-flash-lite' -- Gemini model
)
ON CONFLICT (user_id) DO UPDATE SET
    ai_enabled = true,
    ai_personality = 'cute',
    ai_max_length = 500,
    ai_trigger_mode = 'smart',
    gemini_model = 'gemini-3.1-flash-lite',
    updated_at = CURRENT_TIMESTAMP;

-- Verify the result
SELECT 
    user_id,
    ai_enabled,
    ai_personality,
    ai_max_length,
    ai_trigger_mode,
    gemini_model,
    created_at,
    updated_at
FROM user_settings 
WHERE user_id = 'aeb707c3-4acc-4211-b197-d335e5cae10b';
