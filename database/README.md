# 🗄️ Database Setup Guide

## 📋 Files

- `schema.sql` - Database schema (tables, indexes, triggers)
- `migrate.sql` - Migration script (single-user → multi-user)
- `queries.sql` - Useful queries for management

---

## 🚀 Quick Setup

### Method 1: Tự động (Code tự tạo)

Code đã có logic tự động tạo tables khi start!

```typescript
// lib/postgres.ts tự động chạy initDatabase()
```

**Không cần làm gì thêm!** Chỉ cần:
1. Add DATABASE_URL vào Render
2. Deploy
3. Tables sẽ tự động tạo

---

### Method 2: Chạy SQL thủ công (Optional)

Nếu muốn tạo tables trước:

#### Bước 1: Connect vào Neon DB

**Option A: Neon Console**
1. Vào https://console.neon.tech/
2. Chọn project **zalobot**
3. Click **SQL Editor**

**Option B: psql CLI**
```bash
psql "postgresql://neondb_owner:npg_ZLr5qOCX6lKT@ep-summer-glade-b3aw0g6q-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
```

#### Bước 2: Chạy schema.sql

Copy nội dung file `schema.sql` và paste vào SQL Editor → Run

Hoặc qua CLI:
```bash
psql "postgresql://..." -f database/schema.sql
```

---

## 📊 Verify Tables

```sql
-- Xem tất cả tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Xem structure của table users
\d users

-- Xem structure của table zalo_sessions
\d zalo_sessions

-- Xem structure của table bot_settings
\d bot_settings
```

Expected output:
```
 table_name    
---------------
 users
 zalo_sessions
 bot_settings
 message_logs
```

---

## 🔍 Useful Queries

### 1. Xem tất cả users

```sql
SELECT 
    u.id,
    u.session_id,
    u.created_at,
    u.last_active,
    CASE 
        WHEN zs.id IS NOT NULL THEN '✅ Has Zalo'
        ELSE '❌ No Zalo'
    END as zalo_status,
    zs.user_info->>'displayName' as zalo_name
FROM users u
LEFT JOIN zalo_sessions zs ON u.id = zs.user_id
ORDER BY u.last_active DESC;
```

### 2. Xem active bots

```sql
SELECT 
    u.session_id,
    zs.user_info->>'displayName' as zalo_name,
    zs.user_info->>'userId' as zalo_id,
    bs.enabled as bot_enabled,
    bs.auto_reply_message,
    zs.updated_at as last_login
FROM users u
JOIN zalo_sessions zs ON u.id = zs.user_id AND zs.is_active = true
JOIN bot_settings bs ON u.id = bs.user_id
ORDER BY zs.updated_at DESC;
```

### 3. Xem statistics

```sql
SELECT 
    'Total Users' as metric,
    COUNT(*) as count
FROM users
UNION ALL
SELECT 
    'Users with Zalo Session',
    COUNT(*)
FROM zalo_sessions WHERE is_active = true
UNION ALL
SELECT 
    'Active Bots',
    COUNT(*)
FROM bot_settings WHERE enabled = true;
```

### 4. Xem message logs (nếu có)

```sql
SELECT 
    ml.created_at,
    u.session_id,
    ml.thread_id,
    ml.message_text,
    ml.is_from_bot
FROM message_logs ml
JOIN users u ON ml.user_id = u.id
ORDER BY ml.created_at DESC
LIMIT 50;
```

---

## 🧹 Maintenance

### Cleanup inactive sessions (30 days)

```sql
UPDATE zalo_sessions 
SET is_active = false 
WHERE updated_at < NOW() - INTERVAL '30 days'
AND is_active = true;
```

### Delete old inactive users (90 days)

```sql
DELETE FROM users 
WHERE last_active < NOW() - INTERVAL '90 days'
AND id NOT IN (
    SELECT user_id 
    FROM zalo_sessions 
    WHERE is_active = true
);
```

### Reset a specific user's session

```sql
-- By session_id
UPDATE zalo_sessions 
SET is_active = false
WHERE user_id = (
    SELECT id FROM users WHERE session_id = 'YOUR_SESSION_ID'
);

-- By Zalo name
UPDATE zalo_sessions 
SET is_active = false
WHERE user_info->>'displayName' = 'Tên User';
```

---

## 🔐 Security

### Create read-only user (optional)

```sql
CREATE USER readonly_user WITH PASSWORD 'your_password';
GRANT CONNECT ON DATABASE neondb TO readonly_user;
GRANT USAGE ON SCHEMA public TO readonly_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly_user;
```

---

## 🆘 Troubleshooting

### Issue: Tables không tự động tạo

**Solution:** Chạy schema.sql thủ công

### Issue: Permission denied

**Solution:** Check user permissions:
```sql
SELECT * FROM information_schema.role_table_grants 
WHERE grantee = 'neondb_owner';
```

### Issue: Migration failed

**Solution:** Reset và chạy lại:
```sql
DROP TABLE IF EXISTS bot_settings CASCADE;
DROP TABLE IF EXISTS zalo_sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;
-- Rồi chạy lại schema.sql
```

---

## 📚 More Info

- [Neon Docs](https://neon.tech/docs)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [JSONB Guide](https://www.postgresql.org/docs/current/datatype-json.html)
