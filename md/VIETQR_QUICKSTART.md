# ⚡ VietQR API - Quick Start Guide

## 🚀 Bắt đầu nhanh trong 5 phút

### ✅ Bước 0: Kiểm tra tính năng hiện tại

**Không cần làm gì!** Ứng dụng đã hoạt động với API miễn phí.

Thử ngay:
1. Mở ứng dụng
2. Click nút **💳 Thẻ ngân hàng** 
3. Chọn ngân hàng: **MBBank**
4. Nhập STK: **0332138297**
5. Chờ 0.8 giây → Tên tự động hiển thị! ✨

---

## 🔐 Nâng cấp lên API trả phí (Optional)

### Khi nào cần nâng cấp?

❌ **KHÔNG cần** nếu:
- Ứng dụng cá nhân
- <50 user/ngày
- Chấp nhận tốc độ chậm 1-2s

✅ **NÊN nâng cấp** nếu:
- Ứng dụng thương mại
- >100 user/ngày
- Cần tốc độ nhanh (200-300ms)
- Cần uptime cao (99.9%)

---

## 📝 Đăng ký VietQR.io trong 3 bước

### Bước 1: Đăng ký tài khoản (2 phút)
```
1. Truy cập: https://vietqr.io
2. Click "Đăng ký"
3. Điền email + số điện thoại
4. Xác thực email
```

### Bước 2: Chọn gói & Thanh toán (2 phút)
```
Gói Starter: 500,000 VNĐ/tháng
- 1,000 requests/ngày
- Đủ cho ~200 user/ngày

Thanh toán: Chuyển khoản hoặc thẻ
```

### Bước 3: Lấy API Key (1 phút)
```
1. Đăng nhập Dashboard
2. Vào "API Keys"
3. Copy 2 thông tin:
   - Client ID: cas_xxxxxxxxxxxx
   - API Key: sk_live_xxxxxxxxxxxx
```

---

## ⚙️ Cấu hình vào App (30 giây)

### Bước 1: Mở file .env
```bash
# Nếu chưa có, copy từ .env.example
cp .env.example .env
```

### Bước 2: Thêm 2 dòng này vào .env
```env
VIETQR_CLIENT_ID=cas_xxxxxxxxxxxx
VIETQR_API_KEY=sk_live_xxxxxxxxxxxx
```

### Bước 3: Restart server
```bash
# Ctrl+C để stop
npm run dev  # Start lại
```

---

## ✅ Kiểm tra đã hoạt động

### Test 1: Xem log
```bash
# Khi tra cứu, console sẽ hiển thị:
🔐 [Lookup API] Using authenticated API with key: cas_xxxxxx...
✅ Nghĩa là đã dùng API key!

# Nếu thấy:
🆓 [Lookup API] Using free API (no authentication)
❌ Nghĩa là chưa nhận API key (kiểm tra lại .env)
```

### Test 2: So sánh tốc độ
```
Free API:  1000-2000ms ❌ (chậm)
Paid API:  200-300ms   ✅ (nhanh gấp 5 lần!)
```

---

## 🚨 Troubleshooting

### ❌ Lỗi: "401 Unauthorized"
**Nguyên nhân**: API key sai hoặc hết hạn

**Giải pháp**:
1. Kiểm tra lại `Client ID` và `API Key` trong .env
2. Đảm bảo không có khoảng trắng thừa
3. Tạo API key mới trong dashboard VietQR

---

### ❌ Lỗi: "429 Too Many Requests"
**Nguyên nhân**: Vượt quá 1,000 requests/ngày

**Giải pháp**:
1. Nâng cấp lên gói cao hơn (Business: 5,000/ngày)
2. Hoặc chờ 24h để quota reset

---

### ❌ Lỗi: "Không tìm thấy tên"
**Nguyên nhân**: STK không tồn tại hoặc ngân hàng chưa hỗ trợ

**Giải pháp**:
- Kiểm tra lại STK
- Thử ngân hàng khác (MBBank, VCB, Techcombank work tốt nhất)
- Cho phép user nhập thủ công

---

## 💰 Bảng giá tham khảo

| Gói | Giá/tháng | Requests/ngày | User/ngày |
|-----|-----------|---------------|-----------|
| **Free** | 0 VNĐ | ~100 | ~50 |
| **Starter** | 500K | 1,000 | ~200 |
| **Business** | 1,500K | 5,000 | ~1,000 |
| **Enterprise** | Liên hệ | Unlimited | Unlimited |

---

## 📞 Hỗ trợ

**VietQR.io**:
- 🌐 Website: https://vietqr.io
- 📧 Email: support@vietqr.io
- 💬 Live Chat: Có trên website

**Cas.so**:
- 🌐 Website: https://cas.so
- 📧 Email: api@cas.so

---

## 📚 Tài liệu chi tiết

Xem hướng dẫn đầy đủ tại:
- 📖 [VIETQR_API_SETUP.md](./docs/VIETQR_API_SETUP.md) - Hướng dẫn chi tiết
- 📖 [BANK_CARD_FEATURE.md](./docs/BANK_CARD_FEATURE.md) - Tính năng gửi thẻ ngân hàng

---

## ✨ Tips & Tricks

### 💡 Tip 1: Monitor usage
```
Vào VietQR Dashboard mỗi tuần để:
- Kiểm tra số requests đã dùng
- Xem báo cáo thống kê
- Cài alert khi gần hết quota
```

### 💡 Tip 2: Cache kết quả
```
Để giảm API calls, cache tên đã tra cứu:
- Lưu vào localStorage (frontend)
- Lưu vào Redis (backend)
- TTL: 24 giờ
```

### 💡 Tip 3: Rotate API key
```
Đổi API key định kỳ (3-6 tháng):
1. Tạo key mới
2. Cập nhật .env
3. Deploy
4. Xoá key cũ
```

---

**🎉 Done! Bạn đã setup xong VietQR API!**

Có vấn đề? Mở issue tại GitHub hoặc liên hệ support VietQR.io
