# 🧪 Test Smart Mode AI Trigger

## ✅ ĐÃ SỬA: Ngưỡng tin dài từ 10 từ → 3 từ

## Test Cases

### Test 1: Tin nhắn ngắn (1 ký tự) → ❌ KHÔNG dùng AI
| Tin nhắn | Số từ | Dùng AI? | Lý do |
|----------|-------|----------|-------|
| "k" | 1 | ❌ | < 2 ký tự (blocked) |

### Test 2: Tin nhắn ngắn (2 ký tự, không có keyword) → ❌ KHÔNG dùng AI
| Tin nhắn | Số từ | Dùng AI? | Lý do |
|----------|-------|----------|-------|
| "ok" | 1 | ❌ | Không match từ hỏi/keyword, < 3 từ |
| "uh" | 1 | ❌ | Không match từ hỏi/keyword, < 3 từ |
| "ờ" | 1 | ❌ | Không match điều kiện nào |

### Test 3: Tin nhắn ngắn (2 ký tự, CÓ keyword) → ✅ DÙNG AI
| Tin nhắn | Số từ | Dùng AI? | Lý do |
|----------|-------|----------|-------|
| "ts" | 1 | ✅ | Có "ts" trong questionWords |
| "ơi" | 1 | ✅ | Có "ơi" trong aiKeywords |
| "gt" | 1 | ✅ | Có "gt" trong aiKeywords |

### Test 4: Tin nhắn 3 từ trở lên → ✅ DÙNG AI
| Tin nhắn | Số từ | Dùng AI? | Lý do |
|----------|-------|----------|-------|
| "em ơi anh yêu em" | 5 | ✅ | >= 3 từ ✅ |
| "anh yêu em" | 3 | ✅ | >= 3 từ ✅ |
| "đi ăn cơm" | 3 | ✅ | >= 3 từ ✅ |
| "ăn cơm" | 2 | ❌ | < 3 từ |
| "yêu em" | 2 | ❌ | < 3 từ |

### Test 5: Tin nhắn có câu hỏi → ✅ DÙNG AI (bất kể số từ)
| Tin nhắn | Số từ | Dùng AI? | Lý do |
|----------|-------|----------|-------|
| "Sao thế?" | 2 | ✅ | Có "sao" |
| "Như thế nào?" | 3 | ✅ | Có "như thế nào" |
| "Khi nào đi?" | 3 | ✅ | Có "khi nào" |
| "Em ơi?" | 2 | ✅ | Có "?" |

### Test 6: Tin nhắn có từ khóa đặc biệt → ✅ DÙNG AI (bất kể số từ)
| Tin nhắn | Số từ | Dùng AI? | Lý do |
|----------|-------|----------|-------|
| "Giúp em" | 2 | ✅ | Có "giúp" |
| "Help me" | 2 | ✅ | Có "help" |
| "Giải thích đi" | 3 | ✅ | Có "giải thích" |
| "Hướng dẫn" | 2 | ✅ | Có "hướng dẫn" |

---

## 🧪 Test thực tế

### Cách test:

1. Đăng nhập vào bot
2. Bật AI Smart Reply:
   - Vào **Cài đặt** → Tab **🤖 AI Smart Reply**
   - **Kích hoạt AI**: BẬT ✅
   - **Chế độ kích hoạt AI**: **🧠 Thông minh**
   - Nhấn **Lưu cài đặt**

3. Gửi tin nhắn test từ Zalo account khác:

```
Test 1: "k"
→ Bot reply: Preset message (< 2 ký tự) ❌

Test 2: "ok"
→ Bot reply: Preset message (không match điều kiện) ❌

Test 3: "uh"
→ Bot reply: Preset message (không match điều kiện) ❌

Test 4: "ts"
→ Bot reply: AI (có "ts" = tại sao) ✅

Test 5: "ơi"
→ Bot reply: AI (có "ơi" trong keywords) ✅

Test 6: "anh yêu em"
→ Bot reply: AI (3 từ) ✅

Test 7: "em ơi anh yêu em"
→ Bot reply: AI (5 từ + có "em ơi") ✅

Test 8: "ăn cơm"
→ Bot reply: Preset message (2 từ, không đủ 3) ❌

Test 9: "đi ăn cơm"
→ Bot reply: AI (3 từ) ✅

Test 10: "Sao thế?"
→ Bot reply: AI (có "sao") ✅

Test 11: "Giúp em"
→ Bot reply: AI (có "giúp") ✅
```

### Check logs để verify:

Mở terminal/console, xem logs:

```bash
# Khi dùng AI, sẽ thấy:
🤖 [AI] Generated reply (XXX tokens): [reply text]...

# Khi KHÔNG dùng AI, sẽ thấy:
📤 [Bot] Replying with preset message: [preset text]
```

---

## 📊 So sánh TRƯỚC vs SAU

| Tin nhắn | TRƯỚC (10 từ) | SAU (3 từ) |
|----------|---------------|------------|
| "k" (1 ký tự) | ❌ Preset | ❌ Preset |
| "ok" (2 ký tự, no keyword) | ❌ Preset | ❌ Preset |
| "ts" (2 ký tự, keyword) | ❌ Preset | ✅ AI |
| "ơi" (2 ký tự, keyword) | ❌ Preset | ✅ AI |
| "ăn cơm" (2 từ) | ❌ Preset | ❌ Preset |
| "anh yêu em" (3 từ) | ❌ Preset | ✅ AI |
| "đi ăn cơm" (3 từ) | ❌ Preset | ✅ AI |
| "em ơi anh yêu em" (5 từ) | ❌ Preset | ✅ AI |
| "Hôm nay em đi ăn với ai?" (7 từ) | ❌ Preset | ✅ AI |
| "Hôm nay em đi làm về muộn lắm" (8 từ) | ❌ Preset | ✅ AI |
| "Hôm nay em đi làm về muộn lắm em ơi em có đợi anh không?" (14 từ) | ✅ AI | ✅ AI |

---

## 🔍 Debug: Check xem Smart Mode có hoạt động không

### Step 1: Check settings trong database
```sql
SELECT 
  user_id,
  ai_enabled,
  ai_trigger_mode,
  ai_personality,
  ai_max_length
FROM user_settings
WHERE user_id = 'c3d54091-4a58-4a48-be46-51b11f767af7';
```

Phải thấy:
- `ai_enabled = true`
- `ai_trigger_mode = 'smart'`

### Step 2: Check settings trong bot_settings
```sql
SELECT 
  user_id,
  enabled,
  settings->>'aiEnabled' as ai_enabled,
  settings->>'aiTriggerMode' as ai_trigger_mode
FROM bot_settings
WHERE user_id = (
  SELECT id FROM users 
  WHERE session_id = 'YOUR_SESSION_ID'
);
```

### Step 3: Test với logs
Gửi tin: **"em ơi anh yêu em"**

Xem logs phải có:
```
📨 [Listener] New message from [Sender]: em ơi anh yêu em
🤖 [AI] Generated reply (XXX tokens): [AI reply]...
📤 [Bot] Sent reply to [ThreadId]
```

Nếu KHÔNG có log `🤖 [AI]` → Smart mode không hoạt động

---

## ✅ Kết quả mong đợi

Sau khi sửa:
- ✅ "em ơi anh yêu em" → Dùng AI
- ✅ "anh yêu em" → Dùng AI  
- ✅ "đi ăn cơm" → Dùng AI
- ❌ "ăn cơm" → Preset message (chỉ 2 từ)
- ✅ Mọi tin >= 3 từ → Dùng AI

**Nếu vẫn không hoạt động → Check logs và database settings!**
