# Sửa lỗi tin nhắn không hiển thị trên Production

## Vấn đề
- Production site (zalo-bot-vbbk.onrender.com) hiển thị "Chưa có tin nhắn hiển thị" mặc dù database có tin nhắn
- Local development hoạt động bình thường

## Nguyên nhân
API endpoint `/api/zalo/history` chỉ load tin nhắn từ Zalo API, không load từ database. Trên production, nếu chưa đăng nhập Zalo thì sẽ không có tin nhắn hiển thị.

## Giải pháp đã thực hiện

### 1. Cập nhật `/api/zalo/history` để load từ database
- **File**: `app/api/zalo/history/route.ts`
- **Thay đổi**:
  - Thêm fallback: Nếu chưa đăng nhập Zalo, load tin nhắn từ database
  - Merge tin nhắn từ 3 nguồn: Zalo API + Database + In-memory cache
  - Thêm logging chi tiết để debug

### 2. Cải thiện error handling
- Thêm error logging chi tiết hơn
- Trả về thông tin lỗi rõ ràng hơn (trong development mode)

## Cách test trên Production

### Bước 1: Check database có tin nhắn không
```sql
SELECT COUNT(*) FROM zalo_messages WHERE user_id = 'YOUR_USER_ID';
SELECT * FROM zalo_messages WHERE user_id = 'YOUR_USER_ID' LIMIT 5;
```

### Bước 2: Check API endpoint
1. Mở production site: https://zalo-bot-vbbk.onrender.com
2. Đăng nhập vào hệ thống (auth)
3. Mở DevTools Console (F12)
4. Kiểm tra logs khi click vào conversation:
   - `📦 [History] Loaded X messages from database for thread ...`
   - Hoặc: `❌ [History] Error loading messages: ...`

### Bước 3: Check user_id matching
1. Click vào Settings → Debug Info
2. Xem "Database User ID" (ví dụ: `9168a813-37b8-4b1b-98cc-fa860dcfa8b7`)
3. So sánh với user_id trong database:
```sql
SELECT user_id, COUNT(*) 
FROM zalo_messages 
GROUP BY user_id;
```

## Các trường hợp có thể xảy ra

### Case 1: User ID không khớp
**Triệu chứng**: Database có tin nhắn nhưng vẫn không hiển thị
**Nguyên nhân**: User ID trên production khác user ID trong database
**Giải pháp**: 
- Export database từ local: `/api/zalo/backup`
- Import vào production: `/api/zalo/backup` (POST)

### Case 2: Database connection issue
**Triệu chứng**: Console log: `❌ [History] Failed to load from database: ...`
**Nguyên nhân**: DATABASE_URL không được set đúng trên production
**Giải pháp**:
- Check environment variable `DATABASE_URL` trên Render.com
- Format: `postgresql://user:password@host:5432/database?sslmode=require`

### Case 3: Zalo API không login
**Triệu chứng**: Message hiển thị từ database nhưng không có avatar/real-time
**Nguyên nhân**: Chỉ load từ database, không có Zalo API connection
**Giải pháp**: 
- Login Zalo trên production (QR code)
- Sau đó tin nhắn sẽ merge từ cả Zalo API + Database

## Các thay đổi trong code

### Before (chỉ load từ Zalo API):
```typescript
const zaloApi = await getCurrentZaloApi() as any
if (!zaloApi) {
  return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
}
```

### After (fallback to database):
```typescript
const zaloApi = await getCurrentZaloApi() as any
const userId = await getCurrentUserId()

// If not logged into Zalo, try to load from database instead
if (!zaloApi) {
  console.log('⚠️ [History] Not logged into Zalo, loading from database...')
  
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }
  
  const dbMessages = await getThreadMessages(userId, threadId, 100)
  // Transform and return database messages
  return NextResponse.json({
    success: true,
    messages: formattedMessages,
    source: 'database'
  })
}
```

## Next Steps

1. **Push code lên production**:
```bash
git add .
git commit -m "fix: Load messages from database when Zalo API not available"
git push origin main
```

2. **Wait for deployment** trên Render.com (2-3 phút)

3. **Test trên production**:
   - Đăng nhập vào site
   - Click vào conversation
   - Check console logs
   - Kiểm tra tin nhắn có hiển thị không

4. **Nếu vẫn không hiện**:
   - Export database từ local
   - Import vào production
   - Hoặc gửi screenshot console logs để debug thêm

## Logs để kiểm tra

### Success (load từ database):
```
⚠️ [History] Not logged into Zalo, loading from database...
📦 [History] Loaded 6 messages from database for thread 3878568411905747795
```

### Success (load từ Zalo API + database):
```
📦 [History] Loaded 6 messages from database for thread 3878568411905747795
✅ [History] Fetched 10 messages from Zalo API
```

### Error (cần fix):
```
❌ [History] Failed to load from database: Error: ...
```

## Summary
- ✅ Code đã được fix để load từ database khi Zalo API không available
- ✅ Build thành công (TypeScript checks passed)
- 📋 Next: Push code lên production và test
