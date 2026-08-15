# 🤖 Hướng dẫn sử dụng AI Smart Reply

## 📖 Giới thiệu

**AI Smart Reply** là tính năng trả lời tin nhắn tự động bằng trí tuệ nhân tạo. Thay vì dùng tin nhắn có sẵn, AI sẽ:
- 🧠 Đọc hiểu câu hỏi
- 💬 Nhớ ngữ cảnh trò chuyện
- 🎭 Trả lời theo tính cách bạn chọn
- 📝 Học phong cách từ tin nhắn soạn trước của bạn
- ✨ Cá nhân hóa theo từng người

**Công nghệ:** Google Gemini 2.5 Flash Lite (FREE, nhanh hơn, nhẹ hơn)

## 🚀 Setup trong 3 phút

### Bước 1: Lấy API Key miễn phí

1. **Truy cập:** https://aistudio.google.com/app/apikey
2. **Đăng nhập** bằng tài khoản Google
3. **Click** nút **"Create API Key"** màu xanh
4. **Chọn** project (hoặc tạo mới nếu chưa có)
5. **Copy** API key (dạng: `AIzaSy...`)

![Screenshot example](https://i.imgur.com/example.png)

💡 **Lưu ý:** API key là MIỄN PHÍ, không cần thẻ tín dụng!

### Bước 2: Thêm API Key vào project

Mở file `.env` trong thư mục project và thêm dòng:

```env
GEMINI_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Chú ý:** Thay `AIzaSy...` bằng API key bạn vừa copy!

**File `.env` ví dụ:**
```env
DATABASE_URL=postgresql://...
AUTH_USERNAME=admin
AUTH_PASSWORD=123456
GEMINI_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Bước 3: Restart server

Nếu đang chạy server, **stop** và chạy lại:

```bash
npm run dev
```

Hoặc trên **Render/Railway**, server sẽ tự restart khi bạn push code.

### Bước 4: Bật AI trong Dashboard

1. Đăng nhập Zalo Bot
2. Vào tab **"Quản lý Bot"**
3. Scroll xuống tìm section **"🤖 AI Smart Reply"**
4. **Bật** toggle ở góc phải
5. ✅ **Xong!** AI đã sẵn sàng

## 🎨 Cài đặt AI

### 🎭 Chọn tính cách AI

Có 6 tính cách để chọn:

#### 1. 🌟 Thân thiện
- **Phù hợp:** Customer service, support
- **Phong cách:** Nhiệt tình, lịch sự, hữu ích
- **Ví dụ:** 
  > "Chào bạn! Tôi rất vui được hỗ trợ. Bạn cần giúp gì nhỉ? 😊"

#### 2. 💼 Chuyên nghiệp
- **Phù hợp:** Business, công việc
- **Phong cách:** Ngắn gọn, formal, đi thẳng vào vấn đề
- **Ví dụ:**
  > "Cảm ơn thông tin. Tôi sẽ xem xét và phản hồi trong 24h."

#### 3. 😊 Thoải mái
- **Phù hợp:** Bạn bè, người quen
- **Phong cách:** Gần gũi, đời thường, tự nhiên
- **Ví dụ:**
  > "Oke bạn! Để tớ check xem sao nhé 👍"

#### 4. 😄 Hài hước
- **Phù hợp:** Group vui vẻ, giải trí
- **Phong cách:** Vui tươi, có chút hài hước
- **Ví dụ:**
  > "Haha câu hỏi hay đấy! Để tớ nghĩ xem... 🤔 Có vẻ là..."

#### 5. 💙 Hỗ trợ
- **Phù hợp:** Tư vấn, động viên
- **Phong cách:** Đồng cảm, quan tâm, động viên
- **Ví dụ:**
  > "Mình hiểu cảm giác của bạn. Đừng lo, mình sẽ giúp bạn nhé! 💙"

#### 6. 🥺 Dễ thương
- **Phù hợp:** Anime fans, Monica Everett style
- **Phong cách:** Nhút nhát, dễ thương, moe
- **Ví dụ:**
  > "E-Eto... tớ sẽ cố gắng giúp bạn nhé... 🥺✨"

**💡 Mẹo:** Thử hết 6 tính cách để tìm cái phù hợp nhất!

### ⚡ Khi nào AI trả lời?

Có 4 chế độ:

#### 1. 🧠 Thông minh (Khuyến nghị)
AI tự động phát hiện:
- ✅ Tin nhắn có dấu `?` (câu hỏi)
- ✅ Tin dài (>10 từ)
- ✅ Chứa từ khóa: "giải thích", "tại sao", "làm sao", "help"...

**Dùng khi:** Muốn cân bằng giữa chất lượng và tiết kiệm quota

#### 2. ❓ Chỉ câu hỏi
AI chỉ reply khi tin nhắn có dấu `?`

**Dùng khi:** Chỉ muốn trả lời câu hỏi cụ thể

#### 3. ⚡ Luôn luôn
AI reply cho MỌI tin nhắn

**Dùng khi:** Muốn AI xử lý 100% (⚠️ tốn quota nhanh)

#### 4. ✋ Thủ công
AI tắt, dùng tin nhắn mặc định/preset

**Dùng khi:** Muốn tiết kiệm quota hoặc test

### 📏 Độ dài trả lời

Kéo thanh slider để chọn:
- **50 ký tự:** Ngắn gọn (1 câu)
- **100 ký tự:** Vừa phải (1-2 câu) ⭐ **Khuyến nghị**
- **200 ký tự:** Chi tiết (2-3 câu)
- **500 ký tự:** Rất chi tiết (cả đoạn văn)

**💡 Mẹo:** 100-200 ký tự là tối ưu nhất!

## 💬 Ví dụ thực tế

### Tình huống 1: AI học từ Preset Messages 🆕

**Preset Messages đã setup:**
```
1. "Ê~ tao đi ngủ đây, mai chat tiếp nhé! 💤"
2. "U~m... nếu trời sáng kéo tui ra ngoài cảnh của tui sẽ như... (˃̣̣̥ʖ˂̣̣̥) 💧"
3. "Fuck... c chuyện này khó quá ế mất... (˃̣̣̥﹏˂̣̣̥) 💧"
4. "Okela~ để tui xem xét xem sao! ✨"
5. "Ơ kìa... chờ tui chút nha! 👀"
```

**Cách AI học:**
- AI phân tích cách bạn nói chuyện từ 5 tin nhắn này
- Học cách dùng "Ê~", "U~m...", "Okela~"
- Bắt chước emoji và emoticons đặc trưng
- Hiểu văn phong thân mật: "tao", "tui", "mai chat"

**Ví dụ Reply:**

**Tin nhắn:** "Ngủ chưa?"  
**AI Reply:** "Ê~ sắp ngủ rồi đấy! Đang mệt lắm, mai chat tiếp nhé 💤"

**Tin nhắn:** "Giúp tôi cái này được không?"  
**AI Reply:** "Okela~ để tui xem xét giúp bạn xem sao! ✨"

**Tin nhắn:** "Bài này khó quá"  
**AI Reply:** "U~m... bài này hơi khó đúng rồi... để tui nghĩ xem (˃̣̣̥﹏˂̣̣̥) Bạn bí ở đâu?"

➡️ **Kết quả:** AI trả lời tự nhiên như chính bạn đang nói!

### Tình huống 2: Shop bán hàng

**Setup:**
- Tính cách: 🌟 Thân thiện
- Trigger: 🧠 Thông minh
- Độ dài: 150 ký tự

**Tin nhắn khách:** "Giá áo này bao nhiêu vậy shop?"

**AI Reply:**
> "Dạ chào bạn! Áo này giá 250k, đang có chương trình giảm 20% còn 200k nha. Bạn muốn xem thêm màu nào không ạ? 😊"

### Tình huống 3: Nhóm bạn bè

**Setup:**
- Tính cách: 😊 Thoải mái
- Trigger: ❓ Chỉ câu hỏi
- Độ dài: 100 ký tự

**Tin nhắn:** "Ngày mai đi chơi không?"

**AI Reply:**
> "Okela! Mấy giờ đi? Tụi mình hẹn chỗ nào nè? 🎉"

### Tình huống 4: Customer support

**Setup:**
- Tính cách: 💼 Chuyên nghiệp
- Trigger: 🧠 Thông minh
- Độ dài: 200 ký tự

**Tin nhắn:** "Tôi gặp lỗi khi đăng nhập ứng dụng"

**AI Reply:**
> "Cảm ơn bạn đã báo lỗi. Vui lòng thử các bước sau: 1) Clear cache app, 2) Update phiên bản mới nhất, 3) Restart điện thoại. Nếu vẫn lỗi, vui lòng gửi screenshot để chúng tôi hỗ trợ kịp thời."

## 📊 So sánh: AI vs Tin nhắn thường

| Tính năng | Tin nhắn thường | AI Smart Reply |
|-----------|-----------------|----------------|
| **Trả lời** | Cố định, không đổi | Linh hoạt, thay đổi theo context |
| **Học phong cách** | ❌ Không | ✅ Học từ preset messages |
| **Hiểu câu hỏi** | ❌ Không | ✅ Có |
| **Nhớ context** | ❌ Không | ✅ Nhớ 5 tin gần nhất |
| **Tính cách** | ❌ 1 style | ✅ 6 personalities |
| **Setup** | ✅ Dễ | ⚙️ Cần API key |
| **Chi phí** | 💰 Free | 💰 Free (có quota) |
| **Tốc độ** | ⚡ Instant | 🚀 <1 giây |

**💡 Kết luận:** Dùng AI cho các trường hợp quan trọng, tin nhắn thường cho spam/thông báo đơn giản.

## ⚠️ Giới hạn cần biết

### Quota miễn phí:

- **15 requests/phút** (1 request mỗi 4 giây)
- **1,500 requests/ngày**
- **1M tokens/ngày** (~2M ký tự)

### Ước tính:

- 1 reply AI = ~200-500 tokens
- **→ Có thể reply ~2,000-3,000 tin/ngày**

### Khi hết quota:

Bot tự động chuyển về dùng tin nhắn mặc định/preset (không bị lỗi)

## 🐛 Xử lý lỗi thường gặp

### Lỗi 1: "AI Reply chưa được cấu hình"

**Nguyên nhân:** Chưa thêm `GEMINI_API_KEY` vào `.env`

**Cách fix:**
1. Lấy API key từ https://aistudio.google.com/app/apikey
2. Thêm vào `.env`: `GEMINI_API_KEY=your-key`
3. Restart server

### Lỗi 2: Bot reply bằng tin nhắn thường thay vì AI

**Nguyên nhân:** AI Trigger Mode không khớp

**Cách fix:**
- Kiểm tra **"Khi nào dùng AI?"** setting
- Nếu chọn "Chỉ câu hỏi" → Tin nhắn phải có dấu `?`
- Đổi sang "Thông minh" hoặc "Luôn luôn" để test

### Lỗi 3: AI reply quá dài/ngắn

**Cách fix:**
- Điều chỉnh thanh **"Độ dài trả lời tối đa"**
- 50-100: Ngắn gọn
- 200-300: Chi tiết vừa
- 400-500: Rất chi tiết

### Lỗi 4: AI reply không đúng tính cách

**Cách fix:**
- Thử personality khác
- "Thân thiện" → "Chuyên nghiệp" → "Thoải mái"...
- Mỗi personality có phong cách khác nhau

## 💡 Tips & Tricks

### Mẹo 1: Tiết kiệm quota

- ✅ Dùng mode "Thông minh" thay vì "Luôn luôn"
- ✅ Chỉ bật AI cho nhóm/user quan trọng (dùng Whitelist)
- ✅ Set độ dài 100-150 ký tự thay vì 500

### Mẹo 2: Tăng chất lượng reply

- ✅ Để AI nhớ context (không xóa tin nhắn thường xuyên)
- ✅ Chọn personality phù hợp với đối tượng
- ✅ Set độ dài phù hợp (không quá ngắn/dài)

### Mẹo 3: Kết hợp AI + Preset

- **Preset messages:** Dùng cho greeting, thông báo đơn giản
- **AI:** Dùng cho câu hỏi phức tạp, tư vấn
- **Setup:** Bật cả AI và "Random Preset" cùng lúc
  - Tin đơn giản → Preset
  - Câu hỏi phức tạp → AI

### Mẹo 4: Test trước khi deploy

1. Bật AI mode "Thông minh"
2. Gửi thử vài tin nhắn test
3. Check quality của AI reply
4. Điều chỉnh personality/độ dài nếu cần
5. Deploy chính thức

## 📈 Monitor sử dụng

### Check quota đã dùng:

1. Vào https://aistudio.google.com/app/apikey
2. Click vào API key đang dùng
3. Xem **"Usage"** tab

### Dấu hiệu hết quota:

- Bot reply bằng preset thay vì AI
- Logs hiển thị: "Xin lỗi, tôi không thể trả lời lúc này"

### Khi cần nhiều quota hơn:

- **Option 1:** Tạo thêm API key (switch giữa các keys)
- **Option 2:** Upgrade lên Gemini Pro (paid plan)
- **Option 3:** Dùng mode "Chỉ câu hỏi" để giảm usage

## 🎯 Best Practices

### ✅ Nên làm:

1. ✅ Test kỹ trước khi deploy production
2. ✅ Bật AI cho tin cá nhân, tắt cho group spam
3. ✅ Chọn personality phù hợp với brand/tone
4. ✅ Monitor quota usage định kỳ
5. ✅ Backup `.env` file (có API key)

### ❌ Không nên:

1. ❌ Share API key công khai
2. ❌ Bật "Luôn luôn" cho group đông (tốn quota)
3. ❌ Set độ dài 500 cho mọi trường hợp
4. ❌ Để AI reply sticker/image (AI sẽ bỏ qua)
5. ❌ Quên monitor quota (có thể hết bất ngờ)

## 🎉 Tổng kết

AI Smart Reply là công cụ mạnh mẽ giúp bot của bạn:
- 🧠 Thông minh hơn
- 💬 Tự nhiên hơn
- 🎭 Cá nhân hóa
- ⚡ Tiết kiệm thời gian

**Hãy setup ngay hôm nay và trải nghiệm!** 🚀

---

**Cần hỗ trợ?**
- 📖 Đọc docs: `md/AI_SMART_REPLY.md`
- 🔧 Check code: `lib/ai-reply.ts`
- 💬 Hỏi trong group support
