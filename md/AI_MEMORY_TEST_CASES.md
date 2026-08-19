# 🧪 Test Cases - AI Memory Usage Rules

## ✅ Mục tiêu
AI chỉ sử dụng Memory (lịch sử trò chuyện) khi **THỰC SỰ LIÊN QUAN** đến tin nhắn hiện tại.

**KHÔNG** được tự động nhắc lại thông tin cũ khi người dùng chào hỏi hoặc nói chuyện về chủ đề khác.

---

## 📋 Test Case 1: Lời chào (alo, hi, hello)

### Memory:
```
- Phong: "Hôm qua mình nói sẽ đi chơi"
- Bot: "Ồ vậy à! Vui chơi nhé!"
- Phong: "Cảm ơn!"
```

### Tin nhắn mới:
```
Phong: "alo"
```

### ❌ Kết quả SAI (không mong muốn):
```
Bot: "Alooo~ Hôm qua cậu nói sẽ đi chơi mà, hôm nay đi chưa? 😆"
```
→ Tự động nhắc lại Memory khi không được hỏi

### ✅ Kết quả ĐÚNG (mong muốn):
```
Bot: "Alooo~ Có gì không? 😆"
```
hoặc
```
Bot: "Alo! Tớ đây nè 👋"
```
→ Chỉ chào lại tự nhiên, KHÔNG nhắc Memory

---

## 📋 Test Case 2: Lời chào đơn giản (hi, hello)

### Memory:
```
- Phong: "Tớ đang làm website"
- Bot: "Ồ hay đấy! Làm website gì vậy?"
- Phong: "Website bán hàng"
```

### Tin nhắn mới:
```
Phong: "hello"
```

### ❌ Kết quả SAI:
```
Bot: "Hello~ Website làm đến đâu rồi? 😄"
```

### ✅ Kết quả ĐÚNG:
```
Bot: "Hello~ Tớ đây 👋"
```
hoặc
```
Bot: "Hi! Có gì không? 😊"
```

---

## 📋 Test Case 3: Câu hỏi KHÔNG liên quan đến Memory

### Memory:
```
- Phong: "Tớ thích anime"
- Bot: "Ồ anime gì?"
- Phong: "Naruto, One Piece"
```

### Tin nhắn mới:
```
Phong: "Cậu ăn cơm chưa?"
```

### ❌ Kết quả SAI:
```
Bot: "Chưa ăn nha! Nãy cậu nói thích anime, có anime nào hay giới thiệu không? 😄"
```
→ Tự động lôi Memory ra khi không liên quan

### ✅ Kết quả ĐÚNG:
```
Bot: "Ăn rồi á! Cậu thì sao? 😊"
```
→ Trả lời trực tiếp câu hỏi, bỏ qua Memory về anime

---

## 📋 Test Case 4: Câu hỏi CÓ liên quan đến Memory ✅

### Memory:
```
- Phong: "Cuối tuần này tớ sẽ đi Đà Lạt"
- Bot: "Ôi hay quá! Đi với ai vậy?"
- Phong: "Đi với gia đình"
```

### Tin nhắn mới:
```
Phong: "Cuối tuần cậu có đi chơi không?"
```

### ✅ Kết quả ĐÚNG:
```
Bot: "Ủa cậu không nhớ à? Cuối tuần này cậu bảo đi Đà Lạt với gia đình mà! 😄"
```
→ Memory có liên quan TRỰC TIẾP → Sử dụng Memory

---

## 📋 Test Case 5: Tin nhắn ngắn (ok, ừ, haha)

### Memory:
```
- Phong: "Tớ đang học lập trình"
- Bot: "Ồ hay đấy! Học ngôn ngữ gì?"
- Phong: "Python"
```

### Tin nhắn mới:
```
Phong: "ok"
```

### ❌ Kết quả SAI:
```
Bot: "Okii~ Python học đến đâu rồi? 😆"
```

### ✅ Kết quả ĐÚNG:
```
Bot: "Ok nha! 👍"
```
hoặc
```
Bot: "Okii~ 😊"
```

---

## 📋 Test Case 6: Tin nhắn cảm ơn

### Memory:
```
- Phong: "Mai tớ đi du lịch"
- Bot: "Ồ đi đâu vậy?"
- Phong: "Đi Nha Trang"
```

### Tin nhắn mới:
```
Phong: "cảm ơn nha"
```

### ❌ Kết quả SAI:
```
Bot: "Không có gì! Đi Nha Trang vui chơi nhé! 😄"
```
→ Tự động nhắc lại Nha Trang khi không được hỏi

### ✅ Kết quả ĐÚNG:
```
Bot: "Không có gì đâu! 😊"
```
hoặc
```
Bot: "Hehe không có gì nha! 💕"
```

---

## 📋 Test Case 7: Câu hỏi về chủ đề mới (KHÔNG liên quan Memory)

### Memory:
```
- Phong: "Tớ vừa mua xe mới"
- Bot: "Ôi chúc mừng! Xe gì vậy?"
- Phong: "Honda Wave"
```

### Tin nhắn mới:
```
Phong: "Trời hôm nay đẹp quá!"
```

### ❌ Kết quả SAI:
```
Bot: "Ừa đẹp thật! Đi chạy xe mới chưa? 😄"
```

### ✅ Kết quả ĐÚNG:
```
Bot: "Ừa! Trời đẹp quá đi! ☀️"
```
→ Trả lời về thời tiết, KHÔNG nhắc đến xe

---

## 📋 Test Case 8: Sticker/Emoji (KHÔNG có text)

### Memory:
```
- Phong: "Tớ đang học tiếng Nhật"
- Bot: "Ồ hay đấy! Học ở đâu vậy?"
- Phong: "Học online"
```

### Tin nhắn mới:
```
Phong: [gửi sticker 👍]
```

### ❌ Kết quả SAI:
```
Bot: "Haha cảm ơn nha! Học tiếng Nhật thế nào rồi? 😄"
```

### ✅ Kết quả ĐÚNG:
```
Bot: "Haha cảm ơn nha! 😄"
```
hoặc
```
Bot: "👍✨"
```
→ Preset message ngắn gọn, KHÔNG AI reply dài

---

## 📋 Test Case 9: Câu hỏi về Memory cụ thể ✅

### Memory:
```
- Phong: "Hôm qua tớ gặp Hùng"
- Bot: "Ồ Hùng là ai vậy?"
- Phong: "Bạn học cũ"
```

### Tin nhắn mới:
```
Phong: "Hôm qua tớ gặp ai mà cậu quên rồi?"
```

### ✅ Kết quả ĐÚNG:
```
Bot: "Ủa hôm qua cậu gặp Hùng - bạn học cũ mà! 😄"
```
→ Tin nhắn hỏi về Memory → Sử dụng Memory

---

## 📋 Test Case 10: Nhiều chủ đề trong Memory

### Memory:
```
- Phong: "Tớ thích Pizza"
- Bot: "Ồ hay! Tớ cũng thích"
- Phong: "Mai tớ đi xem phim"
- Bot: "Xem phim gì vậy?"
- Phong: "Avatar"
```

### Tin nhắn mới:
```
Phong: "đâu rồi?"
```

### ❌ Kết quả SAI:
```
Bot: "Tớ đây nè! Mai đi xem Avatar à? Pizza ăn chưa? 😄"
```
→ Lôi tất cả Memory ra

### ✅ Kết quả ĐÚNG:
```
Bot: "Tớ đây nè! Có gì không? 😊"
```
→ Trả lời ngắn gọn, KHÔNG kể lại Memory

---

## ✅ TÓM TẮT QUY TẮC

| Tình huống | Memory liên quan? | Hành động |
|-----------|------------------|-----------|
| Lời chào (alo, hi, hello) | ❌ Không | Chào lại tự nhiên, BỎ QUA Memory |
| Tin nhắn ngắn (ok, ừ, haha) | ❌ Không | Reply ngắn, BỎ QUA Memory |
| Câu hỏi về chủ đề mới | ❌ Không | Trả lời chủ đề mới, BỎ QUA Memory |
| Câu hỏi về thông tin trong Memory | ✅ Có | SỬ DỤNG Memory để trả lời |
| Sticker/Emoji | ❌ Không | Preset message ngắn |
| Cảm ơn | ❌ Không | Reply "Không có gì", BỎ QUA Memory |

---

## 🎯 NGUYÊN TẮC VÀNG

1. **Ưu tiên tin nhắn hiện tại** - Luôn trả lời TIN NHẮN MỚI NHẤT trước
2. **Memory chỉ là tham khảo** - Không phải nội dung bắt buộc
3. **Không suy diễn** - Memory "đi chơi" ≠ đang đi chơi / chuẩn bị đi / đã đi
4. **Không kể lại** - Memory để nhớ, không phải để kể
5. **Khi nghi ngờ → Bỏ qua** - Không chắc liên quan → ĐỪNG dùng Memory

---

## 🧪 CÁCH TEST

1. **Setup Memory**: Tạo lịch sử với thông tin cụ thể (đi chơi, làm việc, sở thích...)
2. **Gửi tin nhắn không liên quan**: "alo", "hi", "cảm ơn", "ok"
3. **Kiểm tra kết quả**:
   - ✅ PASS: AI chào lại tự nhiên, KHÔNG nhắc Memory
   - ❌ FAIL: AI tự động kể lại Memory khi không được hỏi

4. **Gửi tin nhắn có liên quan**: "Cậu có đi chơi không?"
5. **Kiểm tra kết quả**:
   - ✅ PASS: AI sử dụng Memory để trả lời
   - ❌ FAIL: AI không nhớ thông tin

---

**Cập nhật**: 2026-08-19
**Trạng thái**: ✅ Đã implement trong `lib/ai-reply.ts`
