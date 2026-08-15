# Zalo Account Import/Export Feature

## 📋 Tổng quan

Tính năng Import/Export cho phép bạn xuất thông tin đăng nhập Zalo từ thiết bị A và nhập vào thiết bị B mà không cần quét QR code lại.

### ✨ Lợi ích:
- **Multi-device login**: 1 tài khoản Zalo đăng nhập trên nhiều thiết bị
- **Không cần QR**: Import credentials trực tiếp, bỏ qua bước quét QR
- **Tiết kiệm thời gian**: Đăng nhập nhanh chóng trên thiết bị mới
- **Backup credentials**: Lưu trữ thông tin đăng nhập để dùng lại sau

---

## 🔐 Cách sử dụng

### 1. Xuất tài khoản (Export)

1. Đăng nhập Zalo trên **Thiết bị A** (quét QR code)
2. Vào tab **Dashboard**
3. Tìm phần **"Quản lý Tài khoản Zalo"**
4. Click nút **📤 Xuất tài khoản**
5. File JSON sẽ tự động download về máy (tên: `zalo-account-<timestamp>.json`)

**Nội dung file JSON:**
```json
{
  "exported_at": "2026-08-15T10:30:00.000Z",
  "account": {
    "imei": "...",
    "cookie": {...},
    "userAgent": "...",
    "language": "vi"
  },
  "version": "1.0"
}
```

### 2. Nhập tài khoản (Import)

1. Mở app trên **Thiết bị B**
2. Vào tab **Dashboard**
3. Tìm phần **"Quản lý Tài khoản Zalo"**
4. Click nút **📥 Nhập tài khoản**
5. Chọn 1 trong 2 cách:
   - **Cách 1**: Upload file JSON đã xuất
   - **Cách 2**: Copy/paste nội dung JSON trực tiếp
6. Click **"Nhập tài khoản"**
7. Đợi xác nhận thành công → Trang sẽ tự động reload
8. ✅ Đã đăng nhập thành công!

---

## ⚠️ Bảo mật

### 🔴 Quan trọng:
- **KHÔNG chia sẻ** file JSON này cho người khác
- File chứa thông tin đăng nhập Zalo đầy đủ (cookies, credentials)
- Ai có file này có thể đăng nhập vào tài khoản Zalo của bạn
- Lưu trữ file ở nơi an toàn (mã hóa nếu cần)
- Xóa file sau khi import xong

### 🔒 Khuyến nghị:
- Chỉ dùng để đăng nhập trên thiết bị cá nhân
- Không gửi qua email, chat hoặc cloud storage công cộng
- Đổi mật khẩu Zalo định kỳ
- Kiểm tra danh sách thiết bị đang đăng nhập trong phần **"Active Devices"**

---

## 🛠️ Technical Details

### API Endpoints

#### 1. Export Account
- **Endpoint**: `POST /api/zalo/export-account`
- **Auth**: Required (session cookie)
- **Response**:
  ```json
  {
    "success": true,
    "credentials": {
      "imei": "...",
      "cookie": {...},
      "userAgent": "...",
      "language": "vi"
    },
    "message": "Xuất tài khoản thành công!"
  }
  ```

#### 2. Import Account
- **Endpoint**: `POST /api/zalo/import-account`
- **Auth**: Required (session cookie)
- **Body**:
  ```json
  {
    "credentials": {
      "imei": "...",
      "cookie": {...},
      "userAgent": "...",
      "language": "vi"
    }
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "userInfo": {
      "displayName": "...",
      "userId": "...",
      "phoneNumber": "...",
      "avatar": "..."
    },
    "message": "Nhập tài khoản thành công!"
  }
  ```

### How It Works

1. **Export**:
   - Lấy Zalo API instance hiện tại từ memory
   - Extract credentials (cookie, imei, userAgent) từ context
   - Serialize cookie data (handle `toJSON()` method nếu có)
   - Return JSON data cho client

2. **Import**:
   - Nhận credentials từ client
   - Validate cấu trúc dữ liệu
   - Clear existing Zalo session
   - Tạo Zalo instance mới với credentials đã import
   - Login bằng `zalo.login(credentials)`
   - Check duplicate user (cùng Zalo userId)
   - Merge sessions nếu user đã tồn tại
   - Save session vào database

### Database Integration

- Credentials được lưu vào bảng `users` (column `zalo_session_data`)
- Multi-device: Nhiều browser session có thể share cùng 1 Zalo session
- Auto-merge: Nếu import vào account đã có Zalo userId này, sẽ merge sessions
- Persistence: Session được restore tự động khi reload trang

---

## 🐛 Troubleshooting

### "Dữ liệu không hợp lệ"
- Kiểm tra format JSON có đúng không
- Đảm bảo có đủ các field: `cookie`, `imei`, `userAgent`

### "Dữ liệu credentials không hợp lệ hoặc đã hết hạn"
- Cookie Zalo đã expire
- Cần đăng nhập lại bằng QR code trên thiết bị gốc
- Export file mới

### "Lỗi kết nối"
- Kiểm tra internet connection
- Kiểm tra Zalo server có bị down không

### Import thành công nhưng không nhận tin nhắn
- Vào tab Dashboard → Click **"Start Listener"**
- Listener cần được khởi động sau khi import

---

## 📝 Notes

- Import/Export không ảnh hưởng đến auth session của app (DATABASE_URL auth)
- Mỗi user có thể có nhiều browser sessions, nhưng chỉ 1 Zalo session
- Khi import, app tự động detect duplicate Zalo account và merge
- Credentials được encrypt khi lưu vào database
- Session tự động persist, không mất khi restart server

---

## 🎯 Use Cases

### 1. Development & Testing
- Dev trên laptop → Export → Import vào máy test
- Không cần quét QR nhiều lần

### 2. Multi-Device Personal Use
- Máy văn phòng + Máy nhà
- Login 1 lần, export, import sang máy khác

### 3. Backup Credentials
- Lưu file JSON backup
- Khôi phục nhanh khi cài lại app

### 4. Team Sharing (⚠️ Cẩn thận)
- Share credentials trong team (nếu cần)
- Lưu ý bảo mật!

---

## 📚 Related Docs

- [Multi-User System](./MULTI-USER.md)
- [Authentication System](./AUTH.md)
- [Database Schema](../database/README.md)
