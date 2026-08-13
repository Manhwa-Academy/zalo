# 🔧 FIX: Timing Issue

## ❓ VẤN ĐỀ:
Listener được gọi **TRƯỚC KHI** `setZaloApi()` hoàn tất → `zaloApi` vẫn `null` → Error 401

## ✅ GIẢI PHÁP:
Thêm **retry logic** vào `startListener()`:
- Retry 3 lần nếu gặp 401
- Delay 1 giây giữa các retry
- Alert nếu vẫn fail

---

## 🚀 TEST NGAY:

### **1. Reload trang**
```
F5  hoặc  Ctrl + R
```

### **2. Đăng nhập**
- Click "Đăng nhập"
- Quét QR

### **3. Xem Terminal**
Bạn sẽ thấy:
```
✅ Global zaloApi set: true
POST /api/zalo/login 200

⏳ Retry 1/3...
✅ zaloApi found in listener
POST /api/zalo/listener 200 ✅
```

### **4. Xem Console (F12)**
```
🎧 Starting listener...
⏳ Retry 1/3...
✅ Listener started successfully
Connected to message stream
```

### **5. Kiểm tra giao diện**
- 🟢 Đèn "Đang lắng nghe tin nhắn" **màu xanh**

---

## 🧪 TEST BOT:

1. **Bật bot** (toggle màu xanh)
2. **Gửi tin test** từ điện thoại khác
3. **Kiểm tra:**
   - Tin nhắn xuất hiện trong log
   - Bot tự động trả lời
   - Stats tăng lên

---

## 🎯 KẾT QUẢ:

Sau 1-2 retry, listener sẽ start thành công và bot hoạt động bình thường!

**HÃY RELOAD VÀ THỬ!** 🚀
