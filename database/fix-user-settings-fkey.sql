-- FIX: Change user_settings to reference users table instead of auth_users
-- This makes it consistent with bot_settings

-- Step 1: Find and drop ALL foreign key constraints on user_settings
DO $$ 
DECLARE
    constraint_name text;
BEGIN
    FOR constraint_name IN 
        SELECT tc.constraint_name
        FROM information_schema.table_constraints AS tc
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'user_settings'
        AND tc.table_schema = 'public'
    LOOP
        EXECUTE format('ALTER TABLE user_settings DROP CONSTRAINT IF EXISTS %I CASCADE', constraint_name);
        RAISE NOTICE 'Dropped constraint: %', constraint_name;
    END LOOP;
END $$;

-- Step 2: Add new foreign key to users table
ALTER TABLE user_settings 
ADD CONSTRAINT user_settings_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Step 3: Delete orphaned user_settings (for users that don't exist in users table)
DELETE FROM user_settings 
WHERE user_id NOT IN (SELECT id FROM users);

-- Step 4: Create user_settings for all users in users table
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
    u.id,
    true, 2, false, true, 500, true, true, 'medium', true, 'never',
    true, 'cute', 500, 'smart'
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM user_settings us WHERE us.user_id = u.id
)
ON CONFLICT (user_id) DO NOTHING;

-- Step 5: Verify
SELECT 
    'Verification' as info,
    u.id as user_id,
    u.session_id,
    EXISTS(SELECT 1 FROM user_settings WHERE user_id = u.id) as has_user_settings,
    EXISTS(SELECT 1 FROM bot_settings WHERE user_id = u.id) as has_bot_settings
FROM users u
ORDER BY u.last_active DESC;
