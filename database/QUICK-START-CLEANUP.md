# 🚀 Quick Start: Cleanup Database

## TL;DR - Chạy ngay 1 dòng lệnh này:

```bash
npx tsx database/cleanup-all.ts
```

## Cleanup sẽ làm gì?

✅ Xóa duplicate Zalo users (giữ user mới nhất)  
✅ Xóa auth sessions cũ (giữ max 3 active per user)  
✅ Xóa login history cũ (giữ 1 record mới nhất)

## Trước khi chạy

⚠️ **Backup database trước!** (nếu muốn an toàn)

```sql
-- Quick backup (optional)
-- Run these in your Neon.tech SQL editor
SELECT * FROM users;
SELECT * FROM zalo_sessions;
SELECT * FROM auth_sessions;
```

## Sau khi cleanup

### Verify kết quả
Script sẽ tự động hiển thị summary. Hoặc check thủ công:

```sql
-- Kiểm tra số users còn lại
SELECT COUNT(*) FROM users; -- Phải = số tài khoản Zalo unique

-- Kiểm tra auth sessions per user  
SELECT user_id, COUNT(*) as sessions
FROM auth_sessions
WHERE is_active = true
GROUP BY user_id; -- Max 3 per user
```

### Test login từ thiết bị khác
1. Logout Zalo ở tất cả thiết bị
2. Login lại từ thiết bị 1 ✅
3. Login từ thiết bị 2 ✅
4. Check database: Vẫn chỉ có 1 user ✅

## Troubleshooting

### Lỗi: "duplicate key value violates unique constraint"
- Stop ứng dụng
- Chạy cleanup lại

### Lỗi: "foreign key constraint"  
- Script đã xử lý đúng thứ tự
- Chạy lại script

### Có vấn đề khác?
Đọc file `README-CLEANUP.md` để hiểu chi tiết hơn.

## Done! 🎉

Sau khi cleanup xong:
- ✅ Code mới đã tự động prevent duplicate users
- ✅ Auth sessions tự động cleanup khi tạo session mới
- ✅ Login history tự động cleanup khi log event mới
- ✅ Không cần chạy cleanup script nữa (trừ khi muốn dọn dẹp manual)
