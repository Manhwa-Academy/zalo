# 📱 Tính năng QR Code VietQR

## 🎯 Tổng quan

Thay vì chỉ gửi thông tin thẻ ngân hàng qua text, bạn có thể **tạo QR Code VietQR** để người nhận quét và chuyển khoản ngay!

---

## ✨ Tính năng

### 1. **Tạo QR Code tức thì** ⚡
- Nhập số TK + chọn ngân hàng → Click "Xem QR"
- QR Code hiển thị ngay lập tức
- Không cần API key, hoàn toàn miễn phí!

### 2. **QR Code chuẩn VietQR** 🏦
- Tương thích với tất cả app ngân hàng VN
- Quét bằng MBBank, VCB, Techcombank, ACB, VPBank...
- Thông tin tự động điền: Ngân hàng + STK + Tên

### 3. **Tải về QR Code** 💾
- Download ảnh QR về máy
- Gửi qua Zalo, Messenger, Email...
- Format: JPG (chất lượng cao)

---

## 🚀 Cách sử dụng

### Bước 1: Mở modal gửi thẻ ngân hàng
```
1. Mở cuộc trò chuyện
2. Click nút 💳 Thẻ ngân hàng
```

### Bước 2: Nhập thông tin
```
1. Chọn ngân hàng: MBBank
2. Nhập STK: 0332138297
3. Nhập tên: HOANG KIEN PHONG (tùy chọn)
```

### Bước 3: Tạo QR Code
```
1. Click nút "📱 Xem QR"
2. QR Code hiển thị ngay!
3. Quét bằng app ngân hàng để chuyển khoản
```

---

## 📸 Giao diện

### Modal chính:
```
┌─────────────────────────────────────┐
│ 💳 Gửi Thẻ Ngân Hàng            [X] │
├─────────────────────────────────────┤
│ 🏦 Ngân hàng: MBBank ✓              │
│ # Số TK: 0332138297                 │
│ 👤 Tên: HOANG KIEN PHONG            │
├─────────────────────────────────────┤
│ [Hủy]   [📱 Xem QR]   [💳 Gửi Thẻ] │
└─────────────────────────────────────┘
```

### Modal QR Code:
```
┌──────────────────────────────────┐
│ 📱 QR Code Thanh Toán        [X] │
├──────────────────────────────────┤
│                                  │
│        ╔══════════════╗          │
│        ║  QR QR QR QR ║          │
│        ║  QR QR QR QR ║          │
│        ║  QR QR QR QR ║          │
│        ╚══════════════╝          │
│                                  │
│ Ngân hàng: MBBank                │
│ Số TK: 0332138297                │
│ Tên: HOANG KIEN PHONG            │
│                                  │
│ 📱 Cách quét:                    │
│  1. Mở app ngân hàng             │
│  2. Chọn "Quét QR"               │
│  3. Quét mã này                  │
│  4. Nhập số tiền và xác nhận     │
│                                  │
├──────────────────────────────────┤
│  [💾 Tải về]         [Đóng]     │
└──────────────────────────────────┘
```

---

## 🎨 API được sử dụng

### VietQR Image API (Miễn phí)
```
https://img.vietqr.io/image/{BIN}-{ACCOUNT}-{TEMPLATE}.jpg
```

### Parameters:
- `BIN`: Mã ngân hàng (VD: 970422 = MBBank)
- `ACCOUNT`: Số tài khoản
- `TEMPLATE`: Layout QR (compact2, compact, qr_only, print)

### Optional params:
- `amount`: Số tiền (VD: 50000)
- `addInfo`: Nội dung CK (VD: "Chuyen tien")
- `accountName`: Tên chủ TK

### Ví dụ URL:
```
https://img.vietqr.io/image/970422-0332138297-compact2.jpg?accountName=HOANG%20KIEN%20PHONG&addInfo=Chuyen%20khoan
```

---

## 💡 Use Cases

### Case 1: Nhận tiền nhanh
```
Bạn: "Anh chuyển cho em 500k nhé!"
→ Gửi QR Code
→ Người kia quét → Nhập 500000 → Xong!
⏱️ Thời gian: 10 giây
```

### Case 2: Thu tiền nhóm
```
Admin nhóm: "Mọi người đóng quỹ 100k nhé!"
→ Gửi QR Code vào group
→ Mọi người quét và chuyển
→ Admin nhận tiền tự động
```

### Case 3: Kinh doanh online
```
Khách: "Shop gửi STK cho em"
→ Gửi QR Code thay vì text
→ Khách quét → Thanh toán
→ Không sai STK, không nhầm tên!
```

---

## ⚙️ Customization

### Thay đổi template QR:
Mở file `SendBankCardModal.tsx`, tìm dòng:
```typescript
const template = 'compact2' // Đổi thành template khác
```

**Các template có sẵn:**
1. `compact2` - QR + thông tin ngắn gọn (mặc định) ✅
2. `compact` - QR + thông tin chi tiết
3. `qr_only` - Chỉ có QR code
4. `print` - QR lớn để in ra giấy

### Thêm số tiền mặc định:
```typescript
const amount = 50000 // Số tiền cố định (50,000 VND)
```

### Thay đổi nội dung CK:
```typescript
const addInfo = encodeURIComponent('Thanh toan don hang #123')
```

---

## 🔄 So sánh 2 cách

| Tính năng | Gửi Thẻ (Text) | QR Code |
|-----------|----------------|---------|
| **Tốc độ** | Chậm (copy-paste) | Nhanh (quét 2s) |
| **Lỗi sai** | Dễ sai STK | Không bao giờ sai |
| **UX** | Phải copy thủ công | Quét là xong |
| **Tương thích** | Mọi thiết bị | Cần camera |
| **Số tiền** | Phải nhập thủ công | Có thể đặt sẵn |

---

## 🚨 Troubleshooting

### ❌ QR Code không hiển thị
**Nguyên nhân**: Link bị lỗi hoặc API VietQR bảo trì

**Giải pháp**:
1. Kiểm tra internet
2. Thử lại sau 5 phút
3. Dùng chức năng "Gửi Thẻ" thay thế

---

### ❌ Quét QR không ra thông tin
**Nguyên nhân**: 
- App ngân hàng chưa hỗ trợ VietQR
- Camera không rõ

**Giải pháp**:
1. Cập nhật app ngân hàng lên phiên bản mới nhất
2. Tăng độ sáng màn hình
3. Giữ camera cách QR 10-15cm

---

### ❌ Tải QR về nhưng bị mờ
**Nguyên nhân**: Hình ảnh JPG bị nén

**Giải pháp**:
```typescript
// Thay đổi format từ .jpg → .png
const url = `https://img.vietqr.io/image/${bank.bin}-${accountNumber}-${template}.png`
```

---

## 📊 Thống kê

### Ngân hàng hỗ trợ VietQR: **50+** ngân hàng
- ✅ MBBank, Vietcombank, BIDV, VietinBank
- ✅ Techcombank, ACB, VPBank, TPBank
- ✅ Agribank, Sacombank, SHB, VIB
- ✅ OCB, MSB, SeABank, HDBank
- ✅ Và hầu hết các ngân hàng khác tại VN

### Thời gian xử lý:
- Tạo QR Code: **Instant** (<100ms)
- Quét và chuyển khoản: **5-10 giây**
- Tiền về tài khoản: **Ngay lập tức** (Real-time)

---

## ✅ Best Practices

### ✅ DO:
1. **Luôn nhập tên chủ TK** để người quét biết đúng người
2. **Test QR trước** bằng app ngân hàng của bạn
3. **Tải QR về** để gửi qua nhiều kênh
4. **Zoom in** khi hiển thị QR để dễ quét hơn

### ❌ DON'T:
1. ❌ Đặt số tiền quá lớn mặc định
2. ❌ Chụp ảnh QR từ màn hình (dùng tải về)
3. ❌ Gửi QR với tên sai
4. ❌ Để QR bị mờ, nhòe

---

## 🎯 Roadmap

### Version hiện tại: ✅
- [x] Tạo QR Code VietQR
- [x] Hiển thị QR trong modal
- [x] Tải QR về máy
- [x] Support 20+ ngân hàng

### Version tiếp theo: 🚧
- [ ] Thêm số tiền vào QR
- [ ] Thêm nội dung CK vào QR
- [ ] QR Code động (có logo ngân hàng)
- [ ] Lưu lịch sử QR đã tạo
- [ ] Chia sẻ QR trực tiếp qua Zalo
- [ ] In QR Code (cho shop/quán)

---

## 📚 Tài liệu tham khảo

- 🌐 [VietQR Official](https://vietqr.io)
- 🌐 [NAPAS VietQR Docs](https://www.napas.com.vn/vietqr)
- 📖 [QR Code Standards](https://www.emvco.com/emv-technologies/qrcodes/)

---

## ✨ Tóm tắt

🎉 **Tính năng QR Code đã sẵn sàng!**

- ✅ Tạo QR VietQR instant (không cần API key)
- ✅ Tương thích 50+ ngân hàng Việt Nam
- ✅ Quét bằng mọi app banking
- ✅ Tải về và chia sẻ dễ dàng
- ✅ Không giới hạn, hoàn toàn miễn phí

**📱 Thử ngay: Mở modal → Nhập STK → Click "Xem QR"!**
