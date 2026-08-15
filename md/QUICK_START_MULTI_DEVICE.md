# 🚀 Quick Start: Multi-Device Authentication

## Cài đặt nhanh trong 5 phút!

### Bước 1: Install Dependencies
```bash
npm install
```

Packages mới được cài:
- `bcryptjs` - Password hashing
- `@types/bcryptjs` - TypeScript types

### Bước 2: Setup Database

Đảm bảo `.env` có `DATABASE_URL`:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/zalo_bot
```

### Bước 3: Run Migration

#### Windows:
```bash
npm run migrate:auth:win
```

#### Linux/Mac:
```bash
npm run migrate:auth:unix
```

#### Hoặc manual:
```bash
psql $DATABASE_URL -f database/auth-sessions-schema.sql
```

### Bước 4: Create First Admin User

**QUAN TRỌNG:** Không dùng password mặc định!

```bash
npm run create-admin
```

Script sẽ hỏi:
- Username (default: admin)
- Display Name
- Email
- Password (min 8 chars) - **Enter password tùy chỉnh của bạn!**
- Confirm Password

**Output:**
```
🔐 Create First Admin User
═══════════════════════════════════════

✅ Database connected

Username [admin]: admin
Display Name [Administrator]: Administrator
Email [admin@example.com]: admin@example.com

Password (min 8 chars): ********
Confirm Password: ********

🔄 Creating user...
✅ Admin user created successfully!

📋 User Details:
   Username: admin
   Display Name: Administrator
   Email: admin@example.com

🎉 You can now login with these credentials!
```

### Bước 5: Start Server
```bash
npm run dev
```

### Bước 6: Test Login

Mở `http://localhost:3000` và đăng nhập với credentials bạn vừa tạo ở Bước 4.

🔒 **Security Note:** Password được hash với bcrypt, không ai biết được password thật của bạn!

---

## ✨ Features

### 1. Multi-Device Login
Đăng nhập cùng lúc trên nhiều thiết bị:
- Desktop PC
- Laptop
- Tablet
- Mobile

### 2. Device Management
Xem danh sách thiết bị đang login:
```tsx
import ActiveDevices from '@/components/ActiveDevices'

<ActiveDevices />
```

### 3. Logout Options

#### Header Dropdown Menu:
- **⚙️ Cài đặt** - Settings (coming soon)
- **🚪 Đăng xuất thiết bị này** - Chỉ logout thiết bị hiện tại
- **🚫 Đăng xuất tất cả thiết bị** - Logout tất cả (THẬT SỰ!)

### 4. Session Tracking
- IP address logging
- Device type detection
- Browser detection
- Last active time
- Auto-expire sau 7 ngày

---

## 🔧 API Usage

### Check Active Sessions
```typescript
const response = await fetch('/api/auth/sessions')
const data = await response.json()

console.log(`Số thiết bị: ${data.count}`)
data.sessions.forEach(session => {
  console.log(`${session.deviceInfo.type} - ${session.deviceInfo.browser}`)
})
```

### Logout Specific Device
```typescript
await fetch(`/api/auth/sessions?id=${sessionId}`, {
  method: 'DELETE'
})
```

### Logout All Devices
```typescript
const response = await fetch('/api/auth/logout-all', {
  method: 'POST'
})

const data = await response.json()
console.log(`Đã logout ${data.devicesLoggedOut} thiết bị`)
```

---

## 🔒 Security

### Password Hashing
```typescript
import bcrypt from 'bcryptjs'

// Hash password
const hash = await bcrypt.hash('my-password', 10)

// Verify password
const match = await bcrypt.compare('my-password', hash)
```

### Session Token
- UUID v4 + timestamp
- HttpOnly cookie (không thể đọc bằng JS)
- Secure flag trong production (HTTPS only)
- SameSite: lax (CSRF protection)

### Auto-Cleanup
Expired sessions tự động cleanup mỗi lần validate

---

## 📊 Database Queries

### View Active Sessions
```sql
SELECT * FROM auth_sessions 
WHERE is_active = true 
ORDER BY last_active DESC;
```

### Count Sessions Per User
```sql
SELECT u.username, COUNT(*) as sessions
FROM auth_users u
JOIN auth_sessions s ON u.id = s.user_id
WHERE s.is_active = true
GROUP BY u.username;
```

### View Login History
```sql
SELECT * FROM auth_login_history 
ORDER BY created_at DESC 
LIMIT 20;
```

---

## 🐛 Troubleshooting

### "Database not configured"
→ Set `DATABASE_URL` in `.env`

### "bcrypt not found"
→ Run `npm install`

### "Tables not found"
→ Run migration: `npm run migrate:auth:win`

### "Cannot login"
→ Check username/password: admin/changeme

---

## 🎯 Next Steps

1. **Change admin password:**
```typescript
import { AuthManager } from '@/lib/auth-manager'
await AuthManager.updatePassword(userId, 'new-secure-password')
```

2. **Create new users:**
```typescript
await AuthManager.createUser(
  'username',
  'password',
  'Display Name',
  'email@example.com'
)
```

3. **Add ActiveDevices to dashboard:**
```tsx
// In your dashboard component
import ActiveDevices from '@/components/ActiveDevices'

<ActiveDevices
  onLogoutDevice={(id) => console.log('Logged out:', id)}
  onLogoutAllDevices={handleLogoutAll}
/>
```

4. **Setup cron for cleanup:**
```typescript
// Run every hour
setInterval(async () => {
  await AuthManager.cleanupExpiredSessions()
}, 60 * 60 * 1000)
```

---

**Xem thêm chi tiết:** `md/MULTI_DEVICE_AUTH_SETUP.md`
