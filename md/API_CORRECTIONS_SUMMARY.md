# 🔧 Tóm Tắt Sửa API

## ✅ Đã Sửa: Các API Media Theo Đúng Tài Liệu zca-js

**Ngày**: 19/08/2026  
**Trạng thái**: ✅ Hoàn thành

---

## 📋 Những Gì Đã Sửa

### 1. ❌ Trước: Cách Dùng API Sai

```typescript
// SAI - Dùng đường dẫn file trực tiếp
await zaloApi.sendVoice(filePath, threadId, threadType)
await zaloApi.sendVideo(filePath, threadId, threadType)
await zaloApi.uploadAttachment(filePath) // Thiếu threadId
```

### 2. ✅ Sau: Cách Dùng API Đúng

```typescript
// ĐÚNG - Dùng options object + Upload trước
// Bước 1: Upload để lấy URL
const uploadResult = await zaloApi.uploadAttachment(filePath, threadId, threadType)

// Bước 2: Gửi bằng URL
await zaloApi.sendVoice({ voiceUrl: uploadResult.fileUrl, ttl: 0 }, threadId, threadType)
await zaloApi.sendVideo({ videoUrl: uploadResult.fileUrl, thumbnailUrl: uploadResult.normalUrl }, threadId, threadType)
```

---

## 🔄 Các File Đã Thay Đổi

### 1. `app/api/zalo/send-voice/route.ts`

**Cách cũ (sai)**:
```typescript
await zaloApi.sendVoice(filePath, threadId, threadType)
```

**Cách mới (đúng)**:
```typescript
// Bước 1: Upload để lấy voiceUrl
const uploadResult = await zaloApi.uploadAttachment(filePath, threadId, threadType)
const voiceUrl = uploadResult[0]?.fileUrl || uploadResult[0]?.normalUrl

// Bước 2: Gửi với voiceUrl trong options
const options = { voiceUrl, ttl: 0 }
await zaloApi.sendVoice(options, threadId, threadType)
```

**Những thay đổi**:
- ✅ Upload file trước để lấy URL
- ✅ Dùng options object với thuộc tính `voiceUrl`
- ✅ Hỗ trợ tham số `ttl` (thời gian tồn tại)
- ✅ Trả về voiceUrl trong response

---

### 2. `app/api/zalo/upload-attachment/route.ts`

**Cách cũ (sai)**:
```typescript
await zaloApi.uploadAttachment(filePath)
```

**Cách mới (đúng)**:
```typescript
await zaloApi.uploadAttachment(filePath, threadId, threadType)
```

**Những thay đổi**:
- ✅ Bây giờ yêu cầu tham số `threadId` (từ FormData)
- ✅ Bây giờ yêu cầu tham số `threadType` (từ FormData)
- ✅ Trích xuất và trả về mảng URLs trong response
- ✅ Hỗ trợ upload cả đơn file và nhiều file

---

### 3. `app/api/zalo/forward-message/route.ts`

**Trạng thái**: ✅ Đã đúng từ trước

**Cách dùng**:
```typescript
await zaloApi.forwardMessage(messageId, threadId, threadType)
```

**Những thay đổi**:
- ✅ Thêm comment tài liệu API
- ✅ Không cần thay đổi chức năng

---

### 4. `MEDIA_FEATURES_GUIDE.md`

**Những thay đổi**:
- ✅ Cập nhật phần API Reference với cách dùng đúng
- ✅ Thêm giải thích "Upload Pattern for Media"
- ✅ Thêm tài liệu về "Options Objects"
- ✅ Bổ sung code ví dụ cho tất cả API
- ✅ Thêm ghi chú quan trọng về URL vs đường dẫn file

---

## 📝 Tham Khảo API

### Gửi Tin Nhắn Thoại (Send Voice)
```typescript
api.sendVoice(options: { voiceUrl, ttl? }, threadId, type?)
```

**Ví dụ**:
```typescript
const uploadResult = await api.uploadAttachment('./voice.mp3', threadId, threadType)
await api.sendVoice({ 
  voiceUrl: uploadResult[0].fileUrl,
  ttl: 0 
}, threadId, threadType)
```

---

### Gửi Video (Send Video)
```typescript
api.sendVideo(options: { 
  videoUrl, 
  thumbnailUrl, 
  msg?, 
  duration?, 
  width?, 
  height?, 
  ttl? 
}, threadId, type?)
```

**Ví dụ**:
```typescript
const uploadResult = await api.uploadAttachment('./video.mp4', threadId, threadType)
await api.sendVideo({ 
  videoUrl: uploadResult[0].fileUrl,
  thumbnailUrl: uploadResult[0].thumbUrl || uploadResult[0].normalUrl
}, threadId, threadType)
```

---

### Gửi Link (Send Link)
```typescript
api.sendLink(options: { link, msg?, ttl? }, threadId, type?)
```

**Ví dụ**:
```typescript
await api.sendLink({ 
  link: 'https://example.com',
  msg: 'Xem cái này nè!'
}, threadId, threadType)
```

---

### Upload File Đính Kèm (Upload Attachment)
```typescript
api.uploadAttachment(source: string | string[], threadId, type?)
```

**Trả về**:
```typescript
type UploadAttachmentResponse = Array<{
  // Đối với ảnh:
  normalUrl?: string
  hdUrl?: string
  thumbUrl?: string
  photoId?: string
  width?: number
  height?: number
  
  // Đối với video/file:
  fileUrl?: string
  fileId?: string
  fileName?: string
  totalSize?: number
  
  // Chung:
  fileType: 'image' | 'video' | 'others'
  finished: number | boolean
}>
```

**Ví dụ**:
```typescript
// Upload 1 file
const result = await api.uploadAttachment('./photo.jpg', threadId, threadType)

// Upload nhiều file
const result = await api.uploadAttachment([
  './photo1.jpg',
  './photo2.jpg'
], threadId, threadType)
```

---

### Chuyển Tiếp Tin Nhắn (Forward Message)
```typescript
api.forwardMessage(messageId, threadId, type?)
```

**Ví dụ**:
```typescript
await api.forwardMessage('msg_123', targetThreadId, threadType)
```

---

## 🎯 Các Mẫu Quan Trọng

### Mẫu 1: Upload-Rồi-Gửi (cho Media)
```typescript
// 1. Upload file để lấy URL
const uploadResult = await zaloApi.uploadAttachment(filePath, threadId, threadType)

// 2. Lấy URL từ kết quả
const url = uploadResult[0]?.fileUrl || uploadResult[0]?.normalUrl

// 3. Gửi bằng URL trong options object
await zaloApi.sendVoice({ voiceUrl: url }, threadId, threadType)
await zaloApi.sendVideo({ videoUrl: url, thumbnailUrl: url }, threadId, threadType)
```

### Mẫu 2: Options Object (cho Tất Cả Hàm Gửi)
```typescript
// Luôn dùng options object làm tham số đầu tiên
await zaloApi.sendLink({ link: url }, threadId, type)
await zaloApi.sendVideo({ videoUrl, thumbnailUrl }, threadId, type)
await zaloApi.sendVoice({ voiceUrl }, threadId, type)
```

### Mẫu 3: ThreadId Bắt Buộc (cho Upload)
```typescript
// uploadAttachment bây giờ yêu cầu threadId
await zaloApi.uploadAttachment(filePath, threadId, threadType)

// KHÔNG PHẢI: await zaloApi.uploadAttachment(filePath) ❌
```

---

## ⚠️ Những Thay Đổi Quan Trọng

### Ảnh Hưởng Đến Frontend: KHÔNG CÓ
- Tất cả code frontend gửi FormData với các trường bắt buộc
- Backend tự xử lý mẫu upload-rồi-gửi bên trong
- Không cần thay đổi gì ở các component frontend hiện tại

### Thay Đổi Ở Backend:
1. **send-voice/route.ts**: Giờ upload trước, rồi gửi với URL
2. **upload-attachment/route.ts**: Giờ yêu cầu threadId từ FormData
3. **Tài liệu**: Cập nhật để phản ánh cách dùng API đúng

---

## ✅ Danh Sách Kiểm Tra

- [ ] Tin nhắn thoại: Ghi âm và gửi → kiểm tra nhận được
- [ ] Video: Upload và gửi → kiểm tra nhận được với thumbnail
- [ ] Upload file: Upload file → kiểm tra URL trả về
- [ ] Chuyển tiếp: Forward tin nhắn → kiểm tra xuất hiện ở thread đích
- [ ] Link preview: Gửi link → kiểm tra preview hiển thị

---

## 📚 Tham Khảo

- Tài liệu zca-js: [https://tdung.gitbook.io/zca-js](https://tdung.gitbook.io/zca-js)
- Sửa từ người dùng: Query #1 trong context transfer
- Các file đã sửa: Xem phần "Các File Đã Thay Đổi" ở trên

---

**Trạng thái**: ✅ Đã áp dụng tất cả các sửa đổi  
**Bước tiếp theo**: Test tất cả tính năng media với API mới
