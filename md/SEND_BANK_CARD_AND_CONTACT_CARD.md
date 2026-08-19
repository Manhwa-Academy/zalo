# ✅ Tính Năng Gửi Thẻ Ngân Hàng & Danh Thiếp

## 📋 Tổng Quan

Đã implement 2 tính năng mới để gửi thông tin thẻ ngân hàng và danh thiếp trong Zalo chat:

1. **💳 Gửi Thẻ Ngân Hàng** - Chia sẻ thông tin tài khoản ngân hàng
2. **📇 Gửi Danh Thiếp** - Chia sẻ contact card (của bạn hoặc bạn bè)

---

## 🆕 API Endpoints

### 1. POST `/api/zalo/send-bank-card`

Gửi thông tin thẻ ngân hàng tới cuộc trò chuyện.

**Request Body:**
```json
{
  "threadId": "string",
  "threadType": "User" | "Group",
  "binBank": "string",        // Bank code (e.g., "Techcombank", "Vietcombank")
  "numAccBank": "string",      // Account number
  "nameAccBank": "string"      // Account holder name (optional)
}
```

**Response:**
```json
{
  "success": true,
  "message": "Đã gửi thông tin thẻ ngân hàng",
  "result": ""
}
```

**Zalo API Method:** `zaloApi.sendBankCard(payload, threadId, type)`

---

### 2. POST `/api/zalo/send-card`

Gửi danh thiếp (contact card) tới cuộc trò chuyện.

**Request Body:**
```json
{
  "threadId": "string",
  "threadType": "User" | "Group",
  "userId": "string",          // User ID to share card of
  "phoneNumber": "string",     // Phone number (optional)
  "ttl": number                // Time to live (optional)
}
```

**Response:**
```json
{
  "success": true,
  "message": "Đã gửi danh thiếp",
  "msgId": 123456789,
  "result": {
    "msgId": 123456789
  }
}
```

**Zalo API Method:** `zaloApi.sendCard(options, threadId, type)`

---

## 🎨 UI Components

### 1. `SendBankCardModal.tsx`

Modal để gửi thông tin thẻ ngân hàng với đầy đủ tính năng:

**Features:**
- 🏦 **20+ ngân hàng Việt Nam** - Danh sách các ngân hàng phổ biến
- 🔍 **Search ngân hàng** - Tìm kiếm nhanh theo tên hoặc mã
- 📝 **Validate số tài khoản** - Chỉ cho phép nhập số
- 👤 **Tên chủ tài khoản** - Tùy chọn, auto uppercase
- ✅ **Preview chọn ngân hàng** - Hiển thị ngân hàng đã chọn
- 🎨 **Gradient UI** - Green/Emerald theme
- 📱 **Responsive** - Works on all screen sizes

**Danh sách ngân hàng:**
- Techcombank, Vietcombank, VietinBank, BIDV
- ACB, MBBank, VPBank, Agribank
- Sacombank, TPBank, VIB, SHB
- HDBank, OCB, MSB, SeABank
- VietCapitalBank, SCB, LPBank, Eximbank

**Usage:**
```tsx
<SendBankCardModal
  isOpen={showBankCardModal}
  onClose={() => setShowBankCardModal(false)}
  threadId={activeConv.threadId}
  threadType={activeConv.type}
  threadName={activeConv.name}
/>
```

---

### 2. `SendContactCardModal.tsx`

Modal để gửi danh thiếp với 2 options:

**Features:**
- 👤 **Danh thiếp của tôi** - Share your own contact card
- 👥 **Danh thiếp bạn bè** - Share friend's contact card
- 🔍 **Search bạn bè** - Tìm kiếm nhanh trong danh sách
- 📞 **Phone number** - Optional phone number field
- 🎨 **Avatar display** - Show friend avatars
- ✅ **Visual selection** - Highlight selected friend
- 🔄 **Auto-load friends** - Fetch from `/api/zalo/friends`
- 🎨 **Gradient UI** - Blue/Cyan theme

**Card Types:**
1. **Self Card** - Gửi danh thiếp của chính mình
   - Shows current user info
   - Optional phone number
   
2. **Friend Card** - Gửi danh thiếp của bạn bè
   - Load friends list from API
   - Search by name or ID
   - Display avatar and phone number

**Usage:**
```tsx
<SendContactCardModal
  isOpen={showContactCardModal}
  onClose={() => setShowContactCardModal(false)}
  threadId={activeConv.threadId}
  threadType={activeConv.type}
  threadName={activeConv.name}
  currentUserId={userInfo.userId}
  currentUserName={userInfo.displayName}
/>
```

---

## 🔧 Integration trong ZaloChatView

### 1. **Imports**
```tsx
import { CreditCard, UserCircle } from 'lucide-react'
import SendBankCardModal from './SendBankCardModal'
import SendContactCardModal from './SendContactCardModal'
```

### 2. **State Management**
```tsx
const [showBankCardModal, setShowBankCardModal] = useState(false)
const [showContactCardModal, setShowContactCardModal] = useState(false)
```

### 3. **Attach Menu - 2 nút mới**

Thêm vào attach menu (nút 📎 Paperclip):

```tsx
{/* Dropdown Menu */}
{showAttachMenu && (
  <div className="...">
    {/* ... existing items ... */}
    
    <div className="h-px bg-white/10 my-1"></div>
    
    {/* Bank Card */}
    <button
      type="button"
      onClick={() => {
        setShowBankCardModal(true)
        setShowAttachMenu(false)
      }}
      className="w-full px-4 py-2.5 text-left text-sm hover:bg-white/10 transition-colors flex items-center gap-3 text-gray-300 hover:text-emerald-400"
    >
      <CreditCard className="w-4 h-4" />
      <span>Thẻ ngân hàng</span>
    </button>

    {/* Contact Card */}
    <button
      type="button"
      onClick={() => {
        setShowContactCardModal(true)
        setShowAttachMenu(false)
      }}
      className="w-full px-4 py-2.5 text-left text-sm hover:bg-white/10 transition-colors flex items-center gap-3 text-gray-300 hover:text-cyan-400"
    >
      <UserCircle className="w-4 h-4" />
      <span>Danh thiếp</span>
    </button>
  </div>
)}
```

### 4. **Modal Rendering**

```tsx
{/* Bank Card Modal */}
{showBankCardModal && activeConv && (
  <SendBankCardModal
    isOpen={showBankCardModal}
    onClose={() => setShowBankCardModal(false)}
    threadId={activeConv.threadId}
    threadType={activeConv.type}
    threadName={activeConv.name}
  />
)}

{/* Contact Card Modal */}
{showContactCardModal && activeConv && userInfo && (
  <SendContactCardModal
    isOpen={showContactCardModal}
    onClose={() => setShowContactCardModal(false)}
    threadId={activeConv.threadId}
    threadType={activeConv.type}
    threadName={activeConv.name}
    currentUserId={userInfo.userId || userInfo.id || ''}
    currentUserName={userInfo.displayName || userInfo.name || 'User'}
  />
)}
```

---

## 📍 Vị Trí Trong Chat Input

```
┌─────────────────────────────────────────────────────┐
│  [📎]  [😊]  [Text Input........................]  [Gửi] │
│   ▲                                                   │
│   │                                                   │
│   └─── Paperclip Menu:                              │
│        • 🖼️ Hình ảnh                                 │
│        • 🎬 Video                                    │
│        • 📎 Tập tin                                  │
│        • ──────────                                  │
│        • 🎤 Tin nhắn thoại                           │
│        • 🔗 Liên kết                                 │
│        • ──────────                                  │
│        • 💳 Thẻ ngân hàng     ← NEW!                │
│        • 📇 Danh thiếp        ← NEW!                │
└─────────────────────────────────────────────────────┘
```

---

## 🎯 Use Cases

### 💳 Gửi Thẻ Ngân Hàng
1. User click nút 📎 Paperclip
2. Chọn "💳 Thẻ ngân hàng"
3. Tìm và chọn ngân hàng
4. Nhập số tài khoản
5. (Optional) Nhập tên chủ tài khoản
6. Click "Gửi Thẻ Ngân Hàng"
7. Thông tin được gửi dưới dạng special message trong Zalo

**Example:**
```
Người dùng: "Tôi chuyển khoản cho bạn nhé!"
[Clicks 💳 Thẻ ngân hàng]
→ Chọn: Techcombank
→ STK: 19038393966015
→ Tên: TO CHAU TRI DUNG
→ [Gửi] ✅
```

### 📇 Gửi Danh Thiếp

**Option 1: Danh thiếp của tôi**
1. Click nút 📎 Paperclip
2. Chọn "📇 Danh thiếp"
3. Tab "Danh thiếp của tôi"
4. (Optional) Nhập số điện thoại
5. Click "Gửi Danh Thiếp"

**Option 2: Danh thiếp bạn bè**
1. Click nút 📎 Paperclip
2. Chọn "📇 Danh thiếp"
3. Tab "Danh thiếp bạn bè"
4. Tìm và chọn bạn từ danh sách
5. Click "Gửi Danh Thiếp"

**Example:**
```
Người dùng trong group: "Tôi giới thiệu bạn A cho các bạn!"
[Clicks 📇 Danh thiếp]
→ Tab "Danh thiếp bạn bè"
→ Search: "Nguyen Van A"
→ Select friend
→ [Gửi] ✅
```

---

## 🎨 UI/UX Design

### Color Theme:
- **Bank Card Modal**: 🟢 Green/Emerald gradient (`from-green-500 to-emerald-600`)
- **Contact Card Modal**: 🔵 Blue/Cyan gradient (`from-blue-500 to-cyan-600`)
- **Icons**: Lucide React icons with semantic colors

### Layout Features:
- ✅ Flexbox layout - Footer luôn visible
- ✅ Max height 90vh - Không overflow màn hình
- ✅ Scrollable content - Danh sách ngân hàng/bạn bè scroll độc lập
- ✅ Loading states - Spinner khi đang gửi/load data
- ✅ Disabled states - Button disabled khi thiếu thông tin
- ✅ Backdrop blur - Background overlay khi mở modal
- ✅ Smooth animations - Fade in/zoom effects

### Accessibility:
- Clear labels with required field indicators (*)
- Placeholder text for guidance
- Hover states for all interactive elements
- Keyboard navigation support (Enter to submit, Esc to close)
- Visual feedback for selections
- Info boxes with helpful tips

---

## 🔒 Security & Validation

### Bank Card:
- ✅ Số tài khoản chỉ cho phép số (regex: `/[^0-9]/g`)
- ✅ Max length 20 digits
- ✅ Tên chủ tài khoản auto uppercase
- ✅ Max length 50 characters
- ✅ Validate required fields before submit

### Contact Card:
- ✅ Require userId selection
- ✅ Phone number chỉ cho phép số
- ✅ Max length 15 digits
- ✅ Load friends from authenticated API
- ✅ User must be logged in (check userInfo)

---

## 📝 Error Handling

### API Errors:
```tsx
try {
  const res = await fetch('/api/zalo/send-bank-card', { ... })
  const data = await res.json()
  
  if (data.success) {
    alert('✅ Đã gửi thông tin thẻ ngân hàng!')
  } else {
    alert('❌ ' + (data.error || 'Không thể gửi'))
  }
} catch (error) {
  alert('❌ Không thể gửi thông tin thẻ ngân hàng')
}
```

### User Feedback:
- ✅ Success: Alert with checkmark
- ❌ Error: Alert with error message
- ⏳ Loading: Button shows spinner + "Đang gửi..."
- 💡 Info: Blue info box with helpful tips

---

## 🚀 Testing Checklist

### Bank Card Modal:
- [ ] Modal opens when clicking "Thẻ ngân hàng" button
- [ ] Search ngân hàng works correctly
- [ ] Can select bank from list
- [ ] Account number validates (numbers only)
- [ ] Account name converts to uppercase
- [ ] Send button disabled when missing required fields
- [ ] API call sends correct data
- [ ] Modal closes after successful send
- [ ] Error handling works (shows alert)
- [ ] Click outside/X button closes modal

### Contact Card Modal:
- [ ] Modal opens when clicking "Danh thiếp" button
- [ ] Can switch between "Self" and "Friend" tabs
- [ ] Self card shows current user info
- [ ] Friends list loads from API
- [ ] Search friends works correctly
- [ ] Can select friend from list
- [ ] Visual selection indicator works
- [ ] Phone number validates (numbers only)
- [ ] Send button disabled when no user selected (friend mode)
- [ ] API call sends correct data
- [ ] Modal closes after successful send
- [ ] Error handling works
- [ ] Click outside/X button closes modal

---

## 📊 File Structure

```
zalo/
├── app/api/zalo/
│   ├── send-bank-card/
│   │   └── route.ts          ✅ NEW - Bank card API endpoint
│   └── send-card/
│       └── route.ts          ✅ NEW - Contact card API endpoint
│
├── components/
│   ├── ZaloChatView.tsx      ✅ UPDATED - Added modal integration
│   ├── SendBankCardModal.tsx ✅ NEW - Bank card modal component
│   └── SendContactCardModal.tsx ✅ NEW - Contact card modal component
│
└── md/
    └── SEND_BANK_CARD_AND_CONTACT_CARD.md ✅ This file
```

---

## 🎉 Summary

### Completed:
1. ✅ Created 2 API endpoints (`/api/zalo/send-bank-card`, `/api/zalo/send-card`)
2. ✅ Created 2 modal components (SendBankCardModal, SendContactCardModal)
3. ✅ Integrated into ZaloChatView attach menu
4. ✅ Added icons and state management
5. ✅ Full validation and error handling
6. ✅ Responsive design with smooth animations
7. ✅ No compilation errors

### Features:
- 💳 20+ Vietnamese banks with search
- 📇 Send self or friend contact cards
- 🔍 Search functionality for banks and friends
- ✅ Input validation (numbers only, max length)
- 🎨 Beautiful gradient UI (Green/Blue themes)
- 📱 Fully responsive design
- 🔄 Loading states and error handling
- 💡 Helpful info boxes

### Next Steps:
- Test sending bank cards in real conversations
- Test sending contact cards (self & friends)
- Verify Zalo API compatibility
- Add to user guide/documentation

---

**Tất cả các file đã được tạo và kiểm tra không có lỗi! 🎉**
