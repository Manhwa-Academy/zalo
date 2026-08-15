# 🔐 Hướng Dẫn Setup Authentication + Multi-User

## ✅ Đã Thêm

1. **AuthModal.tsx** - Popup đăng nhập đẹp
2. **middleware.ts** - Bảo vệ API routes
3. **API Routes**:
   - `/api/auth/login` - Đăng nhập
   - `/api/auth/logout` - Đăng xuất
   - `/api/auth/check` - Kiểm tra trạng thái
4. **Multi-user architecture** - Mỗi user có QR riêng

---

## 🎯 Cách Hoạt Động

### Bước 1: Mở trang
```
https://zalo-bot-vbbk.onrender.com
↓
Popup đăng nhập hiện ra
```

### Bước 2: Nhập username/password
```
Username: admin
Password: (password của bạn)
↓
Bấm "Đăng nhập"
```

### Bước 3: Thấy QR Code Zalo
```
✅ Đã xác thực thành công!
↓
Hiện QR Code để quét bằng app Zalo
↓
Mỗi user có QR riêng - không thấy tài khoản người khác!
```

---

## 🔒 Bảo Mật Multi-Layer

### Layer 1: Authentication (Username/Password)
- ✅ Popup đẹp khi mở trang
- ✅ Phải đăng nhập mới dùng được
- ✅ Cookie lưu 7 ngày

### Layer 2: Multi-User Isolation
- ✅ Mỗi browser session = 1 user ID unique
- ✅ Mỗi user có Zalo instance riêng
- ✅ Database lưu session riêng cho từng user
- ✅ Không ai thấy tài khoản Zalo của người khác!

### Layer 3: API Protection
- ✅ Tất cả API routes cần auth cookie
- ✅ Chỉ `/api/health` cho cronjob không cần auth
- ✅ Middleware tự động chặn requests không có auth

---

## 📝 Setup Production (Render.com)

### Bước 1: Push code
```bash
git add -A
git commit -m "feat: add popup auth + multi-user isolation"
git push
```

### Bước 2: Thêm ENV Variables trên Render
Vào: **Render Dashboard → Your Service → Environment**

Click **"Add Environment Variable"** và thêm:
```
AUTH_USERNAME = admin
AUTH_PASSWORD = mat_khau_manh_cua_ban_123
DATABASE_URL = postgresql://neondb_owner:...
```

> ⚠️ **Quan trọng**: Đổi password mạnh!

### Bước 3: Chờ deploy xong

---

## 🎯 Kết Quả

### Trước (Không Auth):
```
❌ Ai vào cũng thấy tài khoản Zalo của bạn
❌ Tab ẩn danh cũng thấy
❌ Không an toàn
```

### Sau (Có Auth + Multi-User):
```
✅ Mở trang → Popup đăng nhập
✅ Nhập đúng username/password → Vào được
✅ Mỗi người có QR riêng để đăng nhập Zalo của họ
✅ Database lưu session riêng cho từng user
✅ Cronjob vẫn ping /api/health bình thường
✅ Hoàn toàn bảo mật!
```

---

## 🔑 Test Multi-User

### Test 1: Browser 1
```bash
1. Mở Chrome thường
2. Nhập admin/password → Login
3. Quét QR bằng Zalo Account A
4. Bot hoạt động với Account A
```

### Test 2: Browser 2 (Incognito)
```bash
1. Mở Chrome Incognito
2. Nhập admin/password → Login
3. Quét QR bằng Zalo Account B
4. Bot hoạt động với Account B
```

### Kết quả:
```
✅ Browser 1: Thấy Account A
✅ Browser 2: Thấy Account B
✅ Không conflict!
✅ Database có 2 users riêng biệt!
```

---

## 🔧 Cấu Hình Chi Tiết

### AuthModal.tsx
```tsx
// Popup đẹp với:
- Input username/password
- Loading state
- Error handling
- Auto-focus
```

### middleware.ts
```typescript
// Bảo vệ API:
✅ /api/health → Không cần auth (cronjob)
✅ /api/auth/* → Không cần auth (login/logout)
❌ /api/zalo/* → CẦN auth cookie
```

### Multi-User Flow
```
1. User mở trang → Tự động tạo session ID (cookie)
2. Login popup → Xác thực username/password
3. Database: Tạo user mới với session ID unique
4. Quét QR → Lưu Zalo session vào DB cho user đó
5. Bot chạy → Chỉ xử lý messages của user đó
```

---

## ❓ FAQ

**Q: Có bao nhiêu người dùng được?**
A: KHÔNG GIỚI HẠN! Mỗi browser session = 1 user riêng

**Q: Có cần tạo nhiều tài khoản không?**
A: KHÔNG! Username/password chỉ để bảo vệ trang. Sau khi login, mỗi user quét QR Zalo của họ.

**Q: Database có bị đầy không?**
A: Neon Free tier: 512MB. Mỗi user ~10KB → chứa được ~50,000 users!

**Q: Cronjob có bị chặn không?**
A: KHÔNG! `/api/health` được cho phép tự do.

**Q: Session có hết hạn không?**
A: Auth cookie: 7 ngày. Zalo session: Permanent (lưu trong DB).

**Q: Có an toàn không?**
A: RẤT AN TOÀN!
- ✅ Username/password bảo vệ trang
- ✅ Mỗi user có session riêng (cookie + DB)
- ✅ Không ai thấy được tài khoản người khác
- ✅ API routes được middleware bảo vệ

---

## 🚀 Lệnh Deploy

```bash
# 1. Test local
npm run dev
# Mở http://localhost:3000
# Sẽ thấy popup login

# 2. Push lên GitHub
git add -A
git commit -m "feat: popup auth + multi-user + database isolation"
git push

# 3. Vào Render thêm ENV:
AUTH_USERNAME=admin
AUTH_PASSWORD=your_password
DATABASE_URL=postgresql://...

# 4. Chờ deploy xong!
```

---

## 📌 Lưu Ý Quan Trọng

1. **PHẢI** có DATABASE_URL (Neon PostgreSQL) để multi-user hoạt động
2. **PHẢI** chạy schema.sql trong Neon Console trước
3. **NÊN** dùng password mạnh cho AUTH_PASSWORD
4. **Mỗi browser session** = 1 user ID unique = 1 Zalo session riêng
5. **Cronjob** ping `/api/health` không bị ảnh hưởng

---

✅ **Authentication + Multi-User đã hoàn tất!**
🔒 **Bot của bạn giờ vừa bảo mật vừa hỗ trợ nhiều user!**
🎯 **Mỗi người có Zalo instance riêng - không conflict!**
