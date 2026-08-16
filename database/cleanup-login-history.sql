-- Cleanup old login history records
-- Keep only the latest record for each action type per user

-- Step 1: Delete all but the latest login record per user
DELETE FROM auth_login_history
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id, action) id
  FROM auth_login_history
  ORDER BY user_id, action, created_at DESC
);

-- Step 2: Verify remaining records
SELECT 'Remaining login history records:' as info;
SELECT 
  user_id,
  action,
  COUNT(*) as count,
  MAX(created_at) as latest_event
FROM auth_login_history
GROUP BY user_id, action
ORDER BY user_id, action;

-- Step 3: Show total count
SELECT 'Total records:' as info, COUNT(*) as total FROM auth_login_history;
