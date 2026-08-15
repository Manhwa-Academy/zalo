# 🧪 TEST: Fix "Bạn 8944" → "My Documents"

## 📋 Checklist Before Testing

### 1. ✅ Verify Code Changes Applied
Check these files have the new code:

**Backend:** `app/api/zalo/friends/route.ts`
```typescript
// Should have this logic:
if (!name && isSelf) {
  name = 'Tài khoản của tôi'
} else if (!name) {
  name = `Người dùng ${uid.slice(-4)}`
}
```

**Frontend:** `components/ZaloChatView.tsx`
```typescript
// Should detect My Documents:
if (fid === '787248696178218846' || (fid.startsWith('787') && fid.length > 15)) {
  fname = 'My Documents'
}
```

### 2. 🔥 Hard Reload Browser
```
Ctrl + Shift + R
(or Ctrl + F5)
```

**WHY:** Clear browser cache to load new JavaScript

### 3. 🔄 Verify Server Restart
Check terminal - should see:
```
✓ Compiled in XXXms
```

If NOT, restart dev server:
```bash
# Stop: Ctrl + C
# Start: 
npm run dev
```

## 🧪 Test Steps

### Step 1: Clear Browser Cache
1. **Open DevTools** (F12)
2. **Right-click** on refresh button
3. **Select:** "Empty Cache and Hard Reload"

### Step 2: Check Backend Response
In browser console, run:
```javascript
fetch('/api/zalo/friends')
  .then(r => r.json())
  .then(data => {
    console.log('📊 Total friends:', data.friends.length)
    
    // Find My Documents
    const myDocs = data.friends.find(f => f.id === '787248696178218846')
    if (myDocs) {
      console.log('✅ My Documents found:', myDocs)
      console.log('   Name:', myDocs.name)
    } else {
      console.log('❌ My Documents NOT found in friends list')
    }
    
    // Show all friends
    console.table(data.friends)
  })
```

**Expected Output:**
```
✅ My Documents found: {id: "787248696178218846", name: "My Documents", ...}
```

### Step 3: Check UI
Look at sidebar conversations:
- ✅ Should see **"My Documents"**
- ❌ Should NOT see "Bạn 8944"

## 🔍 Debugging If Still Shows "Bạn 8944"

### Debug 1: Check What Backend Returns
```javascript
fetch('/api/zalo/friends')
  .then(r => r.json())
  .then(data => {
    const target = data.friends.find(f => f.id.includes('8696178218846'))
    console.log('Raw friend data:', target)
  })
```

**If `name: "Bạn 8944"`:**
→ Backend not fixed yet
→ Check `app/api/zalo/friends/route.ts`

**If `name: "My Documents"`:**
→ Backend OK, frontend issue
→ Check `components/ZaloChatView.tsx`

### Debug 2: Check Frontend Processing
Add logging in `ZaloChatView.tsx`:

```typescript
fData.friends.forEach((f: any) => {
  const fid = String(f.id)
  console.log(`Processing friend: ID=${fid}, Name=${f.name}`)
  
  let fname = f.name || ''
  
  if (!fname) {
    if (fid === '787248696178218846') {
      fname = 'My Documents'
      console.log('✅ Detected My Documents!')
    } else {
      fname = `Người dùng ${fid.slice(-4)}`
    }
  }
  
  console.log(`Final name: ${fname}`)
})
```

### Debug 3: Check Conversations State
In browser console:
```javascript
// Check conversations state
window.dispatchEvent(new CustomEvent('debug_conversations'))
```

Then add to component:
```typescript
useEffect(() => {
  const handler = () => {
    console.log('📋 Current conversations:', conversations)
  }
  window.addEventListener('debug_conversations', handler)
  return () => window.removeEventListener('debug_conversations', handler)
}, [conversations])
```

## 🚨 If Nothing Works

### Nuclear Option: Force Refresh Everything

**1. Clear All State:**
```javascript
// In browser console
localStorage.clear()
sessionStorage.clear()
location.reload()
```

**2. Restart Dev Server:**
```bash
# Terminal
Ctrl + C
npm run dev
```

**3. Hard Reload Browser:**
```
Ctrl + Shift + R
```

## 📊 Expected vs Actual

### Backend Response Should Be:
```json
{
  "success": true,
  "friends": [
    {
      "id": "787248696178218846",
      "name": "My Documents",  // ✅ NOT "Bạn 8944"
      "avatar": "",
      "phoneNumber": ""
    }
  ]
}
```

### Frontend Conversation Should Be:
```typescript
{
  threadId: "787248696178218846",
  name: "My Documents",  // ✅ NOT "Bạn 8944"
  type: "User",
  avatar: "",
  lastMessage: "...",
  lastTime: "..."
}
```

## 🎯 Success Criteria

✅ Sidebar shows "My Documents"
✅ Click vào → Header shows "My Documents"
✅ NOT "Bạn 8944" anywhere
✅ Other friends show correct names too

## 📝 Quick Fix Script

If you need to manually fix in console:

```javascript
// Find and rename the conversation
const conversations = [...document.querySelectorAll('[data-thread-id]')]
const target = conversations.find(el => 
  el.textContent.includes('Bạn 8944')
)

if (target) {
  console.log('Found Bạn 8944, but this only fixes display temporarily')
  console.log('Need to fix backend/frontend code for permanent fix')
}
```

## 🔧 If Pattern Doesn't Match

If ID is different than expected, update pattern:

```typescript
// In ZaloChatView.tsx
if (fid === 'YOUR_ACTUAL_ID_HERE') {
  fname = 'My Documents'
}
```

To find actual ID, check backend logs:
```
👥 [Friends API] getAllFriends returned 34 friends
```

Or check browser console after fetching friends.

---

## ✨ After Fix Works

You should see:
- ✅ "My Documents" in sidebar
- ✅ Clean professional naming
- ✅ All friends show correct names
