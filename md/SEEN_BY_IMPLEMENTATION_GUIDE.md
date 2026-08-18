# 🎯 Hướng dẫn implement "Ai đã xem" (Seen By)

## ✅ Đã hoàn thành

### 1. Backend - Listener
**File**: `lib/zalo-listener-manager.ts`

✅ **Đã update** listener để parse `GroupSeenMessage` events:
```typescript
zaloApi.listener.on('read_receipt', (seenData) => {
  if (isGroup) {
    // Parse seenUids array
    const seenUids = seenData.data?.seenUids || []
    
    // Fetch user info for all seen users
    const seenBy = seenUids.map(uid => ({
      userId: uid,
      userName: '...',
      avatar: '...',
      seenAt: Date.now()
    }))
    
    // Broadcast to SSE clients
    const event = {
      type: 'group_seen',
      threadId: groupId,
      msgId,
      seenBy,
      timestamp: Date.now()
    }
  }
})
```

### 2. UI Component  
**File**: `components/MessageStatus.tsx`

✅ **Đã có** UI component hiển thị:
- Checkmarks ✓ ✓ màu xanh
- Modal "Đã xem bởi X người"
- Danh sách users với avatar, tên, thời gian

## ❌ Còn thiếu

### 3. Frontend SSE Listener
**File**: `components/ZaloChatView.tsx`

❌ **CHƯA CÓ** EventSource để nhận real-time events từ `/api/zalo/listener`

**Cần thêm**:
```typescript
useEffect(() => {
  // Connect to SSE endpoint
  const eventSource = new EventSource('/api/zalo/listener')
  
  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data)
    
    if (data.type === 'group_seen') {
      // Update message seenBy in state
      updateMessageSeenBy(data.msgId, data.seenBy)
    }
    
    if (data.type === 'user_seen') {
      // Update 1:1 chat message status
      updateMessageStatus(data.msgId, 'seen')
    }
  }
  
  return () => eventSource.close()
}, [])
```

### 4. State Update Function
**File**: `components/ZaloChatView.tsx`

❌ **CHƯA CÓ** function để update `seenBy` trong message state

**Cần thêm**:
```typescript
const updateMessageSeenBy = (msgId: string, seenBy: any[]) => {
  // Update logs (real-time messages)
  setLogs(prevLogs => 
    prevLogs.map(msg => 
      msg.msgId === msgId 
        ? { ...msg, status: 'seen', seenBy } 
        : msg
    )
  )
  
  // Update historyMessages (loaded from API)
  setHistoryMessages(prevHistory => 
    prevHistory.map(msg => 
      msg.msgId === msgId 
        ? { ...msg, status: 'seen', seenBy } 
        : msg
    )
  )
}
```

## 📝 Implementation Steps

### Step 1: Thêm EventSource listener (Priority: HIGH)

1. Mở file `components/ZaloChatView.tsx`
2. Tìm section với các `useEffect` hooks
3. Thêm useEffect mới để kết nối SSE:

```typescript
// 🆕 Real-time listener for seen events, reactions, etc.
useEffect(() => {
  let eventSource: EventSource | null = null
  
  const connectSSE = () => {
    eventSource = new EventSource('/api/zalo/listener')
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        console.log('📡 [SSE] Received event:', data.type, data)
        
        // Handle different event types
        switch (data.type) {
          case 'group_seen':
            handleGroupSeenEvent(data)
            break
          case 'user_seen':
            handleUserSeenEvent(data)
            break
          case 'reaction':
            handleReactionEvent(data)
            break
          case 'message':
            handleNewMessage(data)
            break
          default:
            console.log('📡 [SSE] Unknown event type:', data.type)
        }
      } catch (error) {
        console.error('❌ [SSE] Parse error:', error)
      }
    }
    
    eventSource.onerror = (error) => {
      console.error('❌ [SSE] Connection error:', error)
      eventSource?.close()
      
      // Reconnect after 3 seconds
      setTimeout(connectSSE, 3000)
    }
    
    console.log('✅ [SSE] Connected to real-time listener')
  }
  
  connectSSE()
  
  return () => {
    if (eventSource) {
      eventSource.close()
      console.log('🔌 [SSE] Disconnected')
    }
  }
}, [])
```

### Step 2: Thêm event handlers

```typescript
// Handle group seen event
const handleGroupSeenEvent = (data: any) => {
  const { msgId, seenBy, threadId } = data
  
  console.log(`👥 [Seen] ${seenBy.length} users saw message ${msgId}`)
  
  // Update logs
  setLogs(prevLogs => 
    prevLogs.map(msg => {
      if (msg.msgId === msgId || msg.cliMsgId === msgId) {
        return { 
          ...msg, 
          status: 'seen', 
          seenBy: seenBy 
        }
      }
      return msg
    })
  )
  
  // Update history messages
  setHistoryMessages(prevHistory => 
    prevHistory.map(msg => {
      if (msg.msgId === msgId || msg.cliMsgId === msgId) {
        return { 
          ...msg, 
          status: 'seen', 
          seenBy: seenBy 
        }
      }
      return msg
    })
  )
}

// Handle user (1:1) seen event
const handleUserSeenEvent = (data: any) => {
  const { msgId, threadId } = data
  
  console.log(`👤 [Seen] User saw message ${msgId}`)
  
  // Update message status to 'seen'
  setLogs(prevLogs => 
    prevLogs.map(msg => {
      if ((msg.msgId === msgId || msg.cliMsgId === msgId) && msg.threadId === threadId) {
        return { ...msg, status: 'seen' }
      }
      return msg
    })
  )
  
  setHistoryMessages(prevHistory => 
    prevHistory.map(msg => {
      if ((msg.msgId === msgId || msg.cliMsgId === msgId) && msg.threadId === threadId) {
        return { ...msg, status: 'seen' }
      }
      return msg
    })
  )
}
```

### Step 3: Test

1. **Gửi tin nhắn trong group**
2. **Người khác xem tin nhắn** (trên app Zalo mobile/desktop)
3. **Check console** xem có nhận event `group_seen` không
4. **Click vào checkmark ✓✓** xanh để xem modal "Đã xem bởi X người"

## 🐛 Debugging

### Check listener có hoạt động không:
```bash
# Terminal 1: Start app
npm run dev

# Terminal 2: Monitor logs
tail -f .next/server-logs.txt | grep "Seen"
```

### Check SSE connection:
```javascript
// Browser console
fetch('/api/zalo/listener')
  .then(res => console.log('SSE status:', res.status))
```

### Check event format:
```typescript
// Add to listener manager
console.log('👁️ [Listener] Raw seen event:', JSON.stringify(seenData, null, 2))
```

## 🎯 Expected Result

Sau khi implement:

1. ✅ Gửi tin nhắn trong group → Hiển thị ✓ (sent)
2. ✅ Người khác nhận → Hiển thị ✓✓ (delivered)  
3. ✅ Người khác xem → Hiển thị ✓✓ màu xanh (seen)
4. ✅ Click vào ✓✓ → Modal hiển thị:
   - Avatar người đã xem
   - Tên người đã xem
   - Thời gian xem
5. ✅ Real-time update (không cần refresh)

## 📊 Data Flow

```
User A xem tin nhắn
  ↓
Zalo sends GroupSeenMessage event
  ↓
zaloApi.listener.on('read_receipt') receives event
  ↓
Parse seenUids array → Fetch user info
  ↓
Broadcast via SSE to all clients
  ↓
Frontend EventSource receives 'group_seen' event
  ↓
handleGroupSeenEvent() updates message state
  ↓
MessageStatus component re-renders with seenBy data
  ↓
User B sees blue checkmarks ✓✓
  ↓
User B clicks → Modal shows "Đã xem bởi 3 người"
```

## ⚠️ Limitations

- SSE chỉ hoạt động khi **tab browser đang mở**
- Nếu đóng tab và mở lại, **không nhận được** past seen events
- Cần **refresh history** sau khi reconnect để load seen status from DB
- **Database không lưu seenBy** hiện tại (chỉ có in-memory)

## 🔮 Future Improvements

1. **Persist seenBy to database**:
   - Add `seen_by` JSONB column to `messages` table
   - Update on each seen event
   - Load from DB when fetching history

2. **WebSocket instead of SSE**:
   - Bidirectional communication
   - Better reconnection handling
   - Can send acks back to server

3. **Batch updates**:
   - Group multiple seen events in 1 update
   - Reduce re-renders

## 📖 References

- Zalo API Types: `TGroupSeenMessage`, `TUserSeenMessage`
- zca-js documentation: `api.sendSeenEvent(messages, threadId, type)`
- SSE API: [MDN EventSource](https://developer.mozilla.org/en-US/docs/Web/API/EventSource)
