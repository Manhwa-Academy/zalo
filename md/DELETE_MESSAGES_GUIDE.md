# 🗑️ Hướng dẫn xóa tin nhắn & logs

## 📋 Tổng quan

Hệ thống cung cấp **3 phương thức xóa dữ liệu** khác nhau tùy theo nhu cầu:

---

## 🎯 Các tùy chọn xóa

### 1️⃣ Xóa trống tin nhắn (chat_only)

**Mô tả**: Chỉ xóa giao diện hiển thị tin nhắn trong Zalo Chat

**Ảnh hưởng**:
- ✅ Xóa: Lịch sử chat hiển thị trong UI
- ❌ KHÔNG xóa: Database `zalo_messages`
- ❌ KHÔNG xóa: File `.zalo-messages.json`

**Khi nào dùng**: 
- Muốn làm sạch giao diện chat
- Vẫn giữ dữ liệu trong database để backup/analytics

**API**: 
```javascript
window.dispatchEvent(new CustomEvent('zalo_clear_chat_history'))
```

---

### 2️⃣ Xóa mọi phần log (logs_only)

**Mô tả**: Xóa logs trong Dashboard & toàn bộ tin nhắn trong database

**Ảnh hưởng**:
- ✅ Xóa: Dashboard logs (in-memory)
- ✅ Xóa: Database `zalo_messages` (TẤT CẢ sessions của cùng Zalo user)
- ✅ Xóa: File `.zalo-messages.json`
- ❌ KHÔNG xóa: Giao diện chat UI

**Khi nào dùng**:
- Reset toàn bộ database
- Xóa lịch sử messages cho tất cả thiết bị (multi-session sync)
- Giữ giao diện chat hiện tại nhưng xóa backend data

**API**: 
```bash
POST /api/zalo/listener
Body: { "action": "clearLogs" }
```

**Logic**:
1. Clear in-memory cache (`messageQueue`)
2. Lấy `zaloUserId` từ session hiện tại
3. Tìm TẤT CẢ `user_id` (sessions) có cùng `zaloUserId`
4. Xóa messages: `DELETE FROM zalo_messages WHERE user_id = ANY($1)`

---

### 3️⃣ Xóa cả hai (both)

**Mô tả**: Xóa hoàn toàn cả giao diện + database

**Ảnh hưởng**:
- ✅ Xóa: Giao diện chat UI
- ✅ Xóa: Dashboard logs
- ✅ Xóa: Database `zalo_messages` (tất cả sessions)
- ✅ Xóa: File `.zalo-messages.json`

**Khi nào dùng**:
- Reset toàn bộ hệ thống
- Làm sạch mọi dữ liệu liên quan đến messages

**API**: Kết hợp option 1 + 2

---

## 🔧 Các API xóa tin nhắn

### 1. Xóa messages của một thread (conversation)

**Endpoint**: `DELETE /api/zalo/delete-thread-messages?threadId=<id>`

**Mô tả**: Xóa toàn bộ tin nhắn của một thread từ TẤT CẢ sessions

**Response**:
```json
{
  "success": true,
  "deletedCount": 150,
  "sessionsCount": 3,
  "scope": "all_sessions"
}
```

**Sử dụng**: 
- Tích hợp vào "Xóa cuộc trò chuyện" trong UI
- Tự động được gọi khi xóa conversation từ context menu

---

### 2. Xóa toàn bộ messages (debug)

**Endpoint**: `DELETE /api/debug/clear-messages?confirm=yes`

**Tham số**:
- `threadId` (optional): Xóa messages của thread cụ thể
- `confirm=yes` (required): Xác nhận xóa

**Mô tả**: Xóa messages (tất cả hoặc theo thread) từ TẤT CẢ sessions

**Response**:
```json
{
  "success": true,
  "deletedCount": 500,
  "threadId": "all"
}
```

**Ví dụ**:
```javascript
// Xóa TẤT CẢ messages
fetch('/api/debug/clear-messages?confirm=yes', { method: 'DELETE' })

// Xóa messages của một thread
fetch('/api/debug/clear-messages?threadId=123456&confirm=yes', { method: 'DELETE' })
```

---

### 3. Xóa toàn bộ logs (listener)

**Endpoint**: `POST /api/zalo/listener`

**Body**:
```json
{
  "action": "clearLogs"
}
```

**Mô tả**: Xóa in-memory cache + database messages (tất cả sessions)

**Logic**:
1. `clearStoredMessages()` - Xóa `messageQueue` và `.zalo-messages.json`
2. Get `zaloUserId` từ current session
3. Get all `user_id` sessions có cùng `zaloUserId`
4. `DELETE FROM zalo_messages WHERE user_id = ANY($sessionIds)`

---

## 🧪 Cách test

### Test 1: Xóa trống tin nhắn (Option 1)

1. Vào **Dashboard** → Click "Xóa logs / Tin nhắn"
2. Chọn **"1. Xóa trống tin nhắn"**
3. Kiểm tra:
   - ✅ Giao diện chat: rỗng
   - ✅ Database: `SELECT COUNT(*) FROM zalo_messages` → vẫn còn data

---

### Test 2: Xóa mọi phần log (Option 2)

1. Vào **Dashboard** → Click "Xóa logs / Tin nhắn"
2. Chọn **"2. Xóa mọi phần log"**
3. Kiểm tra:
   - ✅ Database: `SELECT COUNT(*) FROM zalo_messages` → 0 rows
   - ✅ File: `.zalo-messages.json` → `[]`
   - ✅ Giao diện chat: vẫn còn (không bị xóa)

---

### Test 3: Xóa cả hai (Option 3)

1. Vào **Dashboard** → Click "Xóa logs / Tin nhắn"
2. Chọn **"3. Xóa cả hai"**
3. Kiểm tra:
   - ✅ Giao diện chat: rỗng
   - ✅ Database: 0 rows
   - ✅ File: `[]`

---

### Test 4: Xóa conversation từ chat UI

1. Vào **Zalo Chat** → Right-click conversation
2. Click **"Xóa cuộc trò chuyện"**
3. Kiểm tra:
   - ✅ Conversation biến mất khỏi danh sách
   - ✅ Messages của thread đó bị xóa khỏi database (tất cả sessions)

---

## 📊 Multi-Session Sync

### Vấn đề
- Cùng một Zalo user đăng nhập trên nhiều thiết bị/sessions
- Mỗi session có `user_id` riêng trong bảng `users`
- Messages được lưu duplicate cho mỗi session

### Giải pháp
- Khi xóa messages, xóa từ **TẤT CẢ sessions** có cùng `zaloUserId`
- Logic:
  1. Query `zalo_sessions` để lấy `zaloUserId`
  2. Query `users` để lấy tất cả `user_id` có cùng `zaloUserId`
  3. Xóa messages: `WHERE user_id = ANY($sessionIds)`

### Code example
```typescript
// Get all sessions for Zalo user
const allSessions = await getAllSessionsForZaloUser(zaloUserId)
// sessionIds = ['uuid-1', 'uuid-2', 'uuid-3']

// Delete from all sessions
await pool.query(
  'DELETE FROM zalo_messages WHERE user_id = ANY($1)',
  [sessionIds]
)
```

---

## ⚠️ Lưu ý quan trọng

1. **Không thể khôi phục**: Sau khi xóa database, không thể phục hồi
2. **Multi-session**: Xóa sẽ ảnh hưởng đến TẤT CẢ thiết bị/sessions
3. **Backup**: Nên export logs trước khi xóa (dùng "Export logs")
4. **Zalo server**: Xóa chỉ ảnh hưởng local database, không xóa trên Zalo server

---

## 🔗 Related Files

- **UI Component**: `components/QuickActions.tsx`
- **Handler**: `app/page.tsx` → `handleClearLogs()`
- **API Endpoints**:
  - `app/api/zalo/listener/route.ts` (clearLogs action)
  - `app/api/zalo/delete-thread-messages/route.ts`
  - `app/api/debug/clear-messages/route.ts`
- **Database sync**: `lib/sync-sessions.ts`
- **Listener manager**: `lib/zalo-listener-manager.ts`

---

## ✅ Tóm tắt

| Tùy chọn | UI Chat | Database | File JSON | Dashboard Logs |
|----------|---------|----------|-----------|----------------|
| Option 1 | ✅ Xóa | ❌ Giữ | ❌ Giữ | ❌ Giữ |
| Option 2 | ❌ Giữ | ✅ Xóa | ✅ Xóa | ✅ Xóa |
| Option 3 | ✅ Xóa | ✅ Xóa | ✅ Xóa | ✅ Xóa |
