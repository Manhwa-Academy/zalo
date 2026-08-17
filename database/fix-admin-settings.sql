-- Fix settings for the REAL admin user
-- User ID: c3d54091-4a58-4a48-be46-51b11f767af7

-- Create user_settings for admin
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
    ai_trigger_mode
) VALUES (
    'c3d54091-4a58-4a48-be46-51b11f767af7',
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
    'smart' -- AI trigger mode
)
ON CONFLICT (user_id) DO UPDATE SET
    ai_enabled = true,
    ai_personality = 'cute',
    ai_max_length = 500,
    ai_trigger_mode = 'smart',
    updated_at = CURRENT_TIMESTAMP;

-- Create bot_settings for admin if not exists
INSERT INTO bot_settings (
    user_id,
    enabled,
    auto_reply_message,
    reply_delay,
    settings
) VALUES (
    'c3d54091-4a58-4a48-be46-51b11f767af7',
    true,
    'Xin chào! Đây là tin nhắn tự động.',
    2000,
    jsonb_build_object(
        'replyScope', 'all',
        'whitelist', '[]'::jsonb,
        'blacklist', '[]'::jsonb,
        'useRandomPreset', true,
        'presetMessages', jsonb_build_array(
            'E-Eto... tôi là Monica Everett... xin hãy chiếu cố cho tôi từ bây giờ nhé... 🌸✨🥺🤍',
            'U-Um... nếu tôi trốn sau cánh cửa thì xin đừng kéo tôi ra nhé... 🚪🥺💦',
            'Fuee... c-chuyện này khó quá đi mất... (՚﹏՚)💦',
            'A-Anou... đừng nói cho mọi người biết nhé... tôi tin bạn đó... 🥺🌸🤍✨',
            'S-Sono... nếu có thể giúp được mọi người thì tôi rất vui... 🍀🤍✨'
        )
    )
)
ON CONFLICT (user_id) DO UPDATE SET
    enabled = true,
    updated_at = CURRENT_TIMESTAMP;

-- Verify
SELECT 
    'user_settings' as table_name,
    user_id,
    ai_enabled,
    ai_personality,
    ai_trigger_mode
FROM user_settings 
WHERE user_id = 'c3d54091-4a58-4a48-be46-51b11f767af7'
UNION ALL
SELECT 
    'bot_settings' as table_name,
    user_id,
    enabled::text as ai_enabled,
    (settings->>'replyScope') as ai_personality,
    (settings->>'useRandomPreset') as ai_trigger_mode
FROM bot_settings 
WHERE user_id = 'c3d54091-4a58-4a48-be46-51b11f767af7';
