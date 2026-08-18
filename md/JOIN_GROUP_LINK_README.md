# 🔗 THAM GIA NHÓM QUA LINK

## ✅ Chức năng hoàn chỉnh

### 📋 **Mô tả:**
Tính năng cho phép tham gia nhóm Zalo bằng cách dán link mời nhóm. Tương tự như tính năng "Join via Link" trên Zalo App.

---

## 🎯 **Tính năng:**

### 1. **Xem thông tin nhóm trước khi tham gia**
- 🖼️ Ảnh đại diện nhóm
- 📝 Tên và mô tả nhóm
- 👥 Số lượng thành viên
- 👤 Danh sách thành viên (preview 5 người)

### 2. **Tham gia nhóm ngay lập tức**
- ✅ Join trực tiếp từ Web
- 🔄 Đồng bộ với Zalo App
- 📢 Thông báo thành công

---

## 🚀 **Cách sử dụng:**

### **Bước 1: Mở modal**
- Bấm nút **🔗** ở góc trên sidebar trái (cạnh nút 👥 Thêm bạn bè)

### **Bước 2: Dán link nhóm**
```
https://zalo.me/g/abcxyz
```
- Bấm **"🔍 Xem thông tin nhóm"**

### **Bước 3: Xem thông tin**
```
┌─────────────────────────────────┐
│ [🖼️]  Nhóm Dev Team             │
│        👥 124 thành viên         │
├─────────────────────────────────┤
│ 📝 Mô tả nhóm:                  │
│ Nhóm thảo luận về lập trình     │
├─────────────────────────────────┤
│ 👤 Thành viên (5+)              │
│ [👤 Hoàng] [👤 Phong] [👤 A]   │
│ +119 khác                       │
└─────────────────────────────────┘
```

### **Bước 4: Tham gia**
- Bấm **"✅ Tham gia nhóm"**
- ✅ Hoàn tất!

---

## 🎨 **Giao diện:**

### **Modal Input:**
```
┌──────────────────────────────────┐
│ Tham gia nhóm              [✕]   │
├──────────────────────────────────┤
│ Link mời nhóm:                   │
│ [https://zalo.me/g/...____]     │
│ 💡 Dán link mời nhóm Zalo        │
│                                  │
│ [🔍 Xem thông tin nhóm]          │
└──────────────────────────────────┘
```

### **Modal Preview:**
```
┌──────────────────────────────────┐
│ Tham gia nhóm              [✕]   │
├──────────────────────────────────┤
│ ┌────────────────────────────┐   │
│ │ [🖼️] Nhóm Dev Team         │   │
│ │      👥 124 thành viên     │   │
│ │                            │   │
│ │ 📝 Mô tả: Nhóm thảo luận  │   │
│ │                            │   │
│ │ 👤 Thành viên:             │   │
│ │ [Avatar] Hoàng             │   │
│ │ [Avatar] Phong   +119 khác │   │
│ └────────────────────────────┘   │
│                                  │
│ [← Quay lại] [✅ Tham gia nhóm] │
│                                  │
│ 💡 Bạn sẽ tham gia trên cả App  │
└──────────────────────────────────┘
```

---

## 📂 **Files:**

### **1. Backend API**
**File:** `app/api/zalo/join-group-link/route.ts`

**Actions:**
- `get_info` - Lấy thông tin nhóm từ link
- `join` - Tham gia nhóm

**API Methods sử dụng:**
```typescript
// Get group info
await zaloApi.getGroupLinkInfo({
  link: 'https://zalo.me/g/abcxyz',
  memberPage: 1
})

// Join group
await zaloApi.joinGroupLink(linkCode)
```

### **2. Frontend Component**
**File:** `components/JoinGroupModal.tsx`

**States:**
- `link` - Link nhóm
- `loading` - Đang load thông tin
- `joining` - Đang tham gia
- `groupInfo` - Thông tin nhóm
- `error` - Lỗi

**Functions:**
- `handleGetInfo()` - Lấy thông tin nhóm
- `handleJoinGroup()` - Tham gia nhóm

### **3. Integration**
**File:** `components/ZaloChatView.tsx`

**Changes:**
- ✅ Import `JoinGroupModal`
- ✅ Add state `showJoinGroupModal`
- ✅ Add button 🔗 to open modal
- ✅ Render modal
- ✅ Refresh group list on success

---

## 🔧 **API Response:**

### **Get Group Info:**
```typescript
{
  success: true,
  groupInfo: {
    groupId: "123456789",
    name: "Nhóm Dev Team",
    desc: "Nhóm thảo luận về lập trình",
    avt: "https://...",
    fullAvt: "https://...",
    totalMember: 124,
    adminIds: ["admin1", "admin2"],
    currentMems: [
      {
        id: "user1",
        dName: "Hoàng Kiều Phong",
        avatar: "https://..."
      },
      // ... more members
    ],
    hasMoreMember: 119
  }
}
```

### **Join Group:**
```typescript
{
  success: true,
  message: "Đã tham gia nhóm thành công!",
  data: { /* group data */ }
}
```

---

## ⚠️ **Xử lý lỗi:**

### **1. Link không hợp lệ**
```
❌ Không thể lấy thông tin nhóm
Link có thể đã hết hạn hoặc không tồn tại
```

### **2. Đã là thành viên**
```
❌ Bạn đã là thành viên của nhóm này rồi
```

### **3. Bị chặn**
```
❌ Bạn đã bị chặn khỏi nhóm này
Vui lòng liên hệ admin nhóm
```

### **4. Link hết hạn**
```
❌ Không thể lấy thông tin nhóm
Link mời có thể đã bị vô hiệu hóa
```

---

## 💡 **Ví dụ Link hợp lệ:**

```
✅ https://zalo.me/g/abcxyz
✅ https://zalo.me/g/xyz123abc
✅ zalo.me/g/test-group
✅ abcxyz (chỉ code)
```

---

## 🎯 **Flow hoàn chỉnh:**

```
1. Bấm nút 🔗 ở sidebar
         ↓
2. Dán link nhóm → Xem thông tin
         ↓
3. Xem thông tin nhóm chi tiết
         ↓
4. Bấm "Tham gia nhóm"
         ↓
5. ✅ Thành công!
         ↓
   ┌─────┴─────┐
   │           │
Web        Zalo App
(Join)     (Sync)
```

---

## 🔄 **Đồng bộ Web ↔️ App:**

✅ **Hoạt động 100%:**
- Tham gia từ Web → Hiển thị trên App
- Tin nhắn trong nhóm → Sync real-time
- Thành viên mới → Cập nhật ngay

---

## 📊 **So sánh với Zalo App:**

| Tính năng | Zalo App | Web (zca-js) |
|-----------|----------|--------------|
| Xem info nhóm | ✅ | ✅ |
| Tham gia nhóm | ✅ | ✅ |
| Xem thành viên | ✅ | ✅ (5 người) |
| Rời nhóm | ✅ | ✅ (đã có) |
| Tạo link mời | ✅ | ⚠️ (cần thêm) |
| Share link | ✅ | ⚠️ (cần thêm) |

---

## 🚀 **Tính năng tương tự có thể làm thêm:**

### 1. **Tạo link mời nhóm**
```typescript
// API: enableGroupLink(groupId)
await zaloApi.enableGroupLink(groupId)
```
- Bật link mời cho nhóm
- Copy link để share

### 2. **Quản lý link mời**
```typescript
// API: getGroupLinkInfo(groupId)
// API: disableGroupLink(groupId)
```
- Xem thông tin link hiện tại
- Tắt link (disable)
- Tạo link mới

### 3. **Thống kê người join qua link**
- Ai đã join qua link?
- Bao nhiêu người join trong tuần?
- Link được share nhiều nhất?

---

## ✅ **Checklist:**

- [x] Backend API route
- [x] Frontend modal component
- [x] Integration vào ZaloChatView
- [x] Nút mở modal ở sidebar
- [x] Get group info từ link
- [x] Join group qua link
- [x] Error handling
- [x] Success notification
- [x] Refresh group list sau khi join
- [x] Documentation đầy đủ

---

## 🧪 **Test:**

```bash
npm run build
npm run dev
```

**Steps:**
1. Mở web → Bấm nút 🔗 ở sidebar
2. Dán link nhóm thật: `https://zalo.me/g/...`
3. Xem thông tin nhóm
4. Bấm "Tham gia nhóm"
5. Kiểm tra Zalo App → Nhóm đã xuất hiện!

---

**🎉 Hoàn thành! Giờ bạn có thể tham gia nhóm Zalo ngay từ Web!**
