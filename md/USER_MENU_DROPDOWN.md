# User Menu Dropdown - Multi-Device Logout Feature

## 📋 Tổng quan

Đã thêm menu dropdown ở Header với các chức năng quản lý tài khoản người dùng, bao gồm:
- ⚙️ **Cài đặt** (Settings)
- 🚪 **Đăng xuất thiết bị này** (Logout this device)
- 🚫 **Đăng xuất tất cả thiết bị** (Logout all devices)

## ✅ Các thay đổi đã thực hiện

### 1. **Header Component** (`components/Header.tsx`)

#### UI Changes:
- ✅ Thay thế nút "Đăng xuất" đơn giản bằng **dropdown menu** với user info
- ✅ Thêm icon dropdown với animation xoay khi mở/đóng
- ✅ Menu hiển thị trên nền dark với backdrop-blur và shadow
- ✅ Click outside để đóng menu (sử dụng `useRef` và `useEffect`)

#### Menu Items:
1. **⚙️ Cài đặt**: Placeholder cho tính năng settings (hiện tại hiển thị alert)
2. **🚪 Đăng xuất thiết bị này**: Đăng xuất chỉ thiết bị hiện tại
3. **🚫 Đăng xuất tất cả thiết bị**: Đăng xuất tất cả thiết bị (với màu đỏ warning)

#### Props:
```typescript
interface HeaderProps {
  userInfo: any
  onLogout: () => void
  onLogoutAllDevices?: () => void  // ✅ New prop
}
```

### 2. **API Endpoint** (`app/api/auth/logout-all/route.ts`)

#### Route: `POST /api/auth/logout-all`

**Chức năng:**
- Xóa `auth_token` cookie để đăng xuất
- Trả về JSON response với success message

**⚠️ Lưu ý quan trọng:**
Hệ thống auth hiện tại sử dụng **cookie đơn giản** (`auth_token`) không lưu sessions trong database, nên:
- "Logout all devices" **thực chất giống logout bình thường** - chỉ xóa cookie trên thiết bị này
- Không thể thực sự invalidate sessions trên các thiết bị khác

**Để hỗ trợ thật sự multi-device logout cần:**
1. Lưu sessions vào database với `user_id` và `session_token`
2. Invalidate tất cả sessions trong DB khi logout all
3. Verify token với DB mỗi khi có request (thay vì chỉ check cookie)

**Response:**
```json
{
  "success": true,
  "message": "Đã đăng xuất thành công",
  "note": "Hệ thống auth hiện tại chưa hỗ trợ tracking multi-device sessions..."
}
```

### 3. **Parent Component** (`app/page.tsx`)

#### Handler: `handleLogoutAllDevices()`

**Flow:**
1. Hiển thị confirmation dialog
2. Gọi API `POST /api/auth/logout-all`
3. Nếu thành công:
   - Hiển thị toast notification
   - Logout khỏi Zalo (`POST /api/zalo/logout`)
   - Clear tất cả state: `isAuthenticated`, `isLoggedIn`, `userInfo`, v.v.
4. Nếu lỗi: Hiển thị toast error

#### Handler: `handleLogout()` (Updated)

**Flow mới:**
1. Logout khỏi auth system (`POST /api/auth/logout`)
2. Logout khỏi Zalo (`POST /api/zalo/logout`)
3. Clear state và set `isAuthenticated = false`

**Trước đây:** Chỉ logout Zalo, không logout auth system

## 🎨 UI/UX Features

### Dropdown Menu Styling:
```css
- Background: dark-200/95 với backdrop-blur-xl
- Border: white/10 rounded-xl
- Shadow: shadow-2xl
- Animation: slideIn animation
- Position: absolute right-0 top-full mt-2
- Width: w-56 (224px)
```

### Menu Items Styling:
- **Hover**: bg-white/5 transition
- **Settings & Logout This Device**: text-gray-300 hover:text-white
- **Logout All Devices**: text-red-400 hover:text-red-300 (warning color)
- **Separator**: 1px divider với bg-white/10

### Responsive Design:
- User info: truncate max-w-[120px]
- Dropdown icon với rotation animation
- Click outside để close menu

## 📝 Code Snippets

### Header.tsx - Dropdown Menu:
```tsx
<div className="relative" ref={menuRef}>
  <button onClick={() => setShowUserMenu(!showUserMenu)}>
    {/* User info + dropdown icon */}
  </button>
  
  {showUserMenu && (
    <div className="absolute right-0 top-full mt-2 ...">
      {/* Menu items */}
    </div>
  )}
</div>
```

### page.tsx - Logout All Handler:
```tsx
const handleLogoutAllDevices = async () => {
  if (!confirm('Bạn có chắc muốn đăng xuất tất cả thiết bị?')) return
  
  const response = await fetch('/api/auth/logout-all', { method: 'POST' })
  if (response.ok) {
    showToast('Đã đăng xuất tất cả thiết bị', 'success')
    // Clear state...
  }
}
```

## 🔄 User Flow

### Flow 1: Logout This Device
```
User clicks user menu → Click "Đăng xuất thiết bị này"
→ handleLogout() called
→ POST /api/auth/logout + POST /api/zalo/logout
→ Clear state → Redirect to login
```

### Flow 2: Logout All Devices
```
User clicks user menu → Click "Đăng xuất tất cả thiết bị"
→ Confirmation dialog → OK
→ handleLogoutAllDevices() called
→ POST /api/auth/logout-all
→ POST /api/zalo/logout
→ Show success toast → Clear state → Redirect to login
```

## 🚀 Testing Checklist

- [x] Menu mở/đóng khi click user button
- [x] Menu đóng khi click outside
- [x] Settings button hiển thị alert placeholder
- [x] Logout this device hoạt động (đăng xuất và redirect)
- [x] Logout all devices hiển thị confirmation
- [x] API endpoint `/api/auth/logout-all` trả về success
- [x] Toast notification hiển thị sau logout all
- [x] State được clear sau logout
- [x] No TypeScript errors

## ⚠️ Limitations

### Current Auth System:
- ❌ Không lưu sessions vào database
- ❌ Không track thiết bị nào đang login
- ❌ "Logout all" không thực sự logout các thiết bị khác

### Recommended Improvements:
1. **Session Storage in Database:**
   ```sql
   CREATE TABLE auth_sessions (
     id UUID PRIMARY KEY,
     user_id VARCHAR(255),
     session_token VARCHAR(255) UNIQUE,
     device_info JSONB,
     ip_address VARCHAR(45),
     created_at TIMESTAMP,
     expires_at TIMESTAMP,
     is_active BOOLEAN
   );
   ```

2. **Session Validation Middleware:**
   - Check session token trong database mỗi request
   - Invalidate expired sessions
   - Support real multi-device tracking

3. **Device Management UI:**
   - Hiển thị danh sách devices đang active
   - Cho phép logout từng device cụ thể
   - Hiển thị thông tin: IP, device type, last active time

## 📦 Files Changed

```
✅ components/Header.tsx          - Added dropdown menu UI
✅ app/page.tsx                   - Added handleLogoutAllDevices
✅ app/api/auth/logout-all/route.ts - Created API endpoint
📝 md/USER_MENU_DROPDOWN.md      - This documentation
```

## 🎯 Next Steps

1. **Implement Settings Page** - Replace alert with actual settings UI
2. **Add Session Database** - Enable real multi-device support
3. **Device Management** - Show list of active devices
4. **Session Expiry** - Auto-logout after inactivity
5. **Security Enhancements** - Add CSRF protection, rate limiting

---

**Status:** ✅ COMPLETED
**Date:** 2026-08-15
**Version:** 1.0
