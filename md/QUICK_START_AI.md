# 🚀 Quick Start: AI Smart Reply

## ⚡ Setup trong 2 phút

### Bước 1: Lấy API Key (30 giây)
```
1. Vào: https://aistudio.google.com/app/apikey
2. Click "Create API Key"
3. Copy key
```

### Bước 2: Thêm vào .env (10 giây)
```env
GEMINI_API_KEY=AIzaSy...
```

### Bước 3: Restart & Bật AI (30 giây)
```bash
npm run dev
```

Vào **Quản lý Bot** → Tìm **🤖 AI Smart Reply** → **Toggle ON** ✅

## 🎯 Done! Test ngay:

Gửi tin nhắn: **"Bạn là ai?"**

AI sẽ reply: **"Chào bạn! Tôi là trợ lý tự động..."** 🤖✨

---

## 📋 Checklist Deploy Production

### Local Test: ✅
- [ ] AI toggle works
- [ ] Personality selection works
- [ ] AI replies in Vietnamese
- [ ] Fallback works (no API key)

### Deploy to Render/Railway:
1. **Add Environment Variable:**
   ```
   Key: GEMINI_API_KEY
   Value: your-api-key
   ```

2. **Push code:**
   ```bash
   git add .
   git commit -m "feat: Add AI Smart Reply with Gemini"
   git push
   ```

3. **Restart service** (auto restart on push)

4. **Test production:**
   - Login Zalo
   - Bật AI
   - Test reply

### Monitor:
- Check logs: `🤖 [AI Reply] Generated reply...`
- Check quota: https://aistudio.google.com/app/apikey

---

## 💡 Tips

### Best Settings:
- **Personality:** Thân thiện (universal)
- **Trigger:** Thông minh (balanced)
- **Max Length:** 150 ký tự (optimal)

### Save Quota:
- Dùng mode "Chỉ câu hỏi" thay vì "Luôn luôn"
- Chỉ bật AI cho nhóm/user quan trọng (Whitelist)
- Set max length 100-150 thay vì 500

### Troubleshoot:
- **AI không reply?** → Check GEMINI_API_KEY trong .env
- **Reply bằng preset?** → AI Trigger Mode không khớp
- **Reply quá dài/ngắn?** → Điều chỉnh Max Length slider

---

## 📊 Features Summary

| Feature | Status |
|---------|--------|
| 6 Personalities | ✅ |
| 4 Trigger Modes | ✅ |
| Context-Aware (5 msgs) | ✅ |
| Adjustable Length | ✅ |
| Auto Fallback | ✅ |
| Vietnamese Support | ✅ |
| Free Tier | ✅ 15 req/min |
| Response Time | ✅ <1s |

---

## 🎉 Enjoy AI-powered replies!

**Full docs:**
- Technical: `md/AI_SMART_REPLY.md`
- User guide: `md/HUONG_DAN_AI.md`

**Need help?**
- Check logs for errors
- Monitor quota usage
- Adjust settings per use case
