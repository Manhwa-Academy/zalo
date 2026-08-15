# 💾 Backup & Restore Feature

## 🎯 Tính năng

Cho phép người dùng **sao lưu và khôi phục** toàn bộ:
- ⚙️ **Bot Settings**: Tin nhắn tự động, phạm vi reply, whitelist, preset messages
- 💬 **Message Logs**: Lịch sử tin nhắn (tối đa 500 tin gần nhất)
- 👤 **User Info**: Thông tin tài khoản Zalo

## 🚀 Cách sử dụng

### 📤 Xuất Backup

1. Vào tab **"Quản lý Bot"** trong dashboard
2. Tìm section **"💾 Backup & Restore"**
3. Click nút **"📤 Xuất Backup"**
4. File JSON sẽ tự động download về máy với tên: `zalo-backup-[tên]-[ngày-giờ].json`

**Ví dụ tên file:**
```
zalo-backup-Hoàng Kiều Phong-2026-08-15T13-30-45.json
```

### 📥 Nhập Backup (Khôi phục)

1. Click nút **"📥 Nhập Backup"**
2. Chọn file backup (`.json`) từ máy tính
3. **Modal xác nhận** sẽ hiện lên với:
   - 📦 Thông tin backup (người dùng, ngày xuất, số tin nhắn)
   - 🎯 Tùy chọn: Chọn khôi phục **Settings** và/hoặc **Tin nhắn**
   - ⚠️ Cảnh báo về việc ghi đè dữ liệu
4. Tick chọn dữ liệu muốn khôi phục
5. Click **"✅ Khôi phục ngay"**
6. Trang sẽ tự động reload để áp dụng thay đổi

## 📊 Cấu trúc File Backup

```json
{
  "version": "1.0",
  "exportedAt": "2026-08-15T13:30:45.123Z",
  "userId": "bf4c38a7-b192-4915-b16e-f11c38940117",
  "userInfo": {
    "displayName": "Hoàng Kiều Phong",
    "phoneNumber": "0912345678",
    "userId": "118854422039702054",
    "avatar": "https://..."
  },
  "botSettings": {
    "enabled": true,
    "autoReplyMessage": "Xin chào! Tôi đang bận...",
    "replyDelay": 2000,
    "replyScope": "user_only",
    "whitelist": ["323684691472053501"],
    "blacklist": [],
    "useRandomPreset": true,
    "presetMessages": [
      "E-Eto... tôi là Monica Everett...",
      "U-Um... nếu tôi trốn sau cánh cửa...",
      "..."
    ]
  },
  "messages": [
    {
      "id": "1234567890",
      "timestamp": "2026-08-15T12:00:00.000Z",
      "from": "User123",
      "fromName": "Nguyễn Văn A",
      "content": "Hello",
      "type": "User",
      "threadId": "323684691472053501",
      "replied": false,
      "isSelf": false
    }
  ],
  "stats": {
    "totalMessages": 58,
    "exportedMessages": 58
  }
}
```

## 🔄 Use Cases

### 1. **Sync giữa nhiều thiết bị**

```
Device A (PC)          →  Export backup  →  📥 Download
                                              ↓
Device B (Laptop)      ←  Import backup  ←  📤 Upload
```

**Kịch bản:**
- Bạn làm việc trên PC, cấu hình bot rất kỹ
- Muốn dùng cùng settings trên Laptop
- Xuất backup từ PC → Nhập vào Laptop
- ✅ Settings đồng bộ ngay lập tức!

### 2. **Lưu trữ định kỳ**

```
Mỗi tuần → Export backup → Lưu vào Google Drive / Dropbox
```

**Lợi ích:**
- 💾 Có bản backup an toàn
- 🔙 Khôi phục nhanh khi cần
- 📊 Lưu lịch sử tin nhắn quan trọng

### 3. **Test & Experiment**

```
1. Export backup hiện tại (bản gốc)
2. Thay đổi settings / Test các tính năng
3. Nếu không ưng → Import lại bản gốc
4. Nếu OK → Giữ nguyên
```

### 4. **Share Settings với team**

```
Team Lead   →  Export backup với settings tối ưu
     ↓
Team Members  ←  Import backup để dùng cùng config
```

## ⚙️ API Endpoints

### GET `/api/zalo/backup`

**Export backup**

**Response:**
```json
{
  "success": true,
  "backup": { ... }
}
```

### POST `/api/zalo/backup`

**Import/Restore backup**

**Request Body:**
```json
{
  "backup": { ... },
  "restoreSettings": true,
  "restoreMessages": true
}
```

**Response:**
```json
{
  "success": true,
  "results": {
    "settings": true,
    "messages": true,
    "errors": []
  },
  "message": "Restored: Settings Messages"
}
```

## 🛡️ Xử lý dữ liệu

### Settings Restore
- **Ghi đè hoàn toàn** settings hiện tại
- Update trực tiếp vào database (PostgreSQL)

### Messages Restore
- **Merge thông minh** với tin nhắn hiện tại
- Không duplicate: Check `msgId`, `cliMsgId`, `id`
- Chỉ thêm tin nhắn mới chưa có
- Giữ nguyên tin nhắn cũ

**Ví dụ Merge:**
```
Tin nhắn hiện tại:  [A, B, C]
Tin nhắn backup:    [B, C, D, E]
Sau khi merge:      [A, B, C, D, E]  (B, C không bị duplicate)
```

## 📝 Files

### Backend
- `app/api/zalo/backup/route.ts` - API endpoints cho export/import

### Frontend
- `components/BackupRestore.tsx` - UI component

### Integration
- `app/page.tsx` - Add BackupRestore component vào dashboard

## ⚠️ Lưu ý

### 1. **Giới hạn tin nhắn**
- Chỉ export **500 tin nhắn gần nhất** để tránh file quá lớn
- Nếu cần backup nhiều hơn → Có thể tăng limit trong code

### 2. **Bảo mật**
- File backup chứa **settings nhạy cảm** (whitelist, messages)
- **Không share** file backup công khai
- Lưu trữ ở nơi an toàn (encrypted drive)

### 3. **Version Control**
- Hiện tại: `version: "1.0"`
- Nếu thay đổi cấu trúc backup → Tăng version
- Import sẽ check version để đảm bảo tương thích

### 4. **Reload sau Import**
- Trang sẽ **tự động reload** sau khi import thành công
- Cần thiết để UI cập nhật settings mới từ database

## 🎨 UI/UX

### Desktop View
```
┌─────────────────────────────────────┐
│  💾 Backup & Restore                │
│  Sao lưu và khôi phục settings      │
├─────────────────────────────────────┤
│  ┌──────────┐    ┌──────────┐      │
│  │ 📤 Xuất  │    │ 📥 Nhập  │      │
│  │ Backup   │    │ Backup   │      │
│  └──────────┘    └──────────┘      │
└─────────────────────────────────────┘
```

### Import Modal
```
┌─────────────────────────────────────┐
│ 📥 Xác nhận Khôi phục         ✕    │
├─────────────────────────────────────┤
│ 📦 Thông tin Backup:                │
│   👤 Người dùng: Hoàng Kiều Phong   │
│   📅 Xuất lúc: 15/08/2026 13:30     │
│   💬 Tin nhắn: 58 tin               │
│   ⚙️ Settings: ✅ Có                │
├─────────────────────────────────────┤
│ 🎯 Chọn dữ liệu cần khôi phục:      │
│   ☑ ⚙️ Bot Settings                 │
│   ☑ 💬 Tin nhắn (58 tin)            │
├─────────────────────────────────────┤
│ ⚠️ Settings sẽ ghi đè lên hiện tại  │
├─────────────────────────────────────┤
│              [Hủy] [✅ Khôi phục]    │
└─────────────────────────────────────┘
```

## 🚀 Future Enhancements

### 1. **Auto Backup**
- Tự động export backup mỗi tuần/tháng
- Lưu vào cloud (Google Drive API)

### 2. **Incremental Backup**
- Chỉ backup phần thay đổi
- Giảm dung lượng file

### 3. **Backup History**
- Lưu nhiều versions backup
- Rollback về version cũ

### 4. **Cloud Sync**
- Sync backup tự động lên cloud
- Restore từ cloud trên bất kỳ device nào

### 5. **Selective Restore**
- Chọn restore từng phần riêng lẻ
- VD: Chỉ restore preset messages, không restore whitelist

## ✅ Hoàn thành

Tính năng Backup & Restore đã sẵn sàng sử dụng! 🎉

**Test:**
1. Vào dashboard → Tab "Quản lý Bot"
2. Scroll xuống section "💾 Backup & Restore"
3. Test export backup
4. Test import backup
5. Verify settings được restore đúng
