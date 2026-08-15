# 🔑 Lấy Gemini API Key

## ⚠️ Vấn đề hiện tại

API key trong `.env` của bạn **KHÔNG ĐÚNG FORMAT**:
```
❌ AQ.Ab8RN6J6fg26ghG6KLa518Ytdb3qyA4ZN275xXmnNG61anvaxQ
```

Đây là Zalo API key hoặc key khác, **KHÔNG PHẢI Gemini API key**.

Gemini API key phải có format:
```
✅ AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 🚀 Cách lấy Gemini API Key (FREE)

### Bước 1: Truy cập Google AI Studio
👉 **https://aistudio.google.com/app/apikey**

### Bước 2: Đăng nhập
- Dùng Google account bất kỳ
- Miễn phí, không cần thẻ tín dụng

### Bước 3: Tạo API Key
1. Click nút **"Create API Key"** (màu xanh)
2. Chọn project (hoặc tạo mới nếu chưa có)
3. Chờ ~5 giây

### Bước 4: Copy API Key
- API key sẽ hiển thị dạng: `AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
- Click **"Copy"** để copy

### Bước 5: Update file `.env`
Mở file `.env` và thay thế:

**Từ:**
```env
GEMINI_API_KEY=AQ.Ab8RN6J6fg26ghG6KLa518Ytdb3qyA4ZN275xXmnNG61anvaxQ
```

**Thành:**
```env
GEMINI_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```
(Thay `AIzaSyBxxxxx...` bằng key bạn vừa copy)

### Bước 6: Restart server
```bash
# Stop server (Ctrl+C trong terminal)
# Start lại
npm run dev
```

### Bước 7: Test AI
1. Vào Dashboard
2. Bật **AI Smart Reply** (toggle ON)
3. Gửi tin nhắn test: "Xin chào"
4. ✅ Bot sẽ reply với AI, học phong cách Monica từ preset!

---

## 📝 Example

**5 Preset Messages của bạn:**
```
1. "E-Eto... tôi là Monica Everett... xin hãy chiếu cố cho tôi từ bây giờ nhé... 🌸✨🥺🤍"
2. "U-Um... nếu tôi trốn sau cánh cửa thì xin đừng kéo tôi ra nhé... 🚪🥺💦"
3. "Fuee... c-chuyện này khó quá đi mất... (՚﹏՚)💦"
4. "A-Anou... đừng nói cho mọi người biết nhé... tôi tin bạn đó... 🥺🌸🤍✨"
5. "S-Sono... nếu có thể giúp được mọi người thì tôi rất vui... 🍀🤍✨"
```

**Tin nhắn đến:** "Xin chào mọi người"

**AI reply (học từ preset):**
> "A-Anou... xin chào mọi người ạ... tôi là Monica... rất vui được gặp các bạn... 🥺🌸✨"

➡️ AI học được:
- "A-Anou..." (cách bắt đầu câu)
- Tone nhút nhát, lịch sự
- Emoji: 🥺🌸✨
- Style Monica Everett

---

## ⚠️ Lưu ý quan trọng

### ❌ Key KHÔNG hợp lệ:
```
AQ.Ab8RN6J6fg26ghG6KLa518Ytdb3qyA4ZN275xXmnNG61anvaxQ (Zalo key)
sk-xxxxxxxxxxxxxxxxxxxxx (OpenAI key)
AIzaSyCDEF... (Google Maps key)
```

### ✅ Key hợp lệ (Gemini):
```
AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
AIzaSyC6J9K8L2M4N5P7Q8R9S0T1U2V3W4X5Y6Z
AIzaSyD123456789abcdefghijklmnopqrstuvwxyz
```

**Đặc điểm:** 
- Bắt đầu bằng `AIzaSy`
- Dài ~39 ký tự
- Chỉ chứa chữ, số (không có dấu chấm hoặc gạch ngang)

---

## 🆓 Free Tier

**Gemini 2.5 Flash Lite miễn phí:**
- ✅ 1M tokens/ngày (~2000-3000 replies)
- ✅ 15 requests/phút
- ✅ Không cần thẻ tín dụng
- ✅ Không giới hạn thời gian

---

## 🐛 Troubleshooting

### Lỗi: "GEMINI_API_KEY not configured"
**Fix:** Đảm bảo đã restart server sau khi update `.env`

### Lỗi: "API error: 401 Unauthorized"
**Fix:** API key sai hoặc không hợp lệ. Lấy key mới tại https://aistudio.google.com/app/apikey

### AI không reply
**Fix:** 
1. Check toggle AI Smart Reply có BẬT không
2. Check log có dòng `🤖 [AI] Generated reply` không
3. Check AI Trigger Mode = "Smart" hoặc "Always"

---

## ✅ Checklist

- [ ] Truy cập https://aistudio.google.com/app/apikey
- [ ] Đăng nhập Google account
- [ ] Tạo API key mới
- [ ] Copy key (format: `AIzaSyBxxxxx...`)
- [ ] Paste vào file `.env`
- [ ] Restart server (`npm run dev`)
- [ ] Bật AI Smart Reply trên Dashboard
- [ ] Test với tin nhắn: "Xin chào"
- [ ] ✅ Bot reply với style Monica!

---

🎉 **Sau khi có key đúng, AI sẽ học Monica style và reply tự nhiên!**
