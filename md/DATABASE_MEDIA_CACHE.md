# 💾 Database Media Cache - Giải quyết vấn đề URL hết hạn

## Vấn đề
- Giphy GIF và hình ảnh gửi qua Zalo bị hiển thị "[URL đã hết hạn]" sau 1 thời gian
- URL từ Zalo CDN có thời hạn (expire) và không thể truy cập lại
- localStorage cache bị mất khi clear browser data

## Giải pháp
Lưu URL media vào database PostgreSQL để URL không bao giờ bị mất.

## Cài đặt

### Bước 1: Chạy Migration SQL
Chạy file migration để tạo table `media_cache`:

```bash
psql -h your-db-host -U your-user -d your-database -f database/add-media-cache.sql
```

Hoặc copy nội dung từ `database/add-media-cache.sql` và chạy trong Neon SQL Editor.

### Bước 2: Verify Table
Kiểm tra table đã được tạo:

```sql
SELECT * FROM media_cache LIMIT 5;
```

## Cách hoạt động

### 1. Khi gửi Giphy GIF
```typescript
// Frontend gửi Giphy ID khi upload
formData.append('giphyId', gif.id)

// Backend lưu vào database
await saveMediaToCache(
  userId,
  'giphy_xxx.gif',
  'https://media.giphy.com/media/xxx/giphy.gif',
  'gif',
  'xxx' // Giphy ID
)
```

### 2. Khi load lại tin nhắn
```typescript
// Frontend load cache từ database
const res = await fetch('/api/zalo/media-cache')
const { cache } = await res.json()

// Cache có dạng:
{
  "giphy_xxx.gif": "https://media.giphy.com/media/xxx/giphy.gif",
  "giphy_id_xxx": "https://media.giphy.com/media/xxx/giphy.gif"
}
```

### 3. Khi render message
```typescript
// Nếu URL Zalo CDN hết hạn, dùng cache từ database
if (giphyId) {
  const cachedUrl = cache[`giphy_id_${giphyId}`]
  if (cachedUrl) {
    imgUrl = cachedUrl // Dùng URL gốc từ Giphy
  }
}
```

## Database Schema

```sql
CREATE TABLE media_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    file_name VARCHAR(500) NOT NULL,
    original_url TEXT NOT NULL,
    media_type VARCHAR(50) DEFAULT 'image',
    giphy_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Indexes
- `idx_media_cache_file_name`: Lookup nhanh theo filename
- `idx_media_cache_giphy_id`: Lookup nhanh theo Giphy ID
- `idx_media_cache_user_id`: Filter theo user
- `idx_media_cache_unique_file`: Unique constraint (user + filename)

## API Endpoints

### GET /api/zalo/media-cache
Lấy toàn bộ cache của user hiện tại.

**Response:**
```json
{
  "success": true,
  "cache": {
    "giphy_xxx.gif": "https://media.giphy.com/...",
    "giphy_id_xxx": "https://media.giphy.com/..."
  }
}
```

### POST /api/zalo/media-cache
Lưu media URL vào cache.

**Request:**
```json
{
  "fileName": "giphy_xxx.gif",
  "url": "https://media.giphy.com/...",
  "mediaType": "gif",
  "giphyId": "xxx"
}
```

**Response:**
```json
{
  "success": true
}
```

## Functions

### `saveMediaToCache(userId, fileName, url, mediaType, giphyId)`
Lưu media URL vào database.

### `getMediaFromCache(fileName, userId?)`
Lấy URL từ cache theo filename.

### `getMediaByGiphyId(giphyId, userId?)`
Lấy URL từ cache theo Giphy ID.

### `getAllMediaCache(userId?)`
Lấy toàn bộ cache của user (hoặc tất cả nếu không có userId).

### `cleanupOldMediaCache(daysOld = 90)`
Xóa cache cũ hơn X ngày (default 90 ngày).

## Lợi ích

✅ **URL không bao giờ hết hạn**: Lưu URL gốc từ Giphy, không phụ thuộc Zalo CDN
✅ **Multi-user support**: Mỗi user có cache riêng
✅ **Fast lookup**: Index theo filename và Giphy ID
✅ **Automatic cleanup**: Có thể dọn dẹp cache cũ
✅ **Persistent**: Không bị mất khi clear localStorage
✅ **Scalable**: Lưu trong database, không giới hạn size

## Migration từ localStorage

Code tự động sync từ localStorage sang database khi user load trang:

```typescript
useEffect(() => {
  const syncMediaCache = async () => {
    try {
      const res = await fetch('/api/zalo/media-cache')
      if (res.ok) {
        const data = await res.json()
        if (data.success && data.cache) {
          // Merge với localStorage
          const existing = JSON.parse(localStorage.getItem('giphy_cache') || '{}')
          const merged = { ...existing, ...data.cache }
          localStorage.setItem('giphy_cache', JSON.stringify(merged))
        }
      }
    } catch (e) {}
  }
  syncMediaCache()
}, [])
```

## Maintenance

### Xem cache của user
```sql
SELECT 
  file_name,
  original_url,
  media_type,
  giphy_id,
  created_at
FROM media_cache
WHERE user_id = 'your-user-id'
ORDER BY created_at DESC
LIMIT 20;
```

### Xóa cache cũ hơn 90 ngày
```sql
DELETE FROM media_cache 
WHERE created_at < NOW() - INTERVAL '90 days';
```

### Thống kê cache
```sql
SELECT 
  media_type,
  COUNT(*) as total,
  COUNT(DISTINCT user_id) as unique_users
FROM media_cache
GROUP BY media_type;
```

## Troubleshooting

### Cache không load
1. Kiểm tra table `media_cache` đã được tạo chưa
2. Kiểm tra connection string PostgreSQL trong `.env`
3. Check logs: `console.log` trong `lib/media-cache-db.ts`

### URL vẫn hết hạn
1. Verify Giphy ID được lưu đúng: `SELECT * FROM media_cache WHERE giphy_id IS NOT NULL`
2. Kiểm tra frontend có gửi `giphyId` trong FormData không
3. Check response từ `/api/zalo/media-cache`

### Performance
Nếu cache quá lớn (>10,000 entries), chạy cleanup:

```typescript
import { cleanupOldMediaCache } from '@/lib/media-cache-db'
await cleanupOldMediaCache(30) // Xóa cache >30 ngày
```

## Hoàn tất! 🎉

Giờ Giphy GIF và hình ảnh sẽ không bao giờ bị "[URL đã hết hạn]" nữa!
