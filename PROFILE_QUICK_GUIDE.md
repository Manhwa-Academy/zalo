# 🚀 Quick Guide: Quản lý Profile & Avatar

## Mở modal

**Click vào avatar của bạn ở sidebar (góc dưới bên trái)**

## 2 Tabs chính

### 1️⃣ Thông tin
- Xem profile hiện tại (avatar, tên, zalo name)
- Edit:
  - Tên hiển thị
  - Tiểu sử / Trạng thái
- Click "Cập nhật Profile" để lưu

⚠️ Một số thông tin Zalo không cho phép đổi qua API

### 2️⃣ Avatar

#### Upload mới:
1. Click "Upload Avatar Mới"
2. Chọn ảnh (< 5MB)
3. Tự động upload & áp dụng

#### Dùng lại avatar cũ:
1. Hover vào avatar
2. Click 🔄
3. Áp dụng ngay

#### Xóa avatar:
1. Hover vào avatar (không phải đang dùng)
2. Click 🗑️
3. Confirm → Xóa

## Features

✨ **Upload**: Chọn file → Auto upload → Áp dụng ngay

✨ **Grid view**: 3 cột, hiển thị tất cả avatar đã dùng

✨ **Badge**: Avatar đang dùng có border xanh + badge

✨ **Hover actions**: Hover để hiện nút reuse/delete

✨ **Date**: Hiển thị ngày tạo avatar

## Validation

✅ File type: PNG, JPG, GIF, WEBP only

✅ File size: Max 5MB

✅ Cannot delete: Avatar đang dùng không xóa được

## API Endpoints

```bash
# Lấy thông tin tài khoản
GET /api/zalo/account-info

# Cập nhật profile
POST /api/zalo/update-profile
{ "displayName": "Tên mới", "bio": "Bio mới" }

# Upload avatar mới
POST /api/zalo/change-avatar
{ "avatar": "data:image/png;base64,..." }

# Lấy danh sách avatar
GET /api/zalo/avatar-list

# Dùng lại avatar cũ
POST /api/zalo/avatar-list
{ "action": "reuse", "avatarId": "xxx" }

# Xóa avatar
POST /api/zalo/avatar-list
{ "action": "delete", "avatarId": "xxx" }
```

## Tips

💡 **Upload nhanh**: Drag & drop file vào button (coming soon)

💡 **Preview**: Xem trước avatar trước khi upload (coming soon)

💡 **Crop**: Crop ảnh vuông để đẹp hơn

💡 **Cache**: Zalo có thể cache avatar, đợi vài giây để thấy thay đổi

---

**Tất cả chức năng đã sẵn sàng! 🎉**
