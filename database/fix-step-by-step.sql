-- STEP BY STEP FIX - Run each section separately

-- ========================================
-- STEP 1: Check current constraints
-- ========================================
SELECT 'Current constraint on user_settings:' as step;
SELECT constraint_name, table_name, column_name 
FROM information_schema.key_column_usage
WHERE table_name = 'user_settings' AND column_name = 'user_id';

-- ========================================  
-- STEP 2: Drop old constraint
-- ========================================
-- Run this FIRST, then check if it worked
ALTER TABLE user_settings DROP CONSTRAINT IF EXISTS user_settings_user_id_fkey CASCADE;

-- Verify it's gone
SELECT 'After dropping - should be empty:' as step;
SELECT constraint_name 
FROM information_schema.table_constraints
WHERE table_name = 'user_settings' AND constraint_type = 'FOREIGN KEY';

-- ========================================
-- STEP 3: Check existing data
-- ========================================
SELECT 'Existing user_settings records:' as step;
SELECT user_id FROM user_settings;

SELECT 'Valid users in users table:' as step;
SELECT id FROM users;

-- Check which user_settings are orphaned
SELECT 'Orphaned user_settings (will be deleted):' as step;
SELECT us.user_id 
FROM user_settings us
WHERE us.user_id NOT IN (SELECT id FROM users);

-- ========================================
-- STEP 4: Clean orphaned records
-- ========================================
-- Run this SECOND
DELETE FROM user_settings 
WHERE user_id NOT IN (SELECT id FROM users);

SELECT 'Records deleted. Remaining user_settings:' as step;
SELECT COUNT(*) FROM user_settings;

-- ========================================
-- STEP 5: Add new constraint
-- ========================================
-- Run this THIRD
ALTER TABLE user_settings 
ADD CONSTRAINT user_settings_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

SELECT 'New constraint added. Verify:' as step;
SELECT tc.constraint_name, ccu.table_name AS foreign_table
FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage ccu 
  ON tc.constraint_name = ccu.constraint_name
WHERE tc.table_name = 'user_settings' AND tc.constraint_type = 'FOREIGN KEY';

-- ========================================
-- STEP 6: Insert missing user_settings
-- ========================================
-- Run this LAST
INSERT INTO user_settings (
    user_id, notification_sound, reply_delay, learning_mode, auto_mark_read,
    max_reply_length, dark_mode, animations, font_size, save_history, 
    auto_delete_days, ai_enabled, ai_personality, ai_max_length, ai_trigger_mode
)
SELECT 
    u.id, true, 2, false, true, 500, true, true, 'medium', true, 'never',
    true, 'cute', 500, 'smart'
FROM users u
WHERE NOT EXISTS (SELECT 1 FROM user_settings us WHERE us.user_id = u.id)
ON CONFLICT (user_id) DO NOTHING;

-- ========================================
-- FINAL VERIFICATION
-- ========================================
SELECT 
    'FINAL RESULT' as step,
    u.id as user_id,
    LEFT(u.session_id, 20) as session_id,
    EXISTS(SELECT 1 FROM user_settings WHERE user_id = u.id) as has_user_settings,
    EXISTS(SELECT 1 FROM bot_settings WHERE user_id = u.id) as has_bot_settings
FROM users u
ORDER BY u.last_active DESC;
