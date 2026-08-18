# ⚠️ Giới hạn của "Ai đã xem" (Seen By)

## Vấn đề hiện tại

Mặc dù UI đã có component `MessageStatus` hiển thị checkmarks (✓ ✓) và modal "Đã xem bởi X người", **tính năng này không hoạt động đầy đủ** vì **giới hạn của Zalo API**.

## Tại sao không hiển thị "ai đã xem"?

### 1. Zalo API không cung cấp dữ liệu `seenBy`

Khi fetch chat history qua API:
- `api.getGroupChatHistory(threadId)` - **KHÔNG** trả về thông tin ai đã xem
- `api.getChatHistory(threadId)` - **KHÔNG** trả về thông tin ai đã xem

Response chỉ chứa:
```typescript
{
  msgId: string
  from: string
  content: string
  timestamp: number
  // ❌ KHÔNG CÓ: seenBy, readBy, viewers
}
```

### 2. Seen event chỉ là one-way

Khi gửi `api.sendSeenEvent(messages)`:
- ✅ Thông báo cho người gửi rằng "tôi đã xem tin nhắn"
- ❌ KHÔNG nhận được thông tin "ai đã xem tin nhắn của tôi"

```typescript
// POST /api/zalo/typing-seen
const result = await zaloApi.sendSeenEvent(messages, type)
// Response: { status: 0 } - CHỈ confirm đã gửi, không có thông tin người khác
```

### 3. Listener có thể nhận events nhưng chưa được implement

Zalo listener **CÓ THỂ** nhận được event khi:
- Người khác xem tin nhắn của bạn
- Nhưng phải parse từ real-time WebSocket events
- Hiện tại listener chưa được code để handle seen events từ người khác

## Trạng thái hiện tại

### ✅ Đã hoạt động:
- **Hiển thị message status** (sending → sent → delivered → seen)
- **Checkmarks** (✓ single check, ✓✓ double check màu xanh khi seen)
- **Gửi seen event** khi người dùng xem tin nhắn
- **UI modal "Đã xem bởi"** đã có sẵn (nhưng không có data)

### ❌ Chưa hoạt động:
- **Danh sách chi tiết "ai đã xem"** trong group chat
- **Số lượng người đã xem** (X người đã xem)
- **Thời gian xem** của từng thành viên

## Giải pháp tạm thời

Code hiện tại:
- Hiển thị ✓✓ màu xanh khi tin nhắn đã được `seen`
- **KHÔNG** hiển thị modal chi tiết nếu `seenBy` array rỗng
- Tooltip chỉ hiển thị "Đã xem" thay vì "Đã xem bởi X người"

```typescript
// components/MessageStatus.tsx
const hasSeenByData = isGroup && seenBy && seenBy.length > 0

<div 
  className={hasSeenByData ? 'cursor-pointer' : ''}
  title={hasSeenByData ? `Đã xem bởi ${seenBy.length} người` : 'Đã xem'}
  onClick={() => hasSeenByData && setShowSeenByModal(true)}
>
  <CheckCheck className="w-3 h-3 text-sky-400" />
</div>
```

## Giải pháp dài hạn (nếu cần implement)

### Option 1: Parse listener events
1. Update `lib/zalo-listener-manager.ts` để listen cho seen events
2. Khi nhận event "userX đã xem tin nhắn Y", emit cho frontend
3. Frontend cập nhật `seenBy` array vào state
4. Lưu vào database để persist qua page refresh

```typescript
// Pseudo code
listener.on('message_seen', (event) => {
  const { msgId, userId, userName, timestamp } = event
  // Emit to frontend via SSE
  // Update database seenBy field
})
```

### Option 2: Polling API (nếu Zalo có API mới)
- Check documentation xem có API mới để fetch seen status
- Poll định kỳ để update seen info

### Option 3: Accept limitation
- Giữ nguyên như hiện tại
- Chỉ hiển thị checkmark xanh "Đã xem" mà không chi tiết
- Đây là cách Facebook Messenger desktop cũ làm

## Kết luận

**Tính năng "ai đã xem" không hiển thị vì Zalo API không cung cấp dữ liệu này.**

Để implement đầy đủ cần:
1. Reverse engineer Zalo WebSocket protocol
2. Parse real-time seen events từ listener
3. Store và sync seen info qua database
4. Cập nhật UI real-time

Đây là **công việc phức tạp** và có thể **vi phạm ToS của Zalo**.

## Status hiện tại: ⚠️ Limitation Accepted

Checkmark ✓✓ xanh vẫn hiển thị đúng, nhưng không có chi tiết "ai đã xem" trong group.
