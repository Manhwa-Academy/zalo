-- ============================================
-- AUTH SESSIONS SCHEMA FOR MULTI-DEVICE SUPPORT
-- ============================================
-- Purpose: Enable true multi-device login tracking and logout
-- Date: 2026-08-15
-- ============================================

-- 1. Create auth_users table (if not exists)
CREATE TABLE IF NOT EXISTS auth_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL, -- bcrypt hash
  email VARCHAR(255),
  display_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);

-- 2. Create auth_sessions table for multi-device tracking
CREATE TABLE IF NOT EXISTS auth_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  session_token VARCHAR(512) UNIQUE NOT NULL, -- JWT or random token
  device_info JSONB DEFAULT '{}', -- Browser, OS, device name
  ip_address VARCHAR(45), -- IPv4 or IPv6
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL, -- Session expiry
  last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  
  -- Indexes for fast lookups
  CONSTRAINT valid_expiry CHECK (expires_at > created_at)
);

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_id ON auth_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_token ON auth_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_active ON auth_sessions(user_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires ON auth_sessions(expires_at) WHERE is_active = true;

-- 4. Create auth_login_history for audit log
CREATE TABLE IF NOT EXISTS auth_login_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES auth_sessions(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL, -- 'login', 'logout', 'logout_all', 'session_expired'
  ip_address VARCHAR(45),
  user_agent TEXT,
  device_info JSONB DEFAULT '{}',
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_auth_login_history_user ON auth_login_history(user_id, created_at DESC);

-- 5. Function to clean up expired sessions automatically
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  UPDATE auth_sessions 
  SET is_active = false 
  WHERE is_active = true 
    AND expires_at < CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- 6. Function to get active sessions count for a user
CREATE OR REPLACE FUNCTION get_user_active_sessions_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  session_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO session_count
  FROM auth_sessions
  WHERE user_id = p_user_id
    AND is_active = true
    AND expires_at > CURRENT_TIMESTAMP;
  
  RETURN session_count;
END;
$$ LANGUAGE plpgsql;

-- 7. Function to logout all devices for a user
CREATE OR REPLACE FUNCTION logout_all_devices(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  affected_count INTEGER;
BEGIN
  -- Deactivate all active sessions
  UPDATE auth_sessions
  SET is_active = false,
      last_active = CURRENT_TIMESTAMP
  WHERE user_id = p_user_id
    AND is_active = true;
  
  GET DIAGNOSTICS affected_count = ROW_COUNT;
  
  -- Log the action
  INSERT INTO auth_login_history (user_id, action, ip_address, success)
  VALUES (p_user_id, 'logout_all', NULL, true);
  
  RETURN affected_count;
END;
$$ LANGUAGE plpgsql;

-- 8. Function to logout a specific device/session
CREATE OR REPLACE FUNCTION logout_session(p_session_token VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
  v_session_id UUID;
BEGIN
  -- Find and deactivate the session
  UPDATE auth_sessions
  SET is_active = false,
      last_active = CURRENT_TIMESTAMP
  WHERE session_token = p_session_token
    AND is_active = true
  RETURNING user_id, id INTO v_user_id, v_session_id;
  
  IF FOUND THEN
    -- Log the action
    INSERT INTO auth_login_history (user_id, session_id, action, success)
    VALUES (v_user_id, v_session_id, 'logout', true);
    
    RETURN true;
  ELSE
    RETURN false;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 9. Function to validate and refresh session
CREATE OR REPLACE FUNCTION validate_session(p_session_token VARCHAR)
RETURNS TABLE (
  valid BOOLEAN,
  user_id UUID,
  username VARCHAR,
  display_name VARCHAR,
  expires_at TIMESTAMP,
  session_id UUID
) AS $$
BEGIN
  -- Cleanup expired sessions first
  PERFORM cleanup_expired_sessions();
  
  RETURN QUERY
  SELECT 
    true as valid,
    u.id as user_id,
    u.username,
    u.display_name,
    s.expires_at,
    s.id as session_id
  FROM auth_sessions s
  JOIN auth_users u ON s.user_id = u.id
  WHERE s.session_token = p_session_token
    AND s.is_active = true
    AND s.expires_at > CURRENT_TIMESTAMP
    AND u.is_active = true;
  
  -- Update last_active if session found
  IF FOUND THEN
    UPDATE auth_sessions
    SET last_active = CURRENT_TIMESTAMP
    WHERE session_token = p_session_token;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 10. Trigger to update auth_users.updated_at
CREATE OR REPLACE FUNCTION update_auth_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_auth_users_updated_at
BEFORE UPDATE ON auth_users
FOR EACH ROW
EXECUTE FUNCTION update_auth_users_updated_at();

-- ============================================
-- SAMPLE DATA FOR TESTING (Optional)
-- ============================================

-- ⚠️ KHÔNG NÊN hardcode password trong SQL!
-- Thay vào đó, chạy script để tạo user với password tùy chỉnh:
--
--   npx tsx database/create-first-user.ts
--   hoặc: npm run create-admin
--
-- Script sẽ hỏi username, password, email và tạo user an toàn.

-- Nếu bạn THỰC SỰ muốn tạo test user (CHỈ DÙNG CHO DEV):
-- INSERT INTO auth_users (username, password_hash, display_name, email)
-- VALUES (
--   'admin',
--   '$2b$10$rBV2uLJZBXJvBqXvz3qkPOm5YLq7.FxQvZW.8IY6YGH2oZjKfwZfO', -- password: "changeme"
--   'Administrator',
--   'admin@example.com'
-- )
-- ON CONFLICT (username) DO NOTHING;

-- ============================================
-- USEFUL QUERIES FOR ADMINISTRATION
-- ============================================

-- View all active sessions for a user
-- SELECT * FROM auth_sessions WHERE user_id = 'YOUR_USER_ID' AND is_active = true;

-- Get active sessions count per user
-- SELECT u.username, COUNT(*) as active_sessions
-- FROM auth_users u
-- LEFT JOIN auth_sessions s ON u.id = s.user_id AND s.is_active = true
-- GROUP BY u.id, u.username;

-- View login history for a user
-- SELECT * FROM auth_login_history 
-- WHERE user_id = 'YOUR_USER_ID' 
-- ORDER BY created_at DESC 
-- LIMIT 20;

-- Manually cleanup expired sessions
-- SELECT cleanup_expired_sessions();

-- Manually logout all devices for a user
-- SELECT logout_all_devices('YOUR_USER_ID');

-- ============================================
-- MIGRATION NOTES
-- ============================================

/*
To migrate from simple auth_token cookie to this system:

1. Run this SQL file to create tables
2. Update lib/auth-manager.ts (create new file) with:
   - createSession(userId, deviceInfo, ipAddress, userAgent)
   - validateSession(sessionToken)
   - logoutSession(sessionToken)
   - logoutAllSessions(userId)
   - getActiveSessions(userId)

3. Update API routes:
   - /api/auth/login → Create session in DB
   - /api/auth/check → Validate with DB
   - /api/auth/logout → Use logout_session()
   - /api/auth/logout-all → Use logout_all_devices()

4. Add middleware to validate sessions on protected routes

5. Optional: Add cron job to cleanup expired sessions periodically
   - Can use pg_cron extension or Next.js API route with cron
*/

-- ============================================
-- CLEANUP (Use with caution!)
-- ============================================

-- To drop all tables and start fresh (DEV ONLY):
-- DROP TABLE IF EXISTS auth_login_history CASCADE;
-- DROP TABLE IF EXISTS auth_sessions CASCADE;
-- DROP TABLE IF EXISTS auth_users CASCADE;
-- DROP FUNCTION IF EXISTS cleanup_expired_sessions() CASCADE;
-- DROP FUNCTION IF EXISTS get_user_active_sessions_count(UUID) CASCADE;
-- DROP FUNCTION IF EXISTS logout_all_devices(UUID) CASCADE;
-- DROP FUNCTION IF EXISTS logout_session(VARCHAR) CASCADE;
-- DROP FUNCTION IF EXISTS validate_session(VARCHAR) CASCADE;
-- DROP FUNCTION IF EXISTS update_auth_users_updated_at() CASCADE;
