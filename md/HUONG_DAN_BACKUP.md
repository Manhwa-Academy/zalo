# 💾 Hướng dẫn sử dụng Backup & Restore

## 📖 Giới thiệu

Tính năng **Backup & Restore** cho phép bạn:
- 💾 **Sao lưu** toàn bộ cấu hình bot và tin nhắn
- 📥 **Khôi phục** từ file backup
- 🔄 **Đồng bộ** settings giữa nhiều thiết bị
- 🔐 **Lưu trữ** an toàn dữ liệu quan trọng

## 🎯 Các tình huống sử dụng

### 1️⃣ **Đồng bộ giữa PC và Laptop**

**Tình huống:** Bạn đã cấu hình bot rất kỹ trên PC, giờ muốn dùng cùng settings trên Laptop.

**Cách làm:**
```
Bước 1: Trên PC → Xuất backup
Bước 2: Copy file backup qua Laptop (USB/Email/Drive)
Bước 3: Trên Laptop → Nhập backup
✅ Xong! Settings đã đồng bộ
```

### 2️⃣ **Backup định kỳ để phòng mất dữ liệu**

**Tình huống:** Bạn muốn lưu backup hàng tuần để đề phòng.

**Cách làm:**
```
Mỗi Chủ nhật:
1. Xuất backup → Đặt tên theo ngày (backup-15-08-2026.json)
2. Upload lên Google Drive / Dropbox
3. Giữ 4 bản backup gần nhất (1 tháng)
```

### 3️⃣ **Test settings mới một cách an toàn**

**Tình huống:** Muốn thử nghiệm settings mới nhưng sợ làm hỏng cấu hình hiện tại.

**Cách làm:**
```
1. Xuất backup hiện tại (backup-goc.json)
2. Thử nghiệm settings mới thoải mái
3. Nếu không ưng → Nhập lại backup-goc.json
4. Nếu OK → Xuất backup mới và lưu lại
```

### 4️⃣ **Chia sẻ cấu hình với đồng đội**

**Tình huống:** Team bạn muốn dùng cùng 1 cấu hình bot.

**Cách làm:**
```
Team Lead:
1. Tạo cấu hình bot tối ưu
2. Xuất backup
3. Share file backup cho team

Team Members:
1. Nhận file backup
2. Nhập vào bot của mình
✅ Cả team dùng cùng settings!
```

## 📤 Cách Xuất Backup

### Bước 1: Mở Dashboard
- Click tab **"Quản lý Bot"** trên thanh menu

### Bước 2: Tìm section Backup & Restore
- Scroll xuống tìm section **"💾 Backup & Restore"**

### Bước 3: Click Xuất Backup
- Click nút **"📤 Xuất Backup"**
- Đợi vài giây xử lý

### Bước 4: File tự động download
- File sẽ tự động tải về máy với tên:
  ```
  zalo-backup-[tên-của-bạn]-[ngày-giờ].json
  ```
- Ví dụ: `zalo-backup-Hoàng Kiều Phong-2026-08-15T13-30-45.json`

### Bước 5: Lưu file an toàn
- Đặt tên dễ nhớ nếu cần
- Lưu vào thư mục riêng hoặc cloud storage

## 📥 Cách Nhập Backup (Khôi phục)

### Bước 1: Chuẩn bị file backup
- Đảm bảo có file backup `.json` sẵn sàng

### Bước 2: Click Nhập Backup
- Vào section **"💾 Backup & Restore"**
- Click nút **"📥 Nhập Backup"**

### Bước 3: Chọn file
- Cửa sổ chọn file sẽ mở
- Chọn file backup (`.json`) cần khôi phục

### Bước 4: Xem trước & Xác nhận

Modal xác nhận sẽ hiện với các thông tin:

**📦 Thông tin Backup:**
- 👤 Người dùng: Tên người xuất backup
- 📅 Ngày xuất: Thời gian tạo backup
- 💬 Tin nhắn: Số lượng tin nhắn trong backup
- ⚙️ Settings: Có/Không

**🎯 Tùy chọn khôi phục:**

Bạn có thể chọn khôi phục:
- ☑️ **Bot Settings** - Cấu hình bot (tin nhắn tự động, phạm vi, whitelist...)
- ☑️ **Tin nhắn** - Lịch sử tin nhắn

**Mẹo:** Có thể bỏ tick một trong hai nếu chỉ muốn khôi phục 1 phần!

### Bước 5: Khôi phục
- Click nút **"✅ Khôi phục ngay"**
- Đợi vài giây xử lý

### Bước 6: Trang tự động reload
- Trang sẽ tự động tải lại để áp dụng settings mới
- ✅ Hoàn tất! Kiểm tra settings đã được khôi phục

## 🔍 File Backup chứa gì?

File backup là file JSON chứa:

### 1. **Thông tin người dùng**
```json
{
  "displayName": "Hoàng Kiều Phong",
  "phoneNumber": "0912345678",
  "userId": "118854422039702054"
}
```

### 2. **Cấu hình Bot**
```json
{
  "enabled": true,
  "autoReplyMessage": "Xin chào! Tôi đang bận...",
  "replyDelay": 2000,
  "replyScope": "user_only",
  "whitelist": ["323684691472053501"],
  "useRandomPreset": true,
  "presetMessages": [...]
}
```

### 3. **Tin nhắn (tối đa 500 tin gần nhất)**
```json
{
  "messages": [
    {
      "id": "123",
      "timestamp": "2026-08-15T12:00:00.000Z",
      "from": "User123",
      "content": "Hello",
      ...
    }
  ]
}
```

## ⚠️ Lưu ý quan trọng

### ✅ Nên làm:
- 💾 Backup định kỳ (mỗi tuần)
- 🔐 Lưu file backup ở nơi an toàn
- 📝 Đặt tên file có ngày tháng để dễ quản lý
- 🧪 Test import backup trước khi cần thật sự

### ❌ Không nên:
- ⚠️ Share file backup công khai (chứa thông tin cá nhân)
- ⚠️ Xóa file backup cũ ngay (giữ ít nhất 2-3 bản)
- ⚠️ Import backup từ người lạ (có thể chứa settings không phù hợp)

## 🛡️ Bảo mật

File backup chứa:
- ⚠️ Settings nhạy cảm của bot
- ⚠️ Danh sách whitelist (ID nhóm/người dùng)
- ⚠️ Lịch sử tin nhắn

**→ Cần bảo mật như mật khẩu!**

**Khuyến nghị:**
- 🔐 Lưu ở ổ đĩa được mã hóa
- 🔐 Upload lên Google Drive/Dropbox với 2FA
- 🔐 Không gửi qua email không mã hóa

## 💡 Mẹo hay

### Mẹo 1: Đặt tên file theo mục đích
```
backup-goc.json           → Backup ban đầu
backup-test-preset.json   → Đang test preset messages
backup-whitelist-abc.json → Settings whitelist cho group ABC
```

### Mẹo 2: Tạo thư mục quản lý
```
📁 Zalo-Backups/
  📁 2026-08/
    📄 backup-2026-08-01.json
    📄 backup-2026-08-08.json
    📄 backup-2026-08-15.json
  📁 2026-07/
    ...
```

### Mẹo 3: Chỉ restore Settings, không restore Tin nhắn
Nếu bạn chỉ muốn sync settings, không muốn thêm tin nhắn cũ:
- Trong modal xác nhận → **Bỏ tick** "💬 Tin nhắn"
- Chỉ giữ tick "⚙️ Bot Settings"
- → Chỉ settings được restore!

### Mẹo 4: Compare settings giữa 2 backups
- Mở 2 file backup bằng text editor
- So sánh phần `botSettings`
- Xem sự khác biệt để quyết định restore file nào

## ❓ Câu hỏi thường gặp

### Q: File backup có kích thước bao nhiêu?
**A:** Thường 50KB - 500KB tùy số lượng tin nhắn. Rất nhẹ!

### Q: Có giới hạn số lần backup/restore không?
**A:** Không giới hạn! Bạn có thể backup/restore bao nhiêu lần tùy thích.

### Q: Settings bị ghi đè, có cách undo không?
**A:** Có! Chỉ cần import lại backup cũ trước đó.

### Q: Tin nhắn sau khi restore có bị duplicate không?
**A:** Không! Hệ thống tự động kiểm tra và chỉ thêm tin nhắn mới.

### Q: Có thể chỉ restore 1 phần settings không?
**A:** Hiện tại chỉ có thể chọn restore Settings hoặc Tin nhắn. Muốn chi tiết hơn → Edit file backup trước khi import.

### Q: Import backup từ user khác có được không?
**A:** Được, nhưng không khuyến khích vì:
- Settings có thể không phù hợp
- Whitelist IDs khác nhau
- Tin nhắn là của người khác

### Q: Backup có mã hóa không?
**A:** Hiện tại chưa. File là plain JSON. Nên lưu ở nơi an toàn.

## 🎉 Tổng kết

Backup & Restore là tính năng cực kỳ hữu ích để:
- ✅ Bảo vệ dữ liệu
- ✅ Đồng bộ đa thiết bị
- ✅ Thử nghiệm an toàn
- ✅ Chia sẻ cấu hình

**Hãy backup ngay hôm nay để yên tâm!** 💾🎉
