import { NextResponse } from 'next/server'
import { getCurrentZaloApi } from '@/lib/multi-user-zalo'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const zaloApi = await getCurrentZaloApi() as any
    if (!zaloApi) {
      return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
    }
    
    let friendsList: any[] = []

    // Method 1: Try raw API call for friend list
    if (zaloApi.ctx && zaloApi.utils && zaloApi.api?.zpwServiceMap?.friend?.[0]) {
      try {
        const serviceURL = zaloApi.utils.makeURL(`${zaloApi.api.zpwServiceMap.friend[0]}/api/friend/getfriends`)
        const params = { incInval: 0 }
        const encryptedParams = zaloApi.utils.encodeAES(JSON.stringify(params))
        
        if (encryptedParams) {
          const response = await zaloApi.utils.request(serviceURL, {
            method: 'POST',
            body: new URLSearchParams({ params: encryptedParams }),
          })
          
          const rawData = zaloApi.utils.resolve(response)
          
          // Extract friends from response
          const friendsData = rawData?.data?.friends || rawData?.friends || []
          
          if (Array.isArray(friendsData) && friendsData.length > 0) {
            // Get own user ID to identify self
            const ownId = typeof zaloApi.getOwnId === 'function' ? String(zaloApi.getOwnId()) : ''
            
            friendsList = friendsData.map((f: any) => {
              const uid = String(f.uid || f.userId || f.id || '')
              
              // Check if this is self (own account)
              const isSelf = ownId && uid === ownId
              
              let name = f.dName || f.displayName || f.zaloName || f.name || ''
              
              // If no name and this is self, try to get from getUserInfo
              if (!name && isSelf) {
                name = 'Tài khoản của tôi'
              } else if (!name) {
                // Fallback for friends without names
                name = `Người dùng ${uid.slice(-4)}`
              }
              
              const avatar = f.avatar || f.avatarUrl || f.avt || f.avatar_240 || f.avatar_120 || ''
              
              return {
                id: uid,
                name: name,
                avatar: avatar,
                phoneNumber: f.phoneNumber || f.phone || '',
              }
            })
          }
        }
      } catch (err: any) {
        // Silent error - raw API not available
      }
    }

    // Method 2: Fallback to getAllFriends if raw API failed
    if (friendsList.length === 0 && typeof zaloApi.getAllFriends === 'function') {
      try {
        const friends = await zaloApi.getAllFriends()
        
        if (Array.isArray(friends)) {
          // Get own user ID to identify self
          const ownId = typeof zaloApi.getOwnId === 'function' ? String(zaloApi.getOwnId()) : ''
          
          friendsList = friends.map((f: any) => {
            const avatar = f.avatar || f.avatarUrl || f.avt || f.avatar_240 || f.avatar_120 || f.thumb || ''
            const uid = String(f.userId || f.uid || f.id || '')
            
            // Check if this is self
            const isSelf = ownId && uid === ownId
            
            let name = f.displayName || f.zaloName || f.display_name || f.name || ''
            
            // If no name and this is self
            if (!name && isSelf) {
              name = 'Tài khoản của tôi'
            } else if (!name) {
              // Fallback for friends without names
              name = `Người dùng ${uid.slice(-4)}`
            }
            
            return {
              id: uid,
              name: name,
              avatar: avatar,
              phoneNumber: f.phoneNumber || f.phone || '',
            }
          })
        }
      } catch (err: any) {
        // Silent error - getAllFriends not available
      }
    }

    // Method 3: Enrich missing avatars with getUserInfo
    if (friendsList.length > 0) {
      const missingAvatars = friendsList.filter(f => !f.avatar)
      
      if (missingAvatars.length > 0 && typeof zaloApi.getUserInfo === 'function') {
        try {
          // Batch fetch user info for friends missing avatars (max 50 at a time)
          const batch = missingAvatars.slice(0, 50).map(f => f.id)
          
          const userInfoRes = await zaloApi.getUserInfo(batch)
          const userInfoData = userInfoRes?.data || userInfoRes?.changed_profiles || userInfoRes || {}
          
          // Update friends list with fetched avatars
          friendsList = friendsList.map(friend => {
            if (friend.avatar) return friend // Already has avatar
            
            // Try multiple key formats
            const uid = friend.id
            const userInfo = userInfoData[uid] || userInfoData[`${uid}_0`] || userInfoData[uid.replace('_0', '')] || null
            
            if (userInfo) {
              const avatar = userInfo.avatar || userInfo.avatar_240 || userInfo.avatar_120 || userInfo.avt || ''
              const name = userInfo.displayName || userInfo.name || userInfo.zaloName || friend.name
              
              return {
                ...friend,
                avatar: avatar || friend.avatar,
                name: name || friend.name,
              }
            }
            
            return friend
          })
        } catch (err: any) {
          // Silent error - getUserInfo batch fetch failed
        }
      }
    }

    return NextResponse.json({ success: true, friends: friendsList })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
