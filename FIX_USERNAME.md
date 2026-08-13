# 🔧 FIX: Hiển thị tên "User N/A"

## ❓ VẤN ĐỀ:

Sau khi đăng nhập, giao diện hiển thị **"User N/A"** thay vì tên thật "Hoàng Kiều Phong"

## 🔍 NGUYÊN NHÂN:

**zca-js v2** không trả về `displayName` trong API object. Tên chỉ xuất hiện trong **console log** khi đăng nhập:
```
Successfully logged into the account Hoàng Kiều Phong
```

Nhưng **không có cách nào** để lấy tên này ra từ API object vì:
- ❌ Không có `api.displayName`
- ❌ Không có `api.userName`  
- ❌ Không có `api.name`
- ❌ Không có `api.account.displayName`

## ✅ GIẢI PHÁP:

### **Option 1: Cho phép user tự nhập tên** ⭐ ĐÃ TRIỂN KHAI

Tôi đã thêm component **UserProfile** với tính năng:
- ✅ Hiển thị tên người dùng
- ✅ **Nút sửa tên** (biểu tượng bút chì)
- ✅ Nhập tên mới và lưu
- ✅ Hiển thị số điện thoại + User ID

### **Cách sử dụng:**

1. **Sau khi đăng nhập**, bạn sẽ thấy card "Thông tin tài khoản"
2. Click vào **biểu tượng bút chì** ✏️ bên cạnh tên
3. Nhập tên: **"Hoàng Kiều Phong"**
4. Click **"💾 Lưu"**
5. Tên sẽ được cập nhật trong Header!

---

### **Option 2: Hardcode tên trong config** (Nếu chỉ dùng 1 tài khoản)

Nếu bạn luôn dùng cùng 1 tài khoản, có thể hardcode:

**File:** `app/api/zalo/login/route.ts`

```typescript
const userInfo = {
  displayName: 'Hoàng Kiều Phong', // ← Hardcode tên ở đây
  phoneNumber: zaloApi.setting?.account?.data?.phoneNumber || 'N/A',
  userId: zaloApi.zpw_enk || 'Unknown'
}
```

---

### **Option 3: Parse từ console log** (Phức tạp, không khuyến nghị)

Có thể intercept console.log để bắt dòng "Successfully logged into..." nhưng:
- ❌ Phức tạp
- ❌ Không ổn định
- ❌ Dễ break khi zca-js update

---

## 🎯 KHUYẾN NGHỊ:

**Dùng Option 1** - Cho phép user tự nhập tên:
- ✅ Đơn giản
- ✅ Linh hoạt
- ✅ Đã triển khai sẵn
- ✅ UX tốt

---

## 📸 PREVIEW:

Sau khi cập nhật, giao diện sẽ có:

```
┌─────────────────────────────────────┐
│  Thông tin tài khoản                │
├─────────────────────────────────────┤
│                                     │
│  🎯  Hoàng Kiều Phong  ✏️          │
│      84332138297                    │
│                                     │
│  ┌──────────────┬─────────────────┐│
│  │ Số điện thoại│ User ID         ││
│  │ 84332138297  │ 0JxsDXtH...     ││
│  └──────────────┴─────────────────┘│
│                                     │
│  ⚠️ Nếu tên không đúng, click ✏️   │
└─────────────────────────────────────┘
```

---

## 🚀 THỰC HIỆN:

**Reload trang và thử:**

1. Đăng nhập lại
2. Tìm card "Thông tin tài khoản"
3. Click biểu tượng ✏️
4. Nhập "Hoàng Kiều Phong"
5. Click "💾 Lưu"
6. Done! ✅

---

**Tên sẽ được lưu trong session và hiển thị ở Header!** 🎉
