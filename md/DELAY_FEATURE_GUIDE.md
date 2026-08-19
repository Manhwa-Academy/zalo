# ⏱️ Tính Năng Delay Tự Động Trả Lời

## 📋 Tổng Quan

Tính năng **Độ trễ phản hồi (Reply Delay)** giúp bot trả lời tin nhắn một cách **TỰ NHIÊN** hơn bằng cách đợi một khoảng thời gian trước khi gửi câu trả lời.

### ✨ Lợi Ích

1. **Tránh bị phát hiện là bot** 🤖
   - Trả lời ngay lập tức → Zalo dễ phát hiện
   - Delay 5-10 giây → Giống người thật đang gõ

2. **Giảm nguy cơ bị khóa tài khoản** 🔒
   - Bot trả lời quá nhanh → Zalo nghi ngờ → Khóa tài khoản
   - Delay hợp lý → An toàn hơn

3. **Tạo trải nghiệm tự nhiên** 👤
   - Người dùng cảm thấy đang chat với người thật
   - Không bị nghi ngờ là bot

---

## ⚙️ Cách Sử Dụng

### 1. Cài Đặt Delay

Trong giao diện **Cài đặt** (⚙️):

```
Độ trễ phản hồi: [____5____] giây
```

- **Giá trị đề xuất**: 5-10 giây
- **Tối thiểu**: 0 giây (trả lời ngay, không khuyến khích)
- **Tối đa**: Không giới hạn (nhưng không nên > 30 giây)

### 2. Delay Được Áp Dụng Khi Nào?

✅ **Có delay**:
- Tin nhắn văn bản thường
- Reaction (like, love, ...)
- Sticker
- Hình ảnh
- File đính kèm
- Link

❌ **Không delay**:
- Tin nhắn do chính bạn gửi (isSelf)
- Hội thoại đã tắt auto-reply

---

## 🎯 Cách Hoạt Động

### Quy Trình

```
1. Nhận tin nhắn từ người dùng
   ↓
2. Kiểm tra: Có cần auto-reply không?
   ↓ (Yes)
3. Tạo câu trả lời (AI hoặc preset)
   ↓
4. ⏱️ DELAY (chờ 5 giây) ← ĐÂY LÀ PHẦN MỚI
   ↓
5. Gửi tin nhắn trả lời
   ↓
6. Xong!
```

### Code Implementation

```typescript
// Lấy cài đặt delay
const settings = await getBotSettingsAsync()
const replyDelay = settings.replyDelay || 2000 // Default 2 giây

// Tạo câu trả lời
const replyText = await getReplyText(textContent, senderName, threadId)

// ⏱️ DELAY trước khi gửi
console.log(`⏱️ Waiting ${replyDelay}ms before sending...`)
await new Promise(resolve => setTimeout(resolve, replyDelay))

// Gửi tin nhắn
await zaloApi.sendMessage({ msg: replyText }, threadId, threadType)
```

---

## 📊 Ví Dụ Thực Tế

### Ví Dụ 1: Không Có Delay (Nguy hiểm)

```
09:30:00.123 - Người dùng: "Alo"
09:30:00.456 - Bot: "Xin chào! Tôi có thể giúp gì?"
           ↑
       Chỉ 333ms → Quá nhanh! Zalo nghi ngờ
```

### Ví Dụ 2: Có Delay 5 Giây (An toàn)

```
09:30:00.123 - Người dùng: "Alo"
09:30:05.456 - Bot: "Xin chào! Tôi có thể giúp gì?"
           ↑
       5 giây delay → Tự nhiên như người thật
```

### Ví Dụ 3: Delay Ngẫu Nhiên (Tốt nhất)

```
Tin nhắn 1: Delay 5 giây
Tin nhắn 2: Delay 7 giây
Tin nhắn 3: Delay 4 giây
Tin nhắn 4: Delay 6 giây
       ↑
   Không đều → Khó phát hiện hơn
```

**Lưu ý**: Hiện tại delay là cố định, có thể nâng cấp thêm random sau.

---

## 🔧 Cấu Hình Chi Tiết

### Trong Database (PostgreSQL)

**Bảng**: `zalo_bot_settings`

```sql
CREATE TABLE zalo_bot_settings (
  user_id TEXT PRIMARY KEY,
  enabled BOOLEAN DEFAULT false,
  auto_reply_message TEXT,
  reply_delay INTEGER DEFAULT 2000,  ← ĐÂY LÀ DELAY (milliseconds)
  ...
);
```

### API Endpoint

**GET/POST**: `/api/zalo/settings`

**Request Body**:
```json
{
  "enabled": true,
  "autoReplyMessage": "Xin chào!",
  "replyDelay": 5000,  ← 5 giây
  "replyScope": "all"
}
```

**Response**:
```json
{
  "success": true,
  "settings": {
    "enabled": true,
    "autoReplyMessage": "Xin chào!",
    "replyDelay": 5000,
    "replyScope": "all"
  }
}
```

---

## 💡 Khuyến Nghị

### 1. Delay Theo Loại Tin Nhắn

| Loại Tin Nhắn | Delay Đề Xuất | Lý Do |
|---------------|---------------|-------|
| Reaction (👍) | 3-5 giây | Phản ứng nhanh, tự nhiên |
| Tin nhắn ngắn ("alo", "hi") | 5-7 giây | Giống lời chào thường |
| Tin nhắn dài (câu hỏi) | 7-12 giây | Cần thời gian "đọc và suy nghĩ" |
| Hình ảnh | 5-10 giây | Cần thời gian "xem ảnh" |
| File đính kèm | 8-15 giây | Cần thời gian "mở file" |

**Hiện tại**: Tất cả dùng chung 1 delay  
**Tương lai**: Có thể custom theo loại tin nhắn

### 2. Delay Theo Thời Gian

```
Ban ngày (8am - 10pm):
  → Delay ngắn (3-7 giây) - Người ta online nhiều

Ban đêm (10pm - 8am):
  → Delay dài hơn (10-20 giây) - Ít người online, trả lời chậm tự nhiên
```

### 3. Delay Ngẫu Nhiên (Random)

Thay vì delay cố định 5 giây, có thể random:

```typescript
// Ví dụ: Random từ 5-10 giây
const minDelay = 5000  // 5 giây
const maxDelay = 10000 // 10 giây
const randomDelay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay

await new Promise(resolve => setTimeout(resolve, randomDelay))
```

**Lợi ích**: Khó bị phát hiện hơn vì không đều

---

## ⚠️ Lưu Ý Quan Trọng

### 1. Delay Quá Ngắn (< 2 giây)

❌ **Nguy cơ**:
- Zalo dễ phát hiện
- Có thể bị khóa tài khoản
- Không tự nhiên

### 2. Delay Quá Dài (> 30 giây)

❌ **Vấn đề**:
- Người dùng nghĩ bot không hoạt động
- Mất trải nghiệm người dùng
- Tin nhắn trả lời đã không còn phù hợp

### 3. Delay = 0 (Không Delay)

⚠️ **Cảnh báo**:
```
┌─────────────────────────────────────┐
│  NGUY HIỂM: BỊ KHÓA TÀI KHOẢN!     │
│                                     │
│  Không delay = Trả lời ngay lập tức│
│  → Zalo phát hiện bot               │
│  → Khóa tài khoản                   │
│                                     │
│  ĐỀ XUẤT: Dùng ít nhất 5 giây     │
└─────────────────────────────────────┘
```

---

## 🧪 Kiểm Tra Delay

### Cách Test

1. **Bật auto-reply** và đặt delay = 5 giây
2. **Gửi tin nhắn** từ tài khoản khác: "Test"
3. **Quan sát console log**:

```bash
✅ [Auto-Reply] Conditions met, generating reply...
⏱️ [Auto-Reply] Waiting 5000ms before sending reply...
# (Chờ 5 giây)
✅ [Auto-Reply] Delay completed, sending reply now
📤 [Send Message] Sending: "Xin chào!"
```

4. **Kiểm tra thời gian** giữa tin nhắn gốc và tin nhắn bot:
   - Nếu delay đúng → Khoảng 5 giây
   - Nếu không delay → < 1 giây

### Debug Console

```typescript
console.log(`⏱️ [Auto-Reply] Waiting ${replyDelay}ms before sending reply...`)
await new Promise(resolve => setTimeout(resolve, replyDelay))
console.log(`✅ [Auto-Reply] Delay completed, sending reply now`)
```

---

## 📈 Nâng Cấp Trong Tương Lai

### Phase 1: ✅ Done
- [x] Delay cố định theo cài đặt
- [x] Apply cho tất cả tin nhắn
- [x] Lưu vào database

### Phase 2: 🚀 Coming Soon
- [ ] Delay ngẫu nhiên (random)
- [ ] Delay khác nhau theo loại tin nhắn
- [ ] Delay theo thời gian trong ngày
- [ ] Typing indicator (hiển thị "đang soạn tin...")

### Phase 3: 🎯 Advanced
- [ ] AI predict delay tự nhiên dựa trên lịch sử chat
- [ ] Delay dài hơn cho câu trả lời dài
- [ ] Smart delay: học từ cách người dùng thật trả lời

---

## 🛠️ Troubleshooting

### Vấn đề 1: Bot vẫn trả lời ngay lập tức

**Nguyên nhân**:
- Delay chưa được lưu vào database
- Code chưa reload

**Giải pháp**:
```bash
1. Mở Settings → Đặt delay 5 giây → Save
2. Restart server: npm run dev
3. Test lại
```

### Vấn đề 2: Delay không chính xác

**Nguyên nhân**:
- Nhiều session cùng lúc
- Network lag

**Giải pháp**:
```typescript
// Check actual delay
const startTime = Date.now()
await new Promise(resolve => setTimeout(resolve, replyDelay))
const actualDelay = Date.now() - startTime
console.log(`Actual delay: ${actualDelay}ms`)
```

### Vấn đề 3: Tài khoản vẫn bị khóa dù có delay

**Nguyên nhân**:
- Delay vẫn quá ngắn (< 3 giây)
- Trả lời quá nhiều tin nhắn liên tục
- IP bị Zalo nghi ngờ

**Giải pháp**:
- Tăng delay lên 10-15 giây
- Giới hạn số tin nhắn auto-reply/phút
- Dùng delay ngẫu nhiên
- Tắt bot trong một số hội thoại

---

## 📚 Tài Liệu Liên Quan

- **Auto-Reply Settings**: `app/api/zalo/settings/route.ts`
- **Listener Manager**: `lib/zalo-listener-manager.ts`
- **Database Schema**: `lib/postgres.ts`
- **Frontend Settings**: `components/ZaloChatView.tsx`

---

## 🎉 Kết Luận

✅ **Tính năng delay đã được thêm vào** và hoạt động đúng!

### Checklist Hoàn Thành

- [x] Thêm delay trước khi gửi tin nhắn
- [x] Lấy replyDelay từ bot settings
- [x] Log console để debug
- [x] Apply cho tất cả loại tin nhắn
- [x] Tài liệu hướng dẫn đầy đủ

### Cách Sử Dụng

1. Mở giao diện web bot
2. Vào **Cài đặt** (⚙️)
3. Tìm **"Độ trễ phản hồi"**
4. Nhập **5** (= 5 giây)
5. Click **Lưu**
6. Test bằng cách gửi tin nhắn

**Bây giờ bot sẽ đợi 5 giây trước khi trả lời** → An toàn hơn, tự nhiên hơn! 🎉

---

**Version**: 1.0.0  
**Created**: 2026-08-19  
**Status**: ✅ Hoạt động đúng
