/**
 * Multi-user Zalo Instance Manager
 * Quản lý nhiều Zalo instances cho nhiều users
 */

import { Zalo } from 'zca-js';
import { getSessionId } from './session-cookie';
import { UserManager } from './user-manager';
import pool from './postgres';

// Map lưu Zalo instances theo userId
const zaloInstances = new Map<string, any>();
const zaloUserInfos = new Map<string, any>();

// Lock để tránh load session đồng thời (gây "Another connection is opened")
const sessionLoadingLocks = new Map<string, Promise<any | null>>();

/**
 * Lấy userId của user hiện tại
 * ✨ Multi-device support: Link sessions by Zalo account
 * Nếu đã có user với Zalo account này → dùng lại user cũ
 * Không tạo user mới khi login từ thiết bị khác
 */
export async function getCurrentUserId(): Promise<string> {
  const sessionId = getSessionId();
  // console.log(`🔍 [MultiUser] Getting user for session: ${sessionId}`);
  
  // Bước 1: Kiểm tra xem session này đã có user chưa
  const existingUserResult = await pool?.query(
    'SELECT * FROM users WHERE session_id = $1',
    [sessionId]
  );
  
  if (existingUserResult && existingUserResult.rows.length > 0) {
    const userId = existingUserResult.rows[0].id;
    // console.log(`✅ [MultiUser] User ID: ${userId} (from existing session)`);
    
    // Update last_active
    await pool?.query(
      'UPDATE users SET last_active = CURRENT_TIMESTAMP WHERE id = $1',
      [userId]
    );
    
    return userId;
  }
  
  // Bước 2: Session chưa có user
  // 🔍 Check xem session này đã login Zalo chưa, nếu rồi thì link về user cũ
  const zaloSessionResult = await pool?.query(
    `SELECT user_id, user_info FROM zalo_sessions 
     WHERE user_info IS NOT NULL 
     AND is_active = true
     ORDER BY created_at DESC
     LIMIT 10` // Check 10 sessions gần nhất
  );
  
  let existingUserId: string | null = null;
  
  if (zaloSessionResult && zaloSessionResult.rows.length > 0) {
    // Tìm xem có session nào của cùng Zalo account không
    // (sẽ được link sau khi login thành công)
    console.log(`🔍 [MultiUser] Found ${zaloSessionResult.rows.length} active Zalo sessions`);
  }
  
  // Bước 3: Tạo user mới nếu chưa có
  const user = await UserManager.getOrCreateUser(sessionId);
  
  // console.log(`✅ [MultiUser] User ID: ${user.id} (new user created for this session)`);
  return user.id;
}

/**
 * Lấy Zalo API instance của user hiện tại
 * Nếu chưa có trong memory → Load từ DB
 */
export async function getCurrentZaloApi(): Promise<any | null> {
  const userId = await getCurrentUserId();
  let api = zaloInstances.get(userId);
  
  // Nếu không có trong memory → Load từ DB (với lock để tránh load đồng thời)
  if (!api) {
    // Nếu đang có request khác đang load → chờ nó xong
    const existingLock = sessionLoadingLocks.get(userId);
    if (existingLock) {
      // console.log(`⏳ [MultiUser] Waiting for existing session load for user [${userId}]...`);
      api = await existingLock;
    } else {
      api = await loadCurrentZaloSession();
    }
  }
  
  return api || null;
}

/**
 * Set Zalo API instance cho user hiện tại
 */
export async function setCurrentZaloApi(zaloApi: any): Promise<void> {
  const userId = await getCurrentUserId();
  // console.log(`💾 [MultiUser] Saving zaloApi for user: ${userId}`);
  zaloInstances.set(userId, zaloApi);
  
  // Lưu session vào DB
  try {
    const ctx = zaloApi.getContext ? zaloApi.getContext() : null;
    if (ctx && ctx.cookie) {
      let cookieData = ctx.cookie;
      if (typeof ctx.cookie.toJSON === 'function') {
        cookieData = ctx.cookie.toJSON();
      }
      const credentials = {
        cookie: cookieData,
        imei: ctx.imei,
        userAgent: ctx.userAgent,
        language: ctx.language || 'vi',
      };
      await UserManager.saveZaloSession(userId, credentials);
      // console.log(`✅ [MultiUser] Saved session to DB for user: ${userId}`);
    }
  } catch (error) {
    console.error('Failed to save session to DB:', error);
  }
}

/**
 * Xóa Zalo API instance của user hiện tại
 * @param deleteFromDB - Có xóa session khỏi database không (default: true)
 */
export async function clearCurrentZaloApi(deleteFromDB: boolean = true): Promise<void> {
  const userId = await getCurrentUserId();
  
  // Stop listener first
  const api = zaloInstances.get(userId);
  if (api?.listener) {
    try {
      api.listener.stop();
    } catch (e) {}
  }
  
  // Clear memory instances
  zaloInstances.delete(userId);
  zaloUserInfos.delete(userId);
  
  // Delete session from database (optional)
  if (deleteFromDB) {
    await UserManager.deleteZaloSession(userId);
    console.log(`✅ Cleared Zalo API and DB session for user: ${userId}`);
  } else {
    console.log(`✅ Cleared Zalo API from memory (kept DB session) for user: ${userId}`);
  }
}

/**
 * Lấy user info của user hiện tại
 * Nếu chưa có trong memory → Load từ DB cùng với session
 */
export async function getCurrentZaloUserInfo(): Promise<any | null> {
  const userId = await getCurrentUserId();
  let userInfo = zaloUserInfos.get(userId);
  
  console.log(`🔍 [getCurrentZaloUserInfo] userId: ${userId}, in memory: ${!!userInfo}`)
  
  // Nếu không có trong memory → Load từ DB
  if (!userInfo) {
    console.log(`� [getCurrentZaloUserInfo] Loading from DB...`)
    const saved = await UserManager.getZaloSession(userId);
    console.log(`� [getCurrentZaloUserInfo] DB result:`, {
      hasSession: !!saved,
      hasSessionData: !!saved?.sessionData,
      hasUserInfo: !!saved?.userInfo,
      userInfoSample: saved?.userInfo ? JSON.stringify(saved.userInfo).substring(0, 100) : null
    })
    
    if (saved && saved.userInfo) {
      userInfo = saved.userInfo;
      zaloUserInfos.set(userId, userInfo);
      console.log(`✅ [getCurrentZaloUserInfo] Loaded and cached userInfo:`, {
        displayName: userInfo.displayName,
        userId: userInfo.userId
      })
    } else {
      console.log(`⚠️ [getCurrentZaloUserInfo] No userInfo in DB`)
    }
  }
  
  return userInfo || null;
}

/**
 * Set user info cho user hiện tại
 * CHỈ lưu vào memory và DB, KHÔNG tạo user mới nữa
 * ✨ Auto-link sessions: Nếu Zalo account đã tồn tại → merge về user cũ
 */
export async function setCurrentZaloUserInfo(userInfo: any): Promise<void> {
  const userId = await getCurrentUserId();
  const zaloUserId = userInfo?.userId || userInfo?.id;
  
  console.log(`💾 [MultiUser] Saving Zalo user info for user: ${userId}, Zalo ID: ${zaloUserId}`);
  
  // 🔍 Check if this Zalo account already exists under a different user
  if (zaloUserId) {
    const existingUser = await UserManager.getUserByZaloId(zaloUserId.toString());
    
    if (existingUser && existingUser.id !== userId) {
      console.log(`🔗 [MultiUser] Found existing user ${existingUser.id} for Zalo ID ${zaloUserId}`);
      console.log(`🔗 [MultiUser] Will use existing user instead of creating duplicate`);
      
      // Update current session to point to the existing user
      const sessionId = getSessionId();
      await pool?.query(
        'UPDATE users SET session_id = $1, last_active = CURRENT_TIMESTAMP WHERE id = $2',
        [sessionId, existingUser.id]
      );
      
      console.log(`✅ [MultiUser] Linked session ${sessionId} to existing user ${existingUser.id}`);
      
      // Delete the duplicate user if it has no other sessions
      await pool?.query(
        'DELETE FROM users WHERE id = $1 AND id NOT IN (SELECT user_id FROM zalo_sessions WHERE is_active = true)',
        [userId]
      );
      
      // Use the existing user from now on
      // (Next call to getCurrentUserId() will return the correct one)
    }
  }
  
  // Get the final userId (might have changed after linking)
  const finalUserId = await getCurrentUserId();
  
  // Lưu vào memory
  zaloUserInfos.set(finalUserId, userInfo);
  
  // Update vào DB (UPSERT zalo_sessions)
  try {
    const zaloApi = zaloInstances.get(finalUserId);
    
    // Try to get credentials from zaloApi if available
    let credentials: any = null
    if (zaloApi) {
      const ctx = zaloApi.getContext ? zaloApi.getContext() : null;
      if (ctx && ctx.cookie) {
        let cookieData = ctx.cookie;
        if (typeof ctx.cookie.toJSON === 'function') {
          cookieData = ctx.cookie.toJSON();
        }
        credentials = {
          cookie: cookieData,
          imei: ctx.imei,
          userAgent: ctx.userAgent,
          language: ctx.language || 'vi',
        };
      }
    }
    
    // Save to DB - even if no credentials, just update userInfo
    if (credentials) {
      // Full save with credentials
      await UserManager.saveZaloSession(finalUserId, credentials, userInfo);
      console.log(`✅ [MultiUser] Saved Zalo session with user info for user: ${finalUserId}`);
    } else {
      // Just update userInfo without overwriting credentials
      await UserManager.updateZaloUserInfo(finalUserId, userInfo);
      console.log(`✅ [MultiUser] Updated userInfo only for user: ${finalUserId}`);
    }
  } catch (error) {
    console.error('❌ [MultiUser] Failed to update user info in DB:', error);
    throw error;
  }
}

/**
 * Load Zalo session từ DB cho user hiện tại
 */
export async function loadCurrentZaloSession(): Promise<any | null> {
  const userId = await getCurrentUserId();
  
  // Nếu đã có trong memory (race condition check), trả về luôn
  const existing = zaloInstances.get(userId);
  if (existing) return existing;
  
  // Nếu đang có lock → chờ nó xong (tránh tạo nhiều connection)
  const existingLock = sessionLoadingLocks.get(userId);
  if (existingLock) {
    console.log(`⏳ [MultiUser] Session load already in progress for user [${userId}], waiting...`);
    return await existingLock;
  }
  
  // Tạo lock Promise
  const loadPromise = (async () => {
    const saved = await UserManager.getZaloSession(userId);
    
    if (!saved || !saved.sessionData) {
      return null;
    }
    
    // Double-check memory sau khi query DB (có thể request khác đã set)
    const doubleCheck = zaloInstances.get(userId);
    if (doubleCheck) return doubleCheck;
    
    try {
      const { Zalo } = await import('zca-js');
      const { imageMetadataGetter } = await import('./image-metadata-getter');
      
      const zalo = new Zalo({ selfListen: true, imageMetadataGetter });
      const zaloApi = await zalo.login(saved.sessionData);
      
      zaloInstances.set(userId, zaloApi);
      
      if (saved.userInfo) {
        zaloUserInfos.set(userId, saved.userInfo);
      }
      
      console.log(`✅ Loaded Zalo session from DB for user: ${userId}`);
      return zaloApi;
    } catch (error) {
      console.error('Failed to load Zalo session:', error);
      await UserManager.deleteZaloSession(userId);
      return null;
    }
  })();
  
  // Lưu lock
  sessionLoadingLocks.set(userId, loadPromise);
  
  try {
    const result = await loadPromise;
    return result;
  } finally {
    // Xóa lock khi xong
    sessionLoadingLocks.delete(userId);
  }
}

/**
 * Lấy bot settings của user hiện tại
 */
export async function getCurrentBotSettings() {
  const userId = await getCurrentUserId();
  return await UserManager.getBotSettings(userId);
}

/**
 * Cập nhật bot settings của user hiện tại
 */
export async function updateCurrentBotSettings(updates: any) {
  const userId = await getCurrentUserId();
  return await UserManager.updateBotSettings(userId, updates);
}
