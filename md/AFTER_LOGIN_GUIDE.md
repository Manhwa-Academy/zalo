# 🎉 Sau khi đăng nhập - Hướng dẫn sử dụng

## ✅ Đã đăng nhập thành công!

Chúc mừng! Bạn đã login vào Zalo Auto Reply Bot dashboard.

---

## 🗺️ **Giao diện chính**

### **Header (Thanh trên cùng):**
```
🖼️ Logo  |  Zalo Auto Reply Bot  |  🔔 Thông báo  |  👤 Hoàng Kiều Phong ▼
```

**Click vào tên** → Hiện dropdown:
- ⚙️ **Cài đặt** - Coming soon
- 🚪 **Đăng xuất thiết bị này** - Logout thiết bị hiện tại
- 🚫 **Đăng xuất tất cả thiết bị** - Logout tất cả devices

---

## 📑 **2 Tabs chính:**

### **1. Chat Zalo (Tab 1)**
Giao diện chat giống Zalo Web, dùng để:
- 📨 Xem tin nhắn real-time
- 💬 Reply thủ công
- 👥 Quản lý groups/friends
- 🔇 Mute/unmute conversations
- 📋 Xem whitelist

### **2. Quản lý Bot (Tab 2)** ⭐
Dashboard chính để cấu hình bot, bao gồm:

---

## 🎛️ **Dashboard - Quản lý Bot**

### **1. Bot Status**
```
🟢 Kết nối: Đang hoạt động
🎧 Listener: Đang lắng nghe
⏰ Hoạt động cuối: 21:30 15/8/2026
```

---

### **2. User Profile**
- Thông tin Zalo account
- Tên hiển thị
- Số điện thoại
- Avatar

---

### **3. Statistics Cards**
```
📊 Tổng tin nhắn: 123
✅ Đã trả lời: 98
💬 Chat đang hoạt động: 15
```

---

### **4. Control Panel (Quan trọng nhất! ⭐)**

#### **A. Basic Settings:**
- **🔘 Bật/Tắt Bot** - Toggle auto-reply on/off
- **💬 Tin nhắn tự động** - Message khi bot reply
- **📝 Reply Scope** - Chọn reply cho:
  - Tất cả mọi người
  - Chỉ cá nhân (không reply group)
  - Chỉ nhóm (không reply cá nhân)
  - Danh sách trắng (whitelist)

#### **B. Preset Messages (Soạn trước):**
- ✅ **Dùng tin nhắn soạn trước** - Bật random preset
- **5 tin nhắn mẫu** - Bot sẽ random 1 trong 5
- Ví dụ: Monica Everett style messages

#### **C. Whitelist:**
Nếu chọn scope = "Whitelist only":
- Thêm user/group ID
- Chỉ reply cho người trong list
- Dùng để reply cho customer/friend cụ thể

---

### **5. AI Settings** 🤖

#### **A. AI Smart Reply:**
- **Bật AI** - Dùng Gemini AI thay vì fixed message
- AI sẽ đọc tin nhắn và reply thông minh

#### **B. AI Personality:**
- 😊 Friendly (thân thiện)
- 💼 Professional (chuyên nghiệp)
- 😎 Casual (thoải mái)
- 😄 Funny (hài hước)
- 🤗 Supportive (hỗ trợ)
- 🥺 Cute (dễ thương - Monica style)

#### **C. Max Length:**
Độ dài tối đa của AI reply (50-500 ký tự)

#### **D. Trigger Mode:**
- **Always** - Luôn dùng AI
- **Questions only** - Chỉ khi có dấu hỏi
- **Smart** - AI tự quyết định khi nào reply
- **Manual** - Tắt auto, reply thủ công

---

### **6. Active Devices (MỚI! 🆕)**

```
📱 Thiết bị đang đăng nhập (2)

┌────────────────────────────────────┐
│ 🖥️ Desktop - Chrome                │
│ OS: Windows                        │
│ IP: 192.168.1.100                  │
│ Hoạt động: 2 phút trước            │
│ [Thiết bị này]                     │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│ 📱 Mobile - Safari                 │
│ OS: iOS                            │
│ IP: 192.168.1.101                  │
│ Hoạt động: 1 giờ trước             │
│                     [Đăng xuất]    │
└────────────────────────────────────┘

[🔄 Làm mới]  [🚫 Đăng xuất tất cả]
```

**Chức năng:**
- Xem tất cả devices đang login
- Logout device cụ thể
- Logout all devices cùng lúc
- Thấy device type, browser, OS, IP
- Hiện "Thiết bị này" badge

---

### **7. Quick Actions**
```
🔄 Reset thống kê
📥 Xuất logs (JSON)
🗑️ Xóa logs
```

---

### **8. Backup & Restore**
```
💾 Xuất backup
📂 Khôi phục từ backup
```

Backup bao gồm:
- Bot settings
- Preset messages
- Whitelist
- AI config

---

### **9. Message Logs**
Danh sách tin nhắn gần đây với:
- Người gửi
- Nội dung
- Thời gian
- Đã reply hay chưa
- Auto/Manual

---

## 🚀 **Quick Start Workflow**

### **Setup Bot lần đầu:**

1. **Vào tab "Quản lý Bot"**
2. **Scroll xuống "Control Panel"**
3. **Cấu hình cơ bản:**
   ```
   ✅ Bật Bot
   💬 Gõ tin nhắn auto-reply
   📝 Chọn scope: "Tất cả"
   ```
4. **Hoặc dùng AI:**
   ```
   🤖 Bật AI Smart Reply
   🥺 Chọn personality: Cute (Monica style)
   📏 Max length: 200
   🎯 Trigger: Smart
   ```
5. **Save** (tự động lưu)
6. **Quay về tab "Chat Zalo"**
7. **Test:** Nhắn tin từ Zalo app → Bot sẽ reply!

---

## 🎯 **Use Cases**

### **Case 1: Customer Support Auto-Reply**
```
Bot: BẬT
Message: "Xin chào! Cảm ơn bạn đã liên hệ. Chúng tôi sẽ phản hồi sớm nhất có thể."
Scope: Tất cả
AI: TẮT
```

### **Case 2: AI Personal Assistant**
```
Bot: BẬT
AI: BẬT
Personality: Friendly
Max Length: 300
Trigger: Smart
Preset: 5 messages (để AI học style)
```

### **Case 3: Monica Roleplay Bot**
```
Bot: BẬT
AI: BẬT
Personality: Cute
Preset: 5 Monica messages
  - "E-Eto... tôi là Monica Everett..."
  - "A-Anou... xin lỗi..."
  - etc.
Trigger: Always
```

### **Case 4: Whitelist VIP Only**
```
Bot: BẬT
Scope: Whitelist only
Whitelist: [Customer A ID, Customer B ID, Boss ID]
→ Chỉ reply cho VIP customers
```

---

## 🔐 **Security Features**

### **Multi-Device Management:**
- Xem tất cả devices đang login
- Logout từ xa (remote logout)
- Logout all nếu bị hack
- Track IP, browser, device type

### **Session Security:**
- Sessions expire sau 7 ngày
- Auto-cleanup expired sessions
- Audit log tất cả login/logout events

---

## 🐛 **Troubleshooting**

### **Bot không reply?**
1. Check Bot Status: Có "Đang hoạt động" không?
2. Check Control Panel: Bot có BẬT không?
3. Check Scope: Có phù hợp với người nhắn không?
4. Check Whitelist: Nếu dùng whitelist, có add ID chưa?
5. Check AI: Nếu dùng AI, có set GEMINI_API_KEY chưa?

### **AI không hoạt động?**
1. Check `.env`: Có `GEMINI_API_KEY` chưa?
2. Check AI Settings: AI có BẬT không?
3. Check Console logs: Có error gì không?
4. Check API quota: Gemini còn quota không?

### **Không thấy tin nhắn mới?**
1. Check Listener: Có "Đang lắng nghe" không?
2. Refresh page (F5)
3. Check Zalo login: Có logout không?

### **Dropdown bị che?**
- Đã fix! z-index cao nhất
- Nếu vẫn bị: Ctrl+F5 (hard refresh)

---

## 📚 **Next Steps**

### **Advanced Features (Coming Soon):**
- [ ] Password change UI
- [ ] User registration
- [ ] 2FA authentication
- [ ] Email notifications
- [ ] Scheduled messages
- [ ] Bot analytics dashboard
- [ ] Export statistics
- [ ] Custom AI prompts
- [ ] Message templates library

---

## 💡 **Tips & Tricks**

1. **Desktop notification:** Click 🔔 "Bật thông báo" → Nhận popup khi có tin nhắn mới
2. **Mute annoying chats:** Trong Chat Zalo, click Mute icon
3. **Quick reply:** Click message → Reply nhanh
4. **Backup thường xuyên:** Export backup để không mất config
5. **Monitor logs:** Xem Message Logs để biết bot reply gì
6. **Test AI:** Thử các personality khác nhau để tìm style phù hợp
7. **Use whitelist:** Nếu chỉ muốn reply cho một số người
8. **Check devices:** Thường xuyên check Active Devices để phát hiện session lạ

---

## 🆘 **Need Help?**

1. Check documentation trong folder `md/`
2. Check error logs trong Console (F12)
3. Check environment variables trong `.env`
4. Restart server: `npm run dev`

---

**Enjoy using Zalo Auto Reply Bot! 🎉**

*Tip: Bắt đầu với AI Cute personality + Monica preset messages để có trải nghiệm thú vị nhất!* 🥺🌸
