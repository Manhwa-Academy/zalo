# 🖼️ Fix Avatar trong Lịch sử tin nhắn

## Vấn đề
Trong tab "Quản lý Bot" → "Lịch sử tin nhắn", avatar chỉ hiện chữ cái đầu thay vì ảnh đại diện thực.

## Nguyên nhân
1. **Tin nhắn cũ** trong file `.zalo-messages.json` không có trường `avatar`
2. **Listener** chưa fetch đầy đủ avatar từ Zalo API
3. **Avatar URL** bị lỗi hoặc không load được

## Giải pháp đã thực hiện

### 1. Cải thiện listener lấy avatar
**File: `lib/zalo-listener-manager.ts`**

```typescript
// Lấy avatar từ nhiều nguồn khác nhau
let senderAvatar = 
  message.data?.avatar || 
  message.data?.avt || 
  message.avatar || 
  message.data?.avatarUrl || 
  ''

// Nếu không có avatar, fetch từ getUserInfo API
if (!senderAvatar && typeof zaloApi.getUserInfo === 'function') {
  const uInfoRes = await zaloApi.getUserInfo(senderId)
  const uData = uInfoRes?.data || uInfoRes?.[senderId] || uInfoRes
  if (uData) {
    senderAvatar = 
      uData.avatar || 
      uData.avatarUrl || 
      uData.avt || 
      uData.avatar_240 || 
      uData.avatar_120 || 
      uData.thumb || 
      ''
  }
}
```

### 2. Cải thiện fallback avatar trong UI
**File: `components/MessageLogs.tsx`**

```typescript
{(log as any).avatar && String((log as any).avatar).trim() !== '' ? (
  <img
    src={(log as any).avatar}
    alt={(log as any).fromName || log.from}
    className="w-10 h-10 rounded-full object-cover border border-white/10 shadow-sm"
    onError={(e) => {
      // Nếu avatar lỗi, hiện chữ cái đầu
      const target = e.target as HTMLImageElement
      target.style.display = 'none'
      
      const fallback = document.createElement('div')
      fallback.className = 'w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-sm font-bold shadow-sm'
      fallback.textContent = ((log.fromName || log.from || 'U').charAt(0).toUpperCase())
      target.parentElement?.appendChild(fallback)
    }}
  />
) : (
  // Fallback mặc định nếu không có avatar
  <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-sm font-bold shadow-sm">
    {((log as any).fromName || log.from || 'U').charAt(0).toUpperCase()}
  </div>
)}
```

### 3. Debug logging
Thêm log để kiểm tra avatar có được fetch không:

```typescript
console.log('📥 [Listener] Message data prepared:', {
  fromName: messageData.fromName,
  avatar: messageData.avatar ? messageData.avatar.slice(0, 50) + '...' : 'NO AVATAR',
})
```

## Test & Verify

### Bước 1: Clear cache cũ
Xóa file cache để bắt đầu mới:

```bash
# Windows
del .zalo-messages.json

# Linux/Mac
rm .zalo-messages.json
```

### Bước 2: Khởi động lại app
```bash
npm run dev
```

### Bước 3: Gửi tin nhắn test
1. Đăng nhập Zalo
2. Gửi tin nhắn từ một tài khoản khác vào bot
3. Check console log xem có thấy avatar không:

```
📥 [Listener] Message data prepared: {
  fromName: "Hoàng Mạnh",
  avatar: "https://s120-ava-talk.zadn.vn/...",
  ...
}
```

### Bước 4: Kiểm tra UI
1. Vào tab "Quản lý Bot"
2. Xem "Lịch sử tin nhắn"
3. Avatar phải hiện ảnh thật, không phải chữ cái

### Bước 5: Test fallback
Test nếu avatar URL bị lỗi:

1. Open DevTools → Console
2. Chạy code này để test:
```javascript
// Fake message với avatar lỗi
const fakeMsg = {
  id: Date.now(),
  from: 'test_user',
  fromName: 'Test User',
  avatar: 'https://invalid-url.com/avatar.jpg', // URL lỗi
  content: 'Test message',
  timestamp: new Date().toISOString(),
  type: 'User',
  replied: false
}

// Trigger add message
window.dispatchEvent(new CustomEvent('test-message', { detail: fakeMsg }))
```

Avatar phải fallback thành chữ cái "T" (từ "Test User").

## Troubleshooting

### Avatar vẫn không hiện
**Nguyên nhân:** Tin nhắn cũ trong `.zalo-messages.json` không có avatar

**Giải pháp:**
1. Clear file cache:
```bash
del .zalo-messages.json  # Windows
rm .zalo-messages.json   # Linux/Mac
```

2. Hoặc migrate data cũ bằng script:
```javascript
// scripts/migrate-avatar.js
const fs = require('fs')

const MESSAGES_FILE = '.zalo-messages.json'

if (fs.existsSync(MESSAGES_FILE)) {
  const messages = JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf-8'))
  
  // Add default avatar placeholder for old messages
  const migrated = messages.map(msg => {
    if (!msg.avatar || msg.avatar === '') {
      return {
        ...msg,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.fromName || 'U')}&background=0D8ABC&color=fff`
      }
    }
    return msg
  })
  
  fs.writeFileSync(MESSAGES_FILE, JSON.stringify(migrated, null, 2))
  console.log(`✅ Migrated ${migrated.length} messages with avatar placeholder`)
}
```

Chạy: `node scripts/migrate-avatar.js`

### Avatar bị lỗi CORS
**Nguyên nhân:** Zalo avatar URL yêu cầu referer header

**Giải pháp:**
Thêm vào `next.config.js`:

```javascript
module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Referrer-Policy',
            value: 'no-referrer-when-downgrade',
          },
        ],
      },
    ]
  },
}
```

### Avatar load chậm
**Nguyên nhân:** getUserInfo API call mất thời gian

**Giải pháp:** Cache avatar trong memory

```typescript
// lib/avatar-cache.ts
const avatarCache = new Map<string, string>()

export function getAvatarFromCache(userId: string): string | null {
  return avatarCache.get(userId) || null
}

export function setAvatarToCache(userId: string, avatar: string): void {
  avatarCache.set(userId, avatar)
}
```

Dùng cache trước khi gọi API:

```typescript
// Check cache first
let senderAvatar = getAvatarFromCache(senderId)

if (!senderAvatar) {
  // Fetch from API
  const uInfoRes = await zaloApi.getUserInfo(senderId)
  senderAvatar = uInfoRes?.data?.avatar
  
  // Save to cache
  if (senderAvatar) {
    setAvatarToCache(senderId, senderAvatar)
  }
}
```

## Maintenance

### Xem tin nhắn có avatar
Check file `.zalo-messages.json`:

```javascript
const fs = require('fs')
const msgs = JSON.parse(fs.readFileSync('.zalo-messages.json', 'utf-8'))

const withAvatar = msgs.filter(m => m.avatar && m.avatar !== '')
const withoutAvatar = msgs.filter(m => !m.avatar || m.avatar === '')

console.log('Messages with avatar:', withAvatar.length)
console.log('Messages without avatar:', withoutAvatar.length)

// Sample
console.log('\nSample with avatar:')
console.log(withAvatar[0])
```

### Bulk update avatar cho tin nhắn cũ
Nếu có nhiều tin nhắn cũ không có avatar, có thể fetch hàng loạt:

```typescript
// Lấy danh sách unique userIds
const userIds = [...new Set(messages.map(m => m.from).filter(Boolean))]

// Batch fetch avatars
const avatars: Record<string, string> = {}
for (const userId of userIds) {
  try {
    const info = await zaloApi.getUserInfo(userId)
    avatars[userId] = info?.data?.avatar || ''
  } catch (e) {}
}

// Update messages
const updated = messages.map(m => ({
  ...m,
  avatar: avatars[m.from] || m.avatar || ''
}))

fs.writeFileSync('.zalo-messages.json', JSON.stringify(updated, null, 2))
```

## Kết quả mong đợi

✅ **Tin nhắn mới** luôn có avatar từ listener  
✅ **Avatar lỗi** tự động fallback sang chữ cái đầu  
✅ **UI đẹp** với gradient background cho fallback avatar  
✅ **Debug dễ dàng** với console log chi tiết  

## Hoàn tất! 🎉

Giờ lịch sử tin nhắn sẽ hiển thị đầy đủ avatar!
