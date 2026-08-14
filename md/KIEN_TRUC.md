# 🏗️ KIẾN TRÚC ZALO AUTO REPLY BOT

## 📐 TỔNG QUAN KIẾN TRÚC:

```
┌─────────────────────────────────────────────────────────────┐
│                      ZALO AUTO REPLY BOT                    │
│                     (Next.js 14 + Electron)                 │
└─────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                │                           │
        ┌───────▼───────┐           ┌──────▼──────┐
        │   FRONTEND    │           │   BACKEND   │
        │  (React UI)   │◄─────────►│ (API Routes)│
        └───────┬───────┘           └──────┬──────┘
                │                           │
                │                           │
        ┌───────▼───────────────────────────▼──────┐
        │         GLOBAL SINGLETON INSTANCE         │
        │        (lib/zalo-instance.ts) ⭐          │
        │    globalThis.__zaloApiInstance__         │
        └───────────────────┬───────────────────────┘
                            │
                    ┌───────▼───────┐
                    │   zca-js API  │
                    │   (v2.1.2)    │
                    └───────┬───────┘
                            │
                    ┌───────▼───────┐
                    │  ZALO SERVER  │
                    │   (Official)  │
                    └───────────────┘
```

---

## 🎨 FRONTEND (React + Tailwind):

```
app/page.tsx (Main App)
    │
    ├─► components/Header.tsx
    │   └─► [Logo Aris] + User Info + Logout
    │
    ├─► components/LoginSection.tsx
    │   └─► [Logo Aris] + QR Code Display + Status
    │
    ├─► components/UserProfile.tsx
    │   └─► Editable User Name + Avatar
    │
    ├─► components/BotStatus.tsx
    │   └─► 🟢 Connection Status + 🟢 Listener Status
    │
    ├─► components/ControlPanel.tsx
    │   └─► Toggle Bot + Auto-reply Message Input
    │
    ├─► components/StatsCards.tsx
    │   └─► 📊 Messages Received/Sent/Uptime
    │
    ├─► components/MessageLogs.tsx
    │   └─► 📨 Real-time Message History (SSE)
    │
    └─► components/QuickActions.tsx
        └─► 🔄 Reload + 📋 Clear Logs + ⚙️ Settings
```

---

## 🔌 BACKEND (API Routes):

```
app/api/zalo/
    │
    ├─► login/route.ts
    │   ├─ POST: Generate QR & Login
    │   ├─ GET: Check login status
    │   └─► setZaloApi(zaloApi) ⭐
    │
    ├─► listener/route.ts  ⭐ (FIX 401!)
    │   ├─ POST: Start/Stop listener
    │   ├─ GET: SSE stream for messages
    │   └─► getZaloApi() ⭐
    │
    ├─► messages/route.ts
    │   ├─ POST: Send message
    │   └─► getZaloApi()
    │
    ├─► logout/route.ts
    │   ├─ POST: Logout
    │   └─► clearZaloApi()
    │
    ├─► session/route.ts
    │   └─ GET: Check session
    │
    ├─► groups/route.ts
    │   └─ GET: Get groups list
    │
    ├─► settings/route.ts
    │   ├─ GET: Get bot settings
    │   └─ POST: Update bot settings
    │
    └─► stats/route.ts
        └─ GET: Get bot statistics
```

---

## ⚡ GLOBAL SINGLETON (FIX 401):

```typescript
// lib/zalo-instance.ts ⭐

declare global {
  var __zaloApiInstance__: any    // Shared across all routes
  var __zaloUserInfo__: any
}

┌────────────────────────────────────────┐
│   setZaloApi(api)                      │
│   ├─ Save to globalThis               │
│   └─ Attach listener                  │
└────────────────────────────────────────┘
              │
              ▼
┌────────────────────────────────────────┐
│   globalThis.__zaloApiInstance__       │
│   (Accessible from ALL API routes!)    │
└────────────────────────────────────────┘
              │
              ▼
┌────────────────────────────────────────┐
│   getZaloApi()                         │
│   └─ Return from globalThis           │
└────────────────────────────────────────┘
```

### **Tại sao cần Global Singleton?**

❌ **Trước (KHÔNG hoạt động):**
```typescript
// login/route.ts
export let zaloApi = null

// listener/route.ts
import { zaloApi } from '../login/route'
// → zaloApi = null (not shared!)
```

✅ **Sau (Hoạt động):**
```typescript
// login/route.ts
setZaloApi(zaloApi)  // Save to globalThis

// listener/route.ts
const api = getZaloApi()  // Get from globalThis
// → api = zaloApi ✅ (shared!)
```

---

## 📡 DATA FLOW:

### **1. Login Flow:**
```
User Click "Đăng nhập"
    │
    ├─► Frontend: POST /api/zalo/login
    │       │
    │       ├─► Backend: zalo.loginQR()
    │       │       │
    │       │       ├─► Generate QR Code
    │       │       │
    │       │       ├─► User scans on phone
    │       │       │
    │       │       └─► Confirm on phone
    │       │
    │       ├─► setZaloApi(zaloApi) ⭐
    │       │       │
    │       │       └─► globalThis.__zaloApiInstance__ = zaloApi
    │       │
    │       └─► Return: { success: true, userInfo }
    │
    └─► Frontend: Show Dashboard
```

### **2. Message Listener Flow:**
```
Bot Status: ON
    │
    ├─► Frontend: POST /api/zalo/listener { action: 'start' }
    │       │
    │       ├─► Backend: getZaloApi() ⭐
    │       │       │
    │       │       └─► Get from globalThis ✅
    │       │
    │       ├─► Attach listener
    │       │
    │       └─► Return: 200 (not 401!) ✅
    │
    ├─► Frontend: GET /api/zalo/listener (SSE)
    │       │
    │       └─► Keep connection open
    │
    └─► When message arrives:
            │
            ├─► zaloApi.listener.on('message', ...)
            │       │
            │       ├─► Check if bot enabled
            │       │
            │       ├─► Send auto-reply
            │       │
            │       └─► Push to SSE stream
            │
            └─► Frontend: Update MessageLogs
```

### **3. Auto Reply Flow:**
```
New message from user
    │
    ├─► Listener receives: { from, message, data }
    │
    ├─► Check: Is bot enabled?
    │       │
    │       ├─ YES ─► Continue
    │       │
    │       └─ NO ──► Ignore
    │
    ├─► Get auto-reply message from settings
    │
    ├─► zaloApi.sendMessage(from, autoReplyMsg)
    │       │
    │       └─► POST to Zalo API
    │
    ├─► Update statistics
    │
    └─► Send to SSE clients (update UI)
```

---

## 🗂️ STATE MANAGEMENT:

```
┌─────────────────────────────────────────┐
│         CLIENT STATE (React)            │
├─────────────────────────────────────────┤
│ - isLoggedIn: boolean                   │
│ - userInfo: { name, phone, avatar }     │
│ - qrState: { status, qrImage, error }   │
│ - botEnabled: boolean                   │
│ - autoReplyMsg: string                  │
│ - messages: Message[]                   │
│ - stats: { received, sent, uptime }     │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│      SERVER STATE (Global Singleton)    │
├─────────────────────────────────────────┤
│ - globalThis.__zaloApiInstance__  ⭐    │
│ - globalThis.__zaloUserInfo__           │
│ - messageQueue: Message[]               │
│ - sseClients: Client[]                  │
│ - botSettings: { enabled, message }     │
│ - botStats: { received, sent, start }   │
└─────────────────────────────────────────┘
```

---

## 🔄 REAL-TIME UPDATES (SSE):

```
Browser                    Server
   │                          │
   ├─► GET /api/zalo/listener │
   │   (EventSource)          │
   │                          │
   │   ◄────────────────────┐ │
   │   data: {"type":"connected"}
   │                          │
   │   (Keep connection open) │
   │   ◄────────────────────┐ │
   │   : keepalive           │
   │   (every 15s)           │
   │                          │
   │   ◄────────────────────┐ │
   │   data: {"from":"...", "message":"..."}
   │   (when message arrives)
   │                          │
   ├─► Update UI             │
   │                          │
```

---

## 🎯 KEY COMPONENTS:

### **1. lib/zalo-instance.ts** ⭐⭐⭐
**QUAN TRỌNG NHẤT - FIX LỖI 401!**
```typescript
- setZaloApi(api)      → Save to global
- getZaloApi()         → Get from global
- clearZaloApi()       → Clear global
- setZaloUserInfo()    → Save user info
- getZaloUserInfo()    → Get user info
```

### **2. lib/zalo-listener-manager.ts**
```typescript
- attachListenerToApi(api)  → Setup message listener
- messageQueue              → Store messages
- sseClients                → Connected SSE clients
```

### **3. lib/qr-state.ts**
```typescript
- getQrState()      → Get current QR state
- updateQrState()   → Update QR state
- resetQrState()    → Reset to idle
```

### **4. lib/bot-settings.ts**
```typescript
- getBotSettings()     → Get bot config
- updateBotSettings()  → Update config
- isBotEnabled()       → Check if bot ON
- getAutoReplyMsg()    → Get reply message
```

### **5. lib/bot-stats.ts**
```typescript
- getBotStats()           → Get statistics
- incrementReceived()     → +1 received
- incrementSent()         → +1 sent
- getUptime()             → Calculate uptime
```

---

## 🔐 SESSION PERSISTENCE:

```
┌────────────────────────────────────────┐
│   First Login (QR)                     │
│   ├─ zalo.loginQR()                    │
│   ├─ setZaloApi(zaloApi)               │
│   └─ Save to .zalo-session.json        │
└────────────────────────────────────────┘
              │
              ▼
┌────────────────────────────────────────┐
│   F5 / Reload (Auto-login)             │
│   ├─ Read .zalo-session.json           │
│   ├─ zalo.login(credentials)           │
│   └─ setZaloApi(zaloApi)               │
└────────────────────────────────────────┘
              │
              ▼
┌────────────────────────────────────────┐
│   Restart Server (Re-login required)   │
│   ├─ globalThis cleared                │
│   ├─ Need QR scan again                │
│   └─ New session                       │
└────────────────────────────────────────┘
```

---

## 🌐 ELECTRON INTEGRATION:

```
┌─────────────────────────────────────────┐
│         ELECTRON MAIN PROCESS           │
│         (electron/main.js)              │
├─────────────────────────────────────────┤
│ - Create BrowserWindow                  │
│ - Set icon: aris.png ⭐                 │
│ - Load URL: http://localhost:3000      │
│ - Enable DevTools (dev mode)           │
│ - Handle IPC (minimize/maximize/close)  │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│      ELECTRON RENDERER PROCESS          │
│        (Next.js App in Browser)         │
├─────────────────────────────────────────┤
│ - Full Next.js App                      │
│ - All React Components                  │
│ - API Routes                            │
│ - Tailwind CSS                          │
└─────────────────────────────────────────┘
```

---

## 📊 TECHNOLOGY STACK:

```
┌───────────────────────────────────────┐
│ Frontend Framework                    │
│ ├─ Next.js 14 (App Router)            │
│ ├─ React 18                           │
│ └─ TypeScript 5                       │
├───────────────────────────────────────┤
│ Styling                               │
│ ├─ Tailwind CSS 3                     │
│ └─ CSS Custom Properties              │
├───────────────────────────────────────┤
│ Backend                               │
│ ├─ Next.js API Routes                 │
│ ├─ Server-Sent Events (SSE)           │
│ └─ Node.js Runtime                    │
├───────────────────────────────────────┤
│ Zalo Integration                      │
│ └─ zca-js v2.1.2 (Unofficial)         │
├───────────────────────────────────────┤
│ Desktop                               │
│ └─ Electron 28                        │
├───────────────────────────────────────┤
│ State Management                      │
│ ├─ React useState/useEffect           │
│ └─ Global Singleton (Server) ⭐       │
└───────────────────────────────────────┘
```

---

## 🎨 LOGO INTEGRATION:

```
public/aris.png
    │
    ├─► app/layout.tsx
    │   └─► <link icon="/aris.png" />  (Favicon)
    │
    ├─► components/Header.tsx
    │   └─► <img src="/aris.png" />  (48px × 48px)
    │
    ├─► components/LoginSection.tsx
    │   └─► <img src="/aris.png" />  (80px × 80px)
    │
    ├─► electron/main.js
    │   └─► icon: 'public/aris.png'  (Window icon)
    │
    └─► package.json (build config)
        └─► win.icon: 'public/aris.png'  (App icon)
```

---

## 🔍 DEBUG FLOW:

```
User reports: "Bot không trả lời"
    │
    ├─► Check Terminal
    │   ├─ ✅ POST /api/zalo/login 200
    │   ├─ ❌ POST /api/zalo/listener 401  ← PROBLEM!
    │   └─► Root cause: zaloApi is null
    │
    ├─► Check Code
    │   ├─ ❌ export/import pattern fails
    │   └─► Solution: Global singleton
    │
    ├─► Implement Fix
    │   ├─ Create lib/zalo-instance.ts
    │   ├─ Update all routes
    │   └─ Use setZaloApi/getZaloApi
    │
    ├─► User must RESTART SERVER
    │   └─ Ctrl + C → npm run dev
    │
    └─► Test Again
        ├─ ✅ POST /api/zalo/login 200
        ├─ ✅ POST /api/zalo/listener 200  ← FIXED!
        └─► Bot works! 🎉
```

---

## 🎯 SUMMARY:

```
┌──────────────────────────────────────────────────┐
│ ARCHITECTURE HIGHLIGHTS:                         │
├──────────────────────────────────────────────────┤
│ ✅ Modern Stack (Next.js + React + TypeScript)   │
│ ✅ Separation of Concerns (Frontend/Backend)     │
│ ✅ Global Singleton Pattern (Fix 401) ⭐         │
│ ✅ Real-time Updates (SSE)                       │
│ ✅ Session Persistence (.zalo-session.json)      │
│ ✅ Desktop App (Electron)                        │
│ ✅ Custom Branding (Aris Logo)                   │
│ ✅ Clean Code (TypeScript + Comments)            │
└──────────────────────────────────────────────────┘
```

---

**KIẾN TRÚC HOÀN CHỈNH - SẴN SÀNG SỬ DỤNG!** 🚀
