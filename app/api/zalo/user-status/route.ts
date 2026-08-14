import { NextResponse } from 'next/server'
import { getZaloApi } from '@/lib/zalo-instance'

function findLastActiveInObj(obj: any, depth = 0): number {
  if (!obj || typeof obj !== 'object' || depth > 5) return 0

  const targetKeys = [
    'lastactiontime',
    'last_action_time',
    'lasttimeactive',
    'last_time_active',
    'last_active',
    'lastactive',
    'lastseen',
    'last_seen',
    'activetime',
    'active_time',
  ]

  for (const key of Object.keys(obj)) {
    const lowerKey = key.toLowerCase()
    const val = obj[key]

    if (targetKeys.includes(lowerKey) && val !== undefined && val !== null) {
      const num = Number(val)
      if (!isNaN(num) && num > 1000000) {
        return num > 1e11 ? num : num * 1000
      }
    }

    if (typeof val === 'object' && val !== null) {
      const found = findLastActiveInObj(val, depth + 1)
      if (found > 0) return found
    }
  }

  return 0
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    const zaloApi = getZaloApi() as any
    if (!zaloApi) {
      return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
    }

    let lastActiveTs = 0
    let isOnline = false
    let profileData: any = null

    // 1. Try getUserInfo with both array and string ID formats
    if (typeof zaloApi.getUserInfo === 'function') {
      try {
        let uRes: any = null
        try {
          uRes = await zaloApi.getUserInfo([userId])
        } catch (e1) {
          uRes = await zaloApi.getUserInfo(userId)
        }
        profileData = uRes
        lastActiveTs = findLastActiveInObj(uRes)
      } catch (err: any) {
        console.error('getUserInfo error in user-status:', err.message || err)
      }
    }

    // 2. Try getAllFriends if lastActiveTs not found or to supplement
    if (typeof zaloApi.getAllFriends === 'function') {
      try {
        const friends = await zaloApi.getAllFriends()
        if (Array.isArray(friends)) {
          const match = friends.find((f: any) => String(f.userId || f.uid || f.id) === String(userId))
          if (match) {
            const friendTs = findLastActiveInObj(match)
            if (friendTs > lastActiveTs) {
              lastActiveTs = friendTs
            }
            if (typeof match.isOnline === 'boolean') isOnline = match.isOnline
          }
        }
      } catch (e: any) {
        console.error('getAllFriends error in user-status:', e.message || e)
      }
    }

    console.log(`📡 user-status for ${userId}: lastActiveTs=${lastActiveTs} (${lastActiveTs > 0 ? new Date(lastActiveTs).toISOString() : 'none'})`)

    return NextResponse.json({
      success: true,
      userId,
      lastActiveTs,
      isOnline,
      profile: profileData,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
