-- SOLUTION: Link users table to auth_users
-- The issue: user_settings uses auth_users, but bot uses users table

-- Option 1: Add auth_user_id column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth_users(id);

-- Link all existing users to the admin user (since there's only one admin)
UPDATE users 
SET auth_user_id = 'c3d54091-4a58-4a48-be46-51b11f767af7'
WHERE auth_user_id IS NULL;

-- Verify
SELECT 
    u.id as user_id,
    u.session_id,
    u.auth_user_id,
    au.username as linked_to_username,
    EXISTS(SELECT 1 FROM bot_settings WHERE user_id = u.id) as has_bot_settings,
    EXISTS(SELECT 1 FROM user_settings WHERE user_id = u.auth_user_id) as has_user_settings
FROM users u
LEFT JOIN auth_users au ON au.id = u.auth_user_id
ORDER BY u.last_active DESC;
