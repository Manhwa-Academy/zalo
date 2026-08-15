import { NextResponse } from 'next/server'
import { getUserFromSessionCookie } from '@/lib/multi-user-zalo'
import { saveMediaToCache, getAllMediaCache } from '@/lib/media-cache-db'

export async function GET() {
  try {
    const user = await getUserFromSessionCookie()
    const userId = user?.id || null
    
    const cache = await getAllMediaCache(userId)
    return NextResponse.json({ success: true, cache })
  } catch (error: any) {
    console.error('❌ [GET /api/zalo/media-cache] Error:', error)
    return NextResponse.json({ success: false, cache: {} })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getUserFromSessionCookie()
    const userId = user?.id || null
    
    const { fileName, url, giphyId, mediaType } = await request.json()
    
    if (!fileName || !url) {
      return NextResponse.json({ error: 'Missing fileName or url' }, { status: 400 })
    }
    
    const saved = await saveMediaToCache(userId, fileName, url, mediaType || 'image', giphyId)
    
    if (saved) {
      console.log(`💾 [POST /api/zalo/media-cache] Saved: ${fileName} -> ${url.slice(0, 50)}...`)
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: 'Failed to save to cache' }, { status: 500 })
    }
  } catch (error: any) {
    console.error('❌ [POST /api/zalo/media-cache] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

