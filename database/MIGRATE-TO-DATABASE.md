# 🔄 Migration: JSON Files → PostgreSQL Database

## 📋 Tổng quan

Hệ thống ban đầu lưu tin nhắn và thống kê vào JSON files (`.zalo-messages.json`, `.zalo-stats.json`). Điều này gây ra vấn đề:
- ❌ **Mất dữ liệu khi deploy mới** trên Render.com/Railway (file system bị xóa)
- ❌ Không scale được với nhiều user
- ❌ Performance kém khi file lớn
- ❌ Không có backup tự động

**Giải pháp:** Migrate sang **PostgreSQL database** - dữ liệu persistent, không bị mất khi deploy.

---

## 🚀 Cách thực hiện Migration

### Bước 1: Chạy SQL schema

Tạo bảng `zalo_messages` và `zalo_stats`:

```bash
# Option 1: Copy SQL và chạy trực tiếp trên Neon Console
cat database/add-messages-stats-tables.sql
# → Copy & paste vào Neon SQL Editor

# Option 2: Dùng psql (nếu có)
psql $DATABASE_URL < database/add-messages-stats-tables.sql
```

### Bước 2: Migrate dữ liệu từ JSON files (Optional - chỉ nếu có dữ liệu cũ)

```bash
# Chạy migration script
npx ts-node database/migrate-json-to-db.ts
```

Script sẽ:
- ✅ Đọc `.zalo-messages.json` và `.zalo-stats.json`
- ✅ Insert vào PostgreSQL
- ✅ Tạo backup files (`.json.backup-TIMESTAMP`)
- ✅ Log ra số lượng records đã migrate

### Bước 3: Verify dữ liệu

```sql
-- Kiểm tra số lượng messages
SELECT COUNT(*) FROM zalo_messages;

-- Kiểm tra stats
SELECT * FROM zalo_stats WHERE thread_id IS NULL;

-- Xem tin nhắn gần nhất
SELECT * FROM zalo_messages ORDER BY timestamp DESC LIMIT 10;
```

---

## 📂 Files mới được tạo

### 1. Database Schema
- `database/add-messages-stats-tables.sql` - SQL schema cho 2 bảng mới

### 2. Helper Libraries
- `lib/messages-db.ts` - CRUD operations cho messages
- `lib/stats-db.ts` - CRUD operations cho stats

### 3. Migration Tools
- `database/migrate-json-to-db.ts` - Script migrate dữ liệu từ JSON

---

## 🔧 API Changes Needed

### Messages API

**Before (File system):**
```typescript
import fs from 'fs'
const messages = JSON.parse(fs.readFileSync('.zalo-messages.json', 'utf-8'))
```

**After (Database):**
```typescript
import { getAllMessages, saveMessage } from '@/lib/messages-db'

// Get messages
const messages = await getAllMessages(userId)

// Save message
await saveMessage(userId, {
  threadId: '123',
  content: 'Hello',
  isSelf: true,
  timestamp: Date.now()
})
```

### Stats API

**Before (File system):**
```typescript
import { getStats, incrementReceived } from '@/lib/bot-stats'
// bot-stats.ts internally uses JSON files
```

**After (Database):**
```typescript
import { getOverallStats, incrementReceived } from '@/lib/stats-db'

// Get stats
const stats = await getOverallStats(userId)

// Increment counters
await incrementReceived(userId)
await incrementThreadReceived(userId, threadId, threadName)
```

---

## 📊 Database Schema

### Table: `zalo_messages`

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | FK to users table |
| msg_id | VARCHAR | Message ID from Zalo |
| cli_msg_id | VARCHAR | Client message ID |
| thread_id | VARCHAR | Thread/Conversation ID |
| content | TEXT | Message content (text or JSON) |
| message_type | VARCHAR | Type: text, image, sticker, etc. |
| sender_id | VARCHAR | Sender user ID |
| sender_name | VARCHAR | Sender display name |
| is_self | BOOLEAN | Is this from the bot user? |
| timestamp | BIGINT | Unix timestamp (ms) |
| replied | BOOLEAN | Has bot replied to this? |
| is_undo | BOOLEAN | Has this been recalled? |
| metadata | JSONB | Extra data (avatar, quote, etc.) |
| created_at | TIMESTAMP | DB insert time |

**Indexes:**
- `user_id`, `thread_id`, `msg_id`, `cli_msg_id`, `timestamp`
- Composite: `(user_id, thread_id)` for fast thread queries

### Table: `zalo_stats`

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | FK to users table |
| thread_id | VARCHAR | Thread ID (NULL = overall stats) |
| thread_name | VARCHAR | Thread display name |
| stats_date | DATE | Date of stats (daily tracking) |
| total_received | INTEGER | All-time received count |
| total_sent | INTEGER | All-time sent count |
| total_auto_replied | INTEGER | All-time auto-reply count |
| received_today | INTEGER | Today's received count |
| sent_today | INTEGER | Today's sent count |
| auto_replied_today | INTEGER | Today's auto-reply count |
| created_at | TIMESTAMP | DB insert time |
| updated_at | TIMESTAMP | Last update time |

**Unique constraint:** `(user_id, thread_id, stats_date)`

**Indexes:**
- `user_id`, `thread_id`, `stats_date`, `updated_at`
- Composite: `(user_id, stats_date)` for daily queries

---

## 🎯 Files cần update

### Priority 1 (Critical):
- [ ] `lib/zalo-listener-manager.ts` - Thay đổi từ file system sang database
- [ ] `app/api/zalo/history/route.ts` - Get messages from DB
- [ ] `app/api/zalo/messages/route.ts` - Save messages to DB
- [ ] `app/api/zalo/stats/route.ts` - Get stats from DB

### Priority 2 (Important):
- [ ] `app/api/zalo/backup/route.ts` - Backup from DB instead of files
- [ ] `app/api/zalo/import-account/route.ts` - Import to DB
- [ ] `app/api/zalo/export-account/route.ts` - Export from DB

---

## ✅ Testing Checklist

After migration:
- [ ] Messages hiển thị đúng trong chat
- [ ] Stats hiển thị đúng (received/sent/auto-replied)
- [ ] Auto-reply vẫn hoạt động
- [ ] Deploy mới KHÔNG mất dữ liệu
- [ ] Backup/restore vẫn hoạt động
- [ ] Export account vẫn hoạt động

---

## 🔒 Cleanup (Sau khi verify thành công)

```bash
# Xóa JSON files backup sau khi đã verify dữ liệu
rm .zalo-messages.json.backup-*
rm .zalo-stats.json.backup-*

# Optional: Xóa luôn files gốc (sau khi 100% chắc chắn)
rm .zalo-messages.json
rm .zalo-stats.json
```

---

## 🚨 Rollback Plan (Nếu có vấn đề)

Nếu migration gặp lỗi, restore từ backup:

```bash
# Restore messages
cp .zalo-messages.json.backup-TIMESTAMP .zalo-messages.json

# Restore stats
cp .zalo-stats.json.backup-TIMESTAMP .zalo-stats.json

# Revert code changes
git revert <commit-hash>
```

---

## 📝 Notes

- Migration script **không xóa** JSON files tự động (safety)
- Backup files được tạo với timestamp để dễ identify
- Database operations có error handling (không crash app nếu DB down)
- Migration chỉ chạy **1 lần** (ON CONFLICT DO NOTHING prevents duplicates)

---

**🎉 Sau khi migration xong, dữ liệu sẽ persistent và không bị mất khi deploy!**
