# ✅ Hỗ Trợ Hiển Thị File & Sticker

## 📋 Tổng Quan

Ứng dụng hiện đã hỗ trợ hiển thị:
1. ✅ **Stickers** - Nhãn dán Zalo
2. ✅ **Images** - Hình ảnh
3. ✅ **Files** - Tệp đính kèm (đã fix)
4. ✅ **GIFs** - Ảnh động

---

## 🎨 1. STICKERS (Nhãn Dán)

### URL Đã Sửa
- ❌ **Cũ:** `https://stk.zaloapp.com/...` (không hoạt động)
- ✅ **Mới:** `https://zalo-api.zadn.vn/api/emoticon/sticker/webpc?eid=${stkId}&size=130&version=1`

### Cách Hoạt Động
```typescript
// Listener parse sticker từ tin nhắn
{
  type: 'sticker',
  id: '22626',
  catId: '10371',
  url: 'https://zalo-api.zadn.vn/api/emoticon/sticker/webpc?eid=22626&size=130&version=1'
}
```

### Hiển Thị Trong UI
- Kích thước: 128x128px (w-32 h-32)
- Hover effect: Scale 105%
- Fallback nếu fail:
  1. `stk.za.zaloapp.com/stickers/${catId}/${stkId}.png`
  2. `stk.za.zaloapp.com/static/stickers/${catId}/${stkId}.png`

---

## 📸 2. IMAGES (Hình Ảnh)

### Cách Hoạt Động
```typescript
// Listener parse image từ tin nhắn
{
  type: 'image',
  name: 'photo.jpg',
  url: 'https://...',
  caption: 'Mô tả ảnh'
}
```

### Hiển Thị Trong UI
- Max height: 240px
- Border radius: 12px
- Click để zoom (modal preview)
- Hover effect: Opacity 90%, scale 101%

---

## 📎 3. FILES (Tệp Đính Kèm) - MỚI FIX

### ✅ Đã Thêm Hỗ Trợ

**Listener** (`lib/zalo-listener-manager.ts`):
```typescript
else if (rawContent.type === 'file' || rawContent.fileName || rawContent.fileUrl || rawContent.fileSize) {
  // File attachment - preserve file metadata
  const fileName = rawContent.fileName || rawContent.name || 'File'
  const fileUrl = rawContent.fileUrl || rawContent.url || rawContent.href || ''
  const fileSize = rawContent.fileSize || rawContent.size || 0
  rawContent = JSON.stringify({
    type: 'file',
    name: fileName,
    url: fileUrl,
    size: fileSize,
    caption: rawContent.caption || rawContent.description || '',
  })
  console.log(`📎 [Listener] Parsed file attachment: ${fileName} (${fileSize} bytes)`)
}
```

**History API** (`app/api/zalo/history/route.ts`):
- Đã có support sẵn cho file parsing

**Frontend UI** (`components/ZaloChatView.tsx`):
```typescript
if (parsedObj.type === 'file') {
  return (
    <div className="p-2.5 bg-dark-300/90 border border-white/15 rounded-xl flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-sky-500/20 flex items-center justify-center">
        📄
      </div>
      <div className="flex flex-col truncate">
        <span className="text-xs font-bold">{parsedObj.name || 'Tập tin'}</span>
        <span className="text-[10px] text-gray-400">{(parsedObj.size / 1024 / 1024).toFixed(2)} MB</span>
      </div>
    </div>
  )
}
```

### Hiển Thị File
- Icon: 📄 (file icon)
- Background: Dark với border
- Hiển thị: Tên file + Kích thước (MB)
- Màu: Sky blue accent

---

## 🧪 TEST NGAY

### Test Stickers
1. Gửi sticker trong Zalo (từ điện thoại hoặc người khác)
2. Kiểm tra browser console:
   ```
   ✅ Rendering sticker: {catId: 10371, stkId: 22626, stickerUrl: "..."}
   ```
3. Sticker phải hiển thị là ảnh (không phải text)

### Test Files
1. Người khác gửi file (PDF, DOCX, ZIP, v.v.)
2. Kiểm tra browser console:
   ```
   📎 [Listener] Parsed file attachment: document.pdf (2048576 bytes)
   ```
3. File phải hiển thị với:
   - Icon 📄
   - Tên file
   - Kích thước (MB)

### Test Images
1. Người khác gửi ảnh
2. Ảnh phải hiển thị preview
3. Click để zoom

---

## 🎯 FILE TYPES SUPPORTED

### Hiển Thị Đầy Đủ
- ✅ **Stickers** - Nhãn dán Zalo
- ✅ **Images** - PNG, JPG, JPEG, WebP
- ✅ **GIFs** - Ảnh động
- ✅ **Files** - PDF, DOCX, ZIP, TXT, v.v.

### Parsing Từ Zalo API
```typescript
message.data.content = {
  // Sticker
  type: 'sticker',
  id: '...',
  catId: '...',
  
  // Image
  type: 'image',
  url: '...',
  photoUrl: '...',
  
  // File
  type: 'file',
  fileName: '...',
  fileUrl: '...',
  fileSize: 123456,
}
```

---

## 📊 SIDEBAR PREVIEW

### Tin Nhắn Cuối
- Sticker: `[Nhãn dán]`
- Image: `[Hình ảnh]`
- File: `[Tập tin: filename.pdf]`
- GIF: `[GIF Animation]`

---

## 🐛 DEBUG

### Nếu Sticker Không Hiển Thị
1. Check console có error `ERR_NAME_NOT_RESOLVED` không?
2. Check URL có đúng domain `zalo-api.zadn.vn` không?
3. Thử xóa old messages:
   ```sql
   DELETE FROM message_logs WHERE content LIKE '%stk.zaloapp.com%';
   ```

### Nếu File Không Hiển Thị
1. Check console log: `📎 [Listener] Parsed file attachment`
2. Check parsed content có `type: 'file'` không
3. Check UI có render file block không

### Nếu URL Bị Thiếu
Có thể Zalo API không trả về URL đầy đủ. Trong trường hợp này:
- Sticker: Fallback to alternative CDN
- File: Hiển thị tên + size (không có download link)

---

## 🔧 FILES CHANGED
1. ✅ `lib/zalo-listener-manager.ts` - Added file parsing
2. ✅ `app/api/zalo/history/route.ts` - Already had file support
3. ✅ `components/ZaloChatView.tsx` - Already had file UI

---

## 🚀 READY TO TEST!

Hãy test ngay:
1. Gửi sticker → Kiểm tra hiển thị ảnh
2. Gửi file → Kiểm tra hiển thị tên + size
3. Gửi ảnh → Kiểm tra preview
