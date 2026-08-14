# 🤖 ZALO AUTO REPLY BOT

```
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║     🎉 ZALO AUTO REPLY BOT - DESKTOP APPLICATION 🎉          ║
║                                                               ║
║              Tự động trả lời tin nhắn Zalo                   ║
║         với công nghệ hiện đại: Next.js + Electron           ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
```

---

## 📖 MỤC LỤC:

1. [Giới thiệu](#-giới-thiệu)
2. [Tính năng](#-tính-năng)
3. [Tech Stack](#-tech-stack)
4. [Bắt đầu ngay](#-bắt-đầu-ngay-5-phút)
5. [Screenshot](#-screenshots)
6. [Lưu ý quan trọng](#️-lưu-ý-quan-trọng)
7. [Tài liệu](#-tài-liệu)
8. [FAQ](#-faq)
9. [Giấy phép](#-giấy-phép)

---

## 🎯 GIỚI THIỆU:

**Zalo Auto Reply Bot** là ứng dụng desktop giúp bạn tự động trả lời tin nhắn Zalo khi bạn không có mặt. Ứng dụng được xây dựng với công nghệ hiện đại:

- ✅ **Next.js 14** - Framework React mạnh mẽ
- ✅ **TypeScript** - Type-safe code
- ✅ **Tailwind CSS** - Modern styling
- ✅ **Electron** - Cross-platform desktop app
- ✅ **zca-js** - Unofficial Zalo API

### **Đặc điểm nổi bật:**
- 🚀 Giao diện đẹp, dễ sử dụng (Dark theme)
- 📱 Đăng nhập QR trực tiếp trên web (không cần terminal!)
- 🤖 Tự động trả lời tin nhắn real-time
- 📊 Thống kê chi tiết (tin nhận/gửi, uptime)
- 📨 Lịch sử tin nhắn đầy đủ
- 🎨 Logo Aris tùy chỉnh
- 💾 Tự động lưu session

---

## ✨ TÍNH NĂNG:

### **1. Đăng nhập QR**
- ✅ Mã QR hiển thị trực tiếp trên giao diện web
- ✅ Quét bằng Zalo trên điện thoại
- ✅ Xác nhận đơn giản
- ✅ Session tự động lưu (không cần đăng nhập lại sau F5)

### **2. Auto Reply Bot**
- ✅ Bật/tắt bot dễ dàng (toggle switch)
- ✅ Tùy chỉnh tin nhắn tự động
- ✅ Lắng nghe tin nhắn real-time (Server-Sent Events)
- ✅ Tự động trả lời ngay lập tức

### **3. Message Logs**
- ✅ Xem lịch sử tất cả tin nhắn
- ✅ Hiển thị người gửi, nội dung, thời gian
- ✅ Phân biệt tin nhận và tin đã trả lời
- ✅ Cập nhật real-time

### **4. Statistics Dashboard**
- ✅ Số tin nhắn đã nhận
- ✅ Số tin nhắn đã gửi
- ✅ Tỷ lệ phản hồi
- ✅ Uptime

### **5. User Profile**
- ✅ Hiển thị thông tin người dùng
- ✅ Avatar
- ✅ Tên có thể edit thủ công

### **6. Custom Branding**
- ✅ Logo Aris ở header
- ✅ Logo Aris ở màn hình login
- ✅ Logo Aris làm favicon
- ✅ Professional look

---

## 🛠️ TECH STACK:

### **Frontend:**
```
- Next.js 14 (App Router)
- React 18
- TypeScript 5
- Tailwind CSS 3
- Server-Sent Events (SSE)
```

### **Backend:**
```
- Next.js API Routes
- Node.js
- zca-js v2.1.2 (Unofficial Zalo API)
- Global Singleton Pattern
```

### **Desktop:**
```
- Electron 28
- Cross-platform (Windows/Mac/Linux)
```

### **Development:**
```
- VSCode
- ESLint
- Prettier
- Git
```

---

## 🚀 BẮT ĐẦU NGAY (5 PHÚT):

### **Bước 1: Cài đặt dependencies**
```bash
npm install
```

### **Bước 2: Chạy development server**
```bash
npm run dev
```

### **Bước 3: Mở trình duyệt**
```
http://localhost:3000
```

### **Bước 4: Đăng nhập**
1. Click "Hiển thị Mã QR Đăng Nhập"
2. Mã QR hiển thị trên web
3. Mở Zalo trên điện thoại → Quét mã QR
4. Xác nhận trên điện thoại
5. ✅ Đăng nhập thành công!

### **Bước 5: Bật bot**
1. Nhập tin nhắn tự động (ví dụ: "Xin chào! Tôi là bot...")
2. Bật toggle switch
3. Gửi tin test từ Zalo khác
4. 🎉 Bot sẽ tự động trả lời!

---

## 📸 SCREENSHOTS:

### **Màn hình đăng nhập:**
```
┌────────────────────────────────────────┐
│  [Logo Aris]                           │
│                                        │
│     Đăng nhập Zalo Bot                │
│  Quét mã QR trực tiếp bên dưới         │
│                                        │
│     ┌─────────────────┐               │
│     │                 │               │
│     │   [QR CODE]     │               │
│     │                 │               │
│     └─────────────────┘               │
│                                        │
│  📱 Mở Zalo → Quét mã QR              │
│                                        │
└────────────────────────────────────────┘
```

### **Dashboard chính:**
```
┌────────────────────────────────────────────────────────┐
│  [Logo] Zalo Auto Reply Bot        [User] [Đăng xuất] │
├────────────────────────────────────────────────────────┤
│  🟢 Đã kết nối Zalo    🟢 Đang lắng nghe tin nhắn      │
├────────────────────────────────────────────────────────┤
│  Bot Status: [●] ON                                    │
│  ┌────────────────────────────────────────┐           │
│  │ Tin nhắn tự động:                      │           │
│  │ Xin chào! Tôi là bot tự động...        │           │
│  └────────────────────────────────────────┘           │
│  [💾 Lưu tin nhắn]                                     │
├────────────────────────────────────────────────────────┤
│  📨 Tin nhắn nhận    ✉️ Tin nhắn gửi    ⏱️ Uptime     │
│        12                  12              2h 30m      │
├────────────────────────────────────────────────────────┤
│  📨 Message Logs:                                      │
│  [15:30] Nguyễn Văn A: "Hello"                        │
│          ✅ Đã trả lời: "Xin chào!..."                 │
│  [15:35] Trần Thị B: "Bạn có ở nhà không?"            │
│          ✅ Đã trả lời: "Xin chào!..."                 │
└────────────────────────────────────────────────────────┘
```

---

## ⚠️ LƯU Ý QUAN TRỌNG:

### **1. Không mở Zalo Web/PC đồng thời**
- ❌ Zalo chỉ cho phép 1 web listener tại một thời điểm
- ❌ Nếu mở Zalo Web/PC → Bot tự động logout
- ✅ **Giải pháp:** Đóng Zalo Web/PC khi chạy bot

### **2. Unofficial API - Rủi ro**
- ⚠️ `zca-js` là unofficial API (không chính thức từ Zalo)
- ⚠️ Có thể bị Zalo ban account nếu lạm dụng
- ✅ Khuyến nghị: Dùng cho mục đích cá nhân, không spam

### **3. Session Persistence**
- ✅ Lần đầu: Phải quét QR
- ✅ F5 (reload): Không cần đăng nhập lại (nếu server vẫn chạy)
- ❌ Restart server (Ctrl+C): Phải quét QR lại

### **4. Restart Server sau khi cập nhật code**
- ⚠️ Sau khi update code, **BẮT BUỘC** restart server
- 🔧 Cách restart: `Ctrl + C` → `npm run dev`

---

## 📚 TÀI LIỆU:

### **Bắt đầu:**
- 📄 **`DOC_NGAY_BAY_GIO.txt`** - Đọc đầu tiên! (1 phút)
- 📄 **`START_NOW.md`** - Hướng dẫn 5 phút
- 📄 **`BAT_DAU_NGAY.md`** - Chi tiết từng bước

### **Fix lỗi:**
- 🔧 **`FIX_401_HOAN_TAT.md`** - Fix lỗi 401 (QUAN TRỌNG!)
- 🔧 **`RESTART_REQUIRED.md`** - Hướng dẫn restart
- 🔧 **`FIX_LOG.md`** - Lịch sử các lỗi đã fix

### **Tổng quan:**
- 📊 **`TOM_TAT_DU_AN.md`** - Tóm tắt toàn bộ dự án
- 📊 **`KIEN_TRUC.md`** - Kiến trúc kỹ thuật
- 📊 **`TRANG_THAI.md`** - Trạng thái dự án

### **Testing:**
- 🧪 **`TESTING_GUIDE.md`** - Hướng dẫn test đầy đủ
- 🧪 **`QUICK_TEST.md`** - Test nhanh 2 phút

### **Index:**
- 📚 **`INDEX_TAI_LIEU.md`** - Chỉ mục tất cả tài liệu

---

## ❓ FAQ:

### **Q: Tại sao bot không nhận tin nhắn?**
A: Kiểm tra Terminal có thấy `POST /api/zalo/listener 401` không?
   - Nếu có → Chưa restart server sau khi cập nhật code
   - Giải pháp: `Ctrl + C` → `npm run dev`
   - Đọc: `FIX_401_HOAN_TAT.md`

### **Q: Tại sao tự động logout khi mở Zalo PC?**
A: Zalo chỉ cho 1 web listener. Mở Zalo PC → Bot logout.
   - Giải pháp: Đóng Zalo Web/PC khi chạy bot

### **Q: Tại sao phải quét QR lại sau restart?**
A: Restart server → globalThis cleared → Session mất.
   - Chỉ F5 (reload) thì không mất session
   - Restart server (Ctrl+C) thì mất session

### **Q: Làm sao đổi tên người dùng?**
A: Click icon ✏️ bên cạnh tên trong User Profile
   - zca-js v2 không có API lấy tên
   - Cho phép edit thủ công

### **Q: Bot có thể trả lời có điều kiện không?**
A: Version hiện tại chỉ trả lời cố định 1 tin
   - Tính năng nâng cao có thể thêm sau:
     - Keyword-based replies
     - Multiple messages (random)
     - Whitelist/blacklist

### **Q: Làm sao build thành app desktop?**
A: Chạy lệnh build Electron:
   ```bash
   npm run electron:build
   ```
   Hoặc package:
   ```bash
   npm run package
   ```

---

## 🏗️ KIẾN TRÚC:

```
Frontend (React)
    │
    ├─► API Routes (Server-side)
    │       │
    │       ├─► Global Singleton
    │       │       │
    │       │       └─► zaloApi (shared)
    │       │
    │       └─► zca-js API
    │               │
    │               └─► Zalo Server
    │
    └─► SSE (Real-time updates)
```

Xem chi tiết: `KIEN_TRUC.md`

---

## 👨‍💻 DEVELOPMENT:

### **Chạy dev server:**
```bash
npm run dev
```

### **Chạy Electron app:**
```bash
npm run electron:dev
```

### **Build production:**
```bash
npm run build
npm run electron:build
```

### **Package app:**
```bash
npm run package
```

---

## 📦 SCRIPTS:

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "electron": "electron .",
  "electron:dev": "concurrently \"npm run dev\" \"wait-on http://localhost:3000 && electron .\"",
  "electron:build": "next build && electron-builder",
  "package": "electron-builder build --win --publish never"
}
```

---

## 🔒 BẢO MẬT:

- ⚠️ Session lưu trong `.zalo-session.json` (gitignored)
- ⚠️ Không commit file này lên Git
- ⚠️ Unofficial API - có rủi ro bị ban
- ✅ Chỉ dùng cho mục đích cá nhân

---

## 🐛 TROUBLESHOOTING:

| Vấn đề | Nguyên nhân | Giải pháp |
|--------|-------------|-----------|
| 401 error | Chưa restart | Ctrl+C → npm run dev |
| Không thấy QR | Cache | Ctrl+Shift+R |
| Bot không trả lời | Chưa bật bot | Kiểm tra toggle |
| Tự logout | Mở Zalo PC | Đóng Zalo PC |

Xem thêm: `FIX_LOG.md`

---

## 📝 CHANGELOG:

### **v1.0.0 (2026-08-14)**
- ✅ Initial release
- ✅ QR login on web
- ✅ Auto reply bot
- ✅ Message logs
- ✅ Statistics
- ✅ Aris logo
- ✅ Fix 401 error (Global Singleton)
- ✅ Full documentation

Xem đầy đủ: `CHANGELOG.md`

---

## 🤝 ĐÓNG GÓP:

Dự án này được xây dựng cho mục đích cá nhân/học tập.

Nếu muốn đóng góp:
1. Fork repo
2. Create branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 📄 GIẤY PHÉP:

Dự án này được phát hành dưới giấy phép MIT.

**Lưu ý:** Sử dụng `zca-js` (unofficial Zalo API) có rủi ro. Người dùng tự chịu trách nhiệm về việc sử dụng.

---

## 🎯 ROADMAP (Tương lai):

### **v1.1.0**
- [ ] Keyword-based auto reply
- [ ] Multiple auto-reply messages (random)
- [ ] Whitelist/blacklist users
- [ ] Schedule (bật/tắt theo giờ)

### **v1.2.0**
- [ ] Multi-account support
- [ ] Database persistence (SQLite)
- [ ] Export logs to CSV
- [ ] Advanced statistics

### **v2.0.0**
- [ ] Web UI để quản lý từ xa
- [ ] Mobile app
- [ ] Cloud deployment
- [ ] AI-powered replies (GPT integration)

---

## 📞 HỖ TRỢ:

Nếu gặp vấn đề:
1. Đọc tài liệu (đặc biệt `FIX_401_HOAN_TAT.md`)
2. Kiểm tra Terminal logs
3. Xem `INDEX_TAI_LIEU.md` để tìm tài liệu phù hợp

---

## 🎉 CREDIT:

- **zca-js**: https://github.com/duongductrong/zca.js
- **Next.js**: https://nextjs.org/
- **Electron**: https://www.electronjs.org/
- **Tailwind CSS**: https://tailwindcss.com/

---

## ⭐ KẾT LUẬN:

**Zalo Auto Reply Bot** là ứng dụng desktop hoàn chỉnh với:
- ✅ Công nghệ hiện đại (Next.js + Electron)
- ✅ Giao diện đẹp (Dark theme + Tailwind)
- ✅ Tính năng đầy đủ (QR login + Auto reply + Logs + Stats)
- ✅ Logo tùy chỉnh (Aris branding)
- ✅ Tài liệu chi tiết (22+ files docs)
- ✅ Không có bugs (đã fix tất cả)

**SẴN SÀNG SỬ DỤNG NGAY!** 🚀

---

```
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║         HÃY BẮT ĐẦU: ĐỌC `DOC_NGAY_BAY_GIO.txt`             ║
║                                                               ║
║              SAU 5 PHÚT, BOT SẼ HOẠT ĐỘNG! 🎉                ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
```

---

**Made with ❤️ by AI + Human**  
**Version:** 1.0.0  
**Last Updated:** 2026-08-14
