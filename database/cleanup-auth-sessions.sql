-- Cleanup old/inactive auth sessions
-- Keep only active sessions and delete expired/inactive ones

-- Step 1: Delete expired sessions
DELETE FROM auth_sessions 
WHERE expires_at < NOW();

-- Step 2: Delete inactive sessions (older than 24 hours)
DELETE FROM auth_sessions 
WHERE is_active = false 
AND last_active < NOW() - INTERVAL '24 hours';

-- Step 3: For each user, keep only the 3 most recent active sessions
DELETE FROM auth_sessions
WHERE id IN (
  SELECT id FROM (
    SELECT 
      id,
      ROW_NUMBER() OVER (
        PARTITION BY user_id 
        ORDER BY last_active DESC
      ) as row_num
    FROM auth_sessions
    WHERE is_active = true
  ) ranked
  WHERE row_num > 3
);

-- Step 4: Verify remaining sessions
SELECT '=== CLEANUP SUMMARY ===' as info;
SELECT '';

SELECT 'Sessions per user:' as info;
SELECT 
  user_id,
  COUNT(*) as total_sessions,
  COUNT(*) FILTER (WHERE is_active = true) as active_sessions,
  COUNT(*) FILTER (WHERE is_active = false) as inactive_sessions,
  MAX(last_active) as latest_activity
FROM auth_sessions
GROUP BY user_id;

SELECT '';
SELECT 'Total sessions:' as info;
SELECT COUNT(*) as total FROM auth_sessions;
