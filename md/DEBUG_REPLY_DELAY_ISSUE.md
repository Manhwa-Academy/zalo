# 🔧 Debug: Độ trễ phản hồi không được lưu sau khi F5

## 📋 Vấn đề
User chọn "Độ trễ phản hồi" là 3 giây, nhưng sau khi F5 (refresh) lại, giá trị reset về mặc định (2 giây).

## 🔍 Đã kiểm tra và sửa

### 1. ✅ Component Header.tsx
**Đã thêm console logs để debug:**
- Log khi thay đổi dropdown: `🔧 [Header] Delay dropdown changed to: X`
- Log khi cập nhật state: `✅ [Header] Updated replyDelay state to: X`
- Log khi lưu settings: `💾 [Header] Saving settings to database:`
- Log khi load settings: `✅ [Header] Loaded settings from database:`

**Đã sửa loadSettingsFromDatabase():**
- Đảm bảo `setSettings(data.settings)` được gọi để sync state với database
- Check và set `customDelayMode` đúng cách dựa trên giá trị từ DB
- Xử lý trường hợp `replyDelay` undefined (fallback về 2)

### 2. ✅ API Route `/api/settings/route.ts`
- Đã kiểm tra: API đang lưu và load `replyDelay` đúng cách
- GET endpoint: Map `reply_delay` (DB) → `replyDelay` (frontend)
- POST endpoint: Map `replyDelay` (frontend) → `reply_delay` (DB)

## 🧪 Cách test

1. **Mở Developer Console** (F12)

2. **Thay đổi độ trễ:**
   - Click icon ⚙️ Cài đặt
   - Chọn "Độ trễ phản hồi": 3 giây (hoặc bất kỳ giá trị nào)
   - Check console logs:
     ```
     🔧 [Header] Delay dropdown changed to: 3
     ✅ [Header] Updated replyDelay state to: 3
     ```

3. **Lưu settings:**
   - Click "💾 Lưu thay đổi"
   - Check console logs:
     ```
     💾 [Header] Saving settings to database: {notificationSound: true, replyDelay: 3, ...}
     ✅ [Header] Settings saved successfully: {success: true, message: '...'}
     ```

4. **Refresh trang (F5):**
   - Check console logs khi load:
     ```
     ✅ [Header] Loaded settings from database: {notificationSound: true, replyDelay: 3, ...}
     ```
   - Mở lại cài đặt và check dropdown có hiển thị "3 giây" không

## 🔧 Nếu vẫn lỗi

### Kiểm tra Database
```sql
-- Connect vào PostgreSQL và chạy:
SELECT user_id, reply_delay, updated_at 
FROM user_settings 
ORDER BY updated_at DESC 
LIMIT 5;
```

Kiểm tra xem:
1. Giá trị `reply_delay` có được lưu vào DB không?
2. Có đúng user_id hiện tại không?

### Kiểm tra Network Tab
1. Mở DevTools → Network tab
2. Click "Lưu thay đổi"
3. Tìm request POST `/api/settings`
4. Check payload:
   ```json
   {
     "notificationSound": true,
     "replyDelay": 3,
     "learningMode": false,
     ...
   }
   ```
5. Check response có `success: true` không?

### Kiểm tra localStorage
```javascript
// Trong Console:
localStorage.getItem('app-settings')
```
Nếu có giá trị cũ trong localStorage, có thể nó đang override database.

## 🚀 Giải pháp đã áp dụng

### Trước (có bug):
```typescript
const replyDelay = data.settings.replyDelay || 2
if (!defaultDelays.includes(replyDelay)) {
  setCustomDelayMode(true)
  setCustomDelayValue(replyDelay.toString())
}
// ❌ Không set lại settings state nếu không phải custom
```

### Sau (đã fix):
```typescript
const replyDelay = data.settings.replyDelay !== undefined ? data.settings.replyDelay : 2

if (!defaultDelays.includes(replyDelay)) {
  setCustomDelayMode(true)
  setCustomDelayValue(replyDelay.toString())
} else {
  // ✅ Đảm bảo reset customDelayMode nếu là standard delay
  setCustomDelayMode(false)
}
```

## 📝 Lưu ý quan trọng

1. **Phải click "Lưu thay đổi"** sau khi chọn delay mới
2. Chỉ thay đổi dropdown KHÔNG tự động lưu vào database
3. Settings chỉ được persist sau khi call API `/api/settings`

## ✅ Expected Behavior

1. User chọn delay → State `settings.replyDelay` được cập nhật
2. User click "Lưu thay đổi" → POST `/api/settings` với giá trị mới
3. Refresh page → GET `/api/settings` load giá trị từ DB
4. Dropdown hiển thị đúng giá trị đã lưu

## 🐛 Nếu vẫn bị reset

Có thể có code khác đang set lại giá trị mặc định. Check các file:
- `lib/bot-settings.ts` - DEFAULT_SETTINGS
- `components/Header.tsx` - Initial state
- Bất kỳ useEffect nào có thể override settings

Run grep để tìm:
```bash
grep -r "replyDelay.*2" --include="*.ts" --include="*.tsx"
```
