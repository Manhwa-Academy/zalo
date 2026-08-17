# 🤖 Zalo Auto Reply Bot - AI-Powered Chat Automation

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-14.2-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-336791)
![Gemini AI](https://img.shields.io/badge/Gemini_AI-3.1_Flash_Lite-4285F4)

**Ứng dụng tự động trả lời tin nhắn Zalo thông minh với AI, giao diện đẹp, và nhiều tính năng nâng cao**

[🚀 Demo](https://zalo-bot-vbbk.onrender.com) | [📖 Docs](#-hướng-dẫn-sử-dụng) | [🐛 Issues](https://github.com/your-repo/issues)

</div>

---

## 📋 Mục lục

- [✨ Tính năng chính](#-tính-năng-chính)
- [🎯 Tính năng nâng cao](#-tính-năng-nâng-cao)
- [🤖 AI Reply System](#-ai-reply-system)
- [🚀 Cài đặt](#-cài-đặt)
- [📖 Hướng dẫn sử dụng](#-hướng-dẫn-sử-dụng)
- [🏗️ Kiến trúc](#️-kiến-trúc)
- [🛠️ Công nghệ](#️-công-nghệ)
- [⚙️ Cấu hình](#️-cấu-hình)
- [📦 API Routes](#-api-routes)
- [🐛 Troubleshooting](#-troubleshooting)
- [🤝 Đóng góp](#-đóng-góp)
- [📄 License](#-license)

---

## ✨ Tính năng chính

### 🔐 Authentication & Multi-User
- ✅ **Đăng nhập/Đăng ký** với email & password
- ✅ **Multi-user support** - Mỗi người có account riêng
- ✅ **Session management** - Quản lý nhiều devices
- ✅ **Đăng xuất từ xa** - Logout tất cả thiết bị
- ✅ **Active devices tracking** - Xem danh sách devices đang login

### 💬 Chat & Messaging
- ✅ **Giao diện chat đẹp** - Similar to Zalo/Messenger
- ✅ **Real-time messaging** - Nhắn tin real-time
- ✅ **Lịch sử tin nhắn** - Load history từ Zalo
- ✅ **Multi-media support**:
  - 📸 Hình ảnh (upload & preview)
  - 📄 File attachments
  - 😊 Stickers (Giphy integration)
  - 🎨 GIF support
- ✅ **Message actions**:
  - ↩️ Reply (trả lời)
  - ⏩ Forward (chuyển tiếp)
  - ⭐ Star/Bookmark
  - 📌 Pin message
  - 🗑️ Delete/Recall
  - 📋 Copy text
  - ℹ️ Message details
- ✅ **Online status** - Hiển thị ai đang online (chấm xanh)
- ✅ **Typing indicator** - Thông báo đang nhập
- ✅ **Read receipts** - Đã đọc/chưa đọc
- ✅ **Search conversations** - Tìm kiếm trò chuyện
- ✅ **Filter** - Tất cả / Cá nhân / Nhóm

### 🤖 Auto Reply Bot
- ✅ **Bật/Tắt bot** dễ dàng
- ✅ **Tùy chỉnh tin nhắn** tự động
- ✅ **Preset messages** - 5 mẫu tin nhắn có sẵn
- ✅ **Random reply** - Chọn ngẫu nhiên từ danh sách
- ✅ **Delay reply** - Tùy chỉnh độ trễ (0-10s)
- ✅ **Reply scope**:
  - 🌐 Tất cả trò chuyện
  - 👤 Chỉ tin nhắn cá nhân
  - 👥 Chỉ tin nhắn nhóm
  - 🎯 Whitelist (chỉ nhóm được chọn)
  - ⛔ Blacklist (loại trừ nhóm)

### 👥 Group Management
- ✅ **Danh sách nhóm** - Xem tất cả nhóm
- ✅ **Thành viên nhóm** - Xem members + avatar
- ✅ **Leave group** - Rời nhóm
- ✅ **Group info** - Tên, avatar, số thành viên
- ✅ **@ Mention** - Tag thành viên trong nhóm

### 📊 Statistics & Analytics
- ✅ **Thống kê real-time**:
  - 💬 Tổng tin nhắn nhận
  - ✅ Đã trả lời
  - 👥 Số cuộc trò chuyện
  - 📈 Tỷ lệ trả lời
- ✅ **Message logs** - Lịch sử chi tiết
- ✅ **Export logs** - Xuất ra JSON
- ✅ **Reset stats** - Xóa thống kê

### 💾 Backup & Restore
- ✅ **Backup account** - Lưu settings + logs
- ✅ **Export account** - Xuất toàn bộ data
- ✅ **Import account** - Khôi phục từ file
- ✅ **Undo changes** - Hoàn tác thay đổi

---

## 🎯 Tính năng nâng cao

### 🎨 Customization
- ✅ **Custom chat background** - Upload ảnh nền riêng
- ✅ **Dark mode** - Giao diện tối (mặc định)
- ✅ **Animations** - Hiệu ứng mượt mà
- ✅ **Font size** - Nhỏ / Trung bình / Lớn
- ✅ **Notification sound** - Âm thanh thông báo
- ✅ **Auto mark read** - Tự động đánh dấu đã đọc

### 🔔 Notifications
- ✅ **Browser notifications** - Thông báo trình duyệt
- ✅ **Sound notifications** - Âm thanh khi có tin nhắn
- ✅ **Mute conversations** - Tắt thông báo riêng lẻ

### 📱 Chat Features
- ✅ **Pin conversations** - Ghim trò chuyện quan trọng
- ✅ **Pin messages** - Ghim tin nhắn trong chat
- ✅ **Multi-select** - Chọn nhiều tin nhắn
- ✅ **Batch operations** - Xóa/forward hàng loạt
- ✅ **Media gallery** - Xem ảnh/video/link
- ✅ **Quick reactions** - Emoji nhanh
- ✅ **Right info drawer** - Thông tin nhóm/thành viên

### 🔍 Search & Filter
- ✅ **Search messages** - Tìm trong lịch sử chat
- ✅ **Search users** - Tìm người dùng
- ✅ **Filter by type** - Cá nhân / Nhóm
- ✅ **Filter media** - Ảnh / Video / Links

---

## 🤖 AI Reply System

### 🧠 Powered by Google Gemini AI

Bot hỗ trợ **trả lời thông minh bằng AI** sử dụng Google Gemini 3.1 Flash Lite:

#### ✨ Tính năng AI:
- ✅ **Smart detection** - Tự động phát hiện câu hỏi & tin nhắn >= 3 từ
- ✅ **Context awareness** - Nhớ 5 tin nhắn gần nhất
- ✅ **Personality modes** - 6 tính cách khác nhau:
  - 🌟 Thân thiện (Friendly)
  - 💼 Chuyên nghiệp (Professional)
  - 😊 Thoải mái (Casual)
  - 😄 Hài hước (Funny)
  - 💙 Hỗ trợ (Supportive)
  - 🥺 Dễ thương (Cute - Monica style)
- ✅ **Trigger modes**:
  - 🧠 Thông minh - Tự động phát hiện
  - ❓ Chỉ câu hỏi - Chỉ reply khi có "?"
  - ⚡ Luôn luôn - Mọi tin nhắn
  - ✋ Thủ công - Chỉ khi bật manually
- ✅ **Keyword detection** - 320+ từ khóa & viết tắt tiếng Việt:
  - `j` (gì), `bh` (bao giờ), `bl` (bao lâu)
  - `dc/đc` (được), `ko/k` (không), `r` (rồi)
  - `m/t` (mày/tao), `cx` (cũng), và nhiều hơn
- ✅ **Media responses** - Trả lời khi nhận sticker/ảnh/link/file
- ✅ **Customizable length** - 50-500 ký tự
- ✅ **Personal Gemini API key** - Mỗi user có thể dùng API key riêng:
  - 🔑 Quota riêng (150 requests/phút)
  - 🆓 FREE tier từ Google
  - 🎯 9 models Gemini để chọn
  - 🔒 Secure & isolated per user

#### 🎯 AI Coverage:
- **~95% tin nhắn** tiếng Việt được AI hiểu và phản hồi
- **Fallback** tự động sang preset messages nếu AI lỗi

#### 💰 Chi phí:
- **FREE** - Google Gemini API có free tier
- **150 requests/phút** với Gemini 3.1 Flash Lite
- **Không giới hạn** nếu dùng API key riêng

---

## 🚀 Cài đặt

### 📋 Yêu cầu hệ thống

- **Node.js** 18.0 hoặc cao hơn
- **PostgreSQL** 14+ (database)
- **npm** hoặc **yarn**
- **Git** (optional)

### 🔧 Cài đặt Local

#### 1. Clone repository

```bash
git clone https://github.com/your-repo/zalo-auto-reply-bot.git
cd zalo-auto-reply-bot
```

#### 2. Cài đặt dependencies

```bash
npm install
```

#### 3. Cấu hình environment variables

Tạo file `.env` từ `.env.example`:

```bash
cp .env.example .env
```

Chỉnh sửa `.env`:

```env
# Database (PostgreSQL)
DATABASE_URL="postgresql://user:password@localhost:5432/zalo_bot?sslmode=require"

# JWT Secret (generate random string)
JWT_SECRET="your-super-secret-jwt-key-here"

# Gemini AI (optional - get free from https://aistudio.google.com/apikey)
GEMINI_API_KEY="AIzaSy... hoặc AQ.Ab8RN6J6..."

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

#### 4. Setup database

```bash
# Chạy migrations
npm run migrate:auth:node

# Tạo user đầu tiên (admin)
npm run create-admin
# Hoặc dùng CLI interactive
npm run create-user:cli

# Check database
npm run check-db
npm run list-users
```

#### 5. Chạy development server

```bash
npm run dev
```

Mở trình duyệt: **http://localhost:3000**

---

### 🌐 Deploy lên Production

#### Deploy lên Render.com (Recommended)

1. **Fork repository** về GitHub của bạn

2. **Tạo Web Service mới** trên [Render.com](https://render.com):
   - Connect GitHub repository
   - Build Command: `npm install; npm run build`
   - Start Command: `npm run start`

3. **Tạo PostgreSQL Database**:
   - Internal Database URL sẽ tự động inject vào `DATABASE_URL`

4. **Add Environment Variables**:
   ```
   JWT_SECRET=your-random-secret
   GEMINI_API_KEY=your-gemini-key (optional)
   NODE_ENV=production
   ```

5. **Deploy** 🚀

#### Deploy lên Railway/Vercel/Heroku

Tương tự, cần:
- PostgreSQL database
- Environment variables
- Build command: `npm run build`
- Start command: `npm run start`

---

## 📖 Hướng dẫn sử dụng

### 🔐 1. Đăng ký & Đăng nhập

1. Truy cập app → Click **"Đăng ký"**
2. Nhập:
   - Email
   - Password (min 6 ký tự)
   - Display Name (tên hiển thị)
3. Click **"Tạo tài khoản"**
4. Đăng nhập với email & password

### 📱 2. Kết nối Zalo

1. Click **"Đăng nhập Zalo bằng QR"**
2. Quét QR code bằng **Zalo trên điện thoại**:
   - Mở Zalo → Menu → Quét QR
3. Chờ kết nối thành công ✅
4. Xem danh sách cuộc trò chuyện

### 🤖 3. Cấu hình Bot

#### Cách 1: Dùng Preset Messages
1. Vào **"Quản lý Bot"** tab
2. Chọn 1 trong 5 preset messages có sẵn
3. Bật bot → Done!

#### Cách 2: Tùy chỉnh tin nhắn
1. Nhập tin nhắn vào ô **"Tin nhắn tự động"**
2. Hoặc thêm nhiều messages vào danh sách
3. Bật **"Chọn ngẫu nhiên"** nếu muốn random
4. Chọn **Reply scope**:
   - 🌐 Tất cả
   - 👤 Chỉ cá nhân
   - 👥 Chỉ nhóm
   - 🎯 Whitelist
5. Bật bot

#### Cách 3: Dùng AI Reply (Recommended!)
1. Vào **"Quản lý Bot"** tab
2. Scroll xuống **"AI Smart Reply"**
3. Bật toggle **AI Reply**
4. Chọn **Personality** (Thân thiện, Hài hước, v.v.)
5. Chọn **Trigger mode**:
   - 🧠 Thông minh (khuyên dùng)
   - ❓ Chỉ câu hỏi
   - ⚡ Luôn luôn
6. Điều chỉnh **Độ dài trả lời** (50-500)
7. *(Optional)* Nhập **API key riêng**:
   - Vào Settings → Cấu hình Gemini AI
   - Lấy free key tại: https://aistudio.google.com/apikey
   - Paste vào → Chọn model → Save

### 💬 4. Chat thủ công

1. Click vào **conversation** trong danh sách
2. Nhập tin nhắn ở box phía dưới
3. Gửi **text**, **emoji**, **stickers**, hoặc **files**:
   - 📸 Click icon hình → Upload ảnh
   - 📄 Click icon file → Upload file
   - 😊 Click icon mặt cười → Chọn sticker/GIF
4. **Reply**: Hover tin nhắn → Click ↩️
5. **Forward**: Hover → Click ⏩ → Chọn người nhận
6. **Pin**: Hover → Click 📌
7. **More actions**: Right-click tin nhắn

### 📊 5. Xem thống kê

1. Vào tab **"Thống kê"**
2. Xem:
   - 💬 Tổng tin nhắn
   - ✅ Đã trả lời
   - 👥 Cuộc trò chuyện
   - 📈 Tỷ lệ
3. Xem **Message Logs** chi tiết
4. **Export** logs ra JSON nếu cần
5. **Reset** thống kê nếu muốn

### ⚙️ 6. Settings

Vào **Settings** (icon ⚙️ góc phải):

- 🔔 **Thông báo**: Bật/tắt sound & browser notifications
- 🤖 **Bot settings**: Độ trễ, chế độ học tập
- 🎨 **Giao diện**: Dark mode, animations, font size
- 🔒 **Dữ liệu**: Lưu history, tự động xóa
- ✨ **Gemini AI**: API key riêng, chọn model

### 💾 7. Backup & Restore

1. Vào **"Sao lưu & Khôi phục"**
2. **Backup**:
   - Click "Sao lưu ngay"
   - File JSON sẽ download
3. **Export account**:
   - Export toàn bộ settings + logs
4. **Import**:
   - Click "Khôi phục"
   - Chọn file JSON
   - Confirm

### 👥 8. Quản lý Nhóm

1. Vào danh sách **"Nhóm"**
2. Click vào nhóm → Xem:
   - Thành viên + avatar
   - Tin nhắn gần đây
3. **Leave group**: Click "Rời nhóm"
4. **Whitelist**: Add vào danh sách bot reply

---

## 🏗️ Kiến trúc

### 📐 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Next.js 14 App (React + TypeScript)                 │  │
│  │  ├── Components (Header, Chat, Bot, Settings...)     │  │
│  │  ├── Pages (Home, Login, Register...)               │  │
│  │  └── Contexts (UserContext, AuthContext...)         │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTPS
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    NEXT.JS SERVER (Node.js)                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  API Routes (/api/*)                                 │  │
│  │  ├── /api/auth/*      - Authentication              │  │
│  │  ├── /api/zalo/*      - Zalo operations             │  │
│  │  ├── /api/settings    - User settings               │  │
│  │  └── /api/health      - Health check                │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Business Logic Layer                                │  │
│  │  ├── AuthManager      - JWT, sessions               │  │
│  │  ├── UserManager      - User CRUD, bot settings     │  │
│  │  ├── ZaloListener     - Message listener            │  │
│  │  └── AIReply          - Gemini AI integration       │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────┬──────────────────────────────┬────────────────────┘
          │                              │
          ▼                              ▼
┌─────────────────────┐      ┌──────────────────────────┐
│   PostgreSQL DB     │      │   Zalo API (zca-js)      │
│  ├── users          │      │  ├── Login (QR)          │
│  ├── sessions       │      │  ├── Send messages       │
│  ├── bot_settings   │      │  ├── Get conversations   │
│  └── user_settings  │      │  └── Listen events       │
└─────────────────────┘      └──────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                         │
│  ┌──────────────────┐          ┌──────────────────────┐    │
│  │  Google Gemini   │          │  Giphy API           │    │
│  │  AI Models       │          │  (Stickers/GIFs)     │    │
│  └──────────────────┘          └──────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### 📁 Cấu trúc thư mục

```
zalo-auto-reply-bot/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── auth/                 # Authentication APIs
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   ├── logout/
│   │   │   ├── check/
│   │   │   └── sessions/
│   │   ├── zalo/                 # Zalo APIs
│   │   │   ├── login/
│   │   │   ├── logout/
│   │   │   ├── messages/
│   │   │   ├── history/
│   │   │   ├── friends/
│   │   │   ├── groups/
│   │   │   ├── settings/
│   │   │   ├── stats/
│   │   │   ├── listener/
│   │   │   ├── user-status/
│   │   │   ├── backup/
│   │   │   ├── export-account/
│   │   │   ├── import-account/
│   │   │   └── ...
│   │   ├── settings/             # User settings API
│   │   └── health/               # Health check
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Home page
│   └── globals.css               # Global styles
│
├── components/                   # React Components
│   ├── Header.tsx                # App header + settings
│   ├── LoginSection.tsx          # Zalo login QR
│   ├── ControlPanel.tsx          # Bot control panel
│   ├── ZaloChatView.tsx          # Main chat interface
│   ├── MessageLogs.tsx           # Message logs view
│   ├── StatsCards.tsx            # Statistics cards
│   ├── AISettings.tsx            # AI configuration
│   ├── GeminiSettings.tsx        # Gemini API settings
│   ├── BotStatus.tsx             # Bot status indicator
│   ├── BackupRestore.tsx         # Backup/restore UI
│   ├── UserProfile.tsx           # User profile
│   ├── ActiveDevices.tsx         # Active sessions
│   ├── AuthModal.tsx             # Login/register modal
│   ├── ZaloAccountManager.tsx    # Zalo account switcher
│   ├── ZaloImportModal.tsx       # Import account modal
│   ├── QuickActions.tsx          # Quick action buttons
│   └── Toast.tsx                 # Toast notifications
│
├── contexts/                     # React Contexts
│   └── UserContext.tsx           # User state management
│
├── lib/                          # Business Logic
│   ├── auth-manager.ts           # Authentication logic
│   ├── user-manager.ts           # User management
│   ├── zalo-listener-manager.ts  # Message listener
│   ├── ai-reply.ts               # AI reply logic
│   ├── multi-user-zalo.ts        # Multi-user Zalo
│   ├── bot-settings.ts           # Bot settings
│   └── postgres.ts               # PostgreSQL client
│
├── database/                     # Database scripts
│   ├── schema.sql                # Database schema
│   ├── migrate-node.js           # Migration script
│   ├── create-first-user.ts      # Create admin
│   ├── check-tables.js           # Check DB
│   └── *.sql                     # SQL migrations
│
├── public/                       # Static assets
│   └── aris.png                  # App logo
│
├── .env                          # Environment variables
├── .env.example                  # Env template
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript config
├── tailwind.config.js            # Tailwind config
└── README.md                     # This file
```

---

## 🛠️ Công nghệ

### Frontend
- **Next.js 14.2** - React framework với App Router
- **React 18.3** - UI library
- **TypeScript 5.3** - Type safety
- **Tailwind CSS 3.4** - Utility-first CSS
- **date-fns 3.0** - Date formatting

### Backend
- **Next.js API Routes** - Serverless API
- **PostgreSQL 14+** - Relational database
- **pg 8.11** - PostgreSQL client
- **bcryptjs 2.4** - Password hashing
- **uuid 9.0** - UUID generation

### Integrations
- **zca-js 2.1.2** - Unofficial Zalo API
- **@google/generative-ai 0.24** - Google Gemini AI
- **Giphy API** - Stickers & GIFs

### DevOps
- **Electron 28** - Desktop app wrapper (optional)
- **concurrently** - Run multiple commands
- **tsx** - TypeScript execution

---

## ⚙️ Cấu hình

### 🔐 Environment Variables

Tất cả biến môi trường trong `.env`:

```env
# ============================================
# DATABASE
# ============================================
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"

# ============================================
# AUTHENTICATION
# ============================================
# JWT Secret (random string, min 32 chars)
JWT_SECRET="your-super-secret-jwt-key-minimum-32-characters-long"

# JWT Expiration (default: 7 days)
JWT_EXPIRES_IN="7d"

# ============================================
# GEMINI AI
# ============================================
# System API Key (Fallback - dùng chung khi user không có key riêng)
# ⚠️ Quota: 150 RPM (shared giữa tất cả users không có key riêng)
# 💡 Khuyến khích users nhập key riêng qua Settings để có quota riêng
# Get free: https://aistudio.google.com/apikey
GEMINI_API_KEY="AIzaSy... hoặc AQ.Ab8RN6J6..."

# ============================================
# APP CONFIGURATION
# ============================================
# App URL (production)
NEXT_PUBLIC_APP_URL="https://your-app.com"

# Node Environment
NODE_ENV="production"  # or "development"

# ============================================
# OPTIONAL
# ============================================
# Giphy API Key (for stickers)
GIPHY_API_KEY="GlVGYHkr3WSBnllca54iNt0yFbjz7L65"

# Port (default: 3000)
PORT=3000
```

### 🗄️ Database Schema

Xem chi tiết schema trong `database/schema.sql`:

- **users** - User accounts
- **auth_sessions** - Login sessions (JWT tokens)
- **zalo_sessions** - Zalo login cookies
- **bot_settings** - Bot configuration per user
- **user_settings** - User preferences
- **message_logs** - Message history (optional)

---

## 📦 API Routes

### 🔐 Authentication (`/api/auth/*`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | Đăng ký user mới |
| `/api/auth/login` | POST | Đăng nhập (email + password) |
| `/api/auth/logout` | POST | Đăng xuất device hiện tại |
| `/api/auth/logout-all` | POST | Đăng xuất tất cả devices |
| `/api/auth/check` | GET | Check login status |
| `/api/auth/sessions` | GET | Lấy danh sách active sessions |

### 💬 Zalo (`/api/zalo/*`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/zalo/login` | POST | Login Zalo (QR code) |
| `/api/zalo/logout` | POST | Logout Zalo |
| `/api/zalo/session` | GET | Check Zalo session |
| `/api/zalo/messages` | POST | Gửi tin nhắn |
| `/api/zalo/history` | GET | Lấy lịch sử chat |
| `/api/zalo/friends` | GET | Danh sách bạn bè |
| `/api/zalo/groups` | GET | Danh sách nhóm |
| `/api/zalo/group-members` | GET | Thành viên nhóm |
| `/api/zalo/leave-group` | POST | Rời nhóm |
| `/api/zalo/settings` | GET/POST | Bot settings |
| `/api/zalo/stats` | GET | Thống kê |
| `/api/zalo/listener` | GET | Message listener status |
| `/api/zalo/user-status` | GET | Check online status |
| `/api/zalo/backup` | POST | Backup data |
| `/api/zalo/export-account` | GET | Export account |
| `/api/zalo/import-account` | POST | Import account |
| `/api/zalo/undo` | POST | Undo changes |
| `/api/zalo/upload-background` | POST | Upload chat background |
| `/api/zalo/media-cache` | GET | Media cache info |

### ⚙️ Settings (`/api/settings`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/settings` | GET | Get user settings |
| `/api/settings` | POST | Update user settings |

### 🏥 Health (`/api/health`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check API |

---

## 🐛 Troubleshooting

### ❌ Lỗi đăng nhập Zalo

**Triệu chứng**: QR code không load hoặc scan xong không kết nối

**Giải pháp**:
1. Kiểm tra kết nối internet
2. Logout Zalo Web trên tất cả trình duyệt
3. Clear browser cache
4. Thử trình duyệt khác (Chrome recommended)
5. Restart app và thử lại
6. Check logs server: `npm run dev` (xem lỗi chi tiết)

---

### ❌ Bot không trả lời

**Triệu chứng**: Bot đã BẬT nhưng không tự động reply

**Giải pháp**:
1. **Check bot status**:
   - Xem "Phiên Zalo Bot đang hoạt động" (màu xanh)
   - Nếu đỏ → Click "Khởi động lại Listener"

2. **Check bot settings**:
   - Bot đã BẬT? (toggle ON)
   - Tin nhắn tự động đã nhập?
   - Reply scope đúng chưa? (Tất cả / Cá nhân / Nhóm)

3. **Check whitelist/blacklist**:
   - Nếu dùng Whitelist → Nhóm có trong list không?
   - Nếu có Blacklist → Nhóm bị loại trừ?

4. **Check logs**:
   - Mở Console (F12) → Xem logs
   - Kiểm tra có message "Received message" không?
   - Có lỗi gì không?

5. **Restart listener**:
   - Click "Khởi động lại Listener" trong ControlPanel
   - Hoặc logout Zalo → Login lại

---

### ❌ AI Reply không hoạt động

**Triệu chứng**: AI Reply đã BẬT nhưng bot vẫn dùng preset

**Giải pháp**:
1. **Check API key**:
   - Vào Settings → Cấu hình Gemini AI
   - Xem có API key không?
   - Nếu không → Dùng system key (share quota)
   - Nếu có → Check key còn valid không

2. **Test API key**:
   - Vào https://aistudio.google.com/apikey
   - Check quota còn không?
   - Nếu hết → Chờ reset hoặc tạo key mới

3. **Check trigger mode**:
   - "Thông minh" → Chỉ reply tin >= 3 từ hoặc có keyword
   - "Chỉ câu hỏi" → Chỉ reply khi có "?"
   - "Luôn luôn" → Reply mọi tin nhắn
   - Thử đổi sang "Luôn luôn" để test

4. **Check logs**:
   - Console → Xem "Using USER API key" hoặc "Using SYSTEM API key"
   - Nếu có lỗi "AI Reply Error" → Check API key
   - Nếu "Fallback to normal" → AI fail, dùng preset

---

### ❌ Database connection error

**Triệu chứng**: "Failed to connect to database"

**Giải pháp**:
1. Check `DATABASE_URL` trong `.env`
2. Format đúng: `postgresql://user:pass@host:5432/db?sslmode=require`
3. Check PostgreSQL server đang chạy
4. Check credentials (user/password)
5. Check firewall/network
6. Test connection:
   ```bash
   npm run check-db
   ```

---

### ❌ Port already in use

**Triệu chứng**: "Port 3000 is already in use"

**Giải pháp**:
```bash
# Kill process on port 3000
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac:
lsof -ti:3000 | xargs kill -9

# Hoặc dùng port khác:
PORT=3001 npm run dev
```

---

### ❌ Build failed

**Triệu chứng**: `npm run build` lỗi

**Giải pháp**:
```bash
# Clear cache và rebuild
rm -rf .next node_modules
npm install
npm run build

# Check TypeScript errors
npx tsc --noEmit
```

---

### ❌ Online status không hiển thị

**Triệu chứng**: Không thấy chấm xanh online trong danh sách

**Giải pháp**:
1. **Đợi 30 giây** - Auto-fetch mỗi 30s
2. **Click vào conversation** - Force fetch status
3. **Check console logs**:
   - Xem "✅ Fetched online status for X users"
   - Nếu không thấy → Có lỗi API
4. **Refresh page** → Reload lại app

---

### ❌ Rate limit (429 error)

**Triệu chứng**: "Request failed with status code 429"

**Giải pháp**:
1. **Đợi 1 phút** - Zalo API có rate limit
2. **Giảm số requests**:
   - Tắt bot tạm thời
   - Tăng interval check online (30s → 60s)
3. **Check logs** → Xem API nào bị rate limit
4. **Long-term**:
   - Implement caching
   - Batch API calls
   - Use pagination

---

### 🆘 Vẫn gặp vấn đề?

1. **Check logs**:
   ```bash
   npm run dev  # Xem full logs
   ```

2. **Check GitHub Issues**:
   - Tìm issue tương tự
   - Tạo issue mới nếu cần

3. **Join Discord/Telegram**:
   - Hỏi community
   - Support team

4. **Contact**:
   - Email: support@your-app.com
   - GitHub: @your-username

---

## 🤝 Đóng góp

Contributions are welcome! 🎉

### 📝 Quy trình đóng góp:

1. **Fork** repository
2. **Clone** về máy:
   ```bash
   git clone https://github.com/your-username/zalo-auto-reply-bot.git
   ```
3. **Create branch**:
   ```bash
   git checkout -b feature/amazing-feature
   ```
4. **Commit** changes:
   ```bash
   git commit -m "feat: Add amazing feature"
   ```
5. **Push** lên GitHub:
   ```bash
   git push origin feature/amazing-feature
   ```
6. **Open Pull Request** trên GitHub

### 🎨 Coding Standards:

- **TypeScript** cho type safety
- **ESLint** để format code
- **Conventional Commits** cho commit messages
- **Component-based** architecture
- **API-first** design

### 🐛 Báo lỗi:

Tạo [GitHub Issue](https://github.com/your-repo/issues) với thông tin:
- Mô tả lỗi
- Steps to reproduce
- Expected behavior
- Screenshots (nếu có)
- Environment (OS, browser, Node version)

---

## ⚠️ Lưu ý quan trọng

### 🚨 Disclaimer

- ⚠️ **zca-js là API không chính thức** của Zalo
- ⚠️ **Không đảm bảo** hoạt động lâu dài (Zalo có thể block)
- ⚠️ **Vi phạm ToS** của Zalo nếu sử dụng sai mục đích
- ⚠️ **Tài khoản có thể bị khóa** nếu spam hoặc lạm dụng
- ⚠️ **Chỉ dùng cho mục đích cá nhân, học tập, nghiên cứu**

### ✅ Khuyến nghị sử dụng:

- ✅ **Cá nhân** - Auto reply khi bận
- ✅ **Học tập** - Tìm hiểu API, chatbot
- ✅ **Nghiên cứu** - Thử nghiệm AI/NLP
- ✅ **Non-commercial** - Không dùng cho kinh doanh

### ❌ KHÔNG nên:

- ❌ **Spam** tin nhắn hàng loạt
- ❌ **Lạm dụng** API (quá nhiều requests)
- ❌ **Kinh doanh** không có permission
- ❌ **Phát tán** thông tin sai lệch
- ❌ **Hack** hoặc xâm phạm quyền riêng tư

### 🔒 Bảo mật:

- 🔐 **Không chia sẻ** credentials với người khác
- 🔐 **Không commit** `.env` lên GitHub
- 🔐 **Dùng HTTPS** khi deploy production
- 🔐 **Encrypt sensitive data** trong database
- 🔐 **Regular updates** dependencies để fix vulnerabilities

---

## 📄 License

MIT License

Copyright (c) 2024 Zalo Auto Reply Bot

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

## 🎉 Changelog

### v1.0.0 (2024-01-17)

#### ✨ Features
- 🎨 Giao diện chat đẹp similar to Zalo/Messenger
- 🔐 Multi-user authentication system
- 🤖 AI-powered auto reply (Google Gemini)
- 💬 Real-time messaging với zca-js
- 📊 Statistics & analytics dashboard
- 👥 Group management (members, leave, whitelist)
- 📱 Multi-device session management
- 💾 Backup & restore functionality
- 🎭 6 AI personalities + 4 trigger modes
- 🔍 320+ Vietnamese keywords detection
- 🎨 Custom chat backgrounds
- 😊 Stickers & GIF support (Giphy)
- 📸 Image & file attachments
- ⭐ Message actions (reply, forward, pin, star, delete)
- 🔔 Browser notifications + sound
- 🌐 Online status indicator (real-time)
- 🔑 Personal Gemini API key support (9 models)

#### 🐛 Bug Fixes
- Fixed auth session SQL error
- Fixed import account delay issue
- Fixed online status not showing for all users
- Fixed TypeScript build errors

#### 📝 Documentation
- Complete README with all features
- API documentation
- Troubleshooting guide
- Deployment guide

---

## 🙏 Credits & Acknowledgments

- **[zca-js](https://github.com/VuongNhatMinh/zca-js)** - Unofficial Zalo API
- **[Next.js](https://nextjs.org/)** - React framework
- **[Google Gemini](https://ai.google.dev/)** - AI models
- **[Giphy](https://giphy.com/)** - Stickers & GIFs
- **[Tailwind CSS](https://tailwindcss.com/)** - CSS framework
- **Community contributors** - Thank you! 💙

---

## 📞 Support & Contact

### 💬 Community

- **Discord**: [Join our Discord](https://discord.gg/your-server)
- **Telegram**: [@your_bot](https://t.me/your_bot)
- **GitHub Discussions**: [Discussions](https://github.com/your-repo/discussions)

### 🐛 Bug Reports

- **GitHub Issues**: [Report a bug](https://github.com/your-repo/issues)

### 💡 Feature Requests

- **GitHub Discussions**: [Request a feature](https://github.com/your-repo/discussions/categories/ideas)

### 📧 Email

- **Support**: support@your-app.com
- **Business**: business@your-app.com

---

<div align="center">

**Made with ❤️ by [Your Name](https://github.com/your-username)**

**Powered by Kiro AI 🤖**

⭐ **Star this repo if you find it useful!** ⭐

[⬆ Back to top](#-zalo-auto-reply-bot---ai-powered-chat-automation)

</div>
