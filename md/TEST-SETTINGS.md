# 🧪 Test Settings Functionality

## Mục tiêu
Kiểm tra xem settings có:
- ✅ Lưu vào database
- ✅ Sync across devices
- ✅ Load lại sau khi refresh

## Các bước test

### Test 1: Lưu vào database
1. Mở http://localhost:3000
2. Click vào avatar → "Cài đặt"
3. Đổi một vài settings:
   - Độ trễ phản hồi: **5 giây**
   - Kích thước chữ: **Lớn**
   - Độ dài trả lời tối đa: **800**
4. Click "💾 Lưu thay đổi"
5. Mở F12 Console, check logs:
   ```
   ✅ [Header] Settings saved to database
   ```
6. Check database (Neon.tech SQL Editor):
   ```sql
   SELECT * FROM user_settings 
   WHERE user_id = 'c3d54091-4a58-4a48-be46-51b11f767af7';
   ```
   - Phải thấy: `reply_delay = 5`, `font_size = 'large'`, `max_reply_length = 800`

**✅ PASS nếu:** Settings trong database khớp với settings bạn vừa lưu

---

### Test 2: Load lại sau refresh
1. Tiếp tục từ Test 1
2. Refresh trang (F5)
3. Đợi trang load xong
4. Click avatar → "Cài đặt"
5. Check xem settings có giữ nguyên không:
   - Độ trễ phản hồi: **5 giây** ✅
   - Kích thước chữ: **Lớn** ✅
   - Độ dài trả lời tối đa: **800** ✅

**✅ PASS nếu:** Tất cả settings giữ nguyên sau refresh

---

### Test 3: Sync across devices
1. **Thiết bị 1** (PC):
   - Đổi settings:
     - Độ trễ phản hồi: **10 giây**
     - Hiệu ứng động: **TẮT**
   - Lưu thay đổi
   
2. **Thiết bị 2** (Mobile hoặc tab mới):
   - Login vào cùng tài khoản admin
   - Mở Settings
   - Check xem có settings mới không:
     - Độ trễ phản hồi: **10 giây** ✅
     - Hiệu ứng động: **TẮT** ✅

**✅ PASS nếu:** Settings sync giữa 2 thiết bị

---

### Test 4: Settings apply ngay lập tức
1. Mở Settings
2. Đổi "Kích thước chữ" từ "Trung bình" → "Lớn"
3. Lưu thay đổi
4. Đóng modal Settings
5. **Kiểm tra:** Chữ trong trang có lớn hơn không?

**✅ PASS nếu:** UI thay đổi ngay sau khi lưu

---

## Các lỗi thường gặp

### Lỗi 401: Not authenticated
**Nguyên nhân:** Session expired hoặc chưa login

**Giải pháp:**
1. Check cookie `auth_token` còn không (F12 → Application → Cookies)
2. Nếu không có → Logout và login lại

---

### Settings không lưu (vẫn reset về mặc định)
**Nguyên nhân:** Có thể do:
- Database table `user_settings` chưa có foreign key đúng
- User ID không khớp

**Giải pháp:**
1. Check logs trong console:
   ```
   ❌ [Settings API] Error: ...
   ```
2. Check database:
   ```sql
   -- Xem user_settings có record cho user này không
   SELECT * FROM user_settings 
   WHERE user_id = 'c3d54091-4a58-4a48-be46-51b11f767af7';
   
   -- Nếu không có, check foreign key constraint
   SELECT * FROM information_schema.table_constraints 
   WHERE table_name = 'user_settings';
   ```

---

### Settings load chậm (hiện default settings trước)
**Nguyên nhân:** API call chưa hoàn thành

**Giải pháp:** Đợi thêm 1-2 giây, settings sẽ tự update

---

## Debug Commands

### Check current settings in database
```sql
SELECT 
  user_id,
  notification_sound,
  reply_delay,
  learning_mode,
  max_reply_length,
  ai_enabled,
  font_size,
  updated_at
FROM user_settings
WHERE user_id = 'c3d54091-4a58-4a48-be46-51b11f767af7';
```

### Check if settings sync across devices
```sql
-- Chạy trên 2 thiết bị cùng lúc, check updated_at
SELECT 
  user_id,
  reply_delay,
  font_size,
  updated_at
FROM user_settings
WHERE user_id = 'c3d54091-4a58-4a48-be46-51b11f767af7';
```

### Reset settings to default
```sql
UPDATE user_settings SET
  notification_sound = true,
  reply_delay = 2,
  learning_mode = false,
  auto_mark_read = true,
  max_reply_length = 500,
  ai_enabled = true,
  ai_personality = 'friendly',
  ai_max_length = 200,
  ai_trigger_mode = 'smart',
  dark_mode = true,
  animations = true,
  font_size = 'medium',
  save_history = true,
  auto_delete_days = 'never',
  updated_at = NOW()
WHERE user_id = 'c3d54091-4a58-4a48-be46-51b11f767af7';
```

---

## Kết quả mong đợi

Tất cả 4 tests PASS:
- ✅ Test 1: Settings lưu vào database
- ✅ Test 2: Settings load lại sau refresh
- ✅ Test 3: Settings sync across devices
- ✅ Test 4: Settings apply ngay lập tức

**Nếu tất cả PASS → Settings hoạt động đúng! 🎉**
