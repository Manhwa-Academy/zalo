# 🧪 Test Gemini API với Auth Key mới

## ❌ Lỗi hiện tại:

```
Request had invalid authentication credentials. 
Expected OAuth 2 access token, login cookie or other valid authentication credential.
```

➡️ Auth Key `AQ.` không được chấp nhận bởi API endpoint!

---

## 🔧 Đã thử:

### Fix 1: Thêm header `x-goog-api-key`
```typescript
headers: {
  'Content-Type': 'application/json',
  'x-goog-api-key': apiKey, // Support Auth Key
}
```

**Status:** Testing...

---

## 🎯 Nếu vẫn lỗi, thử các cách sau:

### Option 1: Đổi sang model Gemini 1.5 Flash
Model cũ hơn, có thể support Auth Key tốt hơn.

**Endpoint:**
```
https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent
```

### Option 2: Tạo API Key cũ (AIzaSy format)
Nếu Google AI Studio vẫn cho phép tạo Standard API Key (format `AIzaSy...`), tạo key cũ.

**Cách tạo:**
1. https://aistudio.google.com/app/apikey
2. Click "Create API Key"
3. Chọn "**Create API key in existing project**"
4. Nếu có option chọn key type, chọn "Standard API Key"

### Option 3: Dùng SDK chính thức `@google/generative-ai`
Thay vì gọi REST API trực tiếp, dùng SDK:

```bash
npm install @google/generative-ai
```

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(apiKey) // Support AQ. key
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })
```

SDK tự động xử lý Auth Key mới!

---

## 📝 Test Steps:

### Step 1: Restart server
```bash
npm run dev
```

### Step 2: Test AI reply
Gửi: "Xin chào, bạn có khỏe không?"

### Step 3: Check log
**✅ Success:**
```
🤖 [AI] Generated reply (XXX tokens): A-Anou...
```

**❌ Still failing:**
```
❌ [AI Reply] Error: Request had invalid authentication credentials
```

---

## 🚀 Nếu vẫn lỗi:

Tôi sẽ:
1. Đổi sang Gemini 1.5 Flash (stable hơn)
2. Hoặc cài SDK `@google/generative-ai`

---

⏳ **Testing now...**
