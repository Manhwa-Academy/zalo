import pool from './postgres'

export interface MediaCacheEntry {
  id?: string
  userId?: string
  fileName: string
  originalUrl: string
  mediaType?: string
  giphyId?: string
  createdAt?: Date
  updatedAt?: Date
}

/**
 * Save media URL to database cache
 */
export async function saveMediaToCache(
  userId: string | null,
  fileName: string,
  originalUrl: string,
  mediaType: string = 'image',
  giphyId?: string
): Promise<boolean> {
  if (!pool) {
    return false
  }
  
  try {
    const query = `
      INSERT INTO media_cache (user_id, file_name, original_url, media_type, giphy_id)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_id, file_name) 
      DO UPDATE SET 
        original_url = EXCLUDED.original_url,
        media_type = EXCLUDED.media_type,
        giphy_id = EXCLUDED.giphy_id,
        updated_at = CURRENT_TIMESTAMP
      RETURNING id
    `
    const values = [userId, fileName, originalUrl, mediaType, giphyId || null]
    const result = await pool.query(query, values)
    
    return !!result.rows[0]
  } catch (error: any) {
    console.error('❌ [MediaCache] Failed to save to DB:', error.message)
    return false
  }
}

/**
 * Get media URL from database cache by filename
 */
export async function getMediaFromCache(
  fileName: string,
  userId?: string | null
): Promise<string | null> {
  if (!pool) {
    return null
  }
  
  try {
    let query: string
    let values: any[]
    
    if (userId) {
      // Try user-specific cache first
      query = `SELECT original_url FROM media_cache WHERE file_name = $1 AND user_id = $2 ORDER BY updated_at DESC LIMIT 1`
      values = [fileName, userId]
    } else {
      // Fallback to any cached entry for this filename
      query = `SELECT original_url FROM media_cache WHERE file_name = $1 ORDER BY updated_at DESC LIMIT 1`
      values = [fileName]
    }
    
    const result = await pool.query(query, values)
    
    if (result.rows.length > 0) {
      const url = result.rows[0].original_url
      return url
    }
    
    return null
  } catch (error: any) {
    console.error('❌ [MediaCache] Failed to get from DB:', error.message)
    return null
  }
}

/**
 * Get media URL by Giphy ID
 */
export async function getMediaByGiphyId(
  giphyId: string,
  userId?: string | null
): Promise<string | null> {
  if (!pool) {
    return null
  }
  
  try {
    let query: string
    let values: any[]
    
    if (userId) {
      query = `SELECT original_url FROM media_cache WHERE giphy_id = $1 AND user_id = $2 ORDER BY updated_at DESC LIMIT 1`
      values = [giphyId, userId]
    } else {
      query = `SELECT original_url FROM media_cache WHERE giphy_id = $1 ORDER BY updated_at DESC LIMIT 1`
      values = [giphyId]
    }
    
    const result = await pool.query(query, values)
    
    if (result.rows.length > 0) {
      const url = result.rows[0].original_url
      return url
    }
    
    return null
  } catch (error: any) {
    console.error('❌ [MediaCache] Failed to get by Giphy ID:', error.message)
    return null
  }
}

/**
 * Get all cached media for a user
 */
export async function getAllMediaCache(userId?: string | null): Promise<Record<string, string>> {
  if (!pool) {
    return {}
  }
  
  try {
    let query: string
    let values: any[]
    
    if (userId) {
      query = `SELECT file_name, original_url FROM media_cache WHERE user_id = $1`
      values = [userId]
    } else {
      query = `SELECT file_name, original_url FROM media_cache`
      values = []
    }
    
    const result = await pool.query(query, values)
    
    const cache: Record<string, string> = {}
    result.rows.forEach((row) => {
      cache[row.file_name] = row.original_url
      
      // Also create giphy_id_xxx entries for Giphy GIFs
      if (row.file_name.startsWith('giphy_') && row.file_name.endsWith('.gif')) {
        const giphyId = row.file_name.replace('giphy_', '').replace('.gif', '')
        cache[`giphy_id_${giphyId}`] = row.original_url
      }
    })
    
    return cache
  } catch (error: any) {
    console.error('❌ [MediaCache] Failed to get all cache:', error.message)
    return {}
  }
}

/**
 * Clean up old media cache entries (older than 90 days)
 */
export async function cleanupOldMediaCache(daysOld: number = 90): Promise<number> {
  if (!pool) {
    return 0
  }
  
  try {
    const query = `DELETE FROM media_cache WHERE created_at < NOW() - INTERVAL '${daysOld} days'`
    const result = await pool.query(query)
    
    const deletedCount = result.rowCount || 0
    return deletedCount
  } catch (error: any) {
    console.error('❌ [MediaCache] Failed to cleanup:', error.message)
    return 0
  }
}
