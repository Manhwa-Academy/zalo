# 🔐 Multi-Device Authentication Setup Guide

## 📋 Tổng quan

Hệ thống auth mới hỗ trợ:
- ✅ **Multi-device login** - 1 tài khoản đăng nhập trên nhiều thiết bị
- ✅ **Session tracking** - Theo dõi từng thiết bị đang login
- ✅ **Device management** - Xem và quản lý các thiết bị
- ✅ **Logout all devices** - Đăng xuất tất cả thiết bị thật sự
- ✅ **Session expiry** - Tự động hết hạn sau 7 ngày
- ✅ **Login history** - Audit log cho security

## 🚀 Setup Instructions

### 1. **Cài đặt Dependencies**

```bash
npm install bcryptjs uuid
npm install --save-dev @types/bcryptjs @types/uuid
```

### 2. **Apply Database Schema**

#### Option A: Using psql command (Recommended)
```bash
# Linux/Mac
chmod +x database/migrate-auth-sessions.sh
./database/migrate-auth-sessions.sh

# Windows
database\migrate-auth-sessions.bat
```

#### Option B: Manual psql
```bash
psql $DATABASE_URL -f database/auth-sessions-schema.sql
```

#### Option C: Copy-paste SQL
Open `database/auth-sessions-schema.sql` và chạy trong pgAdmin hoặc DBeaver

### 3. **Verify Migration**

```sql
-- Check tables created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'auth%';

-- Expected output:
-- auth_users
-- auth_sessions
-- auth_login_history

-- Check default admin user
SELECT username, display_name FROM auth_users;

-- Should show: admin | Administrator
```

### 4. **Test Login**

Default credentials (THAY ĐỔI NGAY SAU KHI LOGIN):
- Username: `admin`
- Password: `changeme`

### 5. **Environment Variables**

Đảm bảo `.env` có:
```env
DATABASE_URL=postgresql://user:password@host:port/database
NODE_ENV=production  # Enable secure cookies in production
```

## 📁 Files Created/Modified

### New Files:
```
✅ lib/auth-manager.ts                      - Core auth logic
✅ database/auth-sessions-schema.sql        - Database schema
✅ database/migrate-auth-sessions.sh        - Migration script (Linux/Mac)
✅ database/migrate-auth-sessions.bat       - Migration script (Windows)
✅ app/api/auth/sessions/route.ts           - Device management API
✅ components/ActiveDevices.tsx             - Device list UI component
📝 md/MULTI_DEVICE_AUTH_SETUP.md           - This guide
```

### Modified Files:
```
✅ app/api/auth/login/route.ts              - DB-based login
✅ app/api/auth/check/route.ts              - Session validation
✅ app/api/auth/logout/route.ts             - Single device logout
✅ app/api/auth/logout-all/route.ts         - Multi-device logout
```

## 🔧 API Endpoints

### 1. **POST /api/auth/login**
Login with username + password

**Request:**
```json
{
  "username": "admin",
  "password": "changeme"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "username": "admin",
    "displayName": "Administrator",
    "email": "admin@example.com"
  }
}
```

**Cookie set:** `auth_token` = session token (7 days)

### 2. **GET /api/auth/check**
Validate current session

**Response:**
```json
{
  "authenticated": true,
  "user": {
    "id": "uuid",
    "username": "admin",
    "displayName": "Administrator"
  },
  "expiresAt": "2026-08-22T00:00:00.000Z"
}
```

### 3. **GET /api/auth/sessions**
Get all active devices for current user

**Response:**
```json
{
  "sessions": [
    {
      "id": "session-uuid",
      "deviceInfo": {
        "type": "Desktop",
        "browser": "Chrome",
        "os": "Windows"
      },
      "ipAddress": "192.168.1.100",
      "createdAt": "2026-08-15T10:00:00.000Z",
      "lastActive": "2026-08-15T14:30:00.000Z",
      "expiresAt": "2026-08-22T10:00:00.000Z",
      "isCurrent": true
    }
  ],
  "count": 1
}
```

### 4. **DELETE /api/auth/sessions?id={sessionId}**
Logout a specific device

**Response:**
```json
{
  "success": true,
  "message": "Đã đăng xuất thiết bị thành công"
}
```

### 5. **POST /api/auth/logout**
Logout current device only

**Response:**
```json
{
  "success": true
}
```

### 6. **POST /api/auth/logout-all**
Logout ALL devices

**Response:**
```json
{
  "success": true,
  "message": "Đã đăng xuất 3 thiết bị thành công",
  "devicesLoggedOut": 3
}
```

## 🗄️ Database Schema

### Tables Created:

#### 1. `auth_users`
```sql
- id (UUID, PK)
- username (VARCHAR, UNIQUE)
- password_hash (VARCHAR) -- bcrypt
- email (VARCHAR)
- display_name (VARCHAR)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- last_login (TIMESTAMP)
- is_active (BOOLEAN)
```

#### 2. `auth_sessions`
```sql
- id (UUID, PK)
- user_id (UUID, FK -> auth_users)
- session_token (VARCHAR, UNIQUE)
- device_info (JSONB)
- ip_address (VARCHAR)
- user_agent (TEXT)
- created_at (TIMESTAMP)
- expires_at (TIMESTAMP)
- last_active (TIMESTAMP)
- is_active (BOOLEAN)
```

#### 3. `auth_login_history`
```sql
- id (UUID, PK)
- user_id (UUID, FK -> auth_users)
- session_id (UUID, FK -> auth_sessions)
- action (VARCHAR) -- login, logout, logout_all, session_expired
- ip_address (VARCHAR)
- user_agent (TEXT)
- device_info (JSONB)
- success (BOOLEAN)
- error_message (TEXT)
- created_at (TIMESTAMP)
```

### Functions Created:

1. **`cleanup_expired_sessions()`** - Auto-expire old sessions
2. **`get_user_active_sessions_count(user_id)`** - Count active sessions
3. **`logout_all_devices(user_id)`** - Logout all + log action
4. **`logout_session(session_token)`** - Logout single + log action
5. **`validate_session(session_token)`** - Validate & refresh session

## 🎨 UI Component Usage

### Add ActiveDevices to Dashboard

```tsx
import ActiveDevices from '@/components/ActiveDevices'

// In your dashboard component:
<ActiveDevices
  onLogoutDevice={(deviceId) => {
    console.log('Device logged out:', deviceId)
    showToast('Thiết bị đã được đăng xuất', 'success')
  }}
  onLogoutAllDevices={handleLogoutAllDevices}
/>
```

## 🔄 Migration Flow

### From Simple Auth → DB Auth:

**Before (Simple Cookie Auth):**
```
Login → Set cookie → Done
Check → Cookie exists? → OK
Logout → Delete cookie → Done
```

**After (Database Sessions):**
```
Login → Validate credentials → Create session in DB → Set cookie with session token
Check → Validate token with DB → Check expiry → Update last_active
Logout → Invalidate session in DB → Delete cookie
Logout All → Invalidate ALL user sessions in DB → Delete cookie
```

### Backward Compatibility:

Hệ thống **tự động fallback** nếu `DATABASE_URL` không được set:
```typescript
if (!process.env.DATABASE_URL) {
  // Use old simple auth system
  // No database required
}
```

## 🔒 Security Features

### 1. **Password Hashing**
- Sử dụng bcrypt với cost factor 10
- Không lưu plain text password

### 2. **Session Token**
- UUID v4 + timestamp
- 512 characters unique token
- HttpOnly cookie (không thể đọc bằng JavaScript)

### 3. **Session Expiry**
- Default: 7 days
- Tự động cleanup expired sessions
- Check expiry mỗi request

### 4. **Device Tracking**
- IP address logging
- User agent parsing
- Device type detection (Desktop/Mobile/Tablet)

### 5. **Audit Log**
- All login/logout events logged
- IP address + device info
- Success/failure tracking

### 6. **Secure Cookies**
```typescript
{
  httpOnly: true,              // Không thể đọc bằng JS
  secure: NODE_ENV === 'production',  // HTTPS only in prod
  sameSite: 'lax',             // CSRF protection
  maxAge: 7 * 24 * 60 * 60,    // 7 days
  path: '/',
}
```

## 📊 Admin Queries

### View all active sessions:
```sql
SELECT 
  u.username,
  s.device_info->>'type' as device_type,
  s.device_info->>'browser' as browser,
  s.ip_address,
  s.last_active,
  s.expires_at
FROM auth_sessions s
JOIN auth_users u ON s.user_id = u.id
WHERE s.is_active = true
ORDER BY s.last_active DESC;
```

### Count sessions per user:
```sql
SELECT 
  u.username,
  COUNT(*) as active_sessions
FROM auth_users u
LEFT JOIN auth_sessions s ON u.id = s.user_id AND s.is_active = true
GROUP BY u.id, u.username
ORDER BY active_sessions DESC;
```

### View login history:
```sql
SELECT 
  u.username,
  h.action,
  h.ip_address,
  h.device_info->>'type' as device,
  h.success,
  h.created_at
FROM auth_login_history h
JOIN auth_users u ON h.user_id = u.id
ORDER BY h.created_at DESC
LIMIT 50;
```

### Manually cleanup expired sessions:
```sql
SELECT cleanup_expired_sessions();
```

### Manually logout user from all devices:
```sql
SELECT logout_all_devices('user-uuid-here');
```

## 🐛 Troubleshooting

### Issue: "Database not configured"
**Solution:** Set `DATABASE_URL` in `.env` file

### Issue: "bcrypt not found"
**Solution:** `npm install bcryptjs @types/bcryptjs`

### Issue: "Tables not found"
**Solution:** Run migration script hoặc SQL manually

### Issue: "Cannot connect to database"
**Solution:** Check DATABASE_URL format và database server đang chạy

### Issue: "Session validation failed"
**Solution:** Cookie expired hoặc invalidated, login lại

### Issue: "Password hash mismatch"
**Solution:** Đảm bảo đang dùng bcrypt với cost factor 10

## 🎯 Next Steps

### 1. **Change Default Password**
```sql
-- Generate new bcrypt hash from Node.js:
-- const bcrypt = require('bcryptjs');
-- const hash = await bcrypt.hash('your-new-password', 10);

UPDATE auth_users 
SET password_hash = '$2b$10$YOUR_NEW_HASH_HERE'
WHERE username = 'admin';
```

### 2. **Add More Users**
```typescript
import { AuthManager } from '@/lib/auth-manager';

const user = await AuthManager.createUser(
  'newuser',
  'secure-password',
  'Display Name',
  'email@example.com'
);
```

### 3. **Add Password Change UI**
```typescript
// API endpoint: POST /api/auth/change-password
const success = await AuthManager.updatePassword(userId, newPassword);
```

### 4. **Add Registration Page**
- Create `/app/register/page.tsx`
- Call `AuthManager.createUser()`
- Auto-login after registration

### 5. **Setup Cron Job for Cleanup**
```typescript
// In instrumentation.ts or cron API route
setInterval(async () => {
  await AuthManager.cleanupExpiredSessions();
}, 60 * 60 * 1000); // Every hour
```

### 6. **Add Email Verification**
- Extend `auth_users` with `email_verified` column
- Send verification email on registration
- Verify token before allowing login

### 7. **Add 2FA (Two-Factor Auth)**
- Add `two_factor_enabled` column
- Use TOTP (Time-based OTP) with `speakeasy` library
- Require OTP code after password verification

## 📚 Resources

- [bcrypt.js Documentation](https://github.com/dcodeIO/bcrypt.js)
- [PostgreSQL JSON Functions](https://www.postgresql.org/docs/current/functions-json.html)
- [Next.js Cookies](https://nextjs.org/docs/app/api-reference/functions/cookies)
- [OWASP Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)

---

**Status:** ✅ READY FOR PRODUCTION
**Date:** 2026-08-15
**Version:** 1.0.0
