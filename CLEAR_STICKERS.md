# 🧹 Clear Old Sticker Messages with Broken URLs

## Problem
Old sticker messages in database have broken URL: `stk.zaloapp.com` (doesn't exist)

## Solution
Run this SQL command in your Neon database to delete old sticker messages:

```sql
-- Delete all sticker messages with broken URLs
DELETE FROM message_logs 
WHERE content LIKE '%stk.zaloapp.com%';

-- Or delete ALL messages older than 1 hour (if you want fresh start)
DELETE FROM message_logs 
WHERE created_at < NOW() - INTERVAL '1 hour';

-- Or delete ALL messages (complete reset)
DELETE FROM message_logs;
```

## Verify
After deleting, check remaining messages:
```sql
SELECT COUNT(*) FROM message_logs;
SELECT content FROM message_logs WHERE content LIKE '%sticker%' LIMIT 5;
```

## What's Fixed

### 1. **Listener** (`lib/zalo-listener-manager.ts`)
- Now saves stickers with correct URL: `https://zalo-api.zadn.vn/api/emoticon/sticker/webpc?eid=${stkId}&size=130&version=1`
- This URL works reliably

### 2. **History API** (`app/api/zalo/history/route.ts`)
- Parses stickers with correct URL when fetching history
- Uses same reliable endpoint

### 3. **Frontend** (`components/ZaloChatView.tsx`)
- Fixed rendering to handle old broken URLs
- Auto-replaces `stk.zaloapp.com` with working API endpoint
- Has fallback chain if primary URL fails

## Test
1. Delete old messages from database
2. Send a new sticker in Zalo
3. It should appear as image (not text) in chat

## Files Changed
- ✅ `lib/zalo-listener-manager.ts` - Sticker URL fix at source
- ✅ `app/api/zalo/history/route.ts` - History parsing fix
- ✅ `components/ZaloChatView.tsx` - Rendering with fallback URLs
