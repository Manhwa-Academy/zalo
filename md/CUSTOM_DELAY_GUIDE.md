# ⏱️ Hướng Dẫn Độ Trễ Phản Hồi Tùy Chỉnh

## 📋 Tổng Quan

Tính năng **Độ trễ phản hồi tùy chỉnh** cho phép bạn nhập **BẤT KỲ SỐ GIÂY NÀO** từ 0 đến 60 giây, không giới hạn ở các giá trị có sẵn.

---

## ✨ Tính Năng Mới

### Trước Đây ❌

```
Chỉ có các lựa chọn cố định:
- Ngay lập tức (0 giây)
- 2 giây
- 5 giây
- 10 giây

→ Không thể chọn 7 giây, 12 giây, 25 giây, v.v.
```

### Bây Giờ ✅

```
Có thể chọn BẤT KỲ GIÁ TRỊ NÀO:
- Các giá trị có sẵn: 0, 2, 5, 10, 15, 20, 30 giây
- Tùy chỉnh: Nhập bất kỳ số nào từ 0-60 giây

→ Có thể chọn 7 giây, 12 giây, 25 giây, 37 giây, v.v.
```

---

## 🎯 Cách Sử Dụng

### Bước 1: Mở Cài Đặt

1. Click vào **avatar** hoặc **tên người dùng** ở góc trên phải
2. Chọn **⚙️ Cài đặt**
3. Tìm phần **🤖 Tự động trả lời**
4. Tìm dòng **"Độ trễ phản hồi"**

### Bước 2: Chọn "Tùy chỉnh"

Trong dropdown **Độ trễ phản hồi**:

```
┌─────────────────────┐
│ Ngay lập tức        │
│ 2 giây              │
│ 5 giây              │
│ 10 giây             │
│ 15 giây             │
│ 20 giây             │
│ 30 giây             │
│ Tùy chỉnh...        │ ← Chọn cái này
└─────────────────────┘
```

### Bước 3: Nhập Số Giây

Sau khi chọn "Tùy chỉnh", một ô input sẽ xuất hiện:

```
┌─────────────────────────────────────┐
│ [    12    ] [OK] [Hủy]             │
│      ↑                              │
│  Nhập số giây (0-60)                │
└─────────────────────────────────────┘
```

**Nhập số từ 0 đến 60**, ví dụ:
- `7` = 7 giây
- `12` = 12 giây
- `25` = 25 giây
- `37` = 37 giây

### Bước 4: Xác Nhận

1. Nhấn nút **OK** HOẶC nhấn phím **Enter**
2. Giá trị sẽ được lưu
3. Input sẽ đóng lại
4. Hiển thị: "Tùy chỉnh: X giây" bên dưới

### Bước 5: Lưu Cài Đặt

1. Scroll xuống cuối modal
2. Click nút **💾 Lưu cài đặt**
3. Đợi thông báo **"Đã lưu cài đặt!"**

---

## 📱 Giao Diện

### Khi Chưa Chọn Tùy Chỉnh

```
┌────────────────────────────────────────────────┐
│ Độ trễ phản hồi                    [5 giây ▼] │
│ Thời gian chờ trước khi bot trả lời           │
└────────────────────────────────────────────────┘
```

### Khi Đang Nhập Tùy Chỉnh

```
┌────────────────────────────────────────────────────────┐
│ Độ trễ phản hồi                    [Tùy chỉnh... ▼]   │
│ Thời gian chờ trước khi bot trả lời (12 giây)         │
│                                                        │
│                    [  12  ] [OK] [Hủy]                │
│                        ↑                               │
│                  Đang nhập...                          │
└────────────────────────────────────────────────────────┘
```

### Sau Khi Lưu Giá Trị Tùy Chỉnh

```
┌────────────────────────────────────────────────────────┐
│ Độ trễ phản hồi                    [Tùy chỉnh... ▼]   │
│ Thời gian chờ trước khi bot trả lời                   │
│ (Tùy chỉnh: 12 giây)              ← Hiển thị giá trị  │
└────────────────────────────────────────────────────────┘
```

### Khi Reload Trang

Nếu đã lưu giá trị tùy chỉnh (ví dụ 12 giây):

```
Load trang → Tự động detect 12 giây không nằm trong [0,2,5,10,15,20,30]
           → Tự động chọn "Tùy chỉnh..." trong dropdown
           → Hiển thị "(Tùy chỉnh: 12 giây)"
```

---

## 🎨 Các Trường Hợp Sử Dụng

### Trường Hợp 1: Delay Ngắn (3-7 giây)

**Phù hợp cho**:
- Reaction nhanh
- Tin nhắn ngắn
- Hội thoại thân thiết

**Ví dụ**:
```
Người dùng: "alo"
[Đợi 4 giây]
Bot: "Alo! Có gì không? 😊"
```

### Trường Hợp 2: Delay Trung Bình (8-15 giây)

**Phù hợp cho**:
- Tin nhắn dài
- Câu hỏi phức tạp
- Trả lời cần "suy nghĩ"

**Ví dụ**:
```
Người dùng: "Cho mình hỏi về sản phẩm ABC được không?"
[Đợi 12 giây]
Bot: "Dạ được ạ! Sản phẩm ABC có các tính năng..."
```

### Trường Hợp 3: Delay Dài (16-30 giây)

**Phù hợp cho**:
- Ban đêm (người thường trả lời chậm)
- Tài khoản "ít online"
- File đính kèm lớn (giả lập đang tải)

**Ví dụ**:
```
Người dùng: [Gửi file 5MB]
[Đợi 25 giây]
Bot: "Đã nhận file rồi nha! Để mình xem."
```

### Trường Hợp 4: Delay Ngẫu Nhiên (Nâng Cao)

**Ý tưởng**: Random delay mỗi lần khác nhau

```javascript
Lần 1: 7 giây
Lần 2: 13 giây
Lần 3: 9 giây
Lần 4: 15 giây

→ Không đều → Giống người thật → Khó bị phát hiện
```

**Lưu ý**: Tính năng này chưa có trong UI, cần code thêm.

---

## 🔧 Kỹ Thuật Thực Hiện

### State Management

```typescript
// Custom delay mode state
const [customDelayMode, setCustomDelayMode] = useState(false)
const [customDelayValue, setCustomDelayValue] = useState<string>('')
```

### Dropdown Value Logic

```typescript
value={customDelayMode ? 'custom' : (
  [0, 2, 5, 10, 15, 20, 30].includes(settings.replyDelay) 
    ? settings.replyDelay 
    : 'custom'
)}
```

**Giải thích**:
- Nếu đang ở chế độ custom → Hiển thị "Tùy chỉnh..."
- Nếu giá trị nằm trong danh sách mặc định → Hiển thị giá trị đó
- Nếu giá trị KHÔNG nằm trong danh sách → Hiển thị "Tùy chỉnh..."

### Auto-Detect Custom Value

```typescript
const loadSettingsFromDatabase = async () => {
  // ... load settings ...
  
  // Check if replyDelay is a custom value
  const defaultDelays = [0, 2, 5, 10, 15, 20, 30]
  const replyDelay = data.settings.replyDelay || 2
  if (!defaultDelays.includes(replyDelay)) {
    // Custom delay detected
    setCustomDelayMode(true)
    setCustomDelayValue(replyDelay.toString())
  }
}
```

### Input Validation

```typescript
const delay = Number(customDelayValue)
if (delay >= 0 && delay <= 60) {
  // Valid → Save
  setSettings({...settings, replyDelay: delay})
  setCustomDelayMode(false)
} else {
  // Invalid → Show alert
  alert('Vui lòng nhập số từ 0 đến 60 giây')
}
```

### Enter Key Support

```typescript
onKeyPress={(e) => {
  if (e.key === 'Enter') {
    // Submit when Enter is pressed
    const delay = Number(customDelayValue)
    if (delay >= 0 && delay <= 60) {
      setSettings({...settings, replyDelay: delay})
      setCustomDelayMode(false)
    }
  }
}}
```

---

## ✅ Validation Rules

### Giá Trị Hợp Lệ

```
✅ Số nguyên từ 0 đến 60
✅ 0, 1, 2, 3, ..., 59, 60
✅ Ví dụ: 7, 12, 25, 37, 48
```

### Giá Trị Không Hợp Lệ

```
❌ Số âm: -5
❌ Số thập phân: 5.5 (sẽ làm tròn)
❌ Quá lớn: 61, 100, 999
❌ Không phải số: "abc", "1o", "two"
❌ Để trống: ""
```

### Error Messages

```typescript
if (delay < 0 || delay > 60) {
  alert('Vui lòng nhập số từ 0 đến 60 giây')
}

if (isNaN(delay)) {
  alert('Vui lòng nhập số hợp lệ')
}
```

---

## 📊 So Sánh

| Tính Năng | Trước | Sau |
|-----------|-------|-----|
| **Số lựa chọn** | 4 (0, 2, 5, 10) | 7 cố định + Tùy chỉnh |
| **Giá trị tối đa** | 10 giây | 60 giây |
| **Linh hoạt** | ❌ Không | ✅ Rất cao |
| **Nhập tùy ý** | ❌ Không | ✅ Có (0-60) |
| **Auto-detect** | ❌ Không | ✅ Có |
| **Enter key** | ❌ Không | ✅ Có |
| **Hiển thị giá trị** | ✅ Có | ✅ Có + custom label |

---

## 💡 Khuyến Nghị

### 1. Delay Theo Loại Hội Thoại

```
Người yêu/Bạn thân:
  → 3-7 giây (trả lời nhanh, thân thiết)

Khách hàng:
  → 8-12 giây (chuyên nghiệp, không vội)

Group chat:
  → 5-10 giây (tương tác trung bình)

Người lạ:
  → 10-15 giây (không quá nhanh)
```

### 2. Delay Theo Thời Gian

```
Ban ngày (8am - 6pm):
  → 5-10 giây (online nhiều)

Buổi tối (6pm - 10pm):
  → 8-15 giây (vừa phải)

Ban đêm (10pm - 8am):
  → 15-25 giây (ngủ/ít online)
```

### 3. Delay Theo Nội Dung

```
Reaction (👍):
  → 3-5 giây

Tin nhắn ngắn ("ok", "alo"):
  → 5-8 giây

Tin nhắn dài:
  → 10-20 giây

Hình ảnh:
  → 7-12 giây (giả lập đang xem)

File:
  → 15-25 giây (giả lập đang tải)
```

---

## 🐛 Troubleshooting

### Vấn Đề 1: Không Thể Nhập Số

**Nguyên nhân**: Input type không phải "number"

**Giải pháp**: Đảm bảo `<input type="number">`

### Vấn Đề 2: Giá Trị Không Lưu

**Nguyên nhân**: Chưa click "Lưu cài đặt"

**Giải pháp**: 
1. Nhập giá trị custom
2. Click OK
3. **Scroll xuống**
4. Click **💾 Lưu cài đặt**

### Vấn Đề 3: Sau Khi Reload Mất Giá Trị Custom

**Nguyên nhân**: Giá trị không được detect đúng

**Giải pháp**: Check console log:
```javascript
console.log('replyDelay:', data.settings.replyDelay)
console.log('Is custom?', ![0,2,5,10,15,20,30].includes(replyDelay))
```

### Vấn Đề 4: Alert "Vui lòng nhập số từ 0 đến 60"

**Nguyên nhân**: 
- Nhập số > 60
- Nhập số < 0
- Nhập không phải số

**Giải pháp**: Nhập số hợp lệ từ 0-60

---

## 🎉 Demo Ví Dụ

### Ví Dụ 1: Delay 7 Giây

```
1. Mở Cài đặt
2. Chọn "Tùy chỉnh..."
3. Nhập: 7
4. Click OK
5. Lưu cài đặt
6. Test:
   - Người dùng: "test"
   - [Đợi 7 giây]
   - Bot: "Xin chào!"
```

### Ví Dụ 2: Delay 12 Giây

```
1. Mở Cài đặt
2. Chọn "Tùy chỉnh..."
3. Nhập: 12
4. Nhấn Enter
5. Lưu cài đặt
6. Test:
   - Người dùng: "alo"
   - [Đợi 12 giây]
   - Bot: "Alo! Có gì không?"
```

### Ví Dụ 3: Thay Đổi Từ 5 Giây Sang 18 Giây

```
1. Hiện tại: 5 giây (giá trị mặc định)
2. Chọn "Tùy chỉnh..."
3. Input tự động điền: 5
4. Sửa thành: 18
5. Click OK
6. Lưu cài đặt
7. Bây giờ delay = 18 giây
```

---

## 📝 Checklist

- [x] Thêm state `customDelayMode` và `customDelayValue`
- [x] Thêm option "Tùy chỉnh..." vào dropdown
- [x] Thêm input number với validation (0-60)
- [x] Thêm nút OK và Hủy
- [x] Hỗ trợ Enter key để submit
- [x] Auto-detect custom value khi load settings
- [x] Hiển thị "(Tùy chỉnh: X giây)" khi có custom value
- [x] Validation: Alert khi giá trị không hợp lệ
- [x] Lưu vào database bình thường (replyDelay)
- [x] UI responsive và đẹp
- [x] Tài liệu hướng dẫn đầy đủ

---

## 🚀 Tương Lai

### Phase 1: ✅ Done
- [x] Tùy chỉnh delay cố định (0-60 giây)

### Phase 2: 🎯 Coming Soon
- [ ] Delay ngẫu nhiên (min-max range)
- [ ] Delay theo loại tin nhắn (reaction, text, image, file)
- [ ] Delay theo thời gian trong ngày
- [ ] Preset delay profiles (Nhanh, Trung bình, Chậm)

### Phase 3: 🚀 Advanced
- [ ] AI tự động điều chỉnh delay dựa trên lịch sử chat
- [ ] Typing indicator (hiển thị "đang soạn tin...")
- [ ] Delay khác nhau cho từng hội thoại
- [ ] Analytics: Thống kê thời gian trả lời trung bình

---

## 📚 File Liên Quan

- **Frontend UI**: `components/Header.tsx`
- **Backend API**: `app/api/settings/route.ts`
- **Database**: `lib/postgres.ts` (replyDelay column)
- **Listener**: `lib/zalo-listener-manager.ts` (apply delay before send)

---

**Version**: 1.0.0  
**Created**: 2026-08-19  
**Status**: ✅ Hoàn thành và hoạt động tốt!
