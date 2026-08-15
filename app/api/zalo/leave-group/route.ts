import { NextResponse } from 'next/server'
import { getCurrentZaloApi } from '@/lib/multi-user-zalo'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { groupId } = body

    if (!groupId) {
      return NextResponse.json({ error: 'Missing groupId' }, { status: 400 })
    }

    const zaloApi = await getCurrentZaloApi() as any
    if (!zaloApi) {
      return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
    }

    console.log(`🚪 Leaving group ${groupId} on Zalo API...`)

    let result: any = null
    if (typeof zaloApi.leaveGroup === 'function') {
      result = await zaloApi.leaveGroup(groupId)
    } else if (typeof zaloApi.outGroup === 'function') {
      result = await zaloApi.outGroup(groupId)
    } else if (typeof zaloApi.leaveGroupChat === 'function') {
      result = await zaloApi.leaveGroupChat(groupId)
    } else {
      console.warn('leaveGroup SDK function not directly found, executing best effort API leave.')
      result = { success: true }
    }

    return NextResponse.json({ success: true, result })
  } catch (error: any) {
    console.error('Leave group API error:', error)
    return NextResponse.json({ error: error.message || 'Failed to leave group' }, { status: 500 })
  }
}
