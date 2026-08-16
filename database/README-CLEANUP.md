# 🧹 Hướng dẫn Cleanup Database

## Vấn đề hiện tại

### 1. Duplicate Zalo Users
- Có nhiều users duplicate cho cùng 1 tài khoản Zalo
- Ví dụ: Hoàng Kiều Phong +84332138297 có 7 users

### 2. Quá nhiều Auth Sessions
- User `c3d54091-4a58-4a48-be46-51b11f767af7` có **17 auth_sessions**
- Mỗi lần login tạo session mới nhưng không xóa sessions cũ
- Nhiều sessions inactive/expired chưa được cleanup

### 3. Login History spam
- Quá nhiều records trong `auth_login_history`
- Mỗi login/logout tạo record mới

## Nguyên nhân
- Code cũ tạo user mới mỗi khi login từ thiết bị khác
- Không kiểm tra user đã tồn tại với cùng Zalo userId
- Sessions và history không được auto-cleanup cho đến khi code mới được deploy

## Giải pháp đã implement

### 1. Sửa code (✅ Done)

#### A. Multi-user Zalo
- `lib/user-manager.ts`: Sửa `saveZaloSession()` dùng `EXCLUDED.*` trong UPSERT
- `lib/multi-user-zalo.ts`:
  - `getCurrentUserId()`: Đơn giản hóa, chỉ tạo user 1 lần cho mỗi session
  - `setCurrentZaloUserInfo()`: Không merge/link user nữa, chỉ lưu thông tin

#### B. Auth Sessions Auto-Cleanup
- `lib/auth-manager.ts` → `createSession()`:
  - Xóa expired sessions trước khi tạo mới
  - Xóa inactive sessions > 24h
  - Giữ tối đa 3 active sessions per user

#### C. Login History Auto-Cleanup
- `lib/auth-manager.ts` → `logAuthEvent()`:
  - Xóa records cũ (>1 minute) của cùng action type
  - Giữ chỉ 1 record mới nhất per action per user

### 2. Cleanup database (Chạy 1 lần)

### 2. Cleanup database (Chạy 1 lần)

#### Option 1: Cleanup TẤT CẢ cùng lúc (⭐ Khuyên dùng)
```bash
npx tsx database/cleanup-all.ts
```

Script này sẽ chạy lần lượt:
1. Cleanup duplicate Zalo users
2. Cleanup old auth sessions (giữ max 3 active per user)
3. Cleanup old login history (giữ 1 record mới nhất per action)

#### Option 2: Cleanup từng phần
```bash
# Chỉ cleanup duplicate Zalo users
npx tsx database/run-cleanup.ts

# Hoặc chạy SQL thủ công
# - cleanup-duplicate-zalo-users.sql
# - cleanup-auth-sessions.sql  
# - cleanup-login-history.sql
```

## Script cleanup sẽ làm gì?

### 1. Cleanup Duplicate Zalo Users
- Tìm tất cả users có cùng Zalo userId
- Giữ user mới nhất (theo `last_active`)
- Xóa: `zalo_sessions`, `bot_settings`, `user_settings`, `users` cũ

### 2. Cleanup Auth Sessions
- Xóa expired sessions (`expires_at < NOW()`)
- Xóa inactive sessions > 24h
- Giữ tối đa 3 active sessions per user

### 3. Cleanup Login History
- Giữ 1 record mới nhất per action type (login/logout) per user
- Xóa tất cả records cũ hơn

## Sau khi cleanup

### Kết quả mong đợi
- ✅ 1 tài khoản Zalo = 1 user trong database
- ✅ Mỗi user có tối đa 3 active auth sessions
- ✅ Login history chỉ có 1 record mới nhất per action
- ✅ Settings sync across devices (vì cùng user_id)
- ✅ Không tạo user mới khi login từ thiết bị khác

### Verification
Script sẽ tự động hiển thị:
```
=== CLEANUP COMPLETE ===

Table Counts:
- auth_users: X
- users (Zalo): Y (phải = số tài khoản Zalo unique)
- zalo_sessions: Y
- bot_settings: Y
- user_settings: Y

Users with Zalo accounts:
[Table showing user_id, zalo_user_id, name, phone]

Sessions per user:
[Max 3 active sessions per user]
```

### Test login từ thiết bị khác
1. Logout khỏi Zalo ở tất cả thiết bị
2. Login lại từ thiết bị 1
3. Login lại từ thiết bị 2
4. Kiểm tra database:
   ```sql
   SELECT COUNT(*) FROM users; -- Phải = 1
   SELECT COUNT(*) FROM zalo_sessions; -- Phải = 1
   ```

## Lưu ý
- ⚠️ **Backup database trước khi chạy cleanup!**
- ✅ Script an toàn: Chỉ xóa duplicate users, giữ lại user mới nhất
- ✅ Settings sẽ được giữ lại (settings mới nhất)
- ✅ Không ảnh hưởng đến `auth_users` (authentication system)

## Nếu có lỗi

### Error: "duplicate key value violates unique constraint"
- Có thể do script đang chạy khi có request login mới
- Giải pháp: Stop ứng dụng, chạy cleanup lại

### Error: "foreign key constraint"
- Do có data liên quan chưa được xóa
- Script đã xử lý đúng thứ tự (sessions → settings → users)
- Nếu vẫn lỗi: Chạy lại script

## Kết quả mong đợi
- 1 tài khoản Zalo = 1 user trong database
- Settings sync across devices (vì cùng user_id)
- Không tạo user mới khi login từ thiết bị khác
