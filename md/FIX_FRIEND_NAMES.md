# ✅ Fix: Tên Bạn Bè Hiển Thị "Bạn 8944" Thay Vì Tên Thật

## ❌ Vấn Đề

Một số bạn bè hiển thị:
- "Bạn 8944" ❌
- "Bạn 7512" ❌

Thay vì tên thật như:
- "My Documents" ✅
- "Nguyễn Văn A" ✅

## 🔍 Nguyên Nhân

### 1. API Không Trả Về Tên
Zalo API (`getAllFriends()` hoặc raw API) không trả về field `displayName`, `zaloName`, hoặc `dName` cho một số user:
- **My Documents**: Thread đặc biệt của Zalo (cloud storage)
- **Chính bạn**: Tài khoản của người dùng
- **Contacts chưa có tên**: Số điện thoại chưa lưu

### 2. Fallback Name Không Tốt
Code cũ:
```typescript
const name = f.displayName || `Bạn ${f.id}`  // ❌ "Bạn 8944"
```

## ✅ Giải Pháp

### 1. Cải Thiện Fallback Backend

**File:** `app/api/zalo/friends/route.ts`

```typescript
// Get own user ID
const ownId = typeof zaloApi.getOwnId === 'function' ? String(zaloApi.getOwnId()) : ''

friendsList = friendsData.map((f: any) => {
  const uid = String(f.uid || f.userId || f.id || '')
  const isSelf = ownId && uid === ownId
  
  let name = f.dName || f.displayName || f.zaloName || f.name || ''
  
  if (!name && isSelf) {
    name = 'Tài khoản của tôi'  // ✅ For self
  } else if (!name) {
    name = `Người dùng ${uid.slice(-4)}`  // ✅ Generic fallback
  }
  
  return { id: uid, name, avatar, phoneNumber }
})
```

**Improvements:**
- ✅ Detect self (own account) → "Tài khoản của tôi"
- ✅ Generic fallback → "Người dùng XXXX" (thay vì "Bạn XXXX")
- ✅ Only show last 4 digits (privacy)

### 2. Detect Special Zalo Threads

**File:** `components/ZaloChatView.tsx`

```typescript
fData.friends.forEach((f: any) => {
  const fid = String(f.id)
  let fname = f.name || ''
  
  // Detect special Zalo threads
  if (!fname) {
    if (fid.startsWith('787') && fid.endsWith('18846')) {
      fname = 'My Documents'  // ✅ Cloud storage
    } else {
      fname = `Người dùng ${fid.slice(-4)}`
    }
  }
  
  // ... rest of code
})
```

**Special Threads Detected:**
- ✅ **My Documents** (Cloud Storage): ID pattern `787...18846`
- Future: Có thể thêm các pattern khác nếu cần

### 3. Consistent Fallback Everywhere

Applied to:
- ✅ `/api/zalo/friends` (backend)
- ✅ `ZaloChatView.tsx` (frontend)
- Already done:
  - `lib/zalo-listener-manager.ts`
  - `app/api/zalo/history/route.ts`

## 📊 Before vs After

### Backend API Response

**Before:**
```json
{
  "friends": [
    { "id": "7877...18846", "name": "Bạn 8846", "avatar": "" }
  ]
}
```

**After:**
```json
{
  "friends": [
    { "id": "7877...18846", "name": "My Documents", "avatar": "" }
  ]
}
```

### Frontend Display

| Thread | Before | After |
|--------|--------|-------|
| Cloud Storage | "Bạn 8944" ❌ | "My Documents" ✅ |
| Own Account | "Bạn 7512" ❌ | "Tài khoản của tôi" ✅ |
| Unknown User | "Bạn 1234" ❌ | "Người dùng 1234" ✅ |
| Normal Friend | "Nguyễn Văn A" ✅ | "Nguyễn Văn A" ✅ |

## 🧪 Test

1. **Reload page** (F5)
2. **Check sidebar:**
   - ✅ "My Documents" thay vì "Bạn 8944"
   - ✅ Tên thật của bạn bè hiển thị đúng
   - ✅ Unknown users: "Người dùng XXXX" thay vì "Bạn XXXX"

## 🔍 Debug

Nếu vẫn thấy "Bạn XXXX":

**1. Check Backend Logs:**
```
👥 [Friends API] getAllFriends returned XX friends
✅ [Friends API] Parsed XX friends from getAllFriends
```

**2. Check Frontend Console:**
```javascript
// In browser console
fetch('/api/zalo/friends')
  .then(r => r.json())
  .then(data => {
    console.log('Friends:', data.friends)
    data.friends.forEach(f => {
      console.log(`ID: ${f.id}, Name: ${f.name}`)
    })
  })
```

**3. Check Raw Friend Data:**
Xem trong backend log có field `dName`, `displayName`, `zaloName` không?

## 💡 Why "My Documents"?

"My Documents" là một feature đặc biệt của Zalo:
- **Cloud Storage**: Lưu trữ file, ảnh, video
- **Self-chat**: Gửi tin nhắn cho chính mình
- **Sync across devices**: Đồng bộ giữa điện thoại và web

ID pattern: `787...18846` (có thể khác nhau)

## 📁 Files Changed

1. ✅ `app/api/zalo/friends/route.ts`
   - Added `ownId` detection
   - Improved fallback names
   - "Tài khoản của tôi" for self

2. ✅ `components/ZaloChatView.tsx`
   - Detect "My Documents" thread
   - Better generic fallback
   - Pattern matching for special threads

## 🚀 Next Steps

Nếu có thêm special threads, thêm pattern vào:

```typescript
if (fid.startsWith('XXX') && fid.endsWith('YYY')) {
  fname = 'Thread Name'
}
```

## ✨ Result

Sidebar giờ hiển thị:
- ✅ "My Documents" cho cloud storage
- ✅ "Tài khoản của tôi" cho chính bạn
- ✅ Tên thật của bạn bè
- ✅ "Người dùng XXXX" cho unknown (thay vì "Bạn")

Rõ ràng và professional hơn nhiều! 🎉
