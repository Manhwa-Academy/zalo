import { NextResponse } from 'next/server'
import { getCurrentZaloApi } from '@/lib/multi-user-zalo'

/**
 * GET - Lấy danh sách hội thoại đã ghim
 */
export async function GET(request: Request) {
  try {
    const zaloApi = await getCurrentZaloApi()
    if (!zaloApi) {
      return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
    }

    console.log('📌 [Pinned] Getting pinned conversations...')

    // Get pinned conversations
    const result = await zaloApi.getPinConversations()
    
    console.log('✅ [Pinned] Result:', result)

    return NextResponse.json({ 
      success: true, 
      pinnedConversations: result?.data || result || []
    })
  } catch (error: any) {
    console.error('❌ [Pinned] Error getting pinned conversations:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to get pinned conversations' 
    }, { status: 500 })
  }
}

/**
 * POST - Ghim hoặc bỏ ghim hội thoại
 */
export async function POST(request: Request) {
  try {
    const zaloApi = await getCurrentZaloApi()
    if (!zaloApi) {
      return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
    }

    const { threadIds, action } = await request.json()
    
    if (!threadIds || !Array.isArray(threadIds)) {
      return NextResponse.json({ 
        error: 'Missing or invalid threadIds (must be array)' 
      }, { status: 400 })
    }

    console.log(`📌 [Pinned] ${action === 'unpin' ? 'Unpinning' : 'Pinning'} conversations:`, threadIds)

    // Pin or unpin conversations
    const result = await zaloApi.setPinnedConversations(threadIds)
    
    console.log('✅ [Pinned] Result:', result)

    return NextResponse.json({ 
      success: true,
      action: action === 'unpin' ? 'unpin' : 'pin',
      threadIds,
      result 
    })
  } catch (error: any) {
    console.error('❌ [Pinned] Error setting pinned conversations:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to set pinned conversations' 
    }, { status: 500 })
  }
}
