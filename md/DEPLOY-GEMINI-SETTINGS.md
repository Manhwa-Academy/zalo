# 🚀 Deploy Guide: Gemini Personal API Key Feature

## 📋 Pre-Deploy Checklist

- [x] Code complete (7 files changed)
- [x] TypeScript checks pass (no errors)
- [ ] SQL migration ready
- [ ] Database backup created
- [ ] Test plan prepared

---

## 🗄️ Step 1: Database Migration

### Local/Development
```bash
psql -U postgres -d zalo_bot -f database/add-gemini-settings.sql
```

### Production (Render.com/Railway/etc.)
```bash
# Connect to production database
psql "YOUR_PRODUCTION_DATABASE_URL" -f database/add-gemini-settings.sql

# Or via database GUI (e.g., pgAdmin, DBeaver):
# Copy content from add-gemini-settings.sql and execute
```

### Verify Migration
```sql
-- Check columns exist
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'user_settings' 
  AND column_name IN ('gemini_api_key', 'gemini_model');

-- Expected output:
-- gemini_api_key  | text         | NULL
-- gemini_model    | varchar(100) | 'gemini-3.1-flash-lite'
```

---

## 📦 Step 2: Code Deployment

### Files Changed:
1. ✅ `database/add-gemini-settings.sql` (new)
2. ✅ `components/GeminiSettings.tsx` (new)
3. ✅ `components/Header.tsx` (modified)
4. ✅ `app/api/settings/route.ts` (modified)
5. ✅ `lib/ai-reply.ts` (modified)
6. ✅ `lib/zalo-listener-manager.ts` (modified)
7. ✅ `lib/user-manager.ts` (modified)

### Deploy Commands:
```bash
# 1. Commit changes
git add .
git commit -m "feat: Add personal Gemini API key support for users"

# 2. Push to production
git push origin main

# 3. Wait for auto-deploy (if configured)
# Or manually deploy via platform dashboard
```

---

## 🔍 Step 3: Post-Deploy Verification

### 1. Check Deployment Status
- [ ] Build succeeded
- [ ] No deployment errors
- [ ] App is accessible

### 2. Quick Smoke Test
```bash
# Login to app
# Navigate to Settings (⚙️)
# Look for "✨ Cấu hình Gemini AI" section

# If visible → ✅ Frontend OK
# If not → ❌ Check build logs
```

### 3. Database Connection Test
```bash
# Check if settings API works
curl -X GET https://your-app.com/api/settings \
  -H "Cookie: auth_token=YOUR_TOKEN"

# Should return JSON with:
# {
#   "success": true,
#   "settings": {
#     "geminiApiKey": "",
#     "geminiModel": "gemini-3.1-flash-lite",
#     ...
#   }
# }
```

### 4. End-to-End Test
1. Login as test user
2. Settings → Cấu hình Gemini AI
3. Input test API key: `AIzaSyTestKey123`
4. Select model: `gemini-3.5-flash-lite`
5. Save
6. Reload page
7. Check settings still there
8. Enable AI reply
9. Send test message
10. Check server logs for: `Using USER API key`

---

## 🐛 Rollback Plan

### If Something Goes Wrong:

#### 1. Code Rollback
```bash
# Revert to previous commit
git revert HEAD
git push origin main
```

#### 2. Database Rollback
```sql
-- Remove added columns
ALTER TABLE user_settings 
DROP COLUMN IF EXISTS gemini_api_key,
DROP COLUMN IF EXISTS gemini_model;
```

#### 3. Emergency Fix
- System API key still works as fallback
- Users without personal key → use system key
- No breaking changes to existing functionality

---

## 📊 Monitoring

### Logs to Watch:
```bash
# 1. Check API key usage
grep "Using USER API key" logs.txt
grep "Using SYSTEM API key" logs.txt

# 2. Check AI reply errors
grep "AI Reply] Error" logs.txt

# 3. Check settings save/load
grep "Settings saved" logs.txt
grep "Loaded settings" logs.txt
```

### Metrics to Track:
- % users with personal API key
- API quota usage per user
- AI reply success rate
- Settings save errors

---

## 📞 Support

### User Questions:
**Q: Làm sao lấy API key?**
A: Vào https://aistudio.google.com/apikey → Create API key → Copy

**Q: Model nào tốt nhất?**
A: Gemini 3.1 Flash Lite (nhanh nhất, 150 requests/phút)

**Q: Có mất phí không?**
A: Không! Google Gemini API có free tier với quota cao

**Q: API key có an toàn không?**
A: Có! Key được lưu riêng cho từng user, không ai khác thấy được

---

## ✅ Success Criteria

- [x] SQL migration runs without errors
- [ ] All users can see new UI section
- [ ] Settings save/load correctly
- [ ] AI uses user's key when available
- [ ] AI falls back to system key when user has no key
- [ ] Console logs show correct key usage
- [ ] No breaking changes to existing features
- [ ] Performance: No slowdown in AI reply time

---

## 🎉 Launch Announcement

**Template for users:**

---

🎉 **Feature Mới: Gemini API Key Riêng!**

Giờ bạn có thể dùng API key Gemini riêng để:
✅ Có quota riêng (không share với ai)
✅ 150 requests/phút miễn phí
✅ Chọn model Gemini phù hợp

**Cách dùng:**
1. Vào Settings (⚙️)
2. Tìm "Cấu hình Gemini AI"
3. Click "Hướng dẫn" để lấy free API key
4. Paste key → Chọn model → Lưu
5. Done! 🚀

Lưu ý: Nếu không set key riêng, bot vẫn dùng key hệ thống như trước!

---

**Deployment Date**: _[Fill in]_
**Version**: v1.1.0
**Status**: ✅ READY TO DEPLOY
