# 🤖 AI Smart Reply - Feature Documentation

> **Zalo Bot Auto-Reply** với trí tuệ nhân tạo Google Gemini 1.5 Flash

---

## 📚 Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Features](#features)
4. [Documentation](#documentation)
5. [Deployment](#deployment)
6. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

**AI Smart Reply** là tính năng trả lời tự động thông minh sử dụng Google Gemini API:

### Key Highlights:
- 🧠 **Context-Aware:** Hiểu ngữ cảnh từ 5 tin nhắn gần nhất
- 🎭 **6 Personalities:** Từ Chuyên nghiệp đến Dễ thương
- ⚡ **4 Trigger Modes:** Thông minh, Câu hỏi, Luôn luôn, Thủ công
- 🇻🇳 **Vietnamese Native:** Hỗ trợ tiếng Việt hoàn hảo
- 💰 **Free Tier:** 15 requests/phút, 1500/ngày
- 🚀 **Fast:** Response time <1 giây

---

## ⚡ Quick Start

### 3 bước đơn giản:

```bash
# 1. Lấy API key (FREE)
https://aistudio.google.com/app/apikey

# 2. Thêm vào .env
echo "GEMINI_API_KEY=your-key-here" >> .env

# 3. Restart & Enable
npm run dev
# → Vào "Quản lý Bot" → Bật AI ✅
```

**Xem chi tiết:** [`QUICK_START_AI.md`](QUICK_START_AI.md)

---

## ✨ Features

### 1. 🎭 Six Personalities

| Personality | Style | Use Case |
|-------------|-------|----------|
| 🌟 Thân thiện | Warm, helpful, polite | Customer service, support |
| 💼 Chuyên nghiệp | Concise, formal | Business, professional |
| 😊 Thoải mái | Casual, relaxed | Friends, casual chat |
| 😄 Hài hước | Funny, playful | Entertainment, fun groups |
| 💙 Hỗ trợ | Supportive, empathetic | Counseling, advice |
| 🥺 Dễ thương | Cute, shy (Monica style) | Anime fans, kawaii |

### 2. ⚡ Four Trigger Modes

- **🧠 Thông minh:** Auto-detect questions & long messages (recommended)
- **❓ Chỉ câu hỏi:** Only reply to messages with "?"
- **⚡ Luôn luôn:** AI for all messages (uses more quota)
- **✋ Thủ công:** Disable AI, use preset only

### 3. 🎨 Customizable Settings

- **Max Length:** 50-500 characters
- **Context Window:** Last 5 messages
- **Auto Fallback:** Uses preset when AI fails
- **Smart Detection:** Keywords, questions, message length

### 4. 🛡️ Reliability

- ✅ Automatic fallback on error
- ✅ No crashes if API key missing
- ✅ Handles quota limits gracefully
- ✅ Works alongside preset messages

---

## 📚 Documentation

### For Users (Vietnamese):
- 📖 **[QUICK_START_AI.md](QUICK_START_AI.md)** - Setup trong 2 phút
- 📘 **[md/HUONG_DAN_AI.md](md/HUONG_DAN_AI.md)** - Hướng dẫn đầy đủ
- 📋 **[DEPLOY_CHECKLIST.md](DEPLOY_CHECKLIST.md)** - Deploy checklist

### For Developers (English):
- 🔧 **[md/AI_SMART_REPLY.md](md/AI_SMART_REPLY.md)** - Technical documentation
- 📊 **[md/FEATURES_IMPLEMENTED.md](md/FEATURES_IMPLEMENTED.md)** - Complete feature list
- 💾 **[COMMIT_MESSAGE.txt](COMMIT_MESSAGE.txt)** - Detailed commit message

### Code Structure:
```
lib/
  ├── ai-reply.ts              # Core AI logic
  ├── bot-settings.ts          # Settings interface
  ├── user-manager.ts          # AI settings storage
  └── zalo-listener-manager.ts # AI integration

components/
  └── AISettings.tsx           # UI component

app/api/zalo/
  └── settings/route.ts        # API endpoints
```

---

## 🚀 Deployment

### Local Development:

```bash
# 1. Get API key
open https://aistudio.google.com/app/apikey

# 2. Add to .env
GEMINI_API_KEY=AIzaSy...

# 3. Run
npm run dev

# 4. Test
# → Login Zalo
# → Enable AI in dashboard
# → Send test message
```

### Production (Render/Railway):

1. **Push code:**
   ```bash
   git add .
   git commit -m "feat: Add AI Smart Reply"
   git push
   ```

2. **Add environment variable:**
   - Render: Dashboard → Environment → Add `GEMINI_API_KEY`
   - Railway: Variables → New Variable `GEMINI_API_KEY`

3. **Verify:**
   - Service auto-restarts
   - Check logs for `🤖 [AI Reply]` messages
   - Test AI toggle in production

**Full checklist:** [`DEPLOY_CHECKLIST.md`](DEPLOY_CHECKLIST.md)

---

## 🐛 Troubleshooting

### Common Issues:

#### 1. "AI Reply chưa được cấu hình"
- **Cause:** No API key
- **Fix:** Add `GEMINI_API_KEY` to `.env`, restart

#### 2. Bot uses preset instead of AI
- **Cause:** Trigger mode doesn't match
- **Fix:** 
  - Test with "Luôn luôn" mode
  - Or send question with "?"
  - Or send long message (>10 words)

#### 3. AI replies in English
- **Cause:** Rare edge case
- **Fix:** System prompt specifies Vietnamese, should auto-correct

#### 4. Response too slow
- **Cause:** Gemini API latency
- **Expected:** <1s (usually 300-800ms)
- **Fix:** Check network, API status

### Debug Logs:

Look for these in console:
```
✅ Good:
🤖 [AI Reply] Generated reply for "..." (250 tokens)
✅ Auto-reply sent to ... : "..."

❌ Issues:
❌ [AI Reply] Error: ...
⚠️ [AI] Failed, fallback to normal: ...
```

---

## 💡 Best Practices

### Recommended Settings:
- **Personality:** Thân thiện (universal)
- **Trigger:** Thông minh (balanced)
- **Max Length:** 150 characters (optimal)

### Save Quota:
- ✅ Use "Thông minh" not "Luôn luôn"
- ✅ Enable only for important groups (Whitelist)
- ✅ Set max length 100-150 not 500

### Quality Tips:
- ✅ Let AI remember context (don't clear messages frequently)
- ✅ Choose personality matching your audience
- ✅ Adjust length based on use case

---

## 📊 Performance

### Quota Usage:

| Traffic | Requests/Day | Quota Used |
|---------|--------------|------------|
| Low | 100-500 | 10-30% |
| Medium | 500-1500 | 30-100% |
| High | 1500-3000 | 100%+ (fallback) |

### Response Time:
- **Average:** 500ms
- **Best case:** 300ms
- **Worst case:** 1000ms
- **Timeout:** Uses fallback after 5s

---

## 🎯 Roadmap

### Completed ✅
- [x] Core AI integration
- [x] 6 personalities
- [x] 4 trigger modes
- [x] Context awareness
- [x] Auto fallback
- [x] Vietnamese support
- [x] UI settings

### Future 🔮
- [ ] GPT-4 / Claude support
- [ ] Custom personality training
- [ ] AI learning from feedback
- [ ] Response caching
- [ ] Multi-language UI
- [ ] Voice message transcription

---

## 🤝 Contributing

### Report Issues:
- Found a bug? Open an issue
- Have suggestions? Create a feature request

### Improve Documentation:
- Fix typos in docs
- Add examples
- Translate to other languages

---

## 📄 License

MIT License - See main project LICENSE file

---

## 🙏 Credits

- **AI Model:** Google Gemini 1.5 Flash
- **Framework:** Next.js 14
- **Zalo API:** zca-js
- **Database:** PostgreSQL (Neon)

---

## 📞 Support

- 📖 **Docs:** See files above
- 🐛 **Issues:** Check Troubleshooting section
- 💬 **Discussion:** Project GitHub Discussions
- 📧 **Contact:** See main README

---

**Version:** 1.0.0  
**Release Date:** 2026-08-15  
**Status:** ✅ Production Ready  

---

## 🎉 Enjoy AI-powered conversations!

Made with ❤️ for better chatbot automation
