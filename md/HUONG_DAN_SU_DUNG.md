# 📖 HƯỚNG DẪN SỬ DỤNG - ZALO AUTO REPLY BOT

## ✅ ĐÃ CÀI ĐẶT THÀNH CÔNG!

Bạn đã hoàn tất việc cài đặt dependencies. Giờ có thể chạy app!

---

## 🚀 CÁCH CHẠY ỨNG DỤNG

### **Option 1: Chạy trên trình duyệt (Development)**
```bash
npm run dev
```
- Mở trình duyệt: **http://localhost:3000**
- Phù hợp cho test và development

### **Option 2: Chạy Desktop App (Electron)**
```bash
npm run electron:dev
```
- App sẽ mở như ứng dụng desktop
- **Lưu ý:** Mã QR sẽ hiển thị trong **Terminal/Console**, KHÔNG phải trong app!

---

## 🔐 CÁCH ĐĂNG NHẬP

### **Bước 1:** Chạy app
```bash
npm run dev
# hoặc
npm run electron:dev
```

### **Bước 2:** Click "Đăng nhập bằng QR Code"

### **Bước 3:** **QUAN TRỌNG** - Xem Terminal
- **MÃ QR SẼ HIỂN THỊ TRONG TERMINAL** (cửa sổ CMD này!)
- KHÔNG phải trong app UI
- Quét mã QR đó bằng Zalo trên điện thoại

### **Bước 4:** Đợi đăng nhập thành công
- App sẽ tự động detect khi bạn quét xong
- Giao diện sẽ chuyển sang màn hình chính

---

## 🤖 SỬ DỤNG BOT

### 1. **Nhập tin nhắn tự động**
   - Gõ tin nhắn vào ô text
   - Hoặc chọn 1 trong 3 mẫu có sẵn

### 2. **Bật Bot**
   - Click toggle switch sang màu xanh (BẬT)

### 3. **Xem log**
   - Mọi tin nhắn nhận được sẽ hiện trong phần "Lịch sử tin nhắn"
   - Có thể thấy bot đã trả lời hay chưa

### 4. **Theo dõi thống kê**
   - Xem số tin nhắn đã nhận
   - Số tin đã trả lời
   - Số cuộc trò chuyện

---

## 📦 BUILD APP DESKTOP (File .EXE)

```bash
npm run package
```
- File `.exe` sẽ có trong thư mục `dist/`
- Có thể chạy trực tiếp không cần cài Node.js

---

## ⚠️ LƯU Ý QUAN TRỌNG

### **1. MÃ QR Ở ĐÂU?**
❌ **KHÔNG** trong giao diện app  
✅ **CÓ** trong Terminal/Console/CMD

### **2. Chỉ 1 listener**
- Chỉ chạy được 1 bot/account tại 1 thời điểm
- Nếu mở Zalo Web trên trình duyệt → bot sẽ tự động dừng

### **3. API không chính thức**
- Có thể vi phạm điều khoản Zalo
- Dùng cho mục đích cá nhân, học tập
- KHÔNG spam hoặc lạm dụng

### **4. Tài khoản có thể bị khóa**
- Nếu Zalo phát hiện hành vi bất thường
- Nên dùng tài khoản test, không dùng tài khoản chính

---

## 🐛 TROUBLESHOOTING

### **Lỗi: Cannot find module**
```bash
npm install
```

### **Lỗi: Port 3000 đang được sử dụng**
- Đóng ứng dụng khác đang chạy cổng 3000
- Hoặc sửa port trong `package.json`

### **Quét mã QR đăng nhập**
- Mã QR sẽ hiển thị **trực tiếp hình ảnh nét căng trên màn hình Web** (không cần mở Terminal/CMD).
- Sử dụng camera ứng dụng Zalo trên điện thoại quét mã QR hiển thị trên màn hình.
- Sau khi quét xong, giao diện web sẽ báo *"Đã quét thành công! Vui lòng bấm Xác Nhận trên điện thoại"*.

### **Bot không trả lời**
1. Kiểm tra bot đã BẬT chưa (toggle màu xanh)
2. Kiểm tra đã nhập tin nhắn tự động chưa
3. Xem log trong Console có lỗi không

### **Đăng nhập không thành công**
1. Đảm bảo internet ổn định
2. Thử đăng xuất Zalo Web trên trình duyệt
3. Restart app và thử lại

---

## 📞 HỖ TRỢ

Nếu gặp vấn đề:
1. Kiểm tra Terminal có lỗi gì không
2. Xem file log
3. Restart app

---

## 🎉 CHÚC BẠN SỬ DỤNG VUI VẺ!

**Tạo bởi Kiro AI** 🤖
