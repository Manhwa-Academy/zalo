# 🚀 Quick Guide: Quản lý Bạn Bè

## Mở modal

**Sidebar → Menu ⋯ → "Quản lý bạn bè"**

## 3 Tabs chính

### 1️⃣ Lời mời đã gửi
- Xem danh sách lời mời đã gửi
- Hủy lời mời (nút "Hủy")
- Tìm kiếm theo tên

### 2️⃣ Gợi ý kết bạn
- Xem gợi ý từ Zalo
- Gửi lời mời ngay (nút "Kết bạn")
- Hiển thị số bạn chung

### 3️⃣ Quản lý
- Hướng dẫn xóa bạn/chặn người dùng
- Làm trong chat 1:1

## Xóa bạn / Chặn người dùng

**Chat 1:1 → Menu ⋮ (More) → Chọn action**

### Xóa bạn bè
- Hủy kết bạn
- Vẫn nhìn thấy profile
- Có thể kết bạn lại

### Chặn người dùng
- Chặn hoàn toàn
- Không nhận tin nhắn
- Chat biến mất khỏi sidebar

## API Endpoints

```bash
# Lấy lời mời đã gửi
GET /api/zalo/sent-friend-requests

# Hủy lời mời
POST /api/zalo/add-friend
{ "userId": "xxx", "action": "undo" }

# Chấp nhận lời mời
POST /api/zalo/accept-friend-request
{ "userId": "xxx" }

# Xóa bạn
POST /api/zalo/remove-friend
{ "userId": "xxx" }

# Chặn người dùng
POST /api/zalo/block-user
{ "userId": "xxx" }

# Bỏ chặn
POST /api/zalo/unblock-user
{ "userId": "xxx" }

# Gợi ý kết bạn
GET /api/zalo/friend-recommendations

# Kiểm tra trạng thái
GET /api/zalo/friend-request-status?userId=xxx
```

## Keyboard Shortcuts (Future)

```
⌘/Ctrl + Shift + F - Mở modal quản lý bạn bè
Tab - Chuyển tab
Enter - Confirm action
Esc - Đóng modal
```

## Tips

💡 **Tìm kiếm nhanh:** Gõ tên vào search box trong mỗi tab

💡 **Action confirmation:** Tất cả destructive actions đều có confirm dialog

💡 **Real-time update:** UI tự động cập nhật sau mỗi action thành công

💡 **Error handling:** Toast messages hiển thị kết quả action

---

**Tất cả chức năng đã sẵn sàng! 🎉**
