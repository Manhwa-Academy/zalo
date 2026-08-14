import clientPromise from './mongodb';

const DB_NAME = 'zalobot';
const COLLECTION_NAME = 'sessions';

export interface SessionData {
  key: string;
  data: any;
  updatedAt: Date;
}

export class SessionStorage {
  /**
   * Lưu session vào MongoDB
   */
  static async save(key: string, data: any): Promise<void> {
    try {
      const client = await clientPromise;
      const db = client.db(DB_NAME);
      const collection = db.collection<SessionData>(COLLECTION_NAME);

      await collection.updateOne(
        { key },
        {
          $set: {
            key,
            data,
            updatedAt: new Date(),
          },
        },
        { upsert: true }
      );

      console.log(`✅ [SessionStorage] Saved session: ${key}`);
    } catch (error) {
      console.error('❌ [SessionStorage] Save failed:', error);
      throw error;
    }
  }

  /**
   * Đọc session từ MongoDB
   */
  static async load(key: string): Promise<any | null> {
    try {
      const client = await clientPromise;
      const db = client.db(DB_NAME);
      const collection = db.collection<SessionData>(COLLECTION_NAME);

      const result = await collection.findOne({ key });

      if (result) {
        console.log(`✅ [SessionStorage] Loaded session: ${key}`);
        return result.data;
      }

      console.log(`⚠️ [SessionStorage] No session found: ${key}`);
      return null;
    } catch (error) {
      console.error('❌ [SessionStorage] Load failed:', error);
      return null;
    }
  }

  /**
   * Xóa session khỏi MongoDB
   */
  static async delete(key: string): Promise<void> {
    try {
      const client = await clientPromise;
      const db = client.db(DB_NAME);
      const collection = db.collection<SessionData>(COLLECTION_NAME);

      await collection.deleteOne({ key });

      console.log(`✅ [SessionStorage] Deleted session: ${key}`);
    } catch (error) {
      console.error('❌ [SessionStorage] Delete failed:', error);
      throw error;
    }
  }

  /**
   * Kiểm tra session có tồn tại không
   */
  static async exists(key: string): Promise<boolean> {
    try {
      const client = await clientPromise;
      const db = client.db(DB_NAME);
      const collection = db.collection<SessionData>(COLLECTION_NAME);

      const count = await collection.countDocuments({ key });
      return count > 0;
    } catch (error) {
      console.error('❌ [SessionStorage] Exists check failed:', error);
      return false;
    }
  }
}
