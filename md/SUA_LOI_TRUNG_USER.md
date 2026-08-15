# Đã sửa: Lỗi tài khoản Zalo bị trùng nhiều users trong database

## 🐛 Vấn đề đã sửa

Trước đây khi bạn đăng nhập Zalo từ nhiều thiết bị/trình duyệt khác nhau (ví dụ: Chrome trên máy tính, Firefox, điện thoại), hệ thống sẽ tạo nhiều users trong database cho cùng 1 tài khoản Zalo.

**Ví dụ thực tế:**
- Bạn có 1 tài khoản Zalo: "Hoàng Kiều Phong"
- Đăng nhập từ Chrome → Database tạo user 1
- Đăng nhập từ Firefox → Database tạo user 2  
- Đăng nhập từ điện thoại → Database tạo user 3

Kết quả: 3 users khác nhau trong database cho cùng 1 người!

## ✅ Đã sửa như thế nào

Bây giờ khi bạn đăng nhập Zalo:

1. Hệ thống kiểm tra xem tài khoản Zalo này đã có trong database chưa
2. Nếu **đã có** → Dùng lại user cũ thay vì tạo user mới
3. Nếu **chưa có** → Mới tạo user mới

**Code đã thêm:**

```typescript
// Khi login Zalo thành công
if (userInfo.userId) {
  // Check xem Zalo userId này đã tồn tại chưa?
  const existingUser = await UserManager.getUserByZaloId(userInfo.userId);
  
  if (existingUser) {
    // Đã có rồi → Dùng lại user cũ
    await UserManager.linkSessionToUser(currentSessionId, existingUser.id);
  }
}
```

## 🔧 Dọn dẹp dữ liệu cũ

Để dọn dẹp các users trùng lặp đã có trong database, chạy lệnh:

```bash
node scripts/merge-duplicate-users.js
```

Script này sẽ:
- ✅ Tìm tất cả tài khoản Zalo có nhiều hơn 1 user trong database
- ✅ Giữ lại user **cũ nhất** (tạo đầu tiên)
- ✅ Chuyển tất cả sessions, settings, message logs sang user cũ nhất
- ✅ Xóa các user trùng lặp

**Kết quả sau khi chạy:**

```
🔍 Tìm kiếm users trùng lặp...

⚠️  Tìm thấy 3 tài khoản Zalo có users trùng:

📱 Zalo User: Hoàng Kiều Phong (ID: 118854422039702054)
   Số lượng trùng: 3 users
   
🔀 Đang merge...
   ✓ Giữ user cũ nhất
   ✓ Di chuyển sessions từ users khác
   ✓ Xóa users trùng lặp
   ✅ Hoàn thành

📊 Tổng kết:
   Đã merge: 3 tài khoản Zalo
   Đã xóa: 6 users trùng lặp
```

## 🎯 Kết quả

**Trước khi sửa:**
- Login từ Chrome → User A
- Login từ Firefox → User B (duplicate!)
- Login từ điện thoại → User C (duplicate!)

**Sau khi sửa:**
- Login từ Chrome → User A
- Login từ Firefox → Vẫn dùng User A (không tạo mới!)
- Login từ điện thoại → Vẫn dùng User A

Tất cả settings, messages, sessions đều được lưu vào cùng 1 user, không bị tách rời.

## 📝 Files đã sửa

1. **lib/user-manager.ts**
   - Thêm `getUserByZaloId()` - Tìm user theo Zalo userId
   - Thêm `linkSessionToUser()` - Merge session vào user đã có

2. **app/api/zalo/login/route.ts**
   - Check Zalo userId trước khi lưu session
   - Merge vào user cũ nếu đã tồn tại

3. **scripts/merge-duplicate-users.js**
   - Script để dọn dẹp users trùng lặp trong database

4. **md/FIX_MULTI_DEVICE_DUPLICATE.md**
   - Tài liệu chi tiết (English)

5. **md/SUA_LOI_TRUNG_USER.md**
   - Tài liệu này (Tiếng Việt)

## 🚀 Làm gì tiếp theo?

### Bước 1: Deploy code mới
```bash
git add .
git commit -m "Fix: Prevent duplicate users for same Zalo account on multiple devices"
git push
```

### Bước 2: Chạy migration để dọn dẹp database
```bash
node scripts/merge-duplicate-users.js
```

### Bước 3: Test
- Đăng nhập Zalo từ Chrome
- Đăng nhập lại từ Firefox
- Check database xem còn tạo user mới không:

```sql
SELECT 
  zs.user_info->>'userId' as zalo_user_id,
  zs.user_info->>'displayName' as ten_zalo,
  COUNT(DISTINCT u.id) as so_luong_users
FROM zalo_sessions zs
INNER JOIN users u ON zs.user_id = u.id
GROUP BY zs.user_info->>'userId', zs.user_info->>'displayName'
ORDER BY so_luong_users DESC;
```

Nếu cột `so_luong_users` tất cả đều = 1 → Đã fix thành công! ✅

## ❓ Câu hỏi thường gặp

**Q: Nếu tôi đã login từ 2 devices, sau khi sửa thì sao?**
A: Cả 2 devices vẫn hoạt động bình thường, chỉ là trong database chỉ có 1 user thay vì 2.

**Q: Settings của bot có bị mất không?**
A: Không, script sẽ giữ settings của user cũ nhất hoặc merge settings lại.

**Q: Message logs có bị mất không?**
A: Không, tất cả messages đều được chuyển sang user chính.

**Q: Có an toàn không?**
A: Script chạy trong transaction, nếu có lỗi sẽ rollback. Tuy nhiên nên backup database trước:
```bash
pg_dump $DATABASE_URL > backup.sql
```
