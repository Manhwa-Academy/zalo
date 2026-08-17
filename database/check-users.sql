-- Check BOTH user tables
-- 1. Check auth_users (authentication system)
SELECT 
    'auth_users' as table_name,
    id,
    username,
    email,
    created_at
FROM auth_users
ORDER BY created_at DESC
LIMIT 10;

-- 2. Check users (zalo bot system)
SELECT 
    'users' as table_name,
    id,
    session_id,
    created_at,
    last_active
FROM users
ORDER BY last_active DESC
LIMIT 10;

-- 3. Check which user has bot_settings
SELECT 
    bs.user_id,
    u.session_id,
    bs.enabled,
    bs.created_at
FROM bot_settings bs
LEFT JOIN users u ON u.id = bs.user_id
ORDER BY bs.created_at DESC
LIMIT 10;

-- 4. Check which user has user_settings  
SELECT 
    us.user_id,
    au.username,
    au.email,
    us.ai_enabled,
    us.ai_personality,
    us.created_at
FROM user_settings us
LEFT JOIN auth_users au ON au.id = us.user_id
ORDER BY us.created_at DESC
LIMIT 10;
