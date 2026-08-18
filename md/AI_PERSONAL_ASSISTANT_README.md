# 🤖 AI Personal Assistant - Hướng dẫn cài đặt

## Tính năng mới

AI Personal Assistant cho phép AI tự động trả lời **thay cho bạn** khi:
1. ✅ Có người @mention tên bạn trong nhóm *(chỉ trong nhóm)*
2. ✅ Có người reply tin nhắn của bạn *(cả nhóm và chat 1-1)*
3. ✅ Có người gọi tên/biệt danh của bạn *(cả nhóm và chat 1-1)*
4. ✅ AI đọc toàn bộ luồng tin nhắn để hiểu ngữ cảnh *(cả nhóm và chat 1-1)*

**💡 Hoạt động ở đâu?**
- ✅ **Chat nhóm (Group)**: Hỗ trợ @mention + reply + name detection
- ✅ **Chat 1-1 (Direct Message)**: Hỗ trợ reply + name detection (không có @mention)

---

## Cài đặt

### Bước 1: Chạy migration SQL

Tạo bảng `user_ai_profiles` trong database:

```bash
node scripts/run-ai-profiles-migration.js
```

Hoặc chạy SQL trực tiếp trong database:

```bash
# PostgreSQL
psql $POSTGRES_URL -f database/add-user-ai-profiles.sql
```

### Bước 2: Khởi động lại server

```bash
npm run dev
```

---

## Cách sử dụng

### 1. Truy cập Dashboard

1. Đăng nhập vào web app
2. Chuyển sang tab **"Quản lý Bot"** (Dashboard)
3. Kéo xuống tìm phần **"🤖 Cài đặt AI Cá nhân"**

### 2. Cấu hình thông tin cá nhân

**📛 Tên của bạn:**
- Tên này được lấy tự động từ tài khoản Zalo
- Ví dụ: "Hoàng Kiều Phong"

**🏷️ Biệt danh / Tên khác:**
- Thêm các tên gọi khác mà người khác hay dùng
- Ví dụ: "Phong", "Kiều Phong", "HKP", "anh Phong"
- AI sẽ trả lời khi thấy bất kỳ tên nào trong danh sách

### 3. Chọn chế độ AI

#### 📍 Chỉ khi @mention hoặc reply
- AI chỉ trả lời khi:
  - **Trong nhóm:** Có người @mention chính xác tên bạn
  - **Cả nhóm & chat 1-1:** Có người reply trực tiếp tin nhắn của bạn
- **Phù hợp:** Muốn kiểm soát chặt chẽ, ít tự động

#### 🔍 Khi thấy tên trong tin nhắn
- AI trả lời khi:
  - Thấy tên hoặc biệt danh của bạn trong tin nhắn (không cần @)
  - **Ví dụ trong nhóm:** "Phong ơi cho mình hỏi..." → AI tự động reply
  - **Ví dụ trong chat 1-1:** "Phong có rảnh không?" → AI tự động reply
- **Phù hợp:** Nhóm chat thân thiết hoặc chat 1-1với bạn bè

#### 🧠 Thông minh (tự động)
- AI luôn đọc tin nhắn, tự động trả lời khi:
  - Thấy tên bạn (trong nhóm hoặc chat 1-1)
  - Có câu hỏi liên quan đến chủ đề bạn đã nói
  - Nhận được câu hỏi hoặc yêu cầu (theo logic AI)
- **Phù hợp:** Muốn AI chủ động nhất, cả nhóm lẫn chat 1-1

### 4. Cài đặt nâng cao

**📚 Số tin nhắn đọc trước (Context):**
- Mặc định: 20 tin nhắn
- Tối đa: 50 tin nhắn
- AI sẽ đọc nhiều tin nhắn trước đó để hiểu ngữ cảnh

**🧠 Nhớ thông tin trong hội thoại:**
- Bật: AI nhớ thông tin đã nói (VD: "Hôm qua Phong nói sẽ đi chơi")
- Tắt: AI chỉ đọc tin nhắn gần nhất, không nhớ lâu dài

---

## Ví dụ hoạt động

### Ví dụ 1: @Mention (chỉ trong nhóm)
```
📍 Chat nhóm:
👤 User A: @Hoàng Kiều Phong anh có rảnh không?
🤖 AI (thay Phong): Ủa có gì vậy bạn? Mình đang bận nhẹ nhưng nói đi 😊
```

### Ví dụ 2: Reply tin nhắn (cả nhóm và chat 1-1)
```
📍 Chat nhóm:
👤 Phong: Tối nay mình đi chơi nhé
👤 User B: [Reply] Đi đâu vậy?
🤖 AI (thay Phong): Định đi cafe thôi, bạn đi cùng không? ☕

📍 Chat 1-1:
👤 Bạn A: Mình có thể mượn sách của bạn không?
👤 Phong: Được nha
👤 Bạn A: [Reply] Bao giờ lấy?
🤖 AI (thay Phong): Chiều nay mình có rảnh, bạn đến lấy nhé! 📚
```

### Ví dụ 3: Gọi tên (cả nhóm và chat 1-1)
```
📍 Chat nhóm:
👤 User C: Phong ơi cho mình hỏi bài tập
🤖 AI (thay Phong): Ủa bài nào thế bạn? Để mình xem giúp nhé 📚

📍 Chat 1-1:
👤 Bạn B: Phong có rảnh không?
🤖 AI (thay Phong): Có bạn, cần gì nào? 😊
```

### Ví dụ 4: Smart auto (cả nhóm và chat 1-1)
```
📍 Chat nhóm:
👤 User D: Ai biết cách fix lỗi này không?
👤 User E: Không biết nữa, hỏi Phong đi
🤖 AI (thay Phong): Để mình xem lỗi gì đã! 🔍

📍 Chat 1-1:
👤 Bạn C: Bạn biết code Python không?
🤖 AI (thay Phong): Có nha, bạn cần giúp gì? 💻
```

---

## Cấu trúc Database

### Bảng `user_ai_profiles`

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| `user_id` | TEXT | ID người dùng (khóa chính) |
| `zalo_user_id` | TEXT | ID Zalo của người dùng |
| `zalo_display_name` | TEXT | Tên hiển thị từ Zalo |
| `nicknames` | TEXT[] | Danh sách biệt danh |
| `ai_reply_mode` | TEXT | Chế độ: mention_only, name_detect, smart_auto |
| `context_length` | INTEGER | Số tin nhắn đọc context (5-50) |
| `remember_context` | BOOLEAN | Có nhớ thông tin không |
| `created_at` | TIMESTAMP | Ngày tạo |
| `updated_at` | TIMESTAMP | Ngày cập nhật |

---

## API Endpoints

### GET `/api/user/ai-profile`
Lấy thông tin AI profile của user hiện tại

**Response:**
```json
{
  "success": true,
  "profile": {
    "user_id": "...",
    "zalo_display_name": "Hoàng Kiều Phong",
    "nicknames": ["Phong", "HKP"],
    "ai_reply_mode": "name_detect",
    "context_length": 20,
    "remember_context": true
  }
}
```

### POST `/api/user/ai-profile`
Cập nhật AI profile

**Request body:**
```json
{
  "zaloDisplayName": "Hoàng Kiều Phong",
  "nicknames": ["Phong", "Kiều Phong", "HKP"],
  "aiReplyMode": "name_detect",
  "contextLength": 30,
  "rememberContext": true
}
```

---

## Lưu ý quan trọng

### ⚠️ Yêu cầu
1. ✅ AI phải được bật (AI Settings → Bật AI Reply)
2. ✅ Bot phải được bật (Control Panel → Bật Bot)
3. ✅ Gemini API key phải được cấu hình

### 💡 Tips
- **Thêm nhiều biệt danh:** Càng nhiều biệt danh, AI càng dễ nhận diện
- **Context length cao:** Đọc nhiều tin nhắn hơn → Hiểu ngữ cảnh tốt hơn
- **Smart auto mode:** Tốt nhất cho nhóm chat hoạt động nhiều

### 🔒 Bảo mật
- Mỗi user có profile riêng
- AI chỉ trả lời cho user đó
- Không can thiệp vào người dùng khác

### 🎯 Khi nào AI không trả lời
- Khi AI bị tắt
- Khi Bot bị tắt
- Khi không match điều kiện (tùy mode)
- Khi lỗi API (hết quota, network...)

---

## Troubleshooting

### Lỗi: "Not authenticated"
→ Đăng nhập lại vào web app

### Lỗi: "Failed to load AI profile"
→ Kiểm tra xem đã chạy migration chưa:
```bash
node scripts/run-ai-profiles-migration.js
```

### AI không trả lời
→ Kiểm tra:
1. AI có bật không? (AI Settings)
2. Bot có bật không? (Control Panel)
3. Chế độ AI có đúng không? (mention_only / name_detect / smart_auto)
4. Tên/biệt danh có đúng không?
5. **Trong chat 1-1:** @mention không hoạt động (chỉ có reply + name detection)

### AI trả lời sai người
→ Kiểm tra:
1. Tên người dùng trong profile có chính xác không?
2. Biệt danh có bị trùng với người khác không?

---

## Kiến trúc

```
User Message
    ↓
Listener detects message
    ↓
Load user AI profile
    ↓
Check conditions:
  - @mention?
  - Reply to user?
  - Name in message?
  - Smart trigger?
    ↓
YES → Generate AI reply on behalf of user
NO  → Use normal AI reply (if enabled)
    ↓
Send reply
```

---

## Files đã tạo/sửa

### Mới tạo:
- `database/add-user-ai-profiles.sql` - Migration SQL
- `scripts/run-ai-profiles-migration.js` - Script chạy migration
- `app/api/user/ai-profile/route.ts` - API endpoint
- `components/AIPersonalSettings.tsx` - UI settings
- `AI_PERSONAL_ASSISTANT_README.md` - Tài liệu này

### Đã sửa:
- `lib/ai-reply.ts` - Thêm logic AI personal assistant
- `lib/zalo-listener-manager.ts` - Tích hợp vào listener
- `app/page.tsx` - Thêm component vào dashboard

---

## Tính năng tương lai (TODO)

- [ ] Học phong cách nói chuyện của user từ lịch sử tin nhắn
- [ ] Multi-language support (English, etc.)
- [ ] Voice message analysis
- [ ] Context memory persistence (RAG)
- [ ] Custom trigger keywords per user

---

🎉 **Hoàn tất!** Giờ AI có thể trả lời thay cho bạn rồi!
