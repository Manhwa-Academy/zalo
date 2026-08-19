# 🧪 Test AI Personal Settings

## ✅ Checklist kiểm tra chức năng

### 1. Load Settings
```javascript
// Test GET /api/user/ai-profile
fetch('/api/user/ai-profile')
  .then(r => r.json())
  .then(data => {
    console.log('📥 AI Profile:', data.profile)
    console.log('✅ Display Name:', data.profile.zalo_display_name)
    console.log('✅ Nicknames:', data.profile.nicknames)
    console.log('✅ Reply Mode:', data.profile.ai_reply_mode)
    console.log('✅ Context Length:', data.profile.context_length)
    console.log('✅ Remember Context:', data.profile.remember_context)
  })
```

**Expected**:
- `success: true`
- Profile object với tất cả fields
- Nếu chưa có profile → tự động tạo mới với default values

---

### 2. Save Settings
```javascript
// Test POST /api/user/ai-profile
fetch('/api/user/ai-profile', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    zaloDisplayName: 'Hoàng Kiều Phong',
    nicknames: ['Phong', 'HKP', 'Kiều Phong'],
    aiReplyMode: 'smart_auto', // mention_only | name_detect | smart_auto
    contextLength: 50,
    rememberContext: true
  })
}).then(r => r.json()).then(console.log)
```

**Expected**:
- `success: true`
- Profile updated với values mới

---

### 3. Test Mention Detection

#### Case 1: @Mention (mention_only mode)
```javascript
const testMessage = '@Hoàng Kiều Phong bạn ở đâu rồi?'
const userProfile = {
  zaloDisplayName: 'Hoàng Kiều Phong',
  nicknames: ['Phong', 'HKP'],
  aiReplyMode: 'mention_only',
  contextLength: 20,
  rememberContext: true
}

// Expected: TRUE (có @mention)
```

#### Case 2: Name in message (name_detect mode)
```javascript
const testMessage = 'Phong ơi, mai đi chơi không?'
const userProfile = {
  zaloDisplayName: 'Hoàng Kiều Phong',
  nicknames: ['Phong', 'HKP'],
  aiReplyMode: 'name_detect',
  contextLength: 20,
  rememberContext: true
}

// Expected: TRUE (có tên "Phong" trong tin nhắn)
```

#### Case 3: Smart auto (smart_auto mode)
```javascript
const testMessage = 'Mọi người có ai biết cách fix lỗi này không?'
const userProfile = {
  zaloDisplayName: 'Hoàng Kiều Phong',
  nicknames: ['Phong', 'HKP'],
  aiReplyMode: 'smart_auto',
  contextLength: 20,
  rememberContext: true
}

// Expected: TRUE (câu hỏi + mode smart_auto)
```

#### Case 4: Reply to user's message
```javascript
const testMessage = 'Oke, tôi hiểu rồi'
const quote = {
  fromName: 'Hoàng Kiều Phong',
  content: 'Mai mình đi chơi nhé'
}
const userProfile = {
  zaloDisplayName: 'Hoàng Kiều Phong',
  nicknames: [],
  aiReplyMode: 'mention_only',
  contextLength: 20,
  rememberContext: true
}

// Expected: TRUE (reply đến tin nhắn của user)
```

---

### 4. Test UI Component

#### 4.1 Component renders correctly
1. Mở Dashboard
2. Scroll xuống phần "🤖 Cài đặt AI Cá nhân"
3. Kiểm tra:
   - ✅ Display name field hiển thị đúng
   - ✅ Nicknames list hiển thị đúng
   - ✅ AI Reply Mode radio buttons hoạt động
   - ✅ Context Length slider (5-50)
   - ✅ Remember Context checkbox

#### 4.2 Add/Remove Nickname
1. Nhập nickname vào input: "Phong"
2. Click "+ Thêm"
3. Kiểm tra:
   - ✅ Nickname xuất hiện trong list
   - ✅ Input bị clear
4. Click ✕ trên nickname
5. Kiểm tra:
   - ✅ Nickname bị xóa khỏi list

#### 4.3 Change AI Reply Mode
1. Click radio button "📍 Chỉ khi @mention hoặc reply"
2. Kiểm tra: Radio selected
3. Click radio button "🔍 Khi thấy tên trong tin nhắn"
4. Kiểm tra: Radio selected, previous unselected
5. Click radio button "🧠 Thông minh (tự động)"
6. Kiểm tra: Radio selected

#### 4.4 Adjust Context Length
1. Kéo slider từ 20 → 50
2. Kiểm tra:
   - ✅ Số hiển thị bên cạnh thay đổi
   - ✅ Value = 50

#### 4.5 Toggle Remember Context
1. Click checkbox "Nhớ thông tin trong hội thoại"
2. Kiểm tra: Checkbox checked/unchecked

#### 4.6 Save Settings
1. Thay đổi một vài settings
2. Click "Lưu cài đặt"
3. Kiểm tra:
   - ✅ Button hiển thị "Đang lưu..."
   - ✅ Success modal xuất hiện: "Đã lưu cài đặt AI cá nhân của bạn."
   - ✅ Click "OK" → Modal đóng

#### 4.7 Reload & Verify
1. Reload page
2. Scroll lại xuống "🤖 Cài đặt AI Cá nhân"
3. Kiểm tra:
   - ✅ Settings đã lưu vẫn còn đúng
   - ✅ Nicknames vẫn đầy đủ
   - ✅ AI Reply Mode đúng
   - ✅ Context Length đúng
   - ✅ Remember Context đúng

---

### 5. Test Database

#### 5.1 Check profile exists
```sql
SELECT * FROM user_ai_profiles WHERE user_id = '<your_user_id>';
```

**Expected**:
- 1 row với đầy đủ thông tin
- `zalo_display_name` đúng
- `nicknames` array đúng
- `ai_reply_mode` đúng ('mention_only', 'name_detect', 'smart_auto')
- `context_length` số đúng (5-50)
- `remember_context` boolean đúng

#### 5.2 Check default values
```sql
-- Nếu chưa có profile, hệ thống sẽ tự tạo với:
-- ai_reply_mode = 'mention_only'
-- context_length = 20
-- remember_context = true
-- nicknames = []
```

---

### 6. Test Integration với Listener

#### 6.1 Test mention trong group
1. Trong group, gửi tin nhắn: "@Hoàng Kiều Phong bạn ở đâu?"
2. Kiểm tra console logs:
   ```
   👤 [AI Personal] Checking if should reply for: Hoàng Kiều Phong
   ✅ [AI Reply] @Mention detected: Hoàng Kiều Phong
   ✅ [AI Personal] Replying on behalf of Hoàng Kiều Phong
   ✅ [AI Personal] Generated reply: "<AI response>"
   ```
3. Kiểm tra: AI reply được gửi

#### 6.2 Test nickname detection (name_detect mode)
1. Set AI Reply Mode = "name_detect"
2. Trong group, gửi: "Phong ơi, mai đi chơi không?"
3. Kiểm tra console:
   ```
   ✅ [AI Reply] Nickname detected in message: Phong
   ✅ [AI Personal] Replying on behalf of Hoàng Kiều Phong
   ```
4. Kiểm tra: AI reply được gửi

#### 6.3 Test smart auto mode
1. Set AI Reply Mode = "smart_auto"
2. Trong group, gửi: "Có ai biết cách fix lỗi này không?"
3. Kiểm tra console:
   ```
   ✅ [AI Reply] Smart auto triggered for question/request
   ✅ [AI Personal] Replying on behalf of Hoàng Kiều Phong
   ```
4. Kiểm tra: AI reply được gửi

#### 6.4 Test reply to user's message
1. User (Hoàng Kiều Phong) gửi: "Mai mình đi chơi nhé"
2. Người khác reply: "Oke, tôi hiểu rồi"
3. Kiểm tra console:
   ```
   ✅ [AI Reply] Reply to user's message detected
   ✅ [AI Personal] Replying on behalf of Hoàng Kiều Phong
   ```
4. Kiểm tra: AI reply được gửi

---

### 7. Test Edge Cases

#### 7.1 Empty nickname
1. Thêm nickname rỗng (chỉ spaces)
2. Expected: Không được thêm vào list

#### 7.2 Duplicate nickname
1. Thêm nickname "Phong"
2. Thêm lại "Phong"
3. Expected: Không được thêm lần 2

#### 7.3 Context length boundaries
1. Set context length = 5 (min)
2. Save
3. Expected: Lưu thành công
4. Set context length = 50 (max)
5. Save
6. Expected: Lưu thành công

#### 7.4 Invalid AI reply mode
```javascript
// Test POST với invalid mode
fetch('/api/user/ai-profile', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    aiReplyMode: 'invalid_mode'
  })
}).then(r => r.json()).then(console.log)
```

**Expected**:
- Error: "Invalid ai_reply_mode. Must be one of: mention_only, name_detect, smart_auto"
- Status: 400

---

### 8. Test Multi-Session

#### 8.1 Same Zalo user, different device
1. Login Zalo trên device A
2. Cấu hình AI Personal Settings
3. Save
4. Login Zalo trên device B (cùng account)
5. Kiểm tra: Settings vẫn load đúng (dựa vào `zalo_user_id`)

---

## 🎯 Summary Test Cases

| Test Case | Status | Notes |
|-----------|--------|-------|
| Load Settings (GET) | ✅ | |
| Save Settings (POST) | ✅ | |
| @Mention Detection | ✅ | |
| Name Detection | ✅ | |
| Nickname Detection | ✅ | |
| Smart Auto | ✅ | |
| Reply Detection | ✅ | |
| UI Rendering | ✅ | |
| Add Nickname | ✅ | |
| Remove Nickname | ✅ | |
| Change Reply Mode | ✅ | |
| Adjust Context Length | ✅ | |
| Toggle Remember Context | ✅ | |
| Save Button | ✅ | |
| Database Persistence | ✅ | |
| Listener Integration | ✅ | |
| Edge Cases | ✅ | |

---

## 🐛 Known Issues

None at the moment.

---

## 📝 Notes

1. **AI Reply Mode**:
   - `mention_only`: Chỉ reply khi @mention hoặc reply
   - `name_detect`: Reply khi thấy tên/biệt danh trong tin nhắn
   - `smart_auto`: Tự động reply khi thấy câu hỏi/request

2. **Context Length**: Số tin nhắn trước đó AI sẽ đọc (5-50)

3. **Remember Context**: AI có nhớ thông tin trong cuộc hội thoại hay không

4. **Database Table**: `user_ai_profiles`
   - PK: `user_id`
   - Unique per user (1 profile per user)
