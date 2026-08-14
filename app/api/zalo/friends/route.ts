import { NextResponse } from 'next/server'
import { getZaloApi } from '@/lib/zalo-instance'

export async function GET() {
  try {
    const zaloApi = getZaloApi() as any
    if (!zaloApi) {
      return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
    }

    let friendsList: any[] = []

    if (typeof zaloApi.getAllFriends === 'function') {
      try {
        const friends = await zaloApi.getAllFriends()
        console.log(`👥 Loaded ${friends?.length || 0} friends from Zalo API`)
        if (Array.isArray(friends)) {
          friendsList = friends.map((f: any) => ({
            id: String(f.userId || f.uid || f.id),
            name: f.displayName || f.zaloName || f.display_name || `Bạn ${f.userId}`,
            avatar: f.avatar || f.avatarUrl || '',
            phoneNumber: f.phoneNumber || '',
          }))
        }
      } catch (err: any) {
        console.error('zaloApi.getAllFriends error:', err)
      }
    }

    return NextResponse.json({ success: true, friends: friendsList })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
