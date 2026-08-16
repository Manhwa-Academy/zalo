-- Script to merge all Zalo sessions to one user
-- Strategy: Keep latest session, delete others, then merge users

-- Step 1: Delete old/duplicate zalo_sessions first (keep only the latest one)
DELETE FROM zalo_sessions 
WHERE user_id IN (
  '40d97da3-3061-4598-9db2-2454459c2526',
  'bf4c38a7-b192-4915-b16e-f11c38940117'
);

-- Step 2: Keep only the latest bot_settings, delete duplicates
-- First backup the latest settings
DO $$
DECLARE
  latest_settings jsonb;
BEGIN
  SELECT settings INTO latest_settings
  FROM bot_settings 
  WHERE user_id = 'aeb707c3-4acc-4211-b197-d335e5cae10b'
  ORDER BY updated_at DESC
  LIMIT 1;
  
  -- Delete other bot_settings for this user
  DELETE FROM bot_settings 
  WHERE user_id = 'aeb707c3-4acc-4211-b197-d335e5cae10b'
  AND id NOT IN (
    SELECT id FROM bot_settings 
    WHERE user_id = 'aeb707c3-4acc-4211-b197-d335e5cae10b'
    ORDER BY updated_at DESC 
    LIMIT 1
  );
END $$;

-- Step 3: Delete bot_settings for old users
DELETE FROM bot_settings 
WHERE user_id IN (
  '40d97da3-3061-4598-9db2-2454459c2526',
  '7a22707f-f360-4469-a3f6-b92ff4454cd8',
  '7ab2b138-4021-415f-883e-fce6d108a647',
  '864f6846-fb92-4517-a5a4-064bfdfe0146',
  '9da7d1bb-3fee-4a9c-a667-977f48f3f0c4',
  'bf4c38a7-b192-4915-b16e-f11c38940117'
);

-- Step 4: Delete old users from users table
DELETE FROM users 
WHERE id IN (
  '40d97da3-3061-4598-9db2-2454459c2526',
  '7a22707f-f360-4469-a3f6-b92ff4454cd8',
  '7ab2b138-4021-415f-883e-fce6d108a647',
  '864f6846-fb92-4517-a5a4-064bfdfe0146',
  '9da7d1bb-3fee-4a9c-a667-977f48f3f0c4',
  'bf4c38a7-b192-4915-b16e-f11c38940117'
);

-- Step 5: Verify results
SELECT '=== CLEANUP SUMMARY ===' as info;
SELECT '';

SELECT 'Table Counts:' as info;
SELECT 'auth_users' as table_name, COUNT(*) as count FROM auth_users
UNION ALL
SELECT 'users (Zalo)', COUNT(*) FROM users
UNION ALL
SELECT 'zalo_sessions', COUNT(*) FROM zalo_sessions
UNION ALL
SELECT 'bot_settings', COUNT(*) FROM bot_settings
UNION ALL
SELECT 'user_settings', COUNT(*) FROM user_settings;

SELECT '';
SELECT 'Remaining User:' as info;
SELECT id, session_id, created_at, last_active FROM users;

SELECT '';
SELECT 'Active Zalo Session:' as info;
SELECT user_id, is_active, updated_at 
FROM zalo_sessions;

SELECT '';
SELECT 'Bot Settings:' as info;
SELECT user_id, enabled, updated_at 
FROM bot_settings;
