/**
 * Multi-user Zalo Instance Manager
 * Quản lý nhiều Zalo instances cho nhiều users
 */

import { Zalo } from 'zca-js';
import { getSessionId } from './session-cookie';
import { UserManager } from './user-manager';

// Map lưu Zalo instances theo userId
const zaloInstances = new Map<string, any>();
const zaloUserInfos = new Map<string, any>();

/**
 * Lấy userId của user hiện tại
 */
export async function getCurrentUserId(): Promise<string> {
  const sessionId = getSessionId();
  const user = await UserManager.getOrCreateUser(sessionId);
  return user.id;
}

/**
 * Lấy Zalo API instance của user hiện tại
 */
export async function getCurrentZaloApi(): Promise<any | null> {
  const userId = await getCurrentUserId();
  return zaloInstances.get(userId) || null;
}

/**
 * Set Zalo API instance cho user hiện tại
 */
export async function setCurrentZaloApi(zaloApi: any): Promise<void> {
  const userId = await getCurrentUserId();
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
 */
export async function setCurrentZaloUserInfo(userInfo: any): Promise<void> {
  const userId = await getCurrentUserId();
  zaloUserInfos.set(userId, userInfo);
  
  // Update vào DB
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
        await UserManager.saveZaloSession(userId, credentials, userInfo);
      }
    }
  } catch (error) {
    console.error('Failed to update user info in DB:', error);
  }
}

/**
 * Load Zalo session từ DB cho user hiện tại
 */
export async function loadCurrentZaloSession(): Promise<any | null> {
  const userId = await getCurrentUserId();
  const saved = await UserManager.getZaloSession(userId);
  
  if (!saved || !saved.sessionData) {
    return null;
  }
  
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
