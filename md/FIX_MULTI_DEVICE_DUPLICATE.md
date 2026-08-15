# Fix: Multi-Device User Duplication

## 🐛 Vấn đề

Khi cùng 1 tài khoản Zalo đăng nhập từ nhiều thiết bị/trình duyệt khác nhau, hệ thống tạo nhiều `users` entries và nhiều `zalo_sessions` trong database.

**Ví dụ:**
- User "Hoàng Kiều Phong" (Zalo ID: `118854422039702054`)
- Đăng nhập từ Chrome desktop → Tạo `user_1`
- Đăng nhập từ Firefox → Tạo `user_2`
- Đăng nhập từ điện thoại → Tạo `user_3`

**Kết quả:** 3 users trong database cho cùng 1 người!

## 🔍 Nguyên nhân

```typescript
// BEFORE: Chỉ check theo sessionId (mỗi browser có sessionId khác nhau)
static async getOrCreateUser(sessionId: string): Promise<User> {
  let result = await pool.query(
    'SELECT * FROM users WHERE session_id = $1',
    [sessionId]
  );
  
  if (result.rows.length > 0) {
    return existingUser; // Tìm thấy user với sessionId này
  }
  
  // Tạo user mới (không check xem Zalo userId đã tồn tại chưa!)
  return createNewUser(sessionId);
}
```

Mỗi lần đăng nhập từ device mới:
1. Browser tạo `sessionId` mới (UUID random)
2. System tạo `user` mới cho `sessionId` đó
3. Sau khi login Zalo → Lưu session vào `zalo_sessions`
4. **KHÔNG check** xem Zalo `userId` đã tồn tại trong database chưa

## ✅ Giải pháp

### 1. Thêm function check Zalo userId

```typescript
// lib/user-manager.ts

/**
 * Tìm user theo Zalo userId (để tránh duplicate user cho cùng 1 tài khoản Zalo)
 */
static async getUserByZaloId(zaloUserId: string): Promise<User | null> {
  const result = await pool.query(
    `SELECT u.* FROM users u
     INNER JOIN zalo_sessions zs ON u.id = zs.user_id
     WHERE zs.user_info->>'userId' = $1
     AND zs.is_active = true
     LIMIT 1`,
    [zaloUserId]
  );
  
  return result.rows.length > 0 ? result.rows[0] : null;
}
```

### 2. Thêm function merge sessions

```typescript
/**
 * Link sessionId mới với user đã tồn tại (để merge multi-device)
 */
static async linkSessionToUser(sessionId: string, userId: string): Promise<void> {
  await pool.query(
    'UPDATE users SET session_id = $1, last_active = CURRENT_TIMESTAMP WHERE id = $2',
    [sessionId, userId]
  );
}
```

### 3. Update login flow

```typescript
// app/api/zalo/login/route.ts

// Sau khi login Zalo thành công
let userInfo = await populateUserInfo(zaloApi);

// Check if this Zalo account already exists
if (userInfo.userId && userInfo.userId !== 'Unknown') {
  const existingUser = await UserManager.getUserByZaloId(userInfo.userId);
  
  if (existingUser && existingUser.id !== userId) {
    // Tìm thấy user cũ → Merge session thay vì tạo user mới
    await UserManager.linkSessionToUser(currentSessionId, existingUser.id);
  }
}
```

## 🔧 Migration Script

Để merge các duplicate users đã tồn tại:

```bash
node scripts/merge-duplicate-users.js
```

Script sẽ:
1. Tìm tất cả Zalo userId có nhiều hơn 1 database user
2. Giữ user **cũ nhất** (created_at sớm nhất)
3. Move tất cả sessions, settings, message logs sang user cũ nhất
4. Xóa các duplicate users

**Output ví dụ:**
```
🔍 Searching for duplicate Zalo users...

⚠️  Found 3 Zalo accounts with duplicate users:

📱 Zalo User: Hoàng Kiều Phong (ID: 118854422039702054)
   Duplicate count: 3 users
   User IDs: uuid-1, uuid-2, uuid-3

🔀 Merging Zalo user: Hoàng Kiều Phong
   Primary user (keep): uuid-1
   Duplicate users (merge & delete): uuid-2, uuid-3
   ✓ Moved sessions from uuid-2 to uuid-1
   ✓ Moved sessions from uuid-3 to uuid-1
   ✓ Deleted duplicate user uuid-2
   ✓ Deleted duplicate user uuid-3
   ✅ Successfully merged 2 duplicate users

📊 Migration Summary:
   Zalo accounts merged: 3
   Duplicate users deleted: 6
```

## 🧪 Test Scenarios

### Scenario 1: User mới login lần đầu
```
1. User mở browser mới → sessionId = "session-A"
2. Scan QR Zalo → zaloUserId = "123"
3. Check getUserByZaloId("123") → NULL (chưa tồn tại)
4. Tạo user mới với sessionId "session-A"
5. Lưu zalo_session với userId và zaloUserId "123"
```

### Scenario 2: User đã login, login lại từ device khác
```
1. User mở Firefox → sessionId = "session-B" (khác session-A)
2. Scan QR Zalo → zaloUserId = "123" (cùng account)
3. Check getUserByZaloId("123") → FOUND existing user
4. Merge: UPDATE users SET session_id = "session-B" WHERE id = existing_user_id
5. Next request từ Firefox sẽ dùng existing_user_id thay vì tạo user mới
```

### Scenario 3: User switch giữa các devices
```
User có thể login từ nhiều devices, nhưng:
- Tất cả đều dùng CÙNG 1 database user
- Mỗi device có session_id riêng
- Session_id mới nhất sẽ "ghi đè" trong users table
- Zalo sessions của tất cả devices đều link đến cùng 1 user_id
```

## 📊 Database Changes

**BEFORE:**
```
users:
  - id: uuid-1, session_id: "session-A"
  - id: uuid-2, session_id: "session-B"
  - id: uuid-3, session_id: "session-C"

zalo_sessions:
  - user_id: uuid-1, user_info: { userId: "123", name: "Phong" }
  - user_id: uuid-2, user_info: { userId: "123", name: "Phong" }
  - user_id: uuid-3, user_info: { userId: "123", name: "Phong" }
```

**AFTER (sau migration):**
```
users:
  - id: uuid-1, session_id: "session-C" (latest)

zalo_sessions:
  - user_id: uuid-1, user_info: { userId: "123", name: "Phong" } (session A)
  - user_id: uuid-1, user_info: { userId: "123", name: "Phong" } (session B)
  - user_id: uuid-1, user_info: { userId: "123", name: "Phong" } (session C)
```

## ⚠️ Lưu ý

1. **Session_id trong users table:** Sẽ là sessionId của device login **gần nhất**. Đây là behavior mong muốn vì user thường chỉ active trên 1 device tại 1 thời điểm.

2. **Zalo_sessions table:** Vẫn có thể có nhiều sessions (1 per device), nhưng tất cả đều link về cùng 1 `user_id`.

3. **Bot settings:** Shared giữa tất cả devices vì cùng 1 user_id.

4. **Message logs:** Tất cả messages của user đều link về cùng 1 user_id.

## 🚀 Deployment Steps

1. **Backup database:**
   ```bash
   pg_dump $DATABASE_URL > backup.sql
   ```

2. **Deploy code changes:**
   - `lib/user-manager.ts` → Added `getUserByZaloId()` and `linkSessionToUser()`
   - `app/api/zalo/login/route.ts` → Check for existing Zalo user before saving

3. **Run migration:**
   ```bash
   node scripts/merge-duplicate-users.js
   ```

4. **Verify:**
   ```sql
   SELECT 
     zs.user_info->>'userId' as zalo_user_id,
     COUNT(DISTINCT u.id) as user_count
   FROM zalo_sessions zs
   INNER JOIN users u ON zs.user_id = u.id
   GROUP BY zs.user_info->>'userId'
   HAVING COUNT(DISTINCT u.id) > 1;
   ```
   
   Nếu query trả về 0 rows → Success! Không còn duplicate users.

## ✅ Files Changed

- `lib/user-manager.ts` → Added duplicate detection functions
- `app/api/zalo/login/route.ts` → Merge sessions on login
- `scripts/merge-duplicate-users.js` → Migration script to clean existing duplicates
- `md/FIX_MULTI_DEVICE_DUPLICATE.md` → This documentation
