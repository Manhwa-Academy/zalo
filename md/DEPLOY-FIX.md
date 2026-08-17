# 🐛 Fix: Auth Session Creation Error

## Lỗi
```
❌ [AuthManager] createSession failed: 
error: bind message supplies 2 parameters, but prepared statement "" requires 1
```

## Nguyên nhân
Query cleanup sessions sử dụng `$1` hai lần trong subquery nhưng PostgreSQL cần tham số riêng biệt:

```sql
-- ❌ SAI (PostgreSQL hiểu nhầm)
WHERE user_id = $1
AND id NOT IN (
  SELECT id FROM auth_sessions
  WHERE user_id = $1  -- PostgreSQL nghĩ đây là tham số khác
  ...
)
```

## Giải pháp
Dùng `$2` cho subquery:

```sql
-- ✅ ĐÚNG
WHERE user_id = $1
AND id NOT IN (
  SELECT id FROM auth_sessions
  WHERE user_id = $2  -- Tham số riêng
  ...
)
```

## Commit & Deploy

### 1. Build local test
```bash
npm run build
```

### 2. Commit changes
```bash
git add lib/auth-manager.ts
git commit -m "fix: auth session creation parameter count"
git push origin main
```

### 3. Render sẽ tự động deploy lại

Hoặc manual deploy trên Render dashboard.

## Verify sau khi deploy

1. Vào https://zalo-bot-vbbk.onrender.com
2. Login với username/password
3. Check logs không còn lỗi `bind message supplies 2 parameters`

✅ Fixed!
