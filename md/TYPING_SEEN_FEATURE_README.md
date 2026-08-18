# 🔔 TYPING & SEEN STATUS FEATURE

## 📋 Tổng quan (Overview)

Feature này cho phép hiển thị:
- **Typing Indicator**: Thông báo khi người khác đang nhập tin nhắn
- **Read Receipts**: Xem ai đã đọc tin nhắn (tương tự checkmarks trên Zalo/WhatsApp)

## ✅ Tính năng đã hoàn thành

### 1. Backend API (`/api/zalo/typing-seen`)

**Endpoint**: `POST /api/zalo/typing-seen`

**Actions hỗ trợ**:

#### a) `send_typing` - Gửi trạng thái đang nhập
```json
{
  "action": "send_typing",
  "threadId": "123456789",
  "threadType": "Group" // hoặc "User"
}
```

#### b) `send_seen` - Đánh dấu đã xem tin nhắn
```json
{
  "action": "send_seen",
  "messages": [
    {
      "msgId": "msg123",
      "cliMsgId": "cli456",
      "uidFrom": "sender_id",
      "idTo": "thread_id",
      "msgType": "1",
      "st": 0,
      "at": 0,
      "cmd": 501,
      "ts": "1234567890"
    }
  ],
  "threadType": "Group" // hoặc "User"
}
```

### 2. Frontend - Gửi typing indicator

**ZaloChatView.tsx** đã tích hợp:

```typescript
// Throttled typing indicator (max once per 3 seconds)
const sendTypingThrottled = useCallback(() => {
  if (typingTimeoutRef.current) return // Already scheduled
  
  sendTypingIndicator()
  typingTimeoutRef.current = setTimeout(() => {
    typingTimeoutRef.current = null
  }, 3000)
}, [sendTypingIndicator])

// Gửi khi người dùng gõ vào textarea
onChange={(e) => {
  setInputText(e.target.value)
  sendTypingThrottled() // 🔔 Gửi typing indicator
}}
```

### 3. Frontend - Auto-send seen events

**ZaloChatView.tsx** tự động gửi seen event khi:
- Chuyển đổi conversation (useEffect)
- Có tin nhắn chưa đọc từ người khác

```typescript
useEffect(() => {
  if (!activeThreadId) return
  
  const messages = historyMessages[activeThreadId] || []
  const unseenMessages = messages.filter(msg => !msg.isSelf && msg.msgId)
  
  if (unseenMessages.length > 0) {
    // Send seen event after a short delay
    const timer = setTimeout(() => {
      sendSeenEvent(unseenMessages)
    }, 1000)
    
    return () => clearTimeout(timer)
  }
}, [activeThreadId, historyMessages, sendSeenEvent])
```

### 4. Backend - Typing Event Listener

**lib/zalo-listener-manager.ts** đã thêm listener để nhận typing events:

```typescript
zaloApi.listener.on('typing', (typingData: any) => {
  console.log('⌨️ [Listener] Received typing event:', typingData)
  
  const typingEvent = {
    type: 'typing',
    threadId,
    userId,
    userName,
    isTyping,
    timestamp: Date.now(),
  }
  
  // Broadcast to all SSE clients
  sseClients.forEach((client) => {
    client.controller.enqueue(`data: ${JSON.stringify(typingEvent)}\n\n`)
  })
})
```

### 5. Backend - Seen Event Listener

**lib/zalo-listener-manager.ts** đã thêm listener để nhận seen events:

```typescript
zaloApi.listener.on('read_receipt', (seenData: any) => {
  console.log('👁️ [Listener] Received seen event:', seenData)
  
  const seenEvent = {
    type: 'seen',
    threadId,
    userId,
    userName,
    messageIds,
    timestamp: Date.now(),
  }
  
  // Broadcast to all SSE clients
  sseClients.forEach((client) => {
    client.controller.enqueue(`data: ${JSON.stringify(seenEvent)}\n\n`)
  })
})
```

### 6. Frontend SSE Handler

**app/page.tsx** xử lý typing và seen events từ SSE:

```typescript
eventSource.onmessage = (event) => {
  const message = JSON.parse(event.data)
  
  // Handle typing events
  if (message.type === 'typing') {
    handleTypingEvent(message)
    return
  }
  
  // Handle seen events
  if (message.type === 'seen') {
    handleSeenEvent(message)
    return
  }
  
  // Handle regular messages
  handleNewMessage(message)
}
```

### 7. Typing State Management

**app/page.tsx** quản lý typing state:

```typescript
const [typingUsers, setTypingUsers] = useState<Record<string, Set<string>>>({})
const typingTimeoutsRef = useRef<Record<string, NodeJS.Timeout>>({})

const handleTypingEvent = (event: any) => {
  const { threadId, userId, userName, isTyping } = event
  
  setTypingUsers((prev) => {
    const updated = { ...prev }
    
    if (isTyping) {
      // Add user to typing set
      if (!updated[threadId]) {
        updated[threadId] = new Set()
      }
      updated[threadId].add(userName)
      
      // Auto-clear after 5 seconds
      typingTimeoutsRef.current[`${threadId}_${userId}`] = setTimeout(() => {
        setTypingUsers((current) => {
          const cleared = { ...current }
          if (cleared[threadId]) {
            cleared[threadId].delete(userName)
            if (cleared[threadId].size === 0) {
              delete cleared[threadId]
            }
          }
          return cleared
        })
      }, 5000)
    } else {
      // Remove user from typing set
      if (updated[threadId]) {
        updated[threadId].delete(userName)
        if (updated[threadId].size === 0) {
          delete updated[threadId]
        }
      }
    }
    
    return updated
  })
}
```

### 8. Typing Indicator UI

**components/ZaloChatView.tsx** hiển thị typing indicator:

```tsx
{/* Typing Indicator - Show when others are typing */}
{activeThreadId && typingUsers[activeThreadId] && typingUsers[activeThreadId].size > 0 && (
  <div className="flex items-start gap-2 animate-fadeIn">
    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold border-2 border-dark-300 shadow-lg">
      ⌨️
    </div>
    <div className="flex-1">
      <div className="inline-block px-4 py-2.5 rounded-2xl bg-dark-200/90 border border-sky-500/30 shadow-lg">
        <div className="flex items-center gap-2">
          <span className="text-xs text-sky-300 font-medium">
            {Array.from(typingUsers[activeThreadId]).join(', ')}
          </span>
          <span className="text-xs text-gray-400">đang nhập</span>
          <div className="flex gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-bounce" style={{ animationDelay: '0ms' }}></span>
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-bounce" style={{ animationDelay: '150ms' }}></span>
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-bounce" style={{ animationDelay: '300ms' }}></span>
          </div>
        </div>
      </div>
    </div>
  </div>
)}
```

## 🎨 UI/UX Details

### Typing Indicator
- **Vị trí**: Hiển thị ngay trên textarea input, dưới tin nhắn cuối cùng
- **Animation**: 3 chấm nhấp nháy (bounce effect với staggered delay)
- **Màu sắc**: Sky blue gradient với border và shadow
- **Icon**: ⌨️ emoji trong avatar bubble
- **Text**: "[Tên người dùng] đang nhập"
- **Auto-clear**: Tự động ẩn sau 5 giây không có update

### Seen Receipts (TODO - Chưa hoàn thành UI)
- Single checkmark ✓: Tin nhắn đã gửi
- Double checkmark ✓✓: Tin nhắn đã được đọc
- Blue double checkmark: Tin nhắn đã được đọc (trong nhóm, hiển thị ai đã đọc)

## 🔧 Cách sử dụng

### 1. Test typing indicator
```bash
# Mở 2 tab trình duyệt
# Tab 1: Đăng nhập tài khoản A
# Tab 2: Đăng nhập tài khoản B
# Gõ tin nhắn ở Tab 1 → Tab 2 sẽ thấy "[Tên A] đang nhập"
```

### 2. Test seen receipts
```bash
# Tab 1: Gửi tin nhắn cho Tab 2
# Tab 2: Mở conversation → Tab 1 sẽ nhận seen event
# (Hiện tại chỉ log trong console, chưa có UI)
```

## 📝 TODO - Cần hoàn thiện

### 1. ✅ DONE: Typing Indicator Display
- [x] Add typing indicator UI
- [x] Handle typing events from SSE
- [x] Auto-clear typing after 5 seconds
- [x] Throttle sending typing events (max once per 3s)

### 2. ⚠️ TODO: Read Receipts UI
- [ ] Add checkmark icons to sent messages
- [ ] Single checkmark (sent) vs double checkmark (seen)
- [ ] Blue checkmarks when read
- [ ] Group chat: Show list of who read the message
- [ ] Hover to see "Đã xem lúc [time]"

### 3. ⚠️ TODO: Message Status Tracking
- [ ] Add `status` field to message objects:
  - `sending`: đang gửi
  - `sent`: đã gửi (single ✓)
  - `delivered`: đã nhận (double ✓)
  - `seen`: đã đọc (blue ✓✓)
- [ ] Update message status when receiving seen events
- [ ] Persist message status in database

### 4. ⚠️ TODO: Group Read Receipts
- [ ] Show "Đã xem bởi 3 người" below messages
- [ ] Click to expand and see list of names + avatars
- [ ] Update count when new people read

### 5. ⚠️ TODO: Settings
- [ ] Allow user to disable typing indicator
- [ ] Allow user to disable read receipts
- [ ] Privacy settings: "Don't send read receipts"

## 🐛 Known Issues

1. **Typing events from Zalo listener**: 
   - Cần kiểm tra xem zalo-js-api có emit typing events hay không
   - Có thể cần polling hoặc workaround nếu không có event
   
2. **Seen receipts chưa test thực tế**:
   - Chưa verify xem Zalo API có gửi read_receipt events hay không
   - Có thể cần custom implementation

3. **Auto-clear timing**:
   - Hiện tại: 5 seconds auto-clear
   - Có thể cần điều chỉnh dựa trên user feedback

## 📚 Related Files

### Backend
- `app/api/zalo/typing-seen/route.ts` - API endpoint
- `lib/zalo-listener-manager.ts` - Event listeners

### Frontend
- `app/page.tsx` - SSE handler, state management
- `components/ZaloChatView.tsx` - UI display, send typing/seen

## 🚀 Next Steps

1. **Test with real Zalo accounts** để verify events
2. **Implement read receipt UI** (checkmarks)
3. **Add message status tracking** to database
4. **Group read receipts** with avatars
5. **Settings page** for privacy controls

## 💡 Tips

- Typing indicator **throttled to 3 seconds** để tránh spam server
- Seen events **sent automatically** khi mở conversation
- State được **auto-cleared** sau 5s để tránh stale data
- SSE được dùng để **broadcast real-time** events
