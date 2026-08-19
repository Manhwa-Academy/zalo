# 💳 Tính năng Gửi Thẻ Ngân Hàng

## 📋 Mô tả
Tính năng cho phép gửi thông tin thẻ ngân hàng (số tài khoản, tên ngân hàng, tên chủ tài khoản) qua Zalo dưới dạng tin nhắn đặc biệt.

## ✨ Tính năng chính

### 1. **Tự động tra cứu tên chủ tài khoản**
- Khi nhập số tài khoản (từ 6 số trở lên), hệ thống tự động tra cứu tên chủ tài khoản
- Sử dụng API VietQR miễn phí
- Debounce 800ms để tránh spam API
- Hiển thị trạng thái: đang tra cứu, thành công, hoặc lỗi

### 2. **Hỗ trợ 20+ ngân hàng Việt Nam**
- Techcombank, Vietcombank, VietinBank, BIDV, ACB, MBBank, VPBank
- Agribank, Sacombank, TPBank, VIB, SHB, HDBank, OCB, MSB
- SeABank, VietCapitalBank, SCB, LPBank, Eximbank
- Tìm kiếm nhanh theo tên hoặc mã ngân hàng

### 3. **Giao diện thân thiện**
- Modal hiện đại với gradient xanh lá
- Tìm kiếm ngân hàng nhanh chóng
- Hiển thị ngân hàng đã chọn với nút đổi ngân hàng
- Responsive, tối ưu cho mobile

## 🔧 Cách sử dụng

### Bước 1: Mở modal
```tsx
// Trong ZaloChatView.tsx, thêm nút vào attach menu:
<button onClick={() => setShowBankCardModal(true)}>
  <CreditCard className="w-4 h-4" />
  💳 Thẻ ngân hàng
</button>
```

### Bước 2: Chọn ngân hàng
1. Click vào modal "Gửi Thẻ Ngân Hàng"
2. Tìm kiếm hoặc chọn ngân hàng từ danh sách
3. Ngân hàng được chọn sẽ hiển thị với nút [X] để đổi

### Bước 3: Nhập số tài khoản
1. Nhập số tài khoản (chỉ cho phép số)
2. Sau 0.8 giây, hệ thống tự động tra cứu tên chủ tài khoản
3. Nếu tra cứu thành công, tên tự động điền vào ô "Tên chủ tài khoản"
4. Nếu tra cứu thất bại, bạn có thể nhập thủ công

### Bước 4: Gửi
1. Click nút "Gửi Thẻ"
2. Thông tin thẻ ngân hàng được gửi qua Zalo API
3. Hiển thị dưới dạng tin nhắn đặc biệt trong Zalo

## 🌐 API Tra cứu Tên Tài khoản

### API Endpoint
```
POST /api/bank/lookup-account
```

### Request Body
```json
{
  "bin": "970422",
  "accountNumber": "0332138297"
}
```

### Response (Success)
```json
{
  "success": true,
  "accountName": "NGUYEN VAN A"
}
```

### Response (Error)
```json
{
  "success": false,
  "error": "Không tìm thấy tên chủ tài khoản"
}
```

## 🔑 Cấu hình API (Tùy chọn)

### API miễn phí (Mặc định)
Ứng dụng sử dụng API VietQR miễn phí:
- Endpoint: `https://api.vietqr.io/v2/lookup`
- Không cần API key
- Có thể giới hạn số lượng request

### API trả phí (Nâng cao)
Nếu cần độ tin cậy cao hơn, đăng ký tại:
- 🌐 [VietQR.io](https://vietqr.io)
- 🌐 [Cas.so](https://cas.so/product/pay-out/)

**📖 Xem hướng dẫn chi tiết tại**: [VIETQR_API_SETUP.md](./VIETQR_API_SETUP.md)

Sau khi có API key, thêm vào file `.env`:
```env
VIETQR_CLIENT_ID=your_client_id
VIETQR_API_KEY=your_api_key
```

Backend sẽ tự động ưu tiên sử dụng API key nếu có.

## 🚨 Xử lý lỗi

### Lỗi thường gặp

1. **"Không tìm thấy thông tin"**
   - Số tài khoản không tồn tại
   - Ngân hàng không hỗ trợ tra cứu
   - ➡️ Giải pháp: Nhập tên thủ công

2. **"Không thể tra cứu (lỗi mạng)"**
   - Mất kết nối internet
   - API VietQR bảo trì
   - ➡️ Giải pháp: Kiểm tra kết nối, thử lại sau

3. **"Missing API Key"**
   - API VietQR yêu cầu authentication
   - ➡️ Giải pháp: Đăng ký API key tại VietQR.io

## 📊 Luồng hoạt động

```
User nhập STK (≥ 6 số)
        ↓
Debounce 800ms
        ↓
Frontend gọi /api/bank/lookup-account
        ↓
Backend thử API VietQR
        ↓
    ┌───────┴───────┐
    ↓               ↓
Thành công     Thất bại
    ↓               ↓
Tự động điền   Cho phép nhập thủ công
```

## 🎨 UI Components

### SendBankCardModal
```tsx
<SendBankCardModal
  isOpen={showBankCardModal}
  onClose={() => setShowBankCardModal(false)}
  threadId={activeConv.threadId}
  threadType={activeConv.type}
  threadName={activeConv.name}
/>
```

### Props
- `isOpen`: boolean - Hiển thị/ẩn modal
- `onClose`: function - Callback khi đóng modal
- `threadId`: string - ID cuộc trò chuyện
- `threadType`: 'User' | 'Group' - Loại thread
- `threadName`: string - Tên thread (hiển thị trong modal)

## 🧪 Testing

### Test manual
1. Mở modal gửi thẻ ngân hàng
2. Chọn ngân hàng: **MBBank**
3. Nhập STK: **0332138297**
4. Kiểm tra tự động tra cứu tên
5. Click "Gửi Thẻ"

### Test console
```javascript
// Mở DevTools Console
fetch('/api/bank/lookup-account', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    bin: '970422',
    accountNumber: '0332138297'
  })
})
.then(r => r.json())
.then(console.log)
```

## 📝 Ghi chú

- Tên chủ tài khoản luôn viết HOA (uppercase)
- Số tài khoản chỉ cho phép nhập số (0-9)
- Tối đa 20 ký tự cho số tài khoản
- Tối đa 50 ký tự cho tên chủ tài khoản
- Modal tự động đóng sau khi gửi thành công

## 🔮 Tính năng tương lai

- [ ] Hỗ trợ QR code thanh toán VietQR
- [ ] Lưu lịch sử các tài khoản đã gửi
- [ ] Thêm số tiền vào tin nhắn thẻ ngân hàng
- [ ] Hỗ trợ nhiều API tra cứu (fallback)
- [ ] Cache kết quả tra cứu (giảm API calls)
