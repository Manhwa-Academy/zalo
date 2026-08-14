# 🚀 BẮT ĐẦU SỬ DỤNG BOT - CẬP NHẬT MỚI NHẤT

## ✅ ĐÃ HOÀN THÀNH:

### 1. **Fix lỗi 401 (Bot không nhận tin nhắn)** ✅
   - Đã sửa lỗi `zaloApi` không chia sẻ giữa các route
   - Sử dụng global singleton pattern
   - **BẮT BUỘC RESTART SERVER** để áp dụng!

### 2. **Thêm logo Aris** ✅
   - Logo hiển thị ở header
   - Logo hiển thị ở màn hình đăng nhập
   - Logo là favicon trên trình duyệt
   - File: `public/aris.png`

---

## 🎯 HƯỚNG DẪN CHẠY BOT (5 BƯỚC):

### **BƯỚC 1: RESTART SERVER** ⚡ (BẮT BUỘC!)

Trong terminal VSCode, nhấn:
```
Ctrl + C
```

Sau đó chạy lại:
```bash
npm run dev
```

Chờ đến khi thấy:
```
✓ Ready in 3.5s
○ Local: http://localhost:3000
```

---

### **BƯỚC 2: MỞ TRÌNH DUYỆT**

Mở Chrome/Edge và truy cập:
```
http://localhost:3000
```

Reload nếu cần:
```
F5  hoặc  Ctrl + R
```

---

### **BƯỚC 3: ĐĂNG NHẬP ZALO**

1. **Click nút "Hiển thị Mã QR Đăng Nhập"**
2. **Mã QR sẽ hiển thị TRỰC TIẾP trên web** (không cần kiểm tra terminal!)
3. **Mở Zalo trên điện thoại**
4. **Nhấn icon [Quét mã QR]** ở góc trên
5. **Quét mã QR trên màn hình web**
6. **Nhấn [XÁC NHẬN ĐĂNG NHẬP]** trên điện thoại

✅ Sau vài giây, sẽ thấy giao diện chính của bot!

---

### **BƯỚC 4: KIỂM TRA TRẠNG THÁI**

Phải thấy **2 đèn xanh** ở góc trên:
- 🟢 **Đã kết nối Zalo**
- 🟢 **Đang lắng nghe tin nhắn**

**Kiểm tra Terminal:**
```
✅ Global zaloApi set: true
POST /api/zalo/login 200
POST /api/zalo/listener 200  ← PHẢI LÀ 200 (không phải 401)!
```

Nếu thấy `401` → Chưa restart đúng cách → Quay lại BƯỚC 1!

---

### **BƯỚC 5: BẬT BOT VÀ TEST**

1. **Nhập tin nhắn tự động:**
   ```
   Ví dụ: Xin chào! Tôi là bot tự động.
   ```

2. **Bật bot** (toggle màu xanh)

3. **Từ điện thoại/tài khoản Zalo khác**, gửi tin nhắn đến tài khoản đã đăng nhập bot

4. **Bot sẽ tự động trả lời!** 🎉

---

## 📋 CHECKLIST ĐẦY ĐỦ:

- [ ] Đã restart server (`Ctrl+C` → `npm run dev`)
- [ ] Terminal hiển thị `POST /api/zalo/listener 200`
- [ ] Đã đăng nhập bằng QR code trên web
- [ ] 2 đèn xanh đều sáng
- [ ] Đã nhập tin nhắn tự động
- [ ] Đã bật bot (toggle)
- [ ] Gửi tin test từ điện thoại khác
- [ ] Bot đã trả lời tự động ✅

---

## ⚠️ LƯU Ý QUAN TRỌNG:

### **1. Không mở Zalo Web/PC đồng thời**
- Zalo chỉ cho phép 1 web listener
- Nếu mở Zalo Web/PC → Bot tự động logout
- **Giải pháp:** Đóng Zalo Web/PC khi chạy bot

### **2. Session tự động lưu**
- Lần đầu phải quét QR
- Lần sau chỉ cần F5 (nếu server chưa restart)
- Restart server (Ctrl+C) → Phải quét QR lại

### **3. Xem log tin nhắn**
- Tất cả tin nhắn nhận/gửi hiển thị trong tab "📨 Message Logs"
- Log cũng hiển thị trong Terminal

---

## 🎨 LOGO ARIS:

Logo đã được thêm vào:
- ✅ Header (góc trên bên trái)
- ✅ Màn hình đăng nhập
- ✅ Favicon (tab trình duyệt)
- ✅ File: `public/aris.png`

---

## 🐛 NẾU GẶP LỖI:

### **Lỗi 1: Vẫn thấy 401 trong Terminal**
```bash
# Restart lại server:
Ctrl + C
npm run dev
```

### **Lỗi 2: Không thấy mã QR**
```bash
# Clear cache và reload:
Ctrl + Shift + R (Chrome/Edge)
```

### **Lỗi 3: Bot không trả lời**
1. Kiểm tra 2 đèn xanh
2. Kiểm tra Terminal có `200` không
3. Kiểm tra đã bật bot (toggle)
4. Kiểm tra đã nhập tin nhắn tự động

### **Lỗi 4: Tự động logout**
- Đóng Zalo Web/PC
- Không quét QR trên máy tính khác

---

## 📞 SUPPORT:

Nếu vẫn gặp vấn đề, gửi screenshot:
1. Terminal (toàn bộ log)
2. Giao diện web (2 đèn status)
3. Tab Network trong DevTools (F12)

---

**CHÚC BẠN SỬ DỤNG BOT THÀNH CÔNG!** 🎉

**Hãy bắt đầu ngay từ BƯỚC 1: RESTART SERVER!** ⚡
