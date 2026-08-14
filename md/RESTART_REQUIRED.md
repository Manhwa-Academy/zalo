# ⚠️ PHẢI RESTART SERVER!

## 🔧 ĐÃ FIX LỖI 401!

Đã thay đổi cách lưu `zaloApi`:
- ❌ **Trước:** Export/Import giữa các route (không hoạt động)
- ✅ **Sau:** Global singleton instance (hoạt động!)

---

## 🚀 BẮT BUỘC RESTART:

### **Bước 1: Dừng server**
Trong Terminal, nhấn:
```
Ctrl + C
```

### **Bước 2: Chạy lại**
```bash
npm run dev
```

### **Bước 3: Reload browser**
```
Ctrl + R  hoặc  F5
```

---

## ✅ SAU KHI RESTART:

### **1. Đăng nhập lại**
- Click "Đăng nhập"
- Quét QR

### **2. Kiểm tra Terminal**
Phải thấy:
```
✅ Global zaloApi set: true
POST /api/zalo/login 200

✅ zaloApi found in listener
📋 Getting zaloApi: true
POST /api/zalo/listener 200  ← PHẢI LÀ 200!
```

### **3. Kiểm tra giao diện**
- 🟢 Đèn "Đã kết nối Zalo" màu xanh
- 🟢 Đèn "Đang lắng nghe tin nhắn" màu xanh

### **4. Bật bot và test**
- Nhập tin nhắn tự động
- Bật bot (toggle)
- Gửi tin test từ điện thoại khác
- Bot sẽ trả lời!

---

## 🎯 KẾT QUẢ MONG ĐỢI:

```
Terminal:
POST /api/zalo/login 200
POST /api/zalo/listener 200 ✅
📨 New message received: {...}

Giao diện:
🟢 Đang lắng nghe tin nhắn
[15:30] Nguyễn Văn A: "Hello"
✅ Đã trả lời
```

---

**HÃY RESTART NGAY!** ⚡
