import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/bilibili/emotes
 * Proxy to fetch Bilibili emote packages (避免 CORS 問題)
 */
export async function GET(request: NextRequest) {
  try {
    const packageIds = '1,2,3,4,5,6,7,8,9,10,11,12,14,15,16,17,18,19,20,22,24,25,100,200'
    const url = `https://api.bilibili.com/x/emote/package?business=reply&ids=${packageIds}`
    
    console.log('📺 [Bilibili Proxy] Fetching emotes:', url)
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.bilibili.com',
      },
    })

    if (!response.ok) {
      console.error('❌ [Bilibili Proxy] API error:', response.status, response.statusText)
      return NextResponse.json(
        { error: 'Failed to fetch from Bilibili API', status: response.status },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    // Debug: Log first emote from first package
    if (data.data?.packages?.[0]?.emote?.[0]) {
      console.log('📺 [Bilibili Proxy] Sample emote:', JSON.stringify(data.data.packages[0].emote[0], null, 2))
    }
    
    console.log(`✅ [Bilibili Proxy] Fetched ${data.data?.packages?.length || 0} packages`)
    
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('❌ [Bilibili Proxy] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}
