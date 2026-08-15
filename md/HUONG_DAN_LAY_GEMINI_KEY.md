# 🔑 Hướng dẫn lấy Gemini API Key

## ⚠️ Vấn đề của bạn

API key trong `.env` **SAI ĐỊNH DẠNG**:
```
❌ AQ.Ab8RN6J6fg26ghG6KLa518Ytdb3qyA4ZN275xXmnNG61anvaxQ
```

Đây là key của Zalo hoặc dịch vụ khác, **KHÔNG PHẢI Gemini**.

Key Gemini phải có dạng:
```
✅ AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 🚀 Lấy key đúng trong 2 phút

### 1️⃣ Mở link này:
👉 **https://aistudio.google.com/app/apikey**

### 2️⃣ Đăng nhập Google
- Dùng Gmail bất kỳ
- Miễn phí 100%, không cần thẻ

### 3️⃣ Click "Create API Key"
- Nút màu xanh
- Chọn project (hoặc tạo mới)

### 4️⃣ Copy key
- Key sẽ hiện ra dạng: `AIzaSyBxxxxxxxxx...`
- Click "Copy"

### 5️⃣ Dán vào file `.env`
Mở file `.env` trong project, thay dòng này:

**CŨ:**
```env
GEMINI_API_KEY=AQ.Ab8RN6J6fg26ghG6KLa518Ytdb3qyA4ZN275xXmnNG61anvaxQ
```

**MỚI:**
```env
GEMINI_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```
(Dán key bạn vừa copy vào)

### 6️⃣ Restart server
```bash
# Dừng server (Ctrl+C)
# Chạy lại
npm run dev
```

### 7️⃣ Bật AI và test
1. Vào Dashboard (localhost:3000)
2. Bật **AI Smart Reply** (toggle xanh)
3. Gửi tin: "Xin chào"
4. ✅ Bot reply với style Monica!

---

## 💬 Ví dụ AI reply

**5 tin preset của bạn:**
```
1. E-Eto... tôi là Monica Everett... 🌸✨🥺🤍
2. U-Um... nếu tôi trốn sau cánh cửa... 🚪🥺💦
3. Fuee... c-chuyện này khó quá... (՚﹏՚)💦
4. A-Anou... đừng nói cho mọi người biết nhé... 🥺🌸🤍✨
5. S-Sono... nếu có thể giúp được... 🍀🤍✨
```

**Người gửi:** "Xin chào mọi người"

**Bot (với AI học Monica style):**
> "A-Anou... xin chào mọi người ạ... tôi là Monica... rất vui được gặp các bạn... 🥺🌸✨"

**Người gửi:** "Giúp tôi cái này được không?"

**Bot:**
> "E-Eto... tôi sẽ cố gắng giúp bạn... xin hãy chờ một chút nhé... 🥺💦"

➡️ **AI học được:**
- Cách nói: "A-Anou...", "E-Eto...", "Fuee..."
- Tone nhút nhát, lịch sự
- Emoji: 🥺🌸✨💦
- Style Monica Everett

---

## ❌ Key SAI vs ✅ Key ĐÚNG

### ❌ Không phải Gemini key:
```
AQ.Ab8RN6J6... (Zalo)
sk-xxxxxxxx... (OpenAI)
ya29.xxxxxxx (Google OAuth)
```

### ✅ Gemini key đúng:
```
AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
AIzaSyC6J9K8L2M4N5P7Q8R9S0T1U2V3W4X5Y6Z
AIzaSyD123456789abcdefghijklmnopqrstuvwxyz
```

**Đặc điểm:**
- Bắt đầu: `AIzaSy`
- Dài: ~39 ký tự
- Chỉ có chữ + số

---

## 🆓 Miễn phí mãi mãi

Gemini 2.5 Flash Lite **FREE tier:**
- ✅ 1 triệu tokens/ngày (~2000 tin reply)
- ✅ 15 requests/phút
- ✅ Không cần thẻ tín dụng
- ✅ Dùng mãi không hết hạn

---

## 🐛 Gặp lỗi?

### "GEMINI_API_KEY not configured"
➡️ **Fix:** Đã restart server chưa? (`npm run dev`)

### "API error: 401 Unauthorized"
➡️ **Fix:** Key sai. Lấy key mới tại link trên.

### Bot không reply AI
➡️ **Check:**
1. Toggle AI có BẬT không?
2. Key có đúng format `AIzaSy...` không?
3. Đã restart server chưa?

---

## ✅ Checklist

- [ ] Vào https://aistudio.google.com/app/apikey
- [ ] Đăng nhập Google
- [ ] Tạo API key
- [ ] Copy key (bắt đầu `AIzaSy`)
- [ ] Dán vào `.env`
- [ ] Restart server
- [ ] Bật AI Smart Reply
- [ ] Test: "Xin chào"
- [ ] ✅ Bot reply style Monica!

---

## 📸 Screenshot mẫu

**Key đúng trông như này:**
```
AIzaSyBnRjK7fMpQxWvUzYtCs9dE1fG2hI3jK4l
```

**Trong file `.env`:**
```env
GEMINI_API_KEY=AIzaSyBnRjK7fMpQxWvUzYtCs9dE1fG2hI3jK4l
```

---

🎉 **Làm theo 7 bước trên là xong! AI sẽ reply Monica style ngay!**
