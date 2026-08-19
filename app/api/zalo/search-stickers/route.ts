import { NextRequest, NextResponse } from 'next/server'
import { getCurrentZaloApi } from '@/lib/multi-user-zalo'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Search Zalo stickers by keyword
 * GET /api/zalo/search-stickers?q=hutao&limit=20
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q') || ''
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!query.trim()) {
      return NextResponse.json({ 
        success: false, 
        error: 'Query is required' 
      }, { status: 400 })
    }

    const api = await getCurrentZaloApi()
    if (!api) {
      return NextResponse.json({ 
        success: false, 
        error: 'Zalo client not available' 
      }, { status: 401 })
    }

    console.log('🔍 Searching Zalo stickers:', { query, limit })

    // Try to search stickers using zca-js API
    let result: any = null
    
    // Method 1: Try getStickers (if exists)
    if (typeof api.getStickers === 'function') {
      console.log('🔧 Using api.getStickers()')
      try {
        result = await api.getStickers(query)
      } catch (e: any) {
        console.warn('⚠️ api.getStickers() failed:', e.message)
      }
    }
    
    // Method 2: Try searchStickers (alternative name)
    if (!result && typeof api.searchStickers === 'function') {
      console.log('🔧 Using api.searchStickers()')
      try {
        result = await api.searchStickers(query)
      } catch (e: any) {
        console.warn('⚠️ api.searchStickers() failed:', e.message)
      }
    }

    // Check if we got results
    if (!result || !result.data || (Array.isArray(result.data) && result.data.length === 0)) {
      console.log('⚠️ No stickers found for query:', query)
      return NextResponse.json({
        success: false,
        error: 'No stickers found',
        data: [],
        hint: 'The Zalo API may not support sticker search, or no results were found for this query.'
      })
    }

    // Parse sticker data
    const stickers = result.data
      .slice(0, limit)
      .map((sticker: any) => ({
        id: sticker.id || sticker.stickerId,
        catId: sticker.cateId || sticker.catId || '1',
        name: sticker.name || '',
        url: sticker.icon || sticker.url || `https://zalo-api.zadn.vn/api/emoticon/sticker/webpc?eid=${sticker.id}&size=130&version=1`,
        width: sticker.width || 130,
        height: sticker.height || 130
      }))

    console.log(`✅ Found ${stickers.length} stickers for "${query}"`)

    return NextResponse.json({
      success: true,
      data: stickers,
      query: query,
      count: stickers.length
    })

  } catch (error: any) {
    console.error('❌ Error searching stickers:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to search stickers',
        details: error.toString(),
        hint: 'Sticker search may not be available in the current zca-js version.'
      }, 
      { status: 500 }
    )
  }
}
