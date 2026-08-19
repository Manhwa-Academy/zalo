import { NextResponse } from 'next/server'
import { getCurrentZaloApi } from '@/lib/multi-user-zalo'

/**
 * POST - Gửi link với preview
 */
export async function POST(request: Request) {
  try {
    const zaloApi = await getCurrentZaloApi()
    if (!zaloApi) {
      return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
    }

    const { link, msg, ttl, threadId, threadType } = await request.json()
    
    if (!link || !threadId) {
      return NextResponse.json({ 
        error: 'Missing link or threadId' 
      }, { status: 400 })
    }

    console.log('🔗 [Send Link] Sending link:', { link, msg, ttl, threadId, threadType })

    // Prepare options
    const options = {
      link,
      msg,
      ttl
    }

    // Send link with preview (zca-js API: sendLink(options, threadId, type))
    const result = await zaloApi.sendLink(options, threadId, threadType || 0)
    
    console.log('✅ [Send Link] Result:', result)

    return NextResponse.json({ 
      success: true,
      msgId: result?.msgId,
      result 
    })
  } catch (error: any) {
    console.error('❌ [Send Link] Error:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to send link' 
    }, { status: 500 })
  }
}
