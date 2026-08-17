import fs from 'fs'
import path from 'path'
import { dataFilePath } from './data-dir'
import { saveMediaToCache } from './media-cache-db'

const MEDIA_DIR = dataFilePath('media')

// Ensure media directory exists
if (!fs.existsSync(MEDIA_DIR)) {
  fs.mkdirSync(MEDIA_DIR, { recursive: true })
}

/**
 * Download media from URL and save to local storage
 * Returns the local file path or null if failed
 */
export async function downloadAndCacheMedia(
  url: string,
  fileName: string,
  userId: string | null,
  mediaType: 'image' | 'gif' | 'file' = 'image'
): Promise<string | null> {
  try {
    if (!url || !url.startsWith('http')) {
      console.log(`⏭️ [Media Cache] Skipping invalid URL: ${url}`)
      return null
    }

    // Check if file already exists
    const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
    const localPath = path.join(MEDIA_DIR, safeFileName)
    
    if (fs.existsSync(localPath)) {
      console.log(`✅ [Media Cache] File already exists: ${safeFileName}`)
      return localPath
    }

    console.log(`📥 [Media Cache] Downloading: ${url}`)

    // Download file
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    })

    if (!response.ok) {
      console.error(`❌ [Media Cache] Download failed: ${response.status} ${response.statusText}`)
      return null
    }

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Save to local storage
    fs.writeFileSync(localPath, buffer)
    console.log(`💾 [Media Cache] Saved to: ${localPath} (${buffer.length} bytes)`)

    // Save metadata to database for faster lookup
    const publicUrl = `/media/${safeFileName}` // Relative URL for serving
    await saveMediaToCache(
      userId,
      safeFileName,
      publicUrl, // Store local path instead of remote URL
      mediaType
    ).catch((err) => {
      console.warn(`⚠️ [Media Cache] Failed to save to DB:`, err)
    })

    return localPath
  } catch (error: any) {
    console.error(`❌ [Media Cache] Error downloading ${fileName}:`, error.message)
    return null
  }
}

/**
 * Get local file path for a given filename
 * Returns null if file doesn't exist
 */
export function getLocalMediaPath(fileName: string): string | null {
  const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
  const localPath = path.join(MEDIA_DIR, safeFileName)
  
  if (fs.existsSync(localPath)) {
    return localPath
  }
  
  return null
}

/**
 * Serve media file with proper headers
 */
export function serveMediaFile(fileName: string): { buffer: Buffer; contentType: string } | null {
  const localPath = getLocalMediaPath(fileName)
  
  if (!localPath) {
    return null
  }

  const buffer = fs.readFileSync(localPath)
  const ext = path.extname(fileName).toLowerCase()
  
  let contentType = 'application/octet-stream'
  if (ext === '.png') contentType = 'image/png'
  else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg'
  else if (ext === '.gif') contentType = 'image/gif'
  else if (ext === '.webp') contentType = 'image/webp'
  else if (ext === '.mp4') contentType = 'video/mp4'
  else if (ext === '.pdf') contentType = 'application/pdf'
  else if (ext === '.zip') contentType = 'application/zip'
  
  return { buffer, contentType }
}
