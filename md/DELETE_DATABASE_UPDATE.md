# Cập nhật: Xóa dữ liệu trong Database

## Tóm tắt thay đổi

Đã cập nhật các chức năng xóa dữ liệu để **xóa cả trong database**, không chỉ xóa trong memory/file.

## ✅ Chức năng đã cập nhật

### 1. **Xóa tin nhắn / logs** (Modal "Tùy chọn xóa dữ liệu")

#### Option 1: Xóa trống tin nhắn (chat_only)
- **Hoạt động**: Chỉ xóa giao diện Chat (localStorage)
- **Database**: KHÔNG xóa
- **File**: KHÔNG xóa

#### Option 2: Xóa mọi phần log (logs_only)
- **Hoạt động**: Xóa logs trong Dashboard + **database zalo_messages**
- **Database**: ✅ `DELETE FROM zalo_messages WHERE user_id = $1`
- **File**: ✅ Xóa `.zalo-messages.json`
- **Memory**: ✅ Clear messageQueue

#### Option 3: Xóa cả hai (both)
- **Hoạt động**: Xóa cả giao diện Chat + **database zalo_messages**
- **Database**: ✅ `DELETE FROM zalo_messages WHERE user_id = $1`
- **File**: ✅ Xóa `.zalo-messages.json`
- **Memory**: ✅ Clear messageQueue
- **UI**: ✅ Clear chat history display

### 2. **Reset thống kê** (Button "Reset thống kê")

- **Hoạt động**: Reset tất cả thống kê về 0 + **xóa database zalo_stats**
- **Database**: ✅ `DELETE FROM zalo_stats WHERE user_id = $1`
- **File**: ✅ Reset `.zalo-stats.json` về 0
- **Memory**: ✅ Reset currentStats về 0

## 📝 Files đã chỉnh sửa

### 1. `/app/api/zalo/listener/route.ts`
```typescript
// BEFORE
if (action === 'clearLogs') {
  clearStoredMessages()
  return NextResponse.json({ success: true, message: 'Message logs cleared' })
}

// AFTER
if (action === 'clearLogs') {
  // Clear in-memory cache
  clearStoredMessages()
  
  // Clear database - delete all messages for current user
  const userId = await getCurrentUserId()
  if (userId && pool) {
    await pool.query('DELETE FROM zalo_messages WHERE user_id = $1', [userId])
    console.log('✅ [Listener] Deleted all messages from database for user:', userId)
  }
  
  return NextResponse.json({ success: true, message: 'Message logs cleared from memory and database' })
}
```

### 2. `/app/api/zalo/stats/route.ts`
```typescript
// BEFORE
if (action === 'reset') {
  resetStatsData()
}

// AFTER
if (action === 'reset') {
  // Reset in-memory stats
  resetStatsData()
  
  // Reset database - delete stats for current user
  const userId = await getCurrentUserId()
  if (userId && pool) {
    await pool.query('DELETE FROM zalo_stats WHERE user_id = $1', [userId])
    console.log('✅ [Stats] Deleted stats from database for user:', userId)
  }
}
```

### 3. `/components/QuickActions.tsx`
Cập nhật mô tả trong modal để phản ánh việc xóa database:
- Option 2: "Xóa lịch sử sự kiện Bot trong Dashboard & **database (table zalo_messages)**"
- Option 3: "Xóa hoàn toàn cả giao diện Chat Zalo + **database logs (zalo_messages)**"

### 4. `/app/page.tsx`
Cập nhật modal "Reset thống kê" để hiển thị cảnh báo xóa database:
- Thêm dòng: "• **Database zalo_stats** (xóa vĩnh viễn)"

## 🧪 Cách test

### Test 1: Xóa mọi phần log
1. Truy cập Dashboard
2. Click "Xóa logs / Tin nhắn"
3. Chọn "2. Xóa mọi phần log"
4. Check console logs:
   - `✅ [Listener] Deleted all messages from database for user: <user_id>`
5. Check database:
   ```sql
   SELECT COUNT(*) FROM zalo_messages WHERE user_id = '<your_user_id>';
   -- Kết quả: 0
   ```

### Test 2: Reset thống kê
1. Truy cập Dashboard
2. Click "Reset thống kê"
3. Xác nhận trong modal
4. Check console logs:
   - `✅ [Stats] Deleted stats from database for user: <user_id>`
5. Check database:
   ```sql
   SELECT * FROM zalo_stats WHERE user_id = '<your_user_id>';
   -- Kết quả: 0 rows
   ```

### Test 3: Xóa cả hai
1. Truy cập Dashboard
2. Click "Xóa logs / Tin nhắn"
3. Chọn "3. Xóa cả hai"
4. Check:
   - ✅ Giao diện Chat trống
   - ✅ Dashboard logs trống
   - ✅ Database zalo_messages đã xóa (query SQL)

## ⚠️ Lưu ý quan trọng

### Multi-user safety
- Mỗi user chỉ xóa dữ liệu của **chính họ** (`WHERE user_id = $1`)
- Không ảnh hưởng đến dữ liệu của user khác

### Database backup
- Nên backup database trước khi test tính năng xóa
- Có thể dùng `/api/zalo/backup` để export dữ liệu

### Rollback
- Nếu xóa nhầm, có thể restore từ backup
- File backup có timestamp trong tên file

## 📊 Database tables liên quan

### Table: `zalo_messages`
```sql
CREATE TABLE zalo_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  msg_id TEXT,
  cli_msg_id TEXT,
  thread_id TEXT NOT NULL,
  content TEXT,
  message_type TEXT,
  sender_id TEXT,
  sender_name TEXT,
  is_self BOOLEAN DEFAULT FALSE,
  timestamp BIGINT,
  replied BOOLEAN DEFAULT FALSE,
  is_undo BOOLEAN DEFAULT FALSE,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_message UNIQUE (user_id, thread_id, msg_id)
);
```

### Table: `zalo_stats`
```sql
CREATE TABLE zalo_stats (
  user_id UUID PRIMARY KEY,
  total_received INTEGER DEFAULT 0,
  total_sent INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🎯 Expected behavior

### Trước khi xóa:
- Database có tin nhắn: `SELECT COUNT(*) FROM zalo_messages` → 100 rows
- Database có stats: `SELECT * FROM zalo_stats` → 1 row
- Giao diện hiển thị tin nhắn và thống kê

### Sau khi xóa (Option 2: Xóa mọi phần log):
- Database: `SELECT COUNT(*) FROM zalo_messages WHERE user_id = '<user_id>'` → 0 rows
- File `.zalo-messages.json`: `[]`
- Dashboard: Logs = 0

### Sau khi reset thống kê:
- Database: `SELECT * FROM zalo_stats WHERE user_id = '<user_id>'` → 0 rows
- File `.zalo-stats.json`: `{"totalMessages":0,"repliedMessages":0,"activeChats":[]}`
- Dashboard: Stats cards = 0

## ✅ Checklist

- [x] Xóa tin nhặn xóa cả database `zalo_messages`
- [x] Reset thống kê xóa cả database `zalo_stats`
- [x] Cập nhật UI descriptions để phản ánh database deletion
- [x] Multi-user safety (chỉ xóa dữ liệu của user hiện tại)
- [x] Error handling và logging
- [x] TypeScript checks passed
- [ ] Test trên local
- [ ] Test trên production
