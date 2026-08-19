# Hướng dẫn chạy migration

## Vấn đề
Bảng `messages` chưa được tạo trong database, gây lỗi:
```
❌ [Sync] Error saving to session: relation "messages" does not exist
```

## Giải pháp

### Cách 1: Chạy từ Neon Dashboard (Khuyến nghị)
1. Đăng nhập vào [Neon Dashboard](https://console.neon.tech)
2. Chọn project của bạn
3. Vào tab **SQL Editor**
4. Copy toàn bộ nội dung file `messages-schema.sql`
5. Paste vào SQL Editor
6. Click **Run** để thực thi

### Cách 2: Chạy từ command line (nếu có psql)
```bash
psql "postgresql://[YOUR_CONNECTION_STRING]" -f database/messages-schema.sql
```

### Cách 3: Chạy từ code (Node.js)
Tạo file `scripts/migrate.ts`:

```typescript
import pool from '../lib/postgres'
import fs from 'fs'
import path from 'path'

async function runMigration() {
  try {
    const sql = fs.readFileSync(
      path.join(__dirname, '../database/messages-schema.sql'),
      'utf-8'
    )
    
    await pool.query(sql)
    console.log('✅ Migration completed successfully!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

runMigration()
```

Chạy:
```bash
npx tsx scripts/migrate.ts
```

## Kiểm tra
Sau khi chạy migration, kiểm tra bảng đã được tạo:

```sql
-- Kiểm tra bảng messages tồn tại
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'messages';

-- Kiểm tra cấu trúc bảng
\d messages

-- Kiểm tra số lượng tin nhắn
SELECT COUNT(*) FROM messages;
```

## Kết quả mong đợi
- ✅ Bảng `messages` được tạo thành công
- ✅ Không còn lỗi "relation messages does not exist"
- ✅ Bot có thể lưu tin nhắn vào database
