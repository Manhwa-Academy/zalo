/**
 * Simple rate limiter để tránh spam Zalo API
 */

const callTimestamps = new Map<string, number[]>();
const RATE_LIMITS = {
  getAllFriends: { maxCalls: 3, windowMs: 60000 }, // 3 calls/phút
  getUserInfo: { maxCalls: 10, windowMs: 60000 },  // 10 calls/phút
  default: { maxCalls: 20, windowMs: 60000 },      // 20 calls/phút
};

export function canMakeRequest(apiName: string): boolean {
  const now = Date.now();
  const limit = RATE_LIMITS[apiName as keyof typeof RATE_LIMITS] || RATE_LIMITS.default;
  
  // Lấy hoặc tạo mảng timestamps
  if (!callTimestamps.has(apiName)) {
    callTimestamps.set(apiName, []);
  }
  
  const timestamps = callTimestamps.get(apiName)!;
  
  // Xóa timestamps cũ (ngoài window)
  const cutoff = now - limit.windowMs;
  const validTimestamps = timestamps.filter(t => t > cutoff);
  
  // Kiểm tra có vượt limit không
  if (validTimestamps.length >= limit.maxCalls) {
    console.warn(`⚠️ [RateLimit] ${apiName} exceeded limit (${validTimestamps.length}/${limit.maxCalls})`);
    return false;
  }
  
  // Thêm timestamp mới
  validTimestamps.push(now);
  callTimestamps.set(apiName, validTimestamps);
  
  return true;
}

export function waitForRateLimit(apiName: string): Promise<void> {
  return new Promise((resolve) => {
    const checkInterval = setInterval(() => {
      if (canMakeRequest(apiName)) {
        clearInterval(checkInterval);
        resolve();
      }
    }, 1000); // Check mỗi giây
  });
}
