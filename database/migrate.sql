-- =====================================================
-- Migration Script: Single-User to Multi-User
-- Chuyển data cũ (nếu có) sang schema mới
-- =====================================================

-- Step 1: Backup old data (nếu có table sessions cũ)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sessions') THEN
        -- Tạo backup table
        CREATE TABLE IF NOT EXISTS sessions_backup AS SELECT * FROM sessions;
        RAISE NOTICE 'Backed up old sessions table';
    END IF;
END $$;

-- Step 2: Tạo schema mới
\i schema.sql

-- Step 3: Migrate data từ old sessions table (nếu có)
DO $$
DECLARE
    old_session RECORD;
    new_user_id UUID;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sessions') THEN
        FOR old_session IN SELECT * FROM sessions LOOP
            -- Tạo user mới
            INSERT INTO users (session_id)
            VALUES (old_session.key || '-migrated')
            RETURNING id INTO new_user_id;
            
            -- Tạo zalo session
            INSERT INTO zalo_sessions (user_id, session_data, is_active)
            VALUES (new_user_id, old_session.data, true);
            
            -- Tạo bot settings mặc định
            INSERT INTO bot_settings (user_id)
            VALUES (new_user_id);
            
            RAISE NOTICE 'Migrated session: %', old_session.key;
        END LOOP;
        
        RAISE NOTICE 'Migration completed successfully!';
    ELSE
        RAISE NOTICE 'No old sessions table found. Fresh install.';
    END IF;
END $$;

-- Step 4: Drop old table (uncomment nếu muốn xóa)
-- DROP TABLE IF EXISTS sessions;
-- DROP TABLE IF EXISTS sessions_backup;

-- =====================================================
-- Verification
-- =====================================================
SELECT 
    'users' as table_name, 
    COUNT(*) as record_count 
FROM users
UNION ALL
SELECT 
    'zalo_sessions' as table_name, 
    COUNT(*) as record_count 
FROM zalo_sessions
UNION ALL
SELECT 
    'bot_settings' as table_name, 
    COUNT(*) as record_count 
FROM bot_settings;
