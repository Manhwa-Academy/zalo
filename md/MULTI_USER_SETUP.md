# 🚀 Multi-User Bot Setup Guide

Bot đã được refactor để support nhiều users. Mỗi user có session Zalo riêng!

## 📋 Checklist

### ✅ Bước 1: Cài dependencies

```bash
npm install uuid
npm install --save-dev @types/uuid
```

### ✅ Bước 2: Thêm DATABASE_URL vào Render

Render Dashboard → Environment:

```
DATABASE_URL = postgresql://neondb_owner:npg_ZLr5qOCX6lKT@ep-summer-glade-b3aw0g6q-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
```

### ✅ Bước 3: Deploy

```bash
git add -A
git commit -m "feat: multi-user bot support with Neon DB"
git push
```

Render sẽ tự động deploy (~2-3 phút).

### ✅ Bước 4: Test

1. Mở: https://zalo-bot-vbbk.onrender.com/
2. Đăng nhập Zalo bằng QR (User A)
3. Mở incognito/private window
4. Mở lại: https://zalo-bot-vbbk.onrender.com/
5. Đăng nhập Zalo khác (User B)

→ Mỗi user có bot riêng! 🎉

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│  Browser                                │
│  - Cookie: sessionId                    │
│  - LocalStorage: sessionId (backup)     │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│  Next.js API Routes                     │
│  - getSessionId() → unique per user     │
│  - UserManager.getOrCreateUser()        │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│  Neon Postgres                          │
│  - users (id, sessionId)                │
│  - zalo_sessions (userId, sessionData)  │
│  - bot_settings (userId, enabled, ...)  │
└─────────────────────────────────────────┘
```

---

## 📊 Database Schema

### Table: `users`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| session_id | VARCHAR | Unique session ID |
| created_at | TIMESTAMP | Created date |
| last_active | TIMESTAMP | Last active |

### Table: `zalo_sessions`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | FK to users |
| session_data | JSONB | Zalo credentials |
| user_info | JSONB | User profile |
| is_active | BOOLEAN | Active status |

### Table: `bot_settings`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | FK to users |
| enabled | BOOLEAN | Bot enabled |
| auto_reply_message | TEXT | Reply message |
| reply_delay | INTEGER | Delay in ms |

---

## 🔍 Troubleshooting

### Lỗi: "Database not configured"

→ Chưa add DATABASE_URL vào Render Environment

### Lỗi: "Cannot find module 'uuid'"

→ Chạy `npm install uuid`

### Users thấy session của nhau

→ Clear cookies & localStorage → Reload

### Session bị mất sau redeploy

→ Check Neon DB có data không

---

## 🎯 Testing Multi-User

### Test 1: Multiple browsers

1. Browser A (Chrome) → Login User A
2. Browser B (Firefox) → Login User B
3. Verify: Mỗi browser thấy user riêng

### Test 2: Incognito

1. Normal window → Login User A
2. Incognito window → Login User B
3. Verify: Mỗi window thấy user riêng

### Test 3: Database

```sql
-- Check users
SELECT * FROM users;

-- Check sessions
SELECT 
  u.session_id,
  zs.user_info->>'displayName' as zalo_name,
  zs.is_active
FROM users u
LEFT JOIN zalo_sessions zs ON u.id = zs.user_id;
```

---

## ✅ Done!

Bot giờ support multi-user! Mỗi người có bot riêng! 🎉
