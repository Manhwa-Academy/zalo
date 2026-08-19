# 🔄 Multi-Device Sync - Hướng dẫn

## 🎯 Cách hoạt động

### 1. **Session & User Mapping**

Mỗi thiết bị có một **session cookie** riêng:
- Máy tính: `session_aaa`
- Điện thoại: `session_bbb`

Nhưng cả 2 đều **link về cùng 1 user** dựa trên **Zalo Account ID**.

```
Session A (PC)    → User UUID → Zalo ID: 323684691472053501
Session B (Phone) → User UUID → Zalo ID: 323684691472053501
                       ↓
                  SAME USER!
```

### 2. **Auto-Sync Bot Settings**

- ✅ **Khi toggle bot trên PC:**
  - Update database: `UPDATE bot_settings SET enabled=false WHERE user_id=...`
  - Server trả về settings mới
  - Frontend reload để verify

- ✅ **Trên điện thoại:**
  - Mỗi 5 giây tự động gọi `GET /api/zalo/settings`
  - Nếu detect thay đổi → Update UI ngay lập tức
  - Đồng bộ realtime giữa tất cả thiết bị

### 3. **Auto-Link Duplicate Sessions**

Khi bạn login Zalo từ thiết bị mới:

1. Hệ thống kiểm tra Zalo Account ID
2. Nếu đã tồn tại user với Zalo ID này → Link session về user cũ
3. Xóa user duplicate (nếu có)
4. Tất cả settings được share

## 🔍 Debug - Kiểm tra duplicate users

### Xem tất cả users:

```bash
curl http://localhost:3000/api/debug/users
```

Response:
```json
{
  "summary": {
    "totalUsers": 5,
    "uniqueZaloAccounts": 2,
    "duplicateZaloAccounts": 1
  },
  "duplicates": [
    {
      "zaloUserId": "323684691472053501",
      "zaloDisplayName": "Monica Everett",
      "duplicateCount": 3,
      "users": [
        {
          "userId": "aeb707c3-4acc-4211-b197-d335e5cae10b",
          "botEnabled": true,
          "lastActive": "2026-08-19T10:25:24"
        },
        {
          "userId": "9168a813-37b8-4b1b-98cc-fa860dcfa8b7",
          "botEnabled": false,
          "lastActive": "2026-08-19T02:48:54"
        },
        {
          "userId": "fe85ccfc-40f9-4b04-9a7a-9eb4c206590b",
          "botEnabled": false,
          "lastActive": "2026-08-19T03:03:44"
        }
      ]
    }
  ]
}
```

### Merge duplicate users:

Chọn 1 user để giữ lại (thường là user mới nhất), xóa các user khác:

```bash
curl -X POST http://localhost:3000/api/debug/users \
  -H "Content-Type: application/json" \
  -d '{
    "keepUserId": "aeb707c3-4acc-4211-b197-d335e5cae10b",
    "deleteUserIds": [
      "9168a813-37b8-4b1b-98cc-fa860dcfa8b7",
      "fe85ccfc-40f9-4b04-9a7a-9eb4c206590b"
    ]
  }'
```

## 📝 Logs để debug

### Backend (Server):
```
📖 [Settings] GET request - Current settings: { enabled: false, userId: "aeb..." }
📝 [Settings] Received update request: { enabled: false }
✅ [Settings] Updated and verified bot settings: { enabled: false }
🔗 [MultiUser] Found existing user xxx for Zalo ID 323684691472053501
✅ [MultiUser] Linked session yyy to existing user xxx
```

### Frontend (Browser Console):
```
🔄 [Frontend] Syncing settings: { enabled: false }
✅ [Frontend] Settings synced successfully: { enabled: false }
🔄 [Sync] Starting settings sync polling
```

## ⚡ Fix ngay vấn đề hiện tại

### Bước 1: Kiểm tra duplicate
```bash
curl http://localhost:3000/api/debug/users
```

### Bước 2: Merge về 1 user
Chọn user **mới nhất** (có `lastActive` gần nhất):
```bash
curl -X POST http://localhost:3000/api/debug/users \
  -H "Content-Type: application/json" \
  -d '{"keepUserId":"<USER_MỚI_NHẤT>","deleteUserIds":["<USER_CŨ_1>","<USER_CŨ_2>"]}'
```

### Bước 3: Logout và login lại trên tất cả thiết bị
- Sau khi merge, logout Zalo trên tất cả thiết bị
- Login lại → Tất cả sẽ link về cùng 1 user
- Bot settings giờ sẽ sync giữa các thiết bị

## 🚀 Tự động từ bây giờ

Sau khi fix:
- ✅ Login thiết bị mới → Tự động link về user cũ
- ✅ Toggle bot trên bất kỳ thiết bị → Sync tức thì
- ✅ Không còn duplicate users
- ✅ Settings luôn consistent

## 🔒 Database Schema

```sql
-- users: Mỗi session ban đầu tạo 1 user
CREATE TABLE users (
  id UUID PRIMARY KEY,
  session_id TEXT UNIQUE,
  last_active TIMESTAMP
);

-- zalo_sessions: Link user → Zalo account
CREATE TABLE zalo_sessions (
  user_id UUID REFERENCES users(id),
  user_info JSONB, -- Contains userId (Zalo ID)
  is_active BOOLEAN
);

-- bot_settings: Settings theo user
CREATE TABLE bot_settings (
  user_id UUID REFERENCES users(id),
  enabled BOOLEAN,
  settings JSONB
);
```

## 💡 Tips

1. **Kiểm tra định kỳ:** Chạy `/api/debug/users` để phát hiện duplicates sớm
2. **Browser Console:** Bật để xem sync logs realtime
3. **Server Logs:** Check để debug update issues
4. **Clear cache:** Nếu vẫn không sync, hard refresh (Ctrl+Shift+R)
