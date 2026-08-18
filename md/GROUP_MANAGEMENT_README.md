# ✅ Chức Năng Quản Lý Nhóm Nâng Cao - Hoàn Thành

## 📋 Tổng Quan

Implement 2 chức năng quản lý nhóm quan trọng:
1. **Duyệt yêu cầu tham gia nhóm** (Pending Members)
2. **Quản lý hộp thư mời nhóm** (Invite Box)

Cả 2 chức năng đều đồng bộ hoàn toàn giữa Web và Zalo App.

---

## 🎯 Chức Năng 1: Duyệt Yêu Cầu Tham Gia Nhóm

### Tính Năng
- ✅ Xem danh sách yêu cầu chờ duyệt
- ✅ Chấp nhận yêu cầu tham gia
- ✅ Từ chối yêu cầu tham gia
- ✅ Hiển thị badge số lượng yêu cầu
- ✅ Auto-refresh danh sách
- ✅ Chỉ admin/phó nhóm mới có quyền

### Vị Trí
**Group Info Drawer → "👤 Yêu cầu tham gia"**

### Backend API
**File:** `app/api/zalo/pending-members/route.ts`

#### Action 1: `get_pending` - Lấy danh sách yêu cầu
```typescript
POST /api/zalo/pending-members
Body: {
  action: 'get_pending',
  groupId: '1234567890'
}

Response: {
  success: true,
  data: {
    time: 1234567890,
    users: [
      {
        id: 'user123',
        name: 'Nguyễn Văn A',
        avatar: 'https://...'
      }
    ]
  }
}
```

#### Action 2: `review` - Duyệt/từ chối yêu cầu
```typescript
POST /api/zalo/pending-members
Body: {
  action: 'review',
  groupId: '1234567890',
  members: 'user123' | ['user123', 'user456'],
  isApprove: true | false
}

Response: {
  success: true,
  data: [
    {
      memberId: 'user123',
      status: 0,
      success: true,
      message: 'Thành công'
    }
  ]
}
```

**Status Codes:**
- `0` = SUCCESS - Thành công
- `170` = NOT_IN_PENDING_LIST - Không có trong danh sách chờ
- `178` = ALREADY_IN_GROUP - Đã là thành viên
- `166` = INSUFFICIENT_PERMISSION - Không đủ quyền

### Frontend Component
**File:** `components/PendingMembersSection.tsx`

**Features:**
- Collapsible section với badge đếm số lượng
- Auto-load khi expand
- 2 nút action: ✓ Chấp nhận / ✕ Từ chối
- Loading states cho từng member
- Alert feedback cho user
- Refresh button

**UI Details:**
- Red badge hiển thị số lượng yêu cầu
- Member cards với avatar, name, ID
- Green button (✓) để chấp nhận
- Red button (✕) để từ chối
- Disabled state khi processing

---

## 🎯 Chức Năng 2: Quản Lý Hộp Thư Mời Nhóm

### Tính Năng
- ✅ Xem danh sách lời mời nhóm
- ✅ Xem chi tiết từng lời mời
- ✅ Chấp nhận lời mời → Tham gia nhóm
- ✅ Từ chối/xóa lời mời
- ✅ Hiển thị badge số lượng lời mời
- ✅ Hiển thị thời gian hết hạn
- ✅ Hiển thị thông tin người mời

### Vị Trí
**Sidebar Header → Button 📨 "Hộp thư mời nhóm"**

### Backend API
**File:** `app/api/zalo/invite-box/route.ts`

#### Action 1: `get_list` - Lấy danh sách lời mời
```typescript
POST /api/zalo/invite-box
Body: {
  action: 'get_list',
  page: 0
}

Response: {
  success: true,
  data: {
    invitations: [
      {
        groupId: 'group123',
        groupName: 'Nhóm ABC',
        groupAvatar: 'https://...',
        groupDesc: 'Mô tả nhóm',
        totalMembers: 50,
        inviter: {
          id: 'user123',
          name: 'Nguyễn Văn A',
          avatar: 'https://...'
        },
        creator: {
          id: 'user456',
          name: 'Trần Thị B',
          avatar: 'https://...'
        },
        expiredTs: '1234567890000'
      }
    ],
    total: 5,
    hasMore: false
  }
}
```

#### Action 2: `get_info` - Lấy chi tiết lời mời
```typescript
POST /api/zalo/invite-box
Body: {
  action: 'get_info',
  groupId: 'group123'
}

Response: {
  success: true,
  data: {
    group: { ... },
    inviter: { ... },
    creator: { ... },
    expiredTs: '1234567890000',
    type: 1
  }
}
```

#### Action 3: `join` - Chấp nhận lời mời
```typescript
POST /api/zalo/invite-box
Body: {
  action: 'join',
  groupId: 'group123'
}

Response: {
  success: true,
  message: 'Đã tham gia nhóm thành công'
}
```

#### Action 4: `delete` - Từ chối/xóa lời mời
```typescript
POST /api/zalo/invite-box
Body: {
  action: 'delete',
  groupId: 'group123',
  blockFutureInvite: false | true
}

Response: {
  success: true,
  data: {
    deletedIds: ['group123'],
    errors: {}
  }
}
```

### Frontend Component
**File:** `components/InviteBoxButton.tsx`

**Features:**
- Button trong sidebar header với badge đỏ
- Modal hiển thị danh sách lời mời
- Card cho từng lời mời với đầy đủ thông tin:
  - Avatar & tên nhóm
  - Mô tả nhóm
  - Số lượng thành viên
  - Thời gian hết hạn (countdown)
  - Thông tin người mời
- 2 action buttons:
  - ✓ Tham gia (primary gradient button)
  - ✕ Từ chối (red button)
- Confirm trước khi action
- Alert feedback
- Refresh button

**UI Details:**
- Modal full-screen overlay
- Max 2xl width, max 90vh height
- Scrollable invitation list
- Invitation cards với hover effect
- Expired time với màu amber
- Processing states

---

## 🔧 Zalo APIs Sử Dụng

### Pending Members APIs

**1. getPendingGroupMembers(groupId)**
```typescript
Response: {
  time: number,
  users: [
    {
      uid: string,
      dpn: string,
      avatar: string,
      user_submit: null
    }
  ]
}
```

**2. reviewPendingMemberRequest(payload, groupId)**
```typescript
Payload: {
  members: string | string[],
  isApprove: boolean
}

Response: {
  [memberId: string]: ReviewPendingMemberRequestStatus
}

Status enum:
- SUCCESS = 0
- NOT_IN_PENDING_LIST = 170
- ALREADY_IN_GROUP = 178
- INSUFFICIENT_PERMISSION = 166
```

### Invite Box APIs

**1. getGroupInviteBoxList(payload?)**
```typescript
Payload: {
  mpage?: number,
  page?: number,
  invPerPage?: number,
  mcount?: number
}

Response: {
  invitations: [...],
  total: number,
  hasMore: boolean
}
```

**2. getGroupInviteBoxInfo(payload)**
```typescript
Payload: {
  groupId: string,
  mpage?: number,
  mcount?: number
}

Response: {
  groupInfo: GroupInfo,
  inviterInfo: {...},
  grCreatorInfo: {...},
  expiredTs: string,
  type: number
}
```

**3. joinGroupInviteBox(groupId)**
```typescript
Response: ""
// Empty string on success
```

**4. deleteGroupInviteBox(groupId, blockFutureInvite?)**
```typescript
Response: {
  delInvitaionIds: string[],
  errMap: {
    [groupId: string]: {
      err: number
    }
  }
}
```

---

## 📱 Cách Sử Dụng

### Duyệt Yêu Cầu Tham Gia

```
1. Vào nhóm của bạn (với quyền admin/phó nhóm)
2. Click nút ℹ️ "Thông tin hội thoại"
3. Tìm phần "👤 Yêu cầu tham gia"
4. Click để mở rộng
5. Xem danh sách yêu cầu (nếu có)
6. Click ✓ để chấp nhận hoặc ✕ để từ chối
7. ✅ Xong! Thành viên sẽ được thêm/loại bỏ
```

### Quản Lý Hộp Thư Mời Nhóm

```
1. Click nút 📨 ở sidebar header
2. Xem danh sách lời mời nhóm
3. Đọc thông tin chi tiết:
   - Tên nhóm, mô tả
   - Số lượng thành viên
   - Người mời là ai
   - Còn bao lâu hết hạn
4. Click "✓ Tham gia" để chấp nhận
   HOẶC
   Click "✕" để từ chối
5. ✅ Xong! Nhóm sẽ xuất hiện trong danh sách nếu chấp nhận
```

---

## 🎨 UI/UX Design

### Pending Members Section
- **Header:** 👤 Yêu cầu tham gia + Red badge
- **Collapsed:** Chỉ hiện header với mũi tên
- **Expanded:** Danh sách members với cards
- **Member Card:**
  - Avatar (10x10) hoặc initial letter
  - Name (bold white)
  - ID (gray mono font)
  - 2 buttons: ✓ (green) và ✕ (red)
- **Empty state:** ✅ icon + "Không có yêu cầu tham gia nào"

### Invite Box Button & Modal
- **Button:** 📨 icon + Red badge (absolute positioned)
- **Modal:**
  - Header: 📨 icon + title + count + close button
  - Content: Scrollable list of invitation cards
  - Footer: Refresh button
- **Invitation Card:**
  - Group avatar (14x14) + name + desc
  - Members count + Expired time
  - Inviter info section
  - 2 action buttons (full width + small)
- **Empty state:** 📭 icon + "Không có lời mời nào"

---

## ⚠️ Lưu Ý Quan Trọng

### Quyền Hạn
- **Pending Members:** Chỉ admin và phó nhóm mới có quyền duyệt
- **Invite Box:** Tất cả user đều có thể xem và chấp nhận lời mời

### Thời Gian Hết Hạn
- Lời mời nhóm **hết hạn sau 7 ngày**
- Hiển thị countdown: "Còn X ngày" hoặc "Còn X giờ"
- Không thể tham gia nếu đã hết hạn

### Đồng Bộ
- Duyệt yêu cầu trên Web → Thành viên xuất hiện ngay trên App
- Chấp nhận lời mời trên Web → Tham gia nhóm trên cả Web và App
- Từ chối lời mời → Không nhận lời mời từ nhóm đó nữa (nếu chọn block)

### Error Handling
- Status 166: "Không đủ quyền" → Chỉ admin/phó nhóm
- Status 170: "Không có trong danh sách" → Yêu cầu đã bị xử lý
- Status 178: "Đã là thành viên" → Người dùng đã ở trong nhóm

---

## ✅ Testing Checklist

### Pending Members
- [x] Hiển thị badge số lượng yêu cầu
- [x] Load danh sách khi expand
- [x] Chấp nhận yêu cầu thành công
- [x] Từ chối yêu cầu thành công
- [x] Alert feedback cho user
- [x] Remove khỏi list sau khi xử lý
- [x] Refresh danh sách
- [x] Loading states
- [x] Error handling
- [x] Không có TypeScript errors

### Invite Box
- [x] Hiển thị badge số lượng lời mời
- [x] Modal mở/đóng đúng
- [x] Load danh sách lời mời
- [x] Hiển thị thông tin đầy đủ
- [x] Format expired time
- [x] Chấp nhận lời mời (join group)
- [x] Từ chối lời mời (delete)
- [x] Confirm trước khi action
- [x] Alert feedback
- [x] Remove khỏi list sau action
- [x] Refresh danh sách
- [x] Loading states
- [x] Error handling
- [x] Không có TypeScript errors

---

## 📊 Feature Comparison

| Tính năng | Zalo App | Web (zca-js) | Status |
|-----------|----------|--------------|--------|
| **Pending Members** | | | |
| Xem yêu cầu chờ | ✅ | ✅ | Done |
| Chấp nhận yêu cầu | ✅ | ✅ | Done |
| Từ chối yêu cầu | ✅ | ✅ | Done |
| **Invite Box** | | | |
| Xem lời mời | ✅ | ✅ | Done |
| Chi tiết lời mời | ✅ | ✅ | Done |
| Chấp nhận lời mời | ✅ | ✅ | Done |
| Từ chối lời mời | ✅ | ✅ | Done |
| Block future invite | ✅ | ✅ | Available (not UI) |

---

## 🚀 Future Enhancements (Optional)

### Pending Members
1. **Batch actions** - Chấp nhận/từ chối nhiều cùng lúc
2. **View profile** - Xem profile trước khi duyệt
3. **Notification** - Thông báo khi có yêu cầu mới
4. **Request message** - Xem lời nhắn yêu cầu tham gia

### Invite Box
1. **Block future invite UI** - Checkbox để block lời mời tương lai
2. **Quick preview** - Preview nhóm trước khi tham gia
3. **Sort/filter** - Sắp xếp theo thời gian, số members
4. **Notification** - Thông báo khi có lời mời mới
5. **Auto-delete expired** - Tự động xóa lời mời hết hạn

---

## ✅ Status: COMPLETED

Cả 2 chức năng quản lý nhóm nâng cao đã được implement đầy đủ và sẵn sàng sử dụng! 🎉

**Files Created:**
- ✅ `app/api/zalo/pending-members/route.ts`
- ✅ `app/api/zalo/invite-box/route.ts`
- ✅ `components/PendingMembersSection.tsx`
- ✅ `components/InviteBoxButton.tsx`
- ✅ Updated `components/ZaloChatView.tsx`
