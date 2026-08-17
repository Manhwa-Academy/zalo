# 🧪 Test Plan: Gemini Personal API Key

## ⚠️ Prerequisites
```bash
# 1. Run SQL migration first
psql -U your_user -d your_database -f database/add-gemini-settings.sql

# Or if using connection string:
psql "your_connection_string" -f database/add-gemini-settings.sql
```

---

## 🔍 Test Scenarios

### Test 1: UI Integration
**Steps:**
1. Login to app
2. Click Settings (⚙️) in header
3. Scroll down to "✨ Cấu hình Gemini AI" section

**Expected:**
- ✅ Section visible after "🤖 Tự động trả lời"
- ✅ API key input field present
- ✅ Show/Hide button works (🙈/👁️)
- ✅ Model dropdown has 9 options
- ✅ "Hướng dẫn" button toggles info box

---

### Test 2: Save & Load Settings
**Steps:**
1. Input test API key: `AIzaSyTest123456789`
2. Select model: `gemini-3.5-flash-lite`
3. Click "💾 Lưu thay đổi"
4. Reload page
5. Open Settings again

**Expected:**
- ✅ API key still there (masked: `AIzaSyTe••••••••••••••••`)
- ✅ Model still selected: `gemini-3.5-flash-lite`
- ✅ Success notification: "⚙️ Cài đặt đã lưu"

**Database Check:**
```sql
SELECT 
  user_id, 
  gemini_api_key,
  gemini_model 
FROM user_settings;
```

---

### Test 3: AI Uses User's API Key
**Steps:**
1. Set valid Gemini API key in Settings
2. Save
3. Enable AI Reply in bot settings
4. Send test message from another account: "em ơi anh yêu em"
5. Check server console logs

**Expected:**
```
🔑 [AI Reply] Using USER API key with model: gemini-3.5-flash-lite
🤖 [AI Reply] Generated reply for "em ơi anh yêu em..." (150 tokens, model: gemini-3.5-flash-lite)
```

---

### Test 4: Fallback to System Key
**Steps:**
1. Clear API key (set to empty)
2. Save settings
3. Send test message
4. Check console logs

**Expected:**
```
🔑 [AI Reply] Using SYSTEM API key with model: gemini-3.1-flash-lite
🤖 [AI Reply] Generated reply for "test message..." (120 tokens, model: gemini-3.1-flash-lite)
```

---

### Test 5: Invalid API Key
**Steps:**
1. Set invalid key: `invalid_key_123`
2. Save
3. Send message triggering AI

**Expected:**
- ❌ Error in console: "❌ [AI Reply] Error: ..."
- 🤖 Bot replies: "Xin lỗi, tôi không thể trả lời lúc này. Vui lòng thử lại sau! 🙏"

---

### Test 6: Different Models
**Steps:**
1. Set valid API key
2. Test each model:
   - Gemini 3.1 Flash Lite
   - Gemini 3.5 Flash Lite
   - Gemini 2.5 Flash Lite
3. Send messages and check console

**Expected:**
- Console shows correct model name in logs
- AI responds successfully with each model

---

### Test 7: Multi-User Isolation
**Steps:**
1. User A: Set API key `keyA`
2. User B: Set API key `keyB`
3. Both send messages

**Expected:**
- User A's AI uses `keyA`
- User B's AI uses `keyB`
- No key sharing/leaking
- Console logs show different keys

**Database Check:**
```sql
SELECT 
  u.display_name,
  us.gemini_api_key IS NOT NULL as has_key,
  us.gemini_model
FROM users u
LEFT JOIN user_settings us ON u.id = us.user_id;
```

---

## 📊 Success Criteria

| Test | Status | Notes |
|------|--------|-------|
| UI Integration | ⬜ | Section visible, all fields work |
| Save & Load | ⬜ | Data persists after reload |
| User API Key | ⬜ | Console shows "Using USER" |
| System Fallback | ⬜ | Console shows "Using SYSTEM" |
| Invalid Key | ⬜ | Graceful error handling |
| Different Models | ⬜ | All models work |
| Multi-User | ⬜ | Keys isolated per user |

---

## 🐛 Common Issues

### Issue 1: "gemini_api_key column not found"
**Solution:** Run SQL migration:
```bash
psql -d your_db -f database/add-gemini-settings.sql
```

### Issue 2: API key not saving
**Check:**
- `/api/settings` POST request succeeds
- Database has `user_settings` table
- User is authenticated (auth_token cookie)

### Issue 3: Always uses system key
**Check:**
- `UserManager.getBotSettings()` loads gemini settings
- Console log shows user's API key length
- Settings API returns `geminiApiKey`

### Issue 4: Model not applied
**Check:**
- `generateAIReply()` receives `model` parameter
- Console log shows model name in "Generated reply" message

---

## ✅ Final Verification

```bash
# 1. Check TypeScript compilation
npm run build

# 2. Check for errors
npm run lint

# 3. Start dev server
npm run dev

# 4. Test in browser
# - Login
# - Open Settings
# - Configure Gemini API
# - Send test messages
# - Check console logs
```

---

**Test Status**: ⬜ Not Started | 🔄 In Progress | ✅ Passed | ❌ Failed
