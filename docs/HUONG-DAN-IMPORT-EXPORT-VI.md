# 🔐 Hướng Dẫn Import/Export Tài Khoản Zalo

## 📖 Giới thiệu

Tính năng này cho phép bạn **đăng nhập 1 tài khoản Zalo trên nhiều thiết bị** mà không cần quét QR code nhiều lần.

### ✨ Lợi ích:
- 🚀 Đăng nhập nhanh trên thiết bị mới (không cần QR)
- 💾 Backup thông tin đăng nhập
- 🖥️ Dùng cùng 1 tài khoản trên nhiều máy (máy nhà, máy công ty, laptop, PC)
- ⏰ Tiết kiệm thời gian setup

---

## 🎯 Hướng Dẫn Sử Dụng

### Bước 1: Xuất Tài Khoản (Export) 📤

**Trên thiết bị đã đăng nhập Zalo:**

1. Mở app và đăng nhập Zalo bằng QR code (nếu chưa login)
2. Click vào tab **"Dashboard"** ở thanh menu trên
3. Kéo xuống tìm phần **"🔐 Quản lý Tài khoản Zalo"**
4. Click nút **"📤 Xuất tài khoản"**
5. Một file JSON sẽ tự động download về máy
6. File có tên dạng: `zalo-account-1723456789.json`

**✅ Thành công!** Bạn đã có file chứa thông tin đăng nhập.

---

### Bước 2: Nhập Tài Khoản (Import) 📥

**Trên thiết bị muốn đăng nhập:**

1. Mở app trên thiết bị mới
2. Click vào tab **"Dashboard"**
3. Kéo xuống tìm phần **"🔐 Quản lý Tài khoản Zalo"**
4. Click nút **"📥 Nhập tài khoản"**

#### Cách 1: Upload file (Khuyến nghị)
1. Trong cửa sổ popup, click **"Chọn file JSON đã xuất"**
2. Chọn file `.json` đã tải ở Bước 1
3. File sẽ tự động load vào ô text
4. Click nút **"Nhập tài khoản"**

#### Cách 2: Paste trực tiếp
1. Mở file JSON bằng Notepad/Text editor
2. Copy toàn bộ nội dung
3. Paste vào ô **"Hoặc paste JSON trực tiếp"**
4. Click nút **"Nhập tài khoản"**

5. Đợi thông báo **"✅ Đã nhập tài khoản Zalo thành công!"**
6. Trang web sẽ tự động reload sau 2 giây
7. **Xong!** Bạn đã đăng nhập thành công

---

## 🖼️ Giao Diện

### Dashboard Tab
```
┌─────────────────────────────────────────────────────────┐
│  🔐 Quản lý Tài khoản Zalo                              │
│                                                         │
│  Xuất/nhập tài khoản Zalo để đăng nhập trên nhiều      │
│  thiết bị mà không cần quét QR lại                     │
│                                                         │
│  ┌────────────────────┐  ┌────────────────────┐        │
│  │ 📤 Xuất tài khoản  │  │ 📥 Nhập tài khoản  │        │
│  └────────────────────┘  └────────────────────┘        │
│                                                         │
│  💡 Hướng dẫn:                                          │
│  • Xuất: Lưu file JSON chứa credentials Zalo           │
│  • Nhập: Import file đã xuất vào thiết bị khác         │
│  • Bảo mật: Không chia sẻ file này cho người khác!     │
│  • Multi-device: 1 tài khoản Zalo login nhiều thiết bị │
└─────────────────────────────────────────────────────────┘
```

### Import Modal
```
┌───────────────────────────────────────────────────────────┐
│  📥 Nhập Tài khoản Zalo                                   │
│                                                           │
│  Chọn file JSON đã xuất:                                  │
│  ┌───────────────────────────────────────────────────┐   │
│  │ [Choose File] zalo-account-1723456789.json       │   │
│  └───────────────────────────────────────────────────┘   │
│                                                           │
│  Hoặc paste JSON trực tiếp:                               │
│  ┌───────────────────────────────────────────────────┐   │
│  │ {                                                  │   │
│  │   "exported_at": "2026-08-15T...",                │   │
│  │   "account": {                                     │   │
│  │     "imei": "...",                                 │   │
│  │     "cookie": {...}                                │   │
│  │   }                                                │   │
│  │ }                                                  │   │
│  └───────────────────────────────────────────────────┘   │
│                                                           │
│  ┌──────────────────┐  ┌──────────────────┐             │
│  │ Nhập tài khoản   │  │      Hủy         │             │
│  └──────────────────┘  └──────────────────┘             │
└───────────────────────────────────────────────────────────┘
```

---

## ⚠️ Cảnh Báo Bảo Mật

### 🔴 QUAN TRỌNG - Đọc kỹ trước khi sử dụng:

1. **File JSON rất nhạy cảm:**
   - Chứa toàn bộ thông tin đăng nhập Zalo của bạn
   - Ai có file này = Ai có thể vào tài khoản Zalo của bạn
   - Giống như mật khẩu, phải giữ bí mật tuyệt đối

2. **KHÔNG làm những điều sau:**
   - ❌ Gửi file qua email, Messenger, Zalo, Telegram
   - ❌ Upload lên Google Drive, Dropbox, OneDrive công khai
   - ❌ Share cho bạn bè, đồng nghiệp
   - ❌ Đăng lên Facebook, group, forum
   - ❌ Để file trong folder Downloads lâu dài

3. **NÊN làm:**
   - ✅ Lưu file vào thư mục có password/mã hóa
   - ✅ Đổi tên file để khó nhận diện
   - ✅ Xóa file ngay sau khi import xong
   - ✅ Scan virus/malware định kỳ
   - ✅ Đổi mật khẩu Zalo thường xuyên

4. **Nếu file bị lộ:**
   - 🚨 Đổi mật khẩu Zalo ngay lập tức
   - 🚨 Logout tất cả thiết bị trong phần "Active Devices"
   - 🚨 Đăng nhập lại bằng QR code mới

---

## 🐛 Xử Lý Lỗi Thường Gặp

### Lỗi: "Dữ liệu không hợp lệ (JSON format sai)"
**Nguyên nhân:** File JSON bị lỗi format hoặc copy thiếu

**Giải pháp:**
- Kiểm tra file có mở được bằng Notepad không
- Copy lại toàn bộ nội dung từ đầu đến cuối (bao gồm `{` và `}`)
- Đảm bảo không thêm/bớt ký tự gì

### Lỗi: "Dữ liệu credentials không hợp lệ hoặc đã hết hạn"
**Nguyên nhân:** Cookie Zalo đã hết hạn

**Giải pháp:**
- Quay lại thiết bị gốc
- Đăng nhập Zalo lại bằng QR code
- Xuất file JSON mới
- Thử import lại

### Lỗi: "Lỗi kết nối"
**Nguyên nhân:** Mất internet hoặc Zalo server lỗi

**Giải pháp:**
- Kiểm tra kết nối internet
- Thử lại sau vài phút
- Restart router nếu cần

### Import thành công nhưng không nhận tin nhắn
**Nguyên nhân:** Listener chưa được start

**Giải pháp:**
- Vào tab Dashboard
- Tìm phần "Bot Status"
- Click nút **"Start Listener"**
- Listener sẽ bắt đầu lắng nghe tin nhắn

### File JSON bị mất
**Nguyên nhân:** Chưa backup hoặc xóa nhầm

**Giải pháp:**
- Quay lại thiết bị gốc (còn đăng nhập)
- Xuất file JSON mới
- Lưu backup ở nhiều nơi an toàn

---

## 💡 Mẹo Sử Dụng

### 1. Backup định kỳ
- Export file JSON 1 tuần/1 lần
- Lưu vào folder có password
- Đổi tên file (vd: `backup-zalo-2026-08-15.json`)

### 2. Quản lý nhiều thiết bị
- Đăng nhập máy nhà: Import file
- Đăng nhập máy công ty: Import cùng file
- Cả 2 máy đều hoạt động bình thường
- Check danh sách thiết bị trong "Active Devices"

### 3. Kiểm tra thiết bị đang login
- Vào tab Dashboard
- Tìm phần **"🖥️ Active Devices"**
- Xem danh sách thiết bị đang đăng nhập
- Logout thiết bị lạ nếu có

### 4. Testing trước khi xóa
- Import vào thiết bị mới
- Test gửi/nhận tin nhắn
- Đảm bảo hoạt động ổn định
- Sau đó mới xóa file JSON

---

## 🎯 Các Tình Huống Sử Dụng

### Tình huống 1: Dùng 2 máy tính (nhà + công ty)
1. Máy nhà: Đăng nhập QR, xuất file
2. Máy công ty: Import file
3. ✅ Cả 2 máy đều login được

### Tình huống 2: Setup máy mới
1. Máy cũ: Export file backup
2. Máy mới: Cài app, import file
3. ✅ Không cần quét QR

### Tình huống 3: Testing/Development
1. Dev machine: Login QR, export
2. Test machine: Import file
3. ✅ Test nhanh không mất thời gian

### Tình huống 4: Laptop + Desktop
1. Laptop: Đi làm, export file về USB
2. Desktop: Về nhà, import file từ USB
3. ✅ Linh hoạt đổi thiết bị

---

## 📞 Hỗ Trợ

### Nếu gặp vấn đề:

1. **Đọc lại hướng dẫn:** Kiểm tra từng bước
2. **Check logs:** Mở Console (F12) xem lỗi
3. **Thử lại:** Clear cache, reload page
4. **Contact admin:** Nếu vẫn không được

### Debug Steps:
```bash
# 1. Check database connection
node debug-env.js

# 2. Check users in database
npm run list-users

# 3. Check active sessions
npm run list-sessions

# 4. Check Zalo session data
# Trong app, vào Dashboard, check "Bot Status"
```

---

## ✅ Checklist Sử Dụng An Toàn

Trước khi bắt đầu, check xem bạn đã:
- [ ] Hiểu rõ file JSON rất nhạy cảm, phải giữ bí mật
- [ ] Có folder an toàn để lưu file
- [ ] Biết cách xóa file sau khi dùng xong
- [ ] Biết cách logout tất cả thiết bị nếu file bị lộ
- [ ] Có plan backup credentials định kỳ

---

## 🎓 Tổng Kết

### Quy trình đơn giản:
1. **Login lần đầu:** Quét QR code (1 lần duy nhất)
2. **Export:** Lưu file JSON
3. **Import:** Dùng file JSON để login thiết bị khác
4. **Done:** Tất cả thiết bị đều hoạt động

### Lưu ý quan trọng:
- 🔒 File JSON = Chìa khóa tài khoản Zalo
- 🚨 Giữ bí mật tuyệt đối
- 💾 Backup nhưng phải an toàn
- 🗑️ Xóa sau khi dùng xong

---

**Chúc bạn sử dụng thành công! 🎉**
