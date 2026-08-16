-- Quick test: Cleanup auth_sessions for user c3d54091-4a58-4a48-be46-51b11f767af7
-- Run this to see immediate results

-- Before cleanup: Show current sessions
SELECT '=== BEFORE CLEANUP ===' as info;
SELECT 
  COUNT(*) as total_sessions,
  COUNT(*) FILTER (WHERE is_active = true) as active,
  COUNT(*) FILTER (WHERE is_active = false) as inactive
FROM auth_sessions
WHERE user_id = 'c3d54091-4a58-4a48-be46-51b11f767af7';

-- Step 1: Delete expired sessions
DELETE FROM auth_sessions 
WHERE user_id = 'c3d54091-4a58-4a48-be46-51b11f767af7'
AND expires_at < NOW();

-- Step 2: Delete inactive sessions (older than 24 hours)
DELETE FROM auth_sessions 
WHERE user_id = 'c3d54091-4a58-4a48-be46-51b11f767af7'
AND is_active = false 
AND last_active < NOW() - INTERVAL '24 hours';

-- Step 3: Keep only 3 most recent active sessions
DELETE FROM auth_sessions
WHERE user_id = 'c3d54091-4a58-4a48-be46-51b11f767af7'
AND id NOT IN (
  SELECT id FROM auth_sessions
  WHERE user_id = 'c3d54091-4a58-4a48-be46-51b11f767af7'
  AND is_active = true
  ORDER BY last_active DESC
  LIMIT 3
);

-- After cleanup: Show remaining sessions
SELECT '=== AFTER CLEANUP ===' as info;
SELECT 
  COUNT(*) as total_sessions,
  COUNT(*) FILTER (WHERE is_active = true) as active,
  COUNT(*) FILTER (WHERE is_active = false) as inactive
FROM auth_sessions
WHERE user_id = 'c3d54091-4a58-4a48-be46-51b11f767af7';

-- Show remaining sessions detail
SELECT '=== REMAINING SESSIONS ===' as info;
SELECT 
  id,
  LEFT(session_token, 40) || '...' as session_token,
  device_info->>'type' as device_type,
  device_info->>'os' as os,
  is_active,
  last_active,
  expires_at
FROM auth_sessions
WHERE user_id = 'c3d54091-4a58-4a48-be46-51b11f767af7'
ORDER BY last_active DESC;
