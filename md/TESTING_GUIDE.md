# 🧪 HƯỚNG DẪN TEST - Zalo Auto Reply Bot

## 📋 Checklist Test

### ✅ 1. Đăng nhập
- [ ] Click nút "Đăng nhập bằng QR Code"
- [ ] Kiểm tra Terminal có hiển thị log không
- [ ] Kiểm tra file `qr.png` được tạo trong thư mục
- [ ] Quét QR bằng Zalo trên điện thoại
- [ ] Xác nhận đăng nhập trên điện thoại
- [ ] Kiểm tra giao diện chuyển sang màn hình chính
- [ ] Kiểm tra tên user hiển thị (sau khi fix)

### ✅ 2. Trạng thái kết nối
- [ ] Đèn "Đã kết nối Zalo" màu xanh
- [ ] Đèn "Đang lắng nghe tin nhắn" màu xanh
- [ ] Hiển thị "Hoạt động gần nhất" (sau khi có tin nhắn)

### ✅ 3. Cấu hình Bot
- [ ] Nhập tin nhắn tự động
- [ ] Thử 3 mẫu tin nhắn có sẵn
- [ ] Kiểm tra số ký tự (max 500)
- [ ] Toggle bot ON/OFF
- [ ] Kiểm tra thông báo "Bot đang hoạt động"

### ✅ 4. Gửi tin nhắn test
**Chuẩn bị:**
- Dùng tài khoản Zalo khác (điện thoại/máy tính khác)
- Gửi tin nhắn cho tài khoản đã đăng nhập bot

**Kiểm tra:**
- [ ] Tin nhắn xuất hiện trong "Lịch sử tin nhắn"
- [ ] Hiển thị đúng tên người gửi
- [ ] Hiển thị đúng nội dung
- [ ] Hiển thị thời gian
- [ ] Bot tự động trả lời (nếu đã BẬT)
- [ ] Status "Đã trả lời" hiển thị
- [ ] Thống kê tăng lên

### ✅ 5. Thống kê
**Sau khi gửi 3 tin nhắn test:**
- [ ] "Tổng tin nhắn" = 3
- [ ] "Đã trả lời" = 3 (nếu bot BẬT)
- [ ] "Cuộc trò chuyện" = 1 (hoặc nhiều hơn nếu nhiều người)
- [ ] Progress bar cập nhật

### ✅ 6. Quick Actions
- [ ] **Reset thống kê**: Click và confirm → stats về 0
- [ ] **Export logs**: Click → file JSON được tải về
- [ ] **Xóa logs**: Click và confirm → logs bị xóa

### ✅ 7. Đăng xuất
- [ ] Click "Đăng xuất"
- [ ] Giao diện về màn hình login
- [ ] Stats reset về 0
- [ ] Logs bị xóa

---

## 🎯 Test Cases Nâng cao

### Test 1: Nhiều tin nhắn liên tiếp
1. Gửi 10 tin nhắn nhanh liên tiếp
2. **Expected:** Tất cả tin nhắn đều được nhận và trả lời

### Test 2: Tin nhắn dài
1. Gửi tin nhắn dài > 1000 ký tự
2. **Expected:** Hiển thị đầy đủ trong log, bot vẫn trả lời

### Test 3: Tin nhắn đặc biệt
1. Gửi emoji 🎉😀💪
2. Gửi sticker
3. Gửi hình ảnh
4. **Expected:** Hiển thị emoji, sticker/ảnh hiện "[Media/Sticker]"

### Test 4: Bật/Tắt bot giữa chừng
1. BẬT bot
2. Gửi 3 tin nhắn → bot trả lời
3. TẮT bot
4. Gửi 2 tin nhắn → bot KHÔNG trả lời
5. **Expected:** Chỉ 3 tin đầu được trả lời

### Test 5: Tin nhắn nhóm
1. Thêm bot vào nhóm
2. Gửi tin nhắn trong nhóm
3. **Expected:** Bot nhận và trả lời (nếu bật)

### Test 6: Refresh trang
1. Đăng nhập thành công
2. Nhấn F5 refresh
3. **Expected:** Phải đăng nhập lại (session không lưu)

### Test 7: Terminal log
1. Kiểm tra Terminal trong quá trình test
2. **Expected:** 
   - `📨 New message received:` khi có tin
   - `✅ Login successful!` khi login
   - Không có error đỏ

---

## 🐛 Các lỗi phổ biến và cách fix

### Lỗi 1: Không nhận được tin nhắn
**Nguyên nhân:** Listener chưa start  
**Fix:** Kiểm tra đèn "Đang lắng nghe tin nhắn" có xanh không

### Lỗi 2: Bot không trả lời
**Nguyên nhân:** 
- Bot chưa BẬT
- Tin nhắn tự động trống
**Fix:** Kiểm tra toggle và tin nhắn tự động

### Lỗi 3: QR Code không tạo
**Nguyên nhân:** Lỗi zca-js  
**Fix:** 
- Kiểm tra Terminal có lỗi không
- Thử đăng nhập lại
- Restart `npm run dev`

### Lỗi 4: Stats không cập nhật
**Nguyên nhân:** API stats lỗi  
**Fix:** Kiểm tra Console (F12) có lỗi fetch không

---

## ✅ Kết quả mong đợi

**Test thành công khi:**
- ✅ Đăng nhập QR hoạt động
- ✅ Nhận được tin nhắn trong vòng 2 giây
- ✅ Bot trả lời tự động (khi BẬT)
- ✅ Stats cập nhật chính xác
- ✅ Logs hiển thị đầy đủ
- ✅ Export/Reset/Clear hoạt động
- ✅ Không có lỗi trong Console/Terminal

---

## 📸 Screenshot Checklist

Để báo cáo hoặc demo, chụp:
1. Màn hình đăng nhập QR
2. Dashboard với stats đầy đủ
3. Log tin nhắn với status "Đã trả lời"
4. Terminal với logs
5. File qr.png

---

**Test thoroughly!** 🎯  
**Report bugs:** Tạo issue với screenshot + Terminal log
