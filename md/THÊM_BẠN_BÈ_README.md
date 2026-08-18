# 📋 HƯỚNG DẪN SỬ DỤNG CHỨC NĂNG THÊM BẠN BÈ

## ✅ Đã Hoàn Thành

Chức năng **Thêm bạn bè qua số điện thoại** đã được tích hợp hoàn chỉnh vào Zalo Web!

---

## 📍 Vị Trí Nút "Thêm Bạn Bè"

**Nút nằm ở góc trên bên phải của sidebar trái (danh sách trò chuyện)**

```
┌─────────────────────────────────────┐
│ [🔍 Tìm kiếm...]  [🔄]  [👥]       │  ← NÚT THÊM BẠN Ở ĐÂY
├─────────────────────────────────────┤
│ [Tất cả] [Cá nhân] [Nhóm]          │
├─────────────────────────────────────┤
│ Danh sách trò chuyện...             │
└─────────────────────────────────────┘
```

- **[🔄]** = Đồng bộ tin nhắn
- **[👥]** = Thêm bạn bè ← **NÚT MỚI**

---

## 🎯 Cách Sử Dụng

### Bước 1: Mở Modal Thêm Bạn
- Bấm vào nút **👥** ở góc trên bên phải sidebar trái
- Modal "Thêm bạn" sẽ hiện ra

### Bước 2: Nhập Số Điện Thoại
- Chọn mã quốc gia:
  - 🇻🇳 **+84** (Việt Nam) - mặc định
  - 🇺🇸 **+1** (Mỹ)
  - 🇨🇳 **+86** (Trung Quốc)
- Nhập số điện thoại (ví dụ: `0962949858`)
- Bấm **🔍 Tìm kiếm**

### Bước 3: Xem Thông Tin Người Dùng
Sau khi tìm thấy, sẽ hiển thị:
- 🖼️ Ảnh đại diện
- 👤 Tên hiển thị
- 📱 Số điện thoại
- ✅ Trạng thái (Đã là bạn / Có thể kết bạn)

### Bước 4: Gửi Lời Mời Kết Bạn
- Nhập lời nhắn (hoặc dùng mẫu có sẵn):
  - *"Xin chào, mình là Hoàng Kiều Phong. Kết bạn với mình nhé!"*
- Bấm **📤 Gửi yêu cầu**

### Bước 5: Xem Kết Quả & Tùy Chọn Hủy
Sau khi gửi thành công:
- ✅ Hiển thị thông báo "Đã gửi lời mời thành công!"
- 🖼️ Xem lại thông tin người nhận
- 💬 Xem lại lời nhắn đã gửi
- **❌ Hủy lời mời** - Nếu bạn gửi nhầm hoặc muốn hủy
- **Đóng** - Đóng modal và quay lại danh sách

---

## 🔗 Đồng Bộ Web ↔️ App

✅ **Hoàn toàn đồng bộ giữa Web và Zalo App:**
- Gửi lời mời từ Web → Hiển thị ngay trên App Zalo
- Người nhận có thể chấp nhận/từ chối trên App Zalo
- Sử dụng API chính thức của Zalo (zca-js)

---

## 🎨 Giao Diện

### Header Sidebar (Vị trí nút)
```
┌─────────────────────────────────────┐
│ [Tìm kiếm trò chuyện...] [🔄] [👥]  │
└─────────────────────────────────────┘
```

### Modal Thêm Bạn
```
┌────────────────────────────────────┐
│ Thêm bạn                      [✕]  │
├────────────────────────────────────┤
│ Số điện thoại:                     │
│ [🇻🇳 +84] [0962949858_______]     │
│                                    │
│ [🔍 Tìm kiếm]                      │
└────────────────────────────────────┘
```

### Kết Quả Tìm Kiếm
```
┌────────────────────────────────────┐
│ [🖼️]  Hoàng Kiều Phong            │
│       0962949858                   │
├────────────────────────────────────┤
│ Lời nhắn:                          │
│ [Xin chào, mình là...______]      │
│                                    │
│ [← Quay lại]  [📤 Gửi yêu cầu]    │
└────────────────────────────────────┘
```

### Màn Hình Thành Công (Mới!)
```
┌────────────────────────────────────┐
│        ✅                          │
│  Đã gửi lời mời thành công!        │
│  Lời mời đã được gửi đến:          │
├────────────────────────────────────┤
│ [🖼️]  Hoàng Kiều Phong            │
│       0962949858                   │
├────────────────────────────────────┤
│ Lời nhắn đã gửi:                   │
│ "Xin chào, mình là..."             │
├────────────────────────────────────┤
│ [❌ Hủy lời mời]  [Đóng]           │
├────────────────────────────────────┤
│ 💡 Người nhận sẽ thấy lời mời trên │
│    Zalo App của họ                 │
└────────────────────────────────────┘
```

---

## 📂 Files Liên Quan

### Backend API
- `app/api/zalo/add-friend/route.ts`
  - Action: `find` - Tìm người dùng qua số điện thoại
  - Action: `send` - Gửi lời mời kết bạn
  - Action: `cancel` - Hủy lời mời đã gửi (MỚI) ✨
  - Action: `list_sent` - Lấy danh sách lời mời đã gửi

### Frontend Component
- `components/AddFriendModal.tsx` - Modal UI cho chức năng thêm bạn
- `components/ZaloChatView.tsx` - Component chính đã tích hợp nút và modal

### Dependencies
- `zca-js` library (đã có sẵn trong project)
  - `findUser()` - API tìm người dùng
  - `sendFriendRequest()` - API gửi lời mời kết bạn

---

## 🐛 Xử Lý Lỗi

### Lỗi "Không tìm thấy người dùng"
- Kiểm tra số điện thoại có đúng không
- Đảm bảo số điện thoại đã đăng ký Zalo
- Thử thêm/bỏ số 0 ở đầu

### Lỗi "Không thể gửi lời mời"
- Người dùng có thể đã khóa nhận lời mời kết bạn
- Bạn có thể đã gửi quá nhiều lời mời trong ngày
- Người dùng đã là bạn của bạn rồi

### Lỗi "Không thể hủy lời mời"
- Lời mời có thể đã được chấp nhận bởi người nhận
- Lời mời có thể đã bị từ chối hoặc hết hạn
- Người dùng có thể đã hủy lời mời trước đó

### Lỗi "Chưa đăng nhập Zalo"
- Đảm bảo đã đăng nhập Zalo trên Web
- Thử đăng xuất và đăng nhập lại

---

## 🚀 Tính Năng Hoàn Chỉnh

- [x] **Tìm người dùng qua số điện thoại**
- [x] **Gửi lời mời kết bạn với tin nhắn tùy chỉnh**
- [x] **Hủy lời mời ngay sau khi gửi** ✨ NEW!
- [x] **Hiển thị thông tin chi tiết người nhận**
- [x] **Đồng bộ 100% với Zalo App**
- [ ] Hiển thị danh sách tất cả lời mời đã gửi
- [ ] Chấp nhận lời mời kết bạn từ Web

---

## 🎯 Flow Hoàn Chỉnh

```
1. Bấm nút 👥 ở sidebar
         ↓
2. Nhập số điện thoại → Tìm kiếm
         ↓
3. Xem thông tin người dùng
         ↓
4. Nhập lời nhắn → Gửi yêu cầu
         ↓
5. ✅ Thành công!
         ↓
   ┌─────┴─────┐
   │           │
❌ Hủy      Đóng
   │           │
Hủy ngay   Giữ lời mời
```

---

## 🚀 Tính Năng Sắp Tới (Có Thể)

- [ ] Hiển thị danh sách lời mời đã gửi
- [ ] Chấp nhận lời mời kết bạn từ Web
- [ ] Import danh bạ để thêm nhiều người cùng lúc
- [ ] Gợi ý bạn bè (Friend suggestions)

---

## 📝 Lưu Ý

1. **Chỉ hoạt động khi đã đăng nhập Zalo** trên Web
2. **Số điện thoại phải đúng định dạng** (có hoặc không có số 0 ở đầu)
3. **Lời mời sẽ hiện ngay trên App Zalo** của người nhận
4. **Không giới hạn số lượng tìm kiếm**, nhưng có thể giới hạn số lời mời/ngày từ Zalo

---

## ✅ Checklist

- [x] Backend API hoàn chỉnh
- [x] UI Component đầy đủ
- [x] Tích hợp vào ZaloChatView
- [x] Nút ở vị trí hợp lý (sidebar header)
- [x] Xử lý lỗi đầy đủ
- [x] Đồng bộ Web ↔️ App
- [x] Không có lỗi TypeScript
- [x] Ready to use! 🎉

---

**Tác giả:** Kiro AI Assistant  
**Ngày hoàn thành:** 2026-08-18  
**Phiên bản:** 1.0.0
