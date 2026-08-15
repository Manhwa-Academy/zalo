# 🧹 Clear Message Logs

## Vấn Đề

Messages cũ đã được lưu với format sai:
- Stickers lưu dưới dạng text "Sticker Zalo"
- Files lưu không có metadata

## Fix Nhanh

### Option 1: Clear Local Storage (Client-side)

Trong browser (F12 → Console):
```javascript
localStorage.clear()
location.reload()
```

### Option 2: Clear Database Messages

Run trong Neon Console:
```sql
-- Xóa tất cả message logs
DELETE FROM message_logs;

-- Hoặc chỉ xóa messages cũ hơn 1 giờ
DELETE FROM message_logs 
WHERE created_at < NOW() - INTERVAL '1 hour';
```

### Option 3: Clear Listener Cache Files

Xóa các file cache:
- `.zalo-messages.json`
- `.zalo-media-cache.json`

Restart server để tạo file mới.

## Test Sau Khi Clear

1. Refresh page
2. Vào group chat
3. Gửi sticker MỚI từ điện thoại
4. ✅ Sticker hiển thị đúng ảnh

## Permanent Fix

Code đã được fix để:
1. Parse sticker/file đúng format khi nhận từ Zalo
2. Lưu vào DB dưới dạng JSON
3. Frontend render đúng từ JSON

Messages cũ vẫn có thể bị sai format, nhưng messages mới sẽ đúng!
