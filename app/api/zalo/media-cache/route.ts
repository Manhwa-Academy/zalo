import { NextResponse } from 'next/server'
import fs from 'fs'
import { dataFilePath } from '@/lib/data-dir'

const MEDIA_CACHE_FILE = dataFilePath('.zalo-media-cache.json')

function loadMediaCache(): Record<string, string> {
  try {
    if (fs.existsSync(MEDIA_CACHE_FILE)) {
      return JSON.parse(fs.readFileSync(MEDIA_CACHE_FILE, 'utf-8'))
    }
  } catch (e) {}
  return {}
}

function saveMediaCache(cache: Record<string, string>) {
  try {
    fs.writeFileSync(MEDIA_CACHE_FILE, JSON.stringify(cache, null, 2), 'utf-8')
  } catch (e) {
    console.error('Failed to save media cache:', e)
  }
}

export async function GET() {
  try {
    const cache = loadMediaCache()
    return NextResponse.json({ success: true, cache })
  } catch (error: any) {
    console.error('Failed to load media cache:', error)
    return NextResponse.json({ success: false, cache: {} })
  }
}

export async function POST(request: Request) {
  try {
    const { fileName, url } = await request.json()
    
    if (!fileName || !url) {
      return NextResponse.json({ error: 'Missing fileName or url' }, { status: 400 })
    }

    const cache = loadMediaCache()
    cache[fileName] = url
    saveMediaCache(cache)
    
    console.log(`💾 Saved media cache: ${fileName} -> ${url}`)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Failed to save media cache:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

