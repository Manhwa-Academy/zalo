# 🧪 Test AI Keywords & Viết tắt

## ✅ Đã thêm: 70+ từ khóa và viết tắt

## 📝 Danh sách từ khóa mới

### 1. Từ hỏi (Question Words)
| Từ đầy đủ | Viết tắt | Ví dụ |
|-----------|----------|-------|
| tại sao | ts, v sao | "ts lại thế?", "v sao không rep?" |
| như thế nào | ntn, tn | "làm ntn?", "tn đây?" |
| khi nào | kn | "kn đi?", "kn về?" |
| bao giờ | bg | "bg đi ăn?" |
| bao nhiêu | bn | "giá bn?", "bn tiền?" |
| phải không | pk | "đúng pk?", "là vậy pk?" |
| được không | đk, okk | "đi đk?", "ăn đk?" |
| có thể | ct | "ct làm được k?" |
| ở đâu | đâu | "ở đâu vậy?", "đâu rồi?" |

### 2. Yêu cầu giúp đỡ (Help Requests)
| Từ đầy đủ | Viết tắt | Ví dụ |
|-----------|----------|-------|
| giải thích | gt | "gt giúp em", "gt cái này" |
| hướng dẫn | hd | "hd cái", "hd em với" |
| làm sao | ls | "ls làm được?", "ls fix?" |
| làm thế nào | ltn | "ltn làm được?" |
| giúp đỡ | - | "giúp đỡ em", "giúp với" |
| chi tiết | ct | "ct hơn đi", "xem ct" |

### 3. Thông tin (Information)
| Từ đầy đủ | Viết tắt | Ví dụ |
|-----------|----------|-------|
| thông tin | tt | "tt gì?", "cho tt" |
| cho biết | cb | "cb giúp em", "cb xem" |
| kiểm tra | kt | "kt giúp em", "kt xem" |
| có không | ck | "có ck?", "ck có?" |

### 4. Câu hỏi thân mật (Casual Questions)
| Câu | Ví dụ |
|-----|-------|
| em ơi | "em ơi anh yêu em" |
| anh ơi | "anh ơi em buồn" |
| bạn ơi | "bạn ơi giúp mình" |
| này | "này nghe này" |
| nghe | "nghe này", "nghe nè" |
| biết không | "biết không?" |

### 5. Cảm thán cần phản hồi (Exclamations)
| Câu | Ví dụ |
|-----|-------|
| ối, ôi, trời | "ối trời ơi", "ôi dồi ôi" |
| wow, omg | "wow ngon quá", "omg luôn" |
| haha, hihi, hehe | "haha vui quá", "hihi dễ thương" |

### 6. Phủ định cần làm rõ (Negations)
| Từ đầy đủ | Viết tắt | Ví dụ |
|-----------|----------|-------|
| không hiểu | kh | "kh nữa", "kh gì cả" |
| không biết | kb | "kb luôn", "kb nha" |
| không rõ | ko rõ | "ko rõ lắm", "chưa rõ" |

---

## 🧪 Test Cases

### Test 1: Viết tắt → ✅ DÙNG AI
```
Input: "ts lại thế?"
Expected: AI reply (có "ts" = tại sao)

Input: "làm ntn?"
Expected: AI reply (có "ntn" = như thế nào)

Input: "kn đi?"
Expected: AI reply (có "kn" = khi nào)

Input: "giá bn?"
Expected: AI reply (có "bn" = bao nhiêu)

Input: "đúng pk?"
Expected: AI reply (có "pk" = phải không)

Input: "đi đk?"
Expected: AI reply (có "đk" = được không)

Input: "gt giúp"
Expected: AI reply (có "gt" = giải thích)

Input: "hd em"
Expected: AI reply (có "hd" = hướng dẫn)

Input: "kh nữa"
Expected: AI reply (có "kh" = không hiểu)

Input: "kb luôn"
Expected: AI reply (có "kb" = không biết)
```

### Test 2: Câu thân mật → ✅ DÙNG AI
```
Input: "em ơi"
Expected: AI reply (có "em ơi")

Input: "anh ơi yêu em"
Expected: AI reply (có "anh ơi")

Input: "bạn ơi giúp"
Expected: AI reply (có "bạn ơi")

Input: "này nghe này"
Expected: AI reply (có "này")
```

### Test 3: Cảm thán → ✅ DÙNG AI
```
Input: "ối trời"
Expected: AI reply (có "ối")

Input: "wow ngon"
Expected: AI reply (có "wow")

Input: "haha vui"
Expected: AI reply (có "haha")

Input: "omg luôn"
Expected: AI reply (có "omg")
```

### Test 4: Từ khóa thông dụng → ✅ DÙNG AI
```
Input: "cho tôi xem"
Expected: AI reply (có "cho tôi")

Input: "gửi em"
Expected: AI reply (có "gửi")

Input: "check giúp"
Expected: AI reply (có "check")

Input: "cần gì"
Expected: AI reply (có "cần")

Input: "muốn ăn"
Expected: AI reply (có "muốn")
```

### Test 5: Tin ngắn KHÔNG trigger → ❌ KHÔNG dùng AI
```
Input: "k" (1 ký tự)
Expected: Preset message

Input: "ok" (2 ký tự, không có keyword)
Expected: Preset message

Input: "uh" (2 ký tự, không có keyword)
Expected: Preset message
```

### Test 6: Tin ngắn CÓ keyword → ✅ DÙNG AI
```
Input: "ts" (2 ký tự nhưng là viết tắt "tại sao")
Expected: AI reply

Input: "ơi" (2 ký tự nhưng là keyword)
Expected: AI reply

Input: "kb" (2 ký tự nhưng là viết tắt "không biết")
Expected: AI reply
```

---

## 🔍 So sánh TRƯỚC vs SAU

| Tin nhắn | TRƯỚC | SAU |
|----------|-------|-----|
| "ts lại thế?" | ❌ Không nhận | ✅ AI (viết tắt "tại sao") |
| "ntn đây?" | ❌ Không nhận | ✅ AI (viết tắt "như thế nào") |
| "kn đi?" | ❌ Không nhận | ✅ AI (viết tắt "khi nào") |
| "gt giúp" | ❌ Không nhận | ✅ AI (viết tắt "giải thích") |
| "em ơi" | ❌ Không nhận | ✅ AI (câu thân mật) |
| "wow ngon" | ❌ Không nhận | ✅ AI (cảm thán) |
| "kb luôn" | ❌ Không nhận | ✅ AI (viết tắt "không biết") |
| "tại sao thế?" | ✅ AI | ✅ AI (giữ nguyên) |
| "giúp em" | ✅ AI | ✅ AI (giữ nguyên) |

---

## 📊 Thống kê từ khóa mới

| Loại | Số từ khóa |
|------|-----------|
| Từ hỏi + viết tắt | 25+ |
| Yêu cầu giúp đỡ | 15+ |
| Thông tin | 10+ |
| Câu thân mật | 10+ |
| Cảm thán | 10+ |
| Phủ định | 5+ |
| **TỔNG** | **70+** |

---

## 💡 Các viết tắt thêm vào

- **ts** = tại sao
- **ntn** = như thế nào
- **tn** = thế nào
- **kn** = khi nào
- **bg** = bao giờ
- **bn** = bao nhiêu
- **pk** = phải không
- **đk** = được không
- **ct** = có thể / chi tiết
- **gt** = giải thích
- **hd** = hướng dẫn
- **ls** = làm sao
- **ltn** = làm thế nào
- **tt** = thông tin
- **cb** = cho biết
- **kt** = kiểm tra
- **ck** = có không
- **kh** = không hiểu
- **kb** = không biết
- **ll** = lo lắng

---

## ✅ Kết quả mong đợi

Sau khi thêm từ khóa:
- ✅ Nhận viết tắt: ts, ntn, kn, gt, hd, kb, etc.
- ✅ Nhận câu thân mật: em ơi, anh ơi, bạn ơi
- ✅ Nhận cảm thán: wow, omg, haha
- ✅ Nhận phủ định: không hiểu, không biết
- ✅ Coverage tăng từ ~20% → ~80% tin nhắn

**Bot thông minh hơn rất nhiều! 🚀**
