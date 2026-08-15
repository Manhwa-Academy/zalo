# 🤖 AI-Powered Smart Reply

## 🎯 Tính năng

**AI Smart Reply** sử dụng **Google Gemini 2.5 Flash Lite** để tự động trả lời tin nhắn một cách thông minh:
- 🧠 **Hiểu context:** Đọc 5 tin nhắn gần nhất để hiểu ngữ cảnh
- 🎭 **Cá nhân hóa:** 6 tính cách khác nhau (Thân thiện, Chuyên nghiệp, Hài hước, Dễ thương...)
- 📝 **Học từ preset:** AI học phong cách từ tin nhắn soạn trước của bạn
- ⚡ **Thông minh:** Tự động phát hiện câu hỏi và tin nhắn cần AI
- 💰 **Miễn phí:** Gemini free tier - 15 requests/phút, 1M requests/ngày
- 🇻🇳 **Tiếng Việt tốt:** Native Vietnamese support

## 🚀 Setup nhanh

### Bước 1: Lấy Gemini API Key (FREE)

1. Truy cập: https://aistudio.google.com/app/apikey
2. Đăng nhập Google account
3. Click **"Create API Key"** → Chọn project hoặc tạo mới
4. Copy API key

### Bước 2: Thêm vào .env

Mở file `.env` và thêm:

```env
GEMINI_API_KEY=your-api-key-here
```

**Ví dụ:**
```env
GEMINI_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Bước 3: Restart server

```bash
npm run dev
```

### Bước 4: Bật AI trong Dashboard

1. Vào tab **"Quản lý Bot"**
2. Tìm section **"🤖 AI Smart Reply"**
3. Toggle ON
4. Chọn tính cách và cài đặt
5. ✅ Done!

## 🎨 Cài đặt AI

### 🎭 Tính cách (Personality)

| Tính cách | Mô tả | Ví dụ Reply |
|-----------|-------|-------------|
| 🌟 **Thân thiện** | Nhiệt tình, lịch sự, hữu ích | "Chào bạn! Tôi rất vui được hỗ trợ bạn. Bạn cần giúp gì nào? 😊" |
| 💼 **Chuyên nghiệp** | Ngắn gọn, chính xác, formal | "Cảm ơn thông tin. Tôi sẽ xem xét và phản hồi sớm nhất." |
| 😊 **Thoải mái** | Gần gũi, đời thường | "Oke bạn! Để tớ check xem sao nhé 👍" |
| 😄 **Hài hước** | Vui tươi, đùa giỡn | "Haha câu hỏi hay đấy! Để tớ nghĩ xem... 🤔😄" |
| 💙 **Hỗ trợ** | Đồng cảm, động viên | "Mình hiểu cảm giác của bạn. Đừng lo, mình sẽ giúp bạn nhé! 💙" |
| 🥺 **Dễ thương** | Nhút nhát, Monica style | "E-Eto... tớ sẽ cố gắng giúp bạn nhé... 🥺✨" |

### ⚡ Khi nào dùng AI?

| Mode | Mô tả | Sử dụng khi |
|------|-------|-------------|
| 🧠 **Thông minh** (Smart) | Tự động phát hiện câu hỏi, tin dài, từ khóa | **Khuyến nghị** - Cân bằng tốt |
| ❓ **Chỉ câu hỏi** | Chỉ reply khi có dấu `?` | Chỉ muốn trả lời câu hỏi |
| ⚡ **Luôn luôn** | Mọi tin nhắn đều dùng AI | Muốn AI reply 100% (tốn quota) |
| ✋ **Thủ công** | Tắt AI, dùng preset/message thông thường | Tiết kiệm quota |

### 📏 Độ dài trả lời

- **50 ký tự:** Ngắn gọn, súc tích
- **100 ký tự:** Vừa phải (khuyến nghị)
- **200 ký tự:** Chi tiết
- **500 ký tự:** Rất chi tiết

## 🔧 Cách hoạt động

### Flow xử lý tin nhắn:

```
1. Nhận tin nhắn mới
   ↓
2. Check: Bot có bật không?
   ↓ YES
3. Check: Có trong scope/whitelist không?
   ↓ YES
4. Check: AI có bật không?
   ↓ YES
5. Check: Trigger mode có khớp không?
   ↓ YES (Smart/Questions/Always)
6. Lấy 5 tin nhắn gần nhất làm context
   ↓
7. Gửi request đến Gemini API với:
   - Tin nhắn hiện tại
   - Context 5 tin gần nhất
   - Personality setting
   - Max length
   ↓
8. Nhận AI reply
   ↓
9. Gửi reply về Zalo
   ↓
10. Log & broadcast
```

### Fallback logic:

```
AI Enabled? 
  ↓ NO → Use Preset/Default Message
  ↓ YES
AI Request Failed?
  ↓ YES → Use Preset/Default Message
  ↓ NO
Use AI Reply ✅
```

## 💡 Ví dụ thực tế

### Ví dụ 1: Câu hỏi đơn giản

**Tin nhắn:** "Giờ mở cửa là mấy giờ?"

**AI Reply (Thân thiện):**
> "Chào bạn! Cửa hàng mở cửa từ 8h sáng đến 10h tối hàng ngày nhé. Bạn cần thêm thông tin gì không? 😊"

**AI Reply (Chuyên nghiệp):**
> "Giờ mở cửa: 8:00 - 22:00 hàng ngày."

**AI Reply (Dễ thương):**
> "E-Eto... cửa hàng mở từ 8h sáng đến 10h tối nè... 🥺✨"

### Ví dụ 2: AI học từ Preset Messages 🆕

**Preset Messages (đã cài đặt):**
```
1. "Ê~ tao đi ngủ đây, mai chat tiếp nhé! 💤"
2. "U~m... nếu trời sáng kéo tui ra ngoài cảnh của tui sẽ như... (˃̣̣̥ʖ˂̣̣̥) 💧"
3. "Fuck... c chuyện này khó quá ế mất... (˃̣̣̥﹏˂̣̣̥) 💧"
4. "Okela~ để tui xem xét xem sao! ✨"
5. "Ơ kìa... chờ tui chút nha! 👀"
```

**Tin nhắn đến:** "Ngủ chưa?"

**AI Reply (học từ preset #1):**
> "Ê~ sắp ngủ rồi đấy, đang mệt lắm! Có gì mai chat tiếp nhé 💤"

**Tin nhắn đến:** "Giúp tôi cái này được không?"

**AI Reply (kết hợp preset #2 + #4):**
> "U~m... okela để tui xem xét giúp bạn xem sao nhé! ✨"

**Tin nhắn đến:** "Bài này khó quá"

**AI Reply (học từ preset #3):**
> "Ơ... bài này hơi khó đúng rồi, để tui nghĩ xem... (˃̣̣̥﹏˂̣̣̥) Bạn bí ở đâu?"

➡️ **AI tự động bắt chước:**
- Cách bắt đầu câu: "Ê~", "U~m...", "Okela~"
- Emoji đặc trưng: 💤, 💧, ✨, 👀
- Emoticons: (˃̣̣̥ʖ˂̣̣̥), (˃̣̣̥﹏˂̣̣̥)
- Văn phong thân mật: "tao", "tui", "mai chat tiếp"

### Ví dụ 3: Với context

**Context:**
```
User: Tôi muốn mua laptop
Bot: Bạn cần laptop với mục đích gì ạ?
User: Để học lập trình
```

**Tin nhắn mới:** "Giá bao nhiêu?"

**AI Reply (với context):**
> "Laptop phù hợp cho học lập trình giá từ 15-25 triệu tùy cấu hình bạn nhé. Bạn có ngân sách trong khoảng nào không? 💻"

### Ví dụ 4: Sticker/Image

**Tin nhắn:** `[sticker]` hoặc `[hình ảnh]`

**AI bỏ qua** → Dùng preset/default message thay vì AI

## 📊 So sánh AI vs Normal

| Tính năng | Normal (Preset/Default) | AI Smart Reply |
|-----------|-------------------------|----------------|
| Hiểu context | ❌ | ✅ (5 tin gần nhất) |
| Học từ preset messages | ❌ | ✅ (bắt chước phong cách) |
| Trả lời theo tính cách | ❌ | ✅ (6 personalities) |
| Trả lời câu hỏi phức tạp | ❌ | ✅ |
| Cá nhân hóa | ❌ | ✅ |
| Tốc độ | ⚡ Instant | 🚀 <1s |
| Chi phí | 💰 Free | 💰 Free (có quota) |
| Setup | ✅ Dễ | ⚙️ Cần API key |

## 🛡️ Giới hạn & Quota

### Gemini Free Tier:

- **Requests:** 15 requests/phút, 1500 requests/ngày
- **Tokens:** 1M tokens/ngày (~2M ký tự)
- **Rate limit:** 1 request mỗi 4 giây

### Ước tính sử dụng:

- **1 reply:** ~200-500 tokens (prompt + response)
- **1000 replies/ngày:** ~500K tokens (50% quota)

**→ Đủ cho bot trả lời ~2000-3000 tin/ngày**

### Khi vượt quota:

Bot tự động fallback về preset/default message

## ⚙️ Advanced Settings

### Custom Personality

Bạn có thể edit file `lib/ai-reply.ts` để thêm personality mới:

```typescript
const personalities: Record<string, string> = {
  // ... existing
  custom: '🎨 Bạn là một trợ lý sáng tạo, yêu nghệ thuật...',
}
```

### Custom Trigger Logic

Edit `shouldUseAIReply()` trong `lib/ai-reply.ts`:

```typescript
export function shouldUseAIReply(message: string): boolean {
  // Your custom logic
  if (message.includes('urgent')) return true
  // ...
}
```

### Change AI Model

Hiện tại: `gemini-1.5-flash-latest`

Có thể đổi sang:
- `gemini-1.5-pro-latest` (chậm hơn, thông minh hơn)
- `gemini-1.0-pro` (legacy)

Edit trong `lib/ai-reply.ts`:

```typescript
const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${apiKey}`,
  // ...
)
```

## 🐛 Troubleshooting

### Lỗi: "GEMINI_API_KEY not configured"

**Nguyên nhân:** Chưa thêm API key vào `.env`

**Fix:**
1. Thêm `GEMINI_API_KEY=your-key` vào `.env`
2. Restart server: `npm run dev`

### Lỗi: "API error: 429 Too Many Requests"

**Nguyên nhân:** Vượt quota (15 requests/phút)

**Fix:**
- Chuyển AI Trigger Mode sang **"Chỉ câu hỏi"** hoặc **"Thông minh"**
- Tăng `replyDelay` để giảm tốc độ reply
- Upgrade Gemini plan nếu cần nhiều hơn

### Lỗi: "Empty response from Gemini"

**Nguyên nhân:** Gemini safety filters block response

**Fix:**
- Kiểm tra nội dung tin nhắn (có thể chứa từ nhạy cảm)
- Safety settings đã set `BLOCK_NONE` trong code

### AI reply không phù hợp

**Fix:**
1. Đổi **Personality** khác
2. Giảm **Max Length** (AI ngắn gọn hơn)
3. Edit system prompt trong `lib/ai-reply.ts` function `buildSystemPrompt()`

## 📈 Performance Tips

### Tối ưu tốc độ:

1. **Giảm context window:** Edit `maxMessages: 5` → `3` trong `buildConversationHistory()`
2. **Giảm maxOutputTokens:** Trong `generationConfig`
3. **Cache responses:** Implement caching cho câu hỏi giống nhau

### Tiết kiệm quota:

1. Dùng AI Trigger Mode: **"Thông minh"** thay vì **"Luôn luôn"**
2. Chỉ bật AI cho group quan trọng (dùng Whitelist)
3. Set `maxLength: 100` thay vì `500`

## 🎉 Best Practices

### ✅ Nên làm:

- ✅ Bật AI cho user cá nhân (quality > quantity)
- ✅ Dùng mode "Thông minh" để tiết kiệm quota
- ✅ Set maxLength = 100-200 (đủ dùng, không dài dòng)
- ✅ Test nhiều personality để tìm phù hợp nhất
- ✅ Monitor quota usage qua Google AI Studio

### ❌ Không nên:

- ❌ Bật AI cho tất cả groups lớn (tốn quota nhanh)
- ❌ Set maxLength quá lớn (500+) - AI dài dòng, tốn quota
- ❌ Dùng mode "Luôn luôn" trên group đông (spam quota)
- ❌ Share API key công khai

## 🔮 Future Enhancements

- [ ] Support GPT-4 / Claude API
- [ ] Multi-language personality (English, Japanese...)
- [ ] User-specific personality memory
- [ ] AI learns from feedback (like/dislike)
- [ ] Response caching for common questions
- [ ] Analytics: AI vs Normal performance
- [ ] Custom training data per user
- [ ] Voice message transcription + AI reply

## 📚 Resources

- **Gemini API Docs:** https://ai.google.dev/gemini-api/docs
- **Get API Key:** https://aistudio.google.com/app/apikey
- **Pricing:** https://ai.google.dev/pricing
- **Models:** https://ai.google.dev/models/gemini

---

✅ **AI Smart Reply đã sẵn sàng sử dụng!** 🤖✨
