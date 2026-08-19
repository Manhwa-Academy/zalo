# 🚀 Nút Quick Actions - Hướng Dẫn

**Ngày**: 19/08/2026  
**Trạng thái**: ✅ HOÀN THÀNH

---

## 🎯 TÍNH NĂNG MỚI

Thêm nút **3 chấm (⋮)** ở mỗi cuộc trò chuyện bên trái với menu các action nhanh:

✅ **Ghim/Bỏ ghim** - Pin conversation lên đầu  
✅ **Tắt/Bật thông báo** - Mute notifications  
✅ **Đánh dấu đã đọc** - Mark all as read (TODO)  
✅ **Lưu trữ** - Archive conversation (TODO)  
✅ **Xóa cuộc trò chuyện** - Delete chat locally  

---

## 📱 CÁCH SỬ DỤNG

### Mở Menu

1. **Hover** chuột vào cuộc trò chuyện bất kỳ
2. Nút **3 chấm (⋮)** xuất hiện bên phải
3. **Click** vào nút 3 chấm
4. Menu hiện ra với các options

### Đóng Menu

- Click ra ngoài menu
- Chọn 1 action (tự động đóng)

---

## 🎨 GIAO DIỆN

### Trước (Không có nút)
```
┌────────────────────────────────┐
│ [👤] Bùi Duy Thoại             │
│      Tin nhắn đã được thu hồi  │
│                         Hôm qua│
└────────────────────────────────┘
```

### Sau (Hover → Hiện nút)
```
┌────────────────────────────────┐
│ [👤] Bùi Duy Thoại          [⋮]│
│      Tin nhắn đã được thu hồi  │
│                         Hôm qua│
└────────────────────────────────┘
```

### Menu
```
┌──────────────────────────────┐
│ 📌 Ghim cuộc trò chuyện      │
│ 🔕 Tắt thông báo             │
│ ✅ Đánh dấu đã đọc           │
│ ────────────────────────────  │
│ 📥 Lưu trữ                   │
│ ────────────────────────────  │
│ 🗑️ Xóa cuộc trò chuyện       │
└──────────────────────────────┘
```

---

## ⚙️ CÁC CHỨC NĂNG

### 1. 📌 Ghim Cuộc Trò Chuyện

**Làm gì**:
- Ghim conversation lên đầu danh sách
- Icon 📌 màu vàng xuất hiện
- Conversation luôn ở trên cùng

**Cách dùng**:
1. Click 3 chấm → "Ghim cuộc trò chuyện"
2. Conversation nhảy lên đầu
3. Icon 📌 xuất hiện bên cạnh tên

**Bỏ ghim**:
1. Click 3 chấm → "Bỏ ghim"
2. Conversation trở về vị trí bình thường
3. Icon 📌 biến mất

**Lưu ý**:
- Ghim được lưu vĩnh viễn (localStorage)
- F5 refresh → Vẫn giữ nguyên
- Có thể ghim nhiều conversations

---

### 2. 🔕 Tắt Thông Báo

**Làm gì**:
- Tắt notification cho conversation này
- Icon 🔕 màu xám xuất hiện
- Không còn thông báo khi có tin nhắn mới

**Cách dùng**:
1. Click 3 chấm → "Tắt thông báo"
2. Icon 🔕 xuất hiện

**Bật lại**:
1. Click 3 chấm → "Bật thông báo"
2. Icon 🔔 xuất hiện
3. Lại có thông báo bình thường

**Lưu ý**:
- Mute được lưu vĩnh viễn
- Chỉ tắt ở thiết bị này
- Vẫn nhận tin nhắn, chỉ không báo

---

### 3. ✅ Đánh Dấu Đã Đọc

**Trạng thái**: 🚧 Đang phát triển

**Sẽ làm**:
- Đánh dấu tất cả tin nhắn là đã đọc
- Badge số tin nhắn chưa đọc → 0
- Trạng thái đồng bộ với Zalo

**Hiện tại**:
- Chỉ là placeholder
- Click vào → Chưa có gì xảy ra
- Sẽ implement sau

---

### 4. 📥 Lưu Trữ

**Trạng thái**: 🚧 Đang phát triển

**Sẽ làm**:
- Ẩn conversation khỏi danh sách chính
- Vào tab "Lưu trữ" để xem
- Giống như Archive trên Gmail

**Hiện tại**:
- Chỉ là placeholder
- Click vào → Chưa có gì xảy ra
- Sẽ implement sau

---

### 5. 🗑️ Xóa Cuộc Trò Chuyện

**Làm gì**:
- Xóa conversation khỏi danh sách
- Tin nhắn biến mất ở thiết bị này
- **KHÔNG xóa trên Zalo server**

**Cách dùng**:
1. Click 3 chấm → "Xóa cuộc trò chuyện"
2. Popup confirm xuất hiện:
   ```
   Bạn có chắc muốn xóa cuộc trò chuyện với "Bùi Duy Thoại"?
   
   Lưu ý: Tin nhắn chỉ bị xóa ở thiết bị này, 
   không xóa trên Zalo server.
   ```
3. Click OK → Conversation biến mất
4. Click Cancel → Không làm gì

**Khôi phục**:
- Nếu người đó gửi tin nhắn mới → Conversation xuất hiện lại
- Tin nhắn cũ vẫn còn trên Zalo server

**Lưu ý**:
- Chỉ xóa ở thiết bị này
- Không xóa ở Zalo server
- Không xóa ở thiết bị khác
- Có thể khôi phục nếu có tin nhắn mới

---

## 💡 TIPS & TRICKS

### Tip 1: Tổ Chức Conversations
```
1. Ghim các chat quan trọng (gia đình, công việc)
2. Mute các group đông người
3. Xóa các chat spam/quảng cáo
4. Archive chat ít dùng (coming soon)
```

### Tip 2: Quản Lý Thông Báo
```
1. Mute group đông người → Không bị spam
2. Giữ unmute cho 1-on-1 chat
3. Mute tạm thời khi bận → Unmute sau
```

### Tip 3: Dọn Dẹp Nhanh
```
1. Xóa các chat không cần thiết
2. Ghim 3-5 chat quan trọng nhất
3. Mute 80% groups
4. Giữ sidebar gọn gàng
```

---

## ❓ CÂU HỎI THƯỜNG GẶP

### Q: Ghim có giới hạn số lượng không?
**A**: Không giới hạn, có thể ghim bao nhiêu cũng được.

### Q: Ghim có đồng bộ giữa các thiết bị không?
**A**: Không, mỗi thiết bị có danh sách ghim riêng.

### Q: Xóa cuộc trò chuyện có xóa được tin nhắn trên Zalo không?
**A**: Không. Chỉ xóa ở thiết bị này. Tin nhắn vẫn còn trên Zalo server.

### Q: Xóa rồi có khôi phục được không?
**A**: Có. Nếu người đó gửi tin nhắn mới, cuộc trò chuyện sẽ xuất hiện lại.

### Q: Mute thì có còn nhận tin nhắn không?
**A**: Có. Vẫn nhận tin nhắn bình thường, chỉ không có thông báo.

### Q: Đánh dấu đã đọc và Lưu trữ khi nào có?
**A**: Đang phát triển. Sẽ có trong phiên bản sau.

---

## 🐛 LỖI THƯỜNG GẶP

### Lỗi 1: Không thấy nút 3 chấm

**Nguyên nhân**: Chưa hover chuột vào conversation

**Cách sửa**: Hover chuột vào conversation → Nút sẽ hiện

---

### Lỗi 2: Ghim rồi nhưng F5 lại mất

**Nguyên nhân**: localStorage bị disabled

**Cách sửa**:
1. Kiểm tra browser settings
2. Enable localStorage
3. Thử lại

---

### Lỗi 3: Xóa conversation nhưng lỗi

**Nguyên nhân**: API lỗi hoặc chưa đăng nhập Zalo

**Cách sửa**:
1. Check đã đăng nhập Zalo chưa
2. F5 refresh page
3. Logout → Login lại
4. Thử xóa lại

---

## ✅ CHECKLIST

### Lần Đầu Dùng
- [ ] Hover vào conversation → Thấy nút 3 chấm
- [ ] Click nút → Menu hiện ra
- [ ] Click bên ngoài → Menu đóng
- [ ] Thử ghim 1 conversation
- [ ] F5 refresh → Conversation vẫn được ghim
- [ ] Thử mute 1 conversation
- [ ] Thử xóa 1 conversation (test chat)

### Sử Dụng Hàng Ngày
- [ ] Ghim các chat quan trọng
- [ ] Mute các group đông
- [ ] Xóa chat spam
- [ ] Dọn dẹp sidebar thường xuyên

---

## 📊 THỐNG KÊ

### Các Chức Năng

| Chức năng | Status | Lưu trữ | Đồng bộ |
|-----------|--------|---------|---------|
| Ghim | ✅ | localStorage | ❌ Local only |
| Mute | ✅ | Parent state | ❌ Local only |
| Mark Read | 🚧 TODO | - | - |
| Archive | 🚧 TODO | - | - |
| Delete | ✅ | API call | ❌ Local only |

---

**Tạo bởi**: Kiro AI Assistant  
**Ngày**: 19/08/2026  
**Phiên bản**: 1.0.0  
**Trạng thái**: ✅ **SẴN SÀNG SỬ DỤNG**
