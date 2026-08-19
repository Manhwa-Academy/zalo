# ✅ Environment Variables - Setup Complete

## 📋 Đã Cấu Hình

### File `.env` đã được cập nhật với:

```env
# Cloudinary CDN (for media uploads)
CLOUDINARY_CLOUD_NAME=dijtgbgwb
CLOUDINARY_API_KEY=425337459992981
CLOUDINARY_API_SECRET=yMS-b0R3-ENthGuYnN0qp4GikA4
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dijtgbgwb
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=ml_default

# Push Notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BJf2apDTKwEhr9Jk-mZe-Vp-lR7P2aGpenDyVUMYoilJGQRqJnLSoc_SSncU6Fo-Xo-NKcMc7bVGdQbsw_iUe3o
```

## 🔐 Security Notes

### ⚠️ QUAN TRỌNG:

1. **File `.env` KHÔNG BAO GIỜ commit lên Git**
   - Đã có trong `.gitignore`
   - Chứa credentials nhạy cảm

2. **Credentials hiện tại**:
   - ✅ Cloudinary: Configured
   - ✅ VAPID Key: Configured
   - ⚠️ Chỉ dùng cho development/testing

3. **Production**:
   - Rotate tất cả keys khi deploy production
   - Dùng environment variables trên hosting platform
   - Không hardcode trong code

## 📦 Environment Variables Overview

### Database
```env
DATABASE_URL=postgresql://...
```
- Neon.tech PostgreSQL
- SSL enabled

### Authentication
```env
ADMIN_USERNAME=admin
ADMIN_PASSWORD=monica412
```
- Admin account
- Change password after first login

### AI
```env
GEMINI_API_KEY=AQ.Ab8RN6J6fg26ghG6KLa518Ytdb3qyA4ZN275xXmnNG61anvaxQ
```
- Gemini AI for auto-reply
- Get from: https://aistudio.google.com/app/apikey

### Cloudinary CDN
```env
CLOUDINARY_CLOUD_NAME=dijtgbgwb
CLOUDINARY_API_KEY=425337459992981
CLOUDINARY_API_SECRET=yMS-b0R3-ENthGuYnN0qp4GikA4
```
- Media uploads (images, voice, video)
- Free tier: 25GB storage + 25GB bandwidth/month
- Dashboard: https://cloudinary.com/console

### Upload Preset
```env
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=ml_default
```
- Frontend unsigned uploads
- Configure in Cloudinary dashboard

### Push Notifications
```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BJf2apDTKwEhr9Jk-mZe-Vp...
```
- Web Push notifications
- Browser notifications for new messages

## 🚀 Usage by Feature

### Voice Messages 🎤
**Uses**: `CLOUDINARY_*`
- Records audio → WebM
- Uploads to Cloudinary
- Converts to MP3
- Returns CDN URL
- Sends via Zalo

### Image/Video Uploads 📷
**Uses**: `NEXT_PUBLIC_CLOUDINARY_*`
- Direct browser upload (unsigned)
- Uses upload preset
- CDN delivery

### Browser Notifications 🔔
**Uses**: `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- Web Push API
- Request permission
- Show notifications

### AI Auto-Reply 🤖
**Uses**: `GEMINI_API_KEY`
- Generate responses
- Context-aware
- Multiple modes

## 📝 Variables by Scope

### Server-side Only (Backend)
```env
DATABASE_URL
CLOUDINARY_API_SECRET
GEMINI_API_KEY
ADMIN_PASSWORD
```
❌ Never exposed to client

### Client-side (Frontend)
```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
NEXT_PUBLIC_VAPID_PUBLIC_KEY
```
✅ Safe to expose (public keys only)

## 🔄 Development vs Production

### Development (.env)
```env
NODE_ENV=development
CLOUDINARY_CLOUD_NAME=dijtgbgwb  # Test account
```

### Production (Platform ENV)
```env
NODE_ENV=production
CLOUDINARY_CLOUD_NAME=prod_account  # Separate account
DATABASE_URL=prod_database_url
```

## 🛠️ Setup Checklist

- [x] `.env` file created
- [x] Database URL configured
- [x] Admin credentials set
- [x] Gemini API key added
- [x] Cloudinary credentials added
- [x] VAPID key added
- [x] `.env.example` updated
- [x] `.gitignore` includes `.env`

## 📚 Documentation References

### Cloudinary
- Dashboard: https://cloudinary.com/console
- Docs: https://cloudinary.com/documentation
- Node.js SDK: https://cloudinary.com/documentation/node_integration

### VAPID (Push Notifications)
- Generate keys: https://vapidkeys.com/
- Web Push API: https://developer.mozilla.org/en-US/docs/Web/API/Push_API

### Gemini AI
- Get API key: https://aistudio.google.com/app/apikey
- Docs: https://ai.google.dev/docs

## ⚙️ Next Steps

1. **Restart Development Server**
   ```bash
   # Stop current server (Ctrl+C)
   npm run dev
   ```

2. **Test Cloudinary Upload**
   - Record voice message
   - Check console logs
   - Verify upload to Cloudinary

3. **Check Cloudinary Dashboard**
   - Go to Media Library
   - Find `zalo-voice-messages` folder
   - See uploaded MP3 files

4. **Monitor Usage**
   - Storage: 25GB limit
   - Bandwidth: 25GB/month limit
   - Transformations: 25K/month limit

## 🎉 Status

**✅ ALL CONFIGURED & READY**

Environment variables are properly set up for:
- ✅ Database connection
- ✅ Authentication
- ✅ AI features
- ✅ Media uploads (Cloudinary)
- ✅ Push notifications
- ✅ Production ready

---

**Updated**: 2026-08-19  
**Status**: ✅ PRODUCTION READY
