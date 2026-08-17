-- FIX ALL SETTINGS
-- This script will create settings for BOTH user systems

-- Step 1: Get the current users in both tables
\echo 'Step 1: Checking existing users...'

-- Step 2: Create user_settings for ALL users in auth_users
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
)
SELECT 
    au.id as user_id,
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
FROM auth_users au
WHERE NOT EXISTS (
    SELECT 1 FROM user_settings us WHERE us.user_id = au.id
);

\echo 'Step 2: Created user_settings for auth_users'

-- Step 3: Create bot_settings for ALL users in users table
INSERT INTO bot_settings (
    user_id,
    enabled,
    auto_reply_message,
    reply_delay,
    settings
)
SELECT 
    u.id as user_id,
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
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM bot_settings bs WHERE bs.user_id = u.id
);

\echo 'Step 3: Created bot_settings for users'

-- Step 4: Verify results
\echo 'Step 4: Verification'

SELECT 
    'Summary' as info,
    (SELECT COUNT(*) FROM auth_users) as total_auth_users,
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COUNT(*) FROM user_settings) as total_user_settings,
    (SELECT COUNT(*) FROM bot_settings) as total_bot_settings;

-- Show which users still need settings
SELECT 
    'Missing user_settings' as issue,
    au.id,
    au.username
FROM auth_users au
WHERE NOT EXISTS (SELECT 1 FROM user_settings us WHERE us.user_id = au.id);

SELECT 
    'Missing bot_settings' as issue,
    u.id,
    u.session_id
FROM users u
WHERE NOT EXISTS (SELECT 1 FROM bot_settings bs WHERE bs.user_id = u.id);
