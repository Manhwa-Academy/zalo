-- ========================================================================
-- Script to cleanup duplicate users with same Zalo account
-- Strategy: Keep the most recent user for each Zalo userId, delete others
-- ========================================================================

-- Step 1: Find duplicate users (same Zalo userId)
SELECT 
  zs.user_info->>'userId' as zalo_user_id,
  zs.user_info->>'displayName' as zalo_name,
  COUNT(DISTINCT u.id) as user_count,
  STRING_AGG(u.id::text, ', ') as user_ids
FROM users u
INNER JOIN zalo_sessions zs ON u.id = zs.user_id
WHERE zs.user_info->>'userId' IS NOT NULL
GROUP BY zs.user_info->>'userId', zs.user_info->>'displayName'
HAVING COUNT(DISTINCT u.id) > 1
ORDER BY user_count DESC;

-- Step 2: Delete old zalo_sessions (keep only the latest one per Zalo userId)
WITH duplicate_sessions AS (
  SELECT 
    zs.id,
    zs.user_id,
    zs.user_info->>'userId' as zalo_user_id,
    zs.updated_at,
    ROW_NUMBER() OVER (
      PARTITION BY zs.user_info->>'userId' 
      ORDER BY zs.updated_at DESC
    ) as row_num
  FROM zalo_sessions zs
  WHERE zs.user_info->>'userId' IS NOT NULL
)
DELETE FROM zalo_sessions
WHERE id IN (
  SELECT id FROM duplicate_sessions WHERE row_num > 1
);

-- Step 3: Delete old bot_settings (keep only the latest one per Zalo userId)
WITH duplicate_settings AS (
  SELECT 
    bs.id,
    bs.user_id,
    zs.user_info->>'userId' as zalo_user_id,
    bs.updated_at,
    ROW_NUMBER() OVER (
      PARTITION BY zs.user_info->>'userId' 
      ORDER BY bs.updated_at DESC
    ) as row_num
  FROM bot_settings bs
  INNER JOIN zalo_sessions zs ON bs.user_id = zs.user_id
  WHERE zs.user_info->>'userId' IS NOT NULL
)
DELETE FROM bot_settings
WHERE id IN (
  SELECT id FROM duplicate_settings WHERE row_num > 1
);

-- Step 4: Delete old user_settings (keep only the latest one per Zalo userId)
WITH duplicate_user_settings AS (
  SELECT 
    us.id,
    us.user_id,
    zs.user_info->>'userId' as zalo_user_id,
    us.updated_at,
    ROW_NUMBER() OVER (
      PARTITION BY zs.user_info->>'userId' 
      ORDER BY us.updated_at DESC
    ) as row_num
  FROM user_settings us
  INNER JOIN zalo_sessions zs ON us.user_id = zs.user_id
  WHERE zs.user_info->>'userId' IS NOT NULL
)
DELETE FROM user_settings
WHERE id IN (
  SELECT id FROM duplicate_user_settings WHERE row_num > 1
);

-- Step 5: Delete old users (keep only the latest one per Zalo userId)
WITH users_to_keep AS (
  SELECT 
    u.id,
    zs.user_info->>'userId' as zalo_user_id,
    u.last_active,
    ROW_NUMBER() OVER (
      PARTITION BY zs.user_info->>'userId' 
      ORDER BY u.last_active DESC
    ) as row_num
  FROM users u
  INNER JOIN zalo_sessions zs ON u.id = zs.user_id
  WHERE zs.user_info->>'userId' IS NOT NULL
)
DELETE FROM users
WHERE id NOT IN (
  SELECT id FROM users_to_keep WHERE row_num = 1
)
AND id IN (
  SELECT u.id 
  FROM users u
  INNER JOIN zalo_sessions zs ON u.id = zs.user_id
  WHERE zs.user_info->>'userId' IS NOT NULL
);

-- ========================================================================
-- Verification: Show results after cleanup
-- ========================================================================

SELECT '=== CLEANUP COMPLETE ===' as info;
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
SELECT 'Users with Zalo accounts:' as info;
SELECT 
  u.id as user_id,
  u.session_id,
  zs.user_info->>'userId' as zalo_user_id,
  zs.user_info->>'displayName' as zalo_name,
  zs.user_info->>'phoneNumber' as phone,
  u.created_at,
  u.last_active
FROM users u
INNER JOIN zalo_sessions zs ON u.id = zs.user_id
WHERE zs.is_active = true
ORDER BY u.last_active DESC;

SELECT '';
SELECT 'Active Zalo Sessions:' as info;
SELECT 
  user_id,
  user_info->>'userId' as zalo_user_id,
  user_info->>'displayName' as zalo_name,
  is_active,
  updated_at 
FROM zalo_sessions
WHERE is_active = true
ORDER BY updated_at DESC;
