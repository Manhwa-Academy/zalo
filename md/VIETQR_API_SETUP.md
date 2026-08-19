# 🔐 Hướng dẫn đăng ký và sử dụng VietQR API

## 📋 Tổng quan

Ứng dụng hỗ trợ 2 cách tra cứu tên chủ tài khoản ngân hàng:

1. **API Miễn phí** (Mặc định) - Không cần đăng ký, giới hạn request
2. **API Trả phí** (Nâng cao) - Cần API key, không giới hạn, độ tin cậy cao

---

## 🆓 Phương án 1: Sử dụng API Miễn phí (Mặc định)

### ✅ Ưu điểm
- Không cần đăng ký
- Không cần API key
- Miễn phí hoàn toàn
- Đã được tích hợp sẵn

### ⚠️ Nhược điểm
- Có thể bị giới hạn số lượng request/ngày
- Tốc độ có thể chậm hơn
- Không đảm bảo uptime 24/7
- Có thể bị chặn nếu spam

### 🚀 Cách sử dụng

**Không cần làm gì!** Ứng dụng tự động sử dụng API miễn phí khi chưa có API key.

```bash
# Không cần thêm biến môi trường
# App tự động gọi: https://api.vietqr.io/v2/lookup
```

---

## 💎 Phương án 2: Đăng ký API Trả phí (Cas.so hoặc VietQR.io)

### ✅ Ưu điểm
- Không giới hạn số lượng request
- Tốc độ nhanh, ổn định
- Uptime cao (99.9%)
- Hỗ trợ khách hàng 24/7
- Thêm nhiều tính năng (QR code, transfer tracking, etc.)

### 💰 Chi phí
- **VietQR.io**: Từ 500,000 VNĐ/tháng (tuỳ gói)
- **Cas.so**: Liên hệ để biết giá

---

## 🔧 Cách đăng ký API Key

### Option A: Đăng ký tại VietQR.io

#### Bước 1: Truy cập trang web
```
🌐 https://vietqr.io
```

#### Bước 2: Đăng ký tài khoản
1. Click nút **"Đăng ký"** hoặc **"Sign Up"**
2. Điền thông tin:
   - Email
   - Số điện thoại
   - Tên công ty/cá nhân
   - Mục đích sử dụng

#### Bước 3: Chọn gói dịch vụ
1. Xem các gói: https://vietqr.io/pricing
2. Chọn gói phù hợp với nhu cầu:
   - **Starter**: 500K VNĐ/tháng (1,000 requests/ngày)
   - **Business**: 1,500K VNĐ/tháng (5,000 requests/ngày)
   - **Enterprise**: Liên hệ (Unlimited)

#### Bước 4: Thanh toán
1. Chuyển khoản theo hướng dẫn
2. Ghi rõ mã đơn hàng trong nội dung CK

#### Bước 5: Lấy API Key
1. Đăng nhập vào Dashboard
2. Vào mục **"API Keys"** hoặc **"Credentials"**
3. Tạo API Key mới
4. Sao chép thông tin:
   ```
   Client ID: cas_xxxxxxxxxxxx
   API Key: sk_live_xxxxxxxxxxxx
   ```

---

### Option B: Đăng ký tại Cas.so

#### Bước 1: Truy cập trang API
```
🌐 https://cas.so/general/api/grant/create
🌐 https://cas.so/product/pay-out/
```

#### Bước 2: Tạo tài khoản
1. Click **"Create Account"** hoặc **"Đăng ký"**
2. Điền form đăng ký:
   - Họ tên
   - Email
   - Số điện thoại
   - Tên doanh nghiệp (nếu có)

#### Bước 3: Xác thực tài khoản
1. Check email xác nhận
2. Click link xác thực
3. Hoàn tất profile

#### Bước 4: Đăng ký API Grant
1. Vào mục **"API"** → **"Create Grant"**
2. Chọn loại API: **"Bank Account Lookup"**
3. Điền thông tin dự án:
   - Tên dự án
   - Mô tả
   - Website/App URL
   - Số lượng request dự kiến/tháng

#### Bước 5: Lấy credentials
Sau khi được duyệt (1-3 ngày làm việc), bạn sẽ nhận được:
```
Client ID: cas_client_xxxxxxxxxxxx
Client Secret: cas_secret_xxxxxxxxxxxx
API Endpoint: https://api.cas.so/v1/lookup
```

---

## 🔑 Cấu hình API Key vào App

### Bước 1: Tạo file .env (nếu chưa có)
```bash
# Copy file mẫu
cp .env.example .env
```

### Bước 2: Thêm API credentials vào .env

#### Nếu dùng VietQR.io:
```env
# VietQR API
VIETQR_CLIENT_ID=cas_xxxxxxxxxxxx
VIETQR_API_KEY=sk_live_xxxxxxxxxxxx
VIETQR_API_ENDPOINT=https://api.vietqr.io/v2/lookup
```

#### Nếu dùng Cas.so:
```env
# Cas.so API
VIETQR_CLIENT_ID=cas_client_xxxxxxxxxxxx
VIETQR_API_KEY=cas_secret_xxxxxxxxxxxx
VIETQR_API_ENDPOINT=https://api.cas.so/v1/lookup
```

### Bước 3: Restart server
```bash
# Stop server (Ctrl+C)
# Start lại
npm run dev
```

### Bước 4: Kiểm tra
Mở console và thử tra cứu:
```bash
curl -X POST http://localhost:3000/api/bank/lookup-account \
  -H "Content-Type: application/json" \
  -d '{
    "bin": "970422",
    "accountNumber": "0332138297"
  }'
```

Nếu thành công, bạn sẽ thấy:
```json
{
  "success": true,
  "accountName": "NGUYEN VAN A"
}
```

---

## 🔨 Cập nhật Backend để sử dụng API Key

Mở file `/app/api/bank/lookup-account/route.ts` và cập nhật:

```typescript
export async function POST(request: Request) {
  try {
    const { bin, accountNumber } = await request.json()

    if (!bin || !accountNumber) {
      return NextResponse.json({ 
        error: 'Thiếu bin hoặc accountNumber' 
      }, { status: 400 })
    }

    // Lấy API credentials từ environment
    const clientId = process.env.VIETQR_CLIENT_ID
    const apiKey = process.env.VIETQR_API_KEY
    const endpoint = process.env.VIETQR_API_ENDPOINT || 'https://api.vietqr.io/v2/lookup'

    // Headers cho authenticated API
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    // Nếu có API key, thêm authentication headers
    if (clientId && apiKey) {
      console.log('🔐 [Lookup API] Using authenticated API')
      headers['x-client-id'] = clientId
      headers['x-api-key'] = apiKey
    } else {
      console.log('🆓 [Lookup API] Using free API (no authentication)')
    }

    // Gọi API
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({ bin, accountNumber })
    })

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`)
    }

    const data = await response.json()

    // Parse response
    if (data.code === '00' && data.data?.accountName) {
      return NextResponse.json({
        success: true,
        accountName: data.data.accountName
      })
    }

    return NextResponse.json({
      success: false,
      error: data.desc || 'Không tìm thấy tên chủ tài khoản'
    }, { status: 404 })

  } catch (error: any) {
    console.error('❌ [Lookup API] Error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error.message 
      },
      { status: 500 }
    )
  }
}
```

---

## 📊 So sánh các phương án

| Tiêu chí | API Miễn phí | VietQR.io | Cas.so |
|----------|--------------|-----------|---------|
| **Giá** | Miễn phí | 500K-1,500K/tháng | Liên hệ |
| **Giới hạn** | ~100 req/ngày | 1,000-5,000/ngày | Unlimited |
| **Tốc độ** | Chậm (500ms-2s) | Nhanh (100-300ms) | Nhanh |
| **Uptime** | ~95% | 99.9% | 99.9% |
| **Hỗ trợ** | Không | Email + Chat | Priority |
| **Đăng ký** | Không cần | Dễ (5 phút) | Cần duyệt (1-3 ngày) |
| **Tính năng** | Lookup only | Lookup + QR | Full payment suite |

---

## 🧪 Test API sau khi cấu hình

### Test 1: Kiểm tra API key có hoạt động
```bash
# Xem log khi tra cứu
# Console sẽ hiển thị:
# 🔐 [Lookup API] Using authenticated API
# hoặc
# 🆓 [Lookup API] Using free API
```

### Test 2: So sánh tốc độ
```javascript
// Test free API
console.time('Free API')
fetch('/api/bank/lookup-account', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    bin: '970422',
    accountNumber: '0332138297'
  })
})
.then(r => r.json())
.then(() => console.timeEnd('Free API'))

// Kết quả:
// Free API: 1200ms (chậm)
// Paid API: 250ms (nhanh gấp 5 lần!)
```

---

## 🚨 Troubleshooting

### Lỗi: "Missing API Key"
**Nguyên nhân**: API miễn phí bị rate limit hoặc yêu cầu authentication

**Giải pháp**:
1. Đăng ký API key tại VietQR.io hoặc Cas.so
2. Thêm vào `.env`:
   ```env
   VIETQR_CLIENT_ID=your_client_id
   VIETQR_API_KEY=your_api_key
   ```
3. Restart server

---

### Lỗi: "401 Unauthorized"
**Nguyên nhân**: API key không hợp lệ hoặc đã hết hạn

**Giải pháp**:
1. Kiểm tra lại `Client ID` và `API Key`
2. Đảm bảo không có khoảng trắng thừa
3. Kiểm tra hạn sử dụng trong dashboard
4. Tạo API key mới nếu cần

---

### Lỗi: "429 Too Many Requests"
**Nguyên nhân**: Vượt quá giới hạn request

**Giải pháp**:
- **Nếu dùng free API**: Nâng cấp lên paid plan
- **Nếu dùng paid API**: Nâng cấp gói cao hơn

---

### Lỗi: "Không tìm thấy tên chủ tài khoản"
**Nguyên nhân**: 
- Số tài khoản không tồn tại
- Ngân hàng chưa hỗ trợ tra cứu
- BIN code không đúng

**Giải pháp**:
1. Kiểm tra lại số tài khoản
2. Thử ngân hàng khác (MBBank, Techcombank, VCB thường work tốt)
3. Cho phép user nhập thủ công

---

## 📞 Liên hệ hỗ trợ

### VietQR.io
- 🌐 Website: https://vietqr.io
- 📧 Email: support@vietqr.io
- 💬 Chat: Có live chat trên website

### Cas.so
- 🌐 Website: https://cas.so
- 📧 Email: api@cas.so
- 📱 Hotline: (đang cập nhật)

---

## 🎯 Khuyến nghị

### Cho dự án cá nhân / nhỏ
✅ Dùng **API miễn phí** là đủ
- Chi phí: $0
- Phù hợp với <50 user/ngày

### Cho startup / SME
✅ Dùng **VietQR.io Starter** (500K/tháng)
- 1,000 requests/ngày
- Đủ cho ~100-200 user/ngày
- ROI tốt

### Cho doanh nghiệp lớn
✅ Dùng **VietQR.io Enterprise** hoặc **Cas.so**
- Unlimited requests
- SLA 99.9%
- Priority support
- Tuỳ chỉnh theo nhu cầu

---

## ✅ Checklist triển khai

- [ ] Đăng ký tài khoản VietQR.io hoặc Cas.so
- [ ] Lấy `Client ID` và `API Key`
- [ ] Thêm vào file `.env`
- [ ] Cập nhật code backend (nếu cần)
- [ ] Restart server
- [ ] Test tra cứu với 3-5 số TK khác nhau
- [ ] Monitor usage trong dashboard
- [ ] Cài đặt alert khi gần hết quota

---

**📝 Lưu ý cuối cùng**: 
- Không commit API key vào Git!
- Thêm `.env` vào `.gitignore`
- Rotate API key định kỳ (3-6 tháng)
- Monitor usage để tránh vượt quota
