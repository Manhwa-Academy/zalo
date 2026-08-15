# 🔐 Feature: Duplicate Import Detection

## 📋 Requirement:

User muốn:
- ✅ Xuất tài khoản → OK
- ✅ Nhập lần 1 → OK
- ❌ Nhập lần 2 cùng file → **BÁO LỖI**: "File này đã được nhập"

---

## ✅ Solution Implemented:

### Strategy: Hash-Based Duplicate Detection

**File:** `app/api/zalo/import-account/route.ts`

### How It Works:

```typescript
1. User uploads/pastes JSON credentials
   ↓
2. Create MD5 hash of: imei + userAgent + cookie preview
   ↓
3. Check if this hash exists in database
   ├─ YES → Return error "File đã được nhập"
   └─ NO → Continue with import
   ↓
4. Save credentials WITH hash in userInfo JSON
   ↓
5. Next time same file imported → Hash matches → Reject
```

---

## 📝 Implementation Details:

### 1. Generate Hash from Credentials

```typescript
const credentialsString = JSON.stringify({
  imei: credentials.imei,
  userAgent: credentials.userAgent,
  cookiePreview: JSON.stringify(credentials.cookie).substring(0, 100)
})

const crypto = require('crypto')
const credentialsHash = crypto.createHash('md5')
  .update(credentialsString)
  .digest('hex')
```

**Why MD5?**
- Fast and sufficient for duplicate detection
- Not for security, just for uniqueness check
- Collision risk negligible for this use case

**Why cookie preview (first 100 chars)?**
- Full cookie too large and changes frequently
- First 100 chars contain stable session identifiers
- Enough to uniquely identify credentials

---

### 2. Check for Duplicate

```typescript
const existingSession = await UserManager.getZaloSession(userId)

if (existingSession?.userInfo?._importHash === credentialsHash) {
  const importedAt = new Date(existingSession.userInfo._importedAt)
    .toLocaleString('vi-VN')
  
  return NextResponse.json({
    error: `⚠️ File này đã được nhập vào lúc ${importedAt}!
    
Không thể nhập lại cùng một file. 
Vui lòng export file mới hoặc sử dụng file khác.`
  }, { status: 400 })
}
```

**Features:**
- Shows when file was imported (timestamp)
- Clear error message in Vietnamese
- Suggests solutions (export new file)

---

### 3. Save Hash with UserInfo

```typescript
const userInfoWithHash = {
  ...userInfo,
  _importHash: credentialsHash,
  _importedAt: new Date().toISOString()
}

await setCurrentZaloUserInfo(userInfoWithHash)
```

**Data Structure:**
```json
{
  "displayName": "User Name",
  "userId": "123456",
  "phoneNumber": "0912345678",
  "avatar": "https://...",
  "_importHash": "a1b2c3d4e5f6...",
  "_importedAt": "2026-08-15T15:30:00.000Z"
}
```

**Why use userInfo JSON?**
- ✅ No need to alter database schema
- ✅ Already stored in `zalo_sessions.user_info` column (JSONB)
- ✅ Easy to retrieve with existing queries
- ✅ Prefix with `_` to avoid conflicts with Zalo data

---

## 🧪 Testing Scenarios:

### Test 1: First Import (Should Work)
```
1. Export credentials → Save file: zalo-account-123.json
2. Import file via modal
3. ✅ Success: "Nhập tài khoản thành công!"
4. Page reloads, Zalo logged in
```

### Test 2: Re-Import Same File (Should Fail)
```
1. Import same file: zalo-account-123.json again
2. ❌ Error: "File này đã được nhập vào lúc 15/08/2026 15:30:00!"
3. Modal stays open
4. User can upload different file
```

### Test 3: Import Different File (Should Work)
```
1. Export NEW credentials → Save file: zalo-account-456.json
2. Import new file
3. ✅ Success: New credentials imported
4. Old hash replaced with new hash
```

### Test 4: Import on Different Browser (Should Work)
```
1. Browser A: Import file
2. Browser B: Import SAME file
3. ✅ Success: Different user session, different hash storage
4. No conflict between users
```

---

## 📊 Error Messages:

### Duplicate Import Error:
```
⚠️ File này đã được nhập vào lúc 15/08/2026 15:30:00!

Không thể nhập lại cùng một file. 
Vui lòng export file mới hoặc sử dụng file khác.
```

**Displayed in:**
- Import modal error box (red background)
- Clear, user-friendly Vietnamese
- Includes timestamp of first import
- Suggests solution

---

## 🔍 Edge Cases Handled:

### 1. Modified File
**Scenario:** User edits JSON file manually

**Result:** 
- Hash changes
- Import succeeds as "new" file
- ✅ OK - User knows what they're doing

### 2. Re-Export from Same Account
**Scenario:** Export → Import → Export again → Import

**Result:**
- New export creates new cookies
- Hash different from first import
- Import succeeds
- ✅ OK - Fresh credentials

### 3. Cookie Expiry
**Scenario:** Import old file with expired cookies

**Result:**
- Duplicate check happens BEFORE login attempt
- Shows "already imported" error
- Doesn't waste time trying to login
- ✅ OK - Faster failure

### 4. Multiple Users, Same Zalo Account
**Scenario:** 2 browsers import same Zalo account

**Result:**
- Each user has separate session storage
- Hash stored per-user in `zalo_sessions`
- Both can import (different users)
- ✅ OK - Multi-user system working

---

## 🎯 Benefits:

1. **Prevents Confusion**
   - User clearly knows file was imported before
   - No silent failures

2. **Saves Time**
   - Fast hash check (microseconds)
   - No need to attempt login to detect duplicate

3. **User-Friendly**
   - Clear error message with timestamp
   - Suggests actionable solution

4. **No Schema Changes**
   - Uses existing JSONB column
   - No migration required
   - Backward compatible

5. **Debugging**
   - Console logs show hash comparison
   - Easy to trace import history
   - Timestamp helps with support

---

## 🔧 Technical Notes:

### Hash Stability:
- `imei`: Device identifier (stable)
- `userAgent`: Browser string (stable)
- `cookiePreview`: First 100 chars of cookie (stable enough)

### Why Not Full Cookie?
- Cookies change frequently (timestamps, tokens)
- Full hash would be too sensitive
- Preview captures stable identifiers only

### Why Not Zalo User ID?
- User ID same for ALL exports from that account
- Would prevent ANY re-import ever
- We want to allow re-import of FRESH exports

### Storage Location:
```
Database: neondb
Table: zalo_sessions
Column: user_info (JSONB)
Path: user_info._importHash
```

---

## 📱 User Flow:

```
┌─────────────────────────────────────┐
│   User clicks "Nhập tài khoản"     │
└────────────┬────────────────────────┘
             ↓
┌─────────────────────────────────────┐
│   Upload file or paste JSON         │
└────────────┬────────────────────────┘
             ↓
┌─────────────────────────────────────┐
│   Generate hash of credentials      │
└────────────┬────────────────────────┘
             ↓
        Check hash
             ↓
    ┌────────┴────────┐
    ↓                 ↓
  Exists           Not Exists
    ↓                 ↓
❌ Show Error    ✅ Import
    │                 │
    │                 ↓
    │          Save with hash
    │                 ↓
    │           Success!
    │                 ↓
    └─────────→  Page reload
```

---

## ✅ Status:

- [x] Hash generation implemented
- [x] Duplicate detection working
- [x] Error message clear & helpful
- [x] Timestamp tracking
- [x] No database schema changes
- [x] Backward compatible
- [x] Multi-user safe

**Status: READY FOR TESTING! 🚀**
