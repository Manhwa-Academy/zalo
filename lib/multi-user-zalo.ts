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

/**
 * Lấy userId của user hiện tại
 * Nếu đã có user với Zalo account này → dùng lại user cũ
 * Không tạo user mới khi login từ thiết bị khác
 */
export async function getCurrentUserId(): Promise<string> {
  const sessionId = getSessionId();
  console.log(`🔍 [MultiUser] Getting user for session: ${sessionId}`);
  
  // Bước 1: Kiểm tra xem session này đã có user chưa
  const existingUserResult = await pool?.query(
    'SELECT * FROM users WHERE session_id = $1',
    [sessionId]
  );
  
  if (existingUserResult && existingUserResult.rows.length > 0) {
    const userId = existingUserResult.rows[0].id;
    console.log(`✅ [MultiUser] User ID: ${userId} (from existing session)`);
    
    // Update last_active
    await pool?.query(
      'UPDATE users SET last_active = CURRENT_TIMESTAMP WHERE id = $1',
      [userId]
    );
    
    return userId;
  }
  
  // Bước 2: Session chưa có user → Tạo user mới CHỈ 1 LẦN
  // (Login lần đầu hoặc logout rồi login lại)
  const user = await UserManager.getOrCreateUser(sessionId);
  
  console.log(`✅ [MultiUser] User ID: ${user.id} (new user created for this session)`);
  return user.id;
}

/**
 * Lấy Zalo API instance của user hiện tại
 * Nếu chưa có trong memory → Load từ DB
 */
export async function getCurrentZaloApi(): Promise<any | null> {
  const userId = await getCurrentUserId();
  let api = zaloInstances.get(userId);
  
  console.log(`🔍 [MultiUser] Getting zaloApi for user [${userId}]: ${api ? 'FOUND IN MEMORY' : 'NOT IN MEMORY'}`);
  console.log(`🔍 [MultiUser] Current map size: ${zaloInstances.size}, Keys:`, Array.from(zaloInstances.keys()));
  
  // Nếu không có trong memory → Load từ DB
  if (!api) {
    console.log(`📦 [MultiUser] zaloApi not in memory, loading from DB...`);
    api = await loadCurrentZaloSession();
    if (api) {
      console.log(`✅ [MultiUser] Loaded zaloApi from DB for user [${userId}]`);
    } else {
      console.log(`❌ [MultiUser] No session found in DB for user [${userId}]`);
    }
  }
  
  return api || null;
}

/**
 * Set Zalo API instance cho user hiện tại
 */
export async function setCurrentZaloApi(zaloApi: any): Promise<void> {
  const userId = await getCurrentUserId();
  console.log(`💾 [MultiUser] Saving zaloApi for user: ${userId}`);
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
      console.log(`✅ [MultiUser] Saved session to DB for user: ${userId}`);
    }
  } catch (error) {
    console.error('Failed to save session to DB:', error);
  }
}

/**
 * Xóa Zalo API instance của user hiện tại
 */
export async function clearCurrentZaloApi(): Promise<void> {
  const userId = await getCurrentUserId();
  zaloInstances.delete(userId);
  zaloUserInfos.delete(userId);
  await UserManager.deleteZaloSession(userId);
}

/**
 * Lấy user info của user hiện tại
 */
export async function getCurrentZaloUserInfo(): Promise<any | null> {
  const userId = await getCurrentUserId();
  return zaloUserInfos.get(userId) || null;
}

/**
 * Set user info cho user hiện tại
 * CHỈ lưu vào memory và DB, KHÔNG tạo user mới nữa
 */
export async function setCurrentZaloUserInfo(userInfo: any): Promise<void> {
  const userId = await getCurrentUserId();
  
  console.log(`💾 [MultiUser] Saving Zalo user info for user: ${userId}`, userInfo);
  
  // Lưu vào memory
  zaloUserInfos.set(userId, userInfo);
  
  // Update vào DB (UPSERT zalo_sessions)
  try {
    const zaloApi = zaloInstances.get(userId);
    if (zaloApi) {
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
        
        // UPSERT: Nếu user_id đã có zalo_session → Update, nếu chưa → Insert
        await UserManager.saveZaloSession(userId, credentials, userInfo);
        console.log(`✅ [MultiUser] Saved Zalo session with user info for user: ${userId}`);
      }
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
  console.log(`📦 [MultiUser] Loading session for user: [${userId}]`);
  const saved = await UserManager.getZaloSession(userId);
  
  if (!saved || !saved.sessionData) {
    console.log(`⚠️ [MultiUser] No saved session found for user: [${userId}]`);
    return null;
  }
  
  try {
    const { Zalo } = await import('zca-js');
    const { imageMetadataGetter } = await import('./image-metadata-getter');
    
    const zalo = new Zalo({ selfListen: true, imageMetadataGetter });
    const zaloApi = await zalo.login(saved.sessionData);
    
    console.log(`💾 [MultiUser] Storing zaloApi in map for user: [${userId}]`);
    zaloInstances.set(userId, zaloApi);
    console.log(`✅ [MultiUser] Map size after set: ${zaloInstances.size}`);
    
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
