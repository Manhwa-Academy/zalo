import fs from 'fs';
import { dataFilePath } from './data-dir';
import { SessionStorage } from './session-storage';

const SESSION_KEY = 'zalo-session';
const SESSION_FILE = dataFilePath('.zalo-session.json');

/**
 * Lưu session Zalo
 * - Lưu vào file local (fallback)
 * - Lưu vào MongoDB (primary)
 */
export async function saveSession(credentials: any): Promise<void> {
  try {
    // Save to local file (fallback)
    fs.writeFileSync(SESSION_FILE, JSON.stringify(credentials, null, 2));
    console.log('💾 Session saved to file');

    // Save to MongoDB (primary)
    if (process.env.MONGODB_URI) {
      await SessionStorage.save(SESSION_KEY, credentials);
      console.log('☁️ Session saved to MongoDB');
    }
  } catch (error) {
    console.error('❌ Failed to save session:', error);
    throw error;
  }
}

/**
 * Đọc session Zalo
 * - Ưu tiên MongoDB
 * - Fallback sang file local
 */
export async function loadSession(): Promise<any | null> {
  try {
    // Try MongoDB first
    if (process.env.MONGODB_URI) {
      const mongoSession = await SessionStorage.load(SESSION_KEY);
      if (mongoSession) {
        console.log('☁️ Session loaded from MongoDB');
        return mongoSession;
      }
    }

    // Fallback to local file
    if (fs.existsSync(SESSION_FILE)) {
      const sessionRaw = fs.readFileSync(SESSION_FILE, 'utf-8');
      const credentials = JSON.parse(sessionRaw);
      console.log('💾 Session loaded from file');
      return credentials;
    }

    console.log('⚠️ No session found');
    return null;
  } catch (error) {
    console.error('❌ Failed to load session:', error);
    return null;
  }
}

/**
 * Xóa session Zalo
 */
export async function deleteSession(): Promise<void> {
  try {
    // Delete from file
    if (fs.existsSync(SESSION_FILE)) {
      fs.unlinkSync(SESSION_FILE);
      console.log('💾 Session deleted from file');
    }

    // Delete from MongoDB
    if (process.env.MONGODB_URI) {
      await SessionStorage.delete(SESSION_KEY);
      console.log('☁️ Session deleted from MongoDB');
    }
  } catch (error) {
    console.error('❌ Failed to delete session:', error);
  }
}

/**
 * Kiểm tra session có tồn tại không
 */
export async function hasSession(): Promise<boolean> {
  try {
    // Check MongoDB first
    if (process.env.MONGODB_URI) {
      const exists = await SessionStorage.exists(SESSION_KEY);
      if (exists) return true;
    }

    // Check local file
    return fs.existsSync(SESSION_FILE);
  } catch (error) {
    return false;
  }
}
