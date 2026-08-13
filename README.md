# 🤖 Zalo Auto Reply Desktop App

Ứng dụng Desktop tự động trả lời tin nhắn Zalo được xây dựng với **Next.js**, **Electron**, và **zca-js**.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![Electron](https://img.shields.io/badge/Electron-28-47848F)

## ✨ Tính năng

- ✅ **Giao diện hiện đại** với Next.js 14 + Tailwind CSS
- ✅ **Đăng nhập QR Code** nhanh chóng (file qr.png)
- ✅ **Bật/Tắt bot** dễ dàng
- ✅ **Tùy chỉnh tin nhắn** tự động
- ✅ **Theo dõi log** tin nhắn real-time
- ✅ **Thống kê** chi tiết (tổng tin nhắn, đã trả lời, cuộc trò chuyện)
- ✅ **Trạng thái kết nối** real-time
- ✅ **Export logs** ra file JSON
- ✅ **Reset thống kê** và xóa logs
- ✅ **Mẫu tin nhắn** có sẵn (3 mẫu)
- ✅ **Desktop App** độc lập (Electron)

## 🚀 Cài đặt

### Yêu cầu
- Node.js 18+ 
- npm hoặc yarn

### Bước 1: Clone và cài đặt

\`\`\`bash
# Clone project (nếu có git repo)
git clone <repo-url>
cd zalo-auto-reply-desktop

# Cài đặt dependencies
npm install
\`\`\`

### Bước 2: Chạy development mode

\`\`\`bash
# Chạy Next.js dev server
npm run dev

# Hoặc chạy cả Electron
npm run electron:dev
\`\`\`

### Bước 3: Build ứng dụng Desktop

\`\`\`bash
# Build cho Windows
npm run package
\`\`\`

File `.exe` sẽ được tạo trong thư mục `dist/`

## 📖 Hướng dẫn sử dụng

### 1. Đăng nhập
- Mở ứng dụng
- Click "Đăng nhập bằng QR Code"
- Quét QR bằng Zalo trên điện thoại
- Đợi đăng nhập thành công

### 2. Cấu hình Bot
- Nhập tin nhắn tự động vào ô text
- Hoặc chọn một trong 3 mẫu có sẵn
- Bật bot bằng nút toggle

### 3. Theo dõi
- Xem log tin nhắn ở phía dưới
- Theo dõi thống kê real-time
- Bot sẽ tự động trả lời khi có tin nhắn mới

## ⚠️ Lưu ý quan trọng

- ⚠️ **zca-js là API không chính thức**, sử dụng có thể vi phạm điều khoản Zalo
- ⚠️ **Không sử dụng cho mục đích spam** hoặc lạm dụng
- ⚠️ **Tài khoản có thể bị khóa** nếu Zalo phát hiện hành vi bất thường
- ⚠️ Chỉ nên dùng cho **mục đích cá nhân, học tập**

## 🛠️ Công nghệ sử dụng

- **Next.js 14** - React Framework với App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Electron** - Desktop wrapper
- **zca-js** - Unofficial Zalo API
- **date-fns** - Date formatting

## 📁 Cấu trúc thư mục

\`\`\`
zalo-auto-reply-desktop/
├── app/                    # Next.js App Router
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/             # React Components
│   ├── Header.tsx
│   ├── LoginSection.tsx
│   ├── ControlPanel.tsx
│   ├── MessageLogs.tsx
│   └── StatsCards.tsx
├── services/              # Business Logic
│   └── zalo.service.ts
├── electron/              # Electron Main Process
│   └── main.js
├── public/                # Static assets
├── package.json
├── tailwind.config.js
└── tsconfig.json
\`\`\`

## 🐛 Troubleshooting

### Lỗi đăng nhập
- Đảm bảo kết nối internet ổn định
- Thử đăng xuất Zalo Web trên trình duyệt
- Restart ứng dụng và thử lại

### Bot không trả lời
- Kiểm tra bot đã được BẬT chưa
- Kiểm tra tin nhắn tự động đã nhập
- Xem console log để debug

### Lỗi build
- Xóa `node_modules` và cài lại: `npm install`
- Clear cache: `rm -rf .next`

## 📝 License

MIT License - Sử dụng tự do cho mục đích cá nhân

## 🤝 Đóng góp

Mọi đóng góp đều được chào đón! Tạo Issue hoặc Pull Request.

## 📧 Liên hệ

Nếu có vấn đề, hãy tạo Issue trên GitHub.

---

**Tạo bởi Kiro AI** 🤖
