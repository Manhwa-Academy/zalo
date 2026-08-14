import { NextResponse } from 'next/server'
import { getZaloApi } from '@/lib/zalo-instance'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get('groupId')

    if (!groupId) {
      return NextResponse.json({ error: 'Missing groupId' }, { status: 400 })
    }

    const zaloApi = getZaloApi() as any
    if (!zaloApi) {
      return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
    }

    const memberIdsSet = new Set<string>()
    const memberDetailsMap = new Map<string, { id: string; name: string; avatar: string }>()

    // 1. Fetch group info from getGroupInfo
    let gInfo: any = null
    if (typeof zaloApi.getGroupInfo === 'function') {
      try {
        gInfo = await zaloApi.getGroupInfo(groupId)
      } catch (e: any) {
        console.error('getGroupInfo error:', e.message || e)
      }
    }

    if (gInfo) {
      const gridInfoMap = gInfo?.gridInfoMap || gInfo?.data?.gridInfoMap || {}
      const groupObj = gridInfoMap[groupId] || gridInfoMap[String(groupId)] || Object.values(gridInfoMap)[0] as any

      if (groupObj) {
        // Extract member IDs from memVerList
        if (Array.isArray(groupObj.memVerList)) {
          groupObj.memVerList.forEach((item: any) => {
            const cleanId = String(item).replace('_0', '').trim()
            if (cleanId && cleanId !== '0' && cleanId !== 'undefined') {
              memberIdsSet.add(cleanId)
            }
          })
        }

        // Extract member IDs from memberIds
        if (Array.isArray(groupObj.memberIds)) {
          groupObj.memberIds.forEach((item: any) => {
            const cleanId = String(item).replace('_0', '').trim()
            if (cleanId && cleanId !== '0' && cleanId !== 'undefined') {
              memberIdsSet.add(cleanId)
            }
          })
        }

        // Extract from memInfo or members array if available
        const mems = groupObj.memInfo || groupObj.members || groupObj.memMap || groupObj.mem_info || []
        const memArray = Array.isArray(mems) ? mems : (typeof mems === 'object' && mems !== null ? Object.values(mems) : [])
        memArray.forEach((m: any) => {
          const uid = String(m.id || m.uid || m.userId || '').replace('_0', '').trim()
          const name = m.dName || m.displayName || m.name || m.zaloName || ''
          const avatar = m.avatar || m.avatarUrl || m.avt || m.avatar_120 || m.avatar_240 || m.thumb || m.avatar_0 || ''
          if (uid && uid !== '0' && uid !== 'undefined') {
            memberIdsSet.add(uid)
            if (name || avatar) {
              memberDetailsMap.set(uid, { id: uid, name, avatar })
            }
          }
        })
      }
    }

    const memberIds = Array.from(memberIdsSet)
    console.log(`👥 Found ${memberIds.length} raw member IDs for group ${groupId}:`, memberIds)

    // 2. Fetch member names & avatars using getGroupMembersInfo
    if (memberIds.length > 0 && typeof zaloApi.getGroupMembersInfo === 'function') {
      try {
        const gmRes = await zaloApi.getGroupMembersInfo(memberIds)
        const gmData = gmRes?.data || gmRes
        if (gmData && typeof gmData === 'object') {
          Object.keys(gmData).forEach((uid) => {
            const rawUid = uid.replace('_0', '').trim()
            const item = gmData[uid]
            if (item) {
              const name = item.displayName || item.name || item.dName || item.zaloName || ''
              const avatar = item.avatar || item.avt || item.avatar_120 || item.avatar_240 || ''
              const existing = memberDetailsMap.get(rawUid) || { id: rawUid, name: '', avatar: '' }
              if (name) existing.name = name
              if (avatar) existing.avatar = avatar
              memberDetailsMap.set(rawUid, existing)
            }
          })
        }
      } catch (e: any) {
        console.error('getGroupMembersInfo error:', e.message || e)
      }
    }

    // 3. Fallback to getUserInfo for any missing names/avatars
    const stillMissing = memberIds.filter((id) => {
      const details = memberDetailsMap.get(id)
      return !details || !details.name || details.name.startsWith('Thành viên')
    })

    if (stillMissing.length > 0 && typeof zaloApi.getUserInfo === 'function') {
      try {
        const uRes = await zaloApi.getUserInfo(stillMissing)
        const uData = uRes?.data || uRes?.changed_profiles || uRes
        if (uData && typeof uData === 'object') {
          stillMissing.forEach((uid) => {
            const rawKey = uid.endsWith('_0') ? uid : `${uid}_0`
            const userItem = uData[uid] || uData[rawKey] || uData[uid.replace('_0', '')]
            if (userItem) {
              const name = userItem.displayName || userItem.name || userItem.zaloName || ''
              const avatar = userItem.avatar || userItem.avatar_240 || userItem.avatar_120 || userItem.avt || ''
              const existing = memberDetailsMap.get(uid) || { id: uid, name: '', avatar: '' }
              if (name) existing.name = name
              if (avatar) existing.avatar = avatar
              memberDetailsMap.set(uid, existing)
            }
          })
        }
      } catch (e: any) {
        console.error('getUserInfo fallback error:', e.message || e)
      }
    }

    // Filter out self user id if needed or include all group members
    const ownId = typeof zaloApi.getOwnId === 'function' ? String(zaloApi.getOwnId()) : ''

    const members = memberIds.map((id) => {
      const details = memberDetailsMap.get(id)
      const isSelf = ownId && id === ownId
      const fallbackName = isSelf ? 'Bạn (Chính mình)' : `Thành viên (${id.slice(-4)})`
      return {
        id,
        name: details?.name || fallbackName,
        avatar: details?.avatar || '',
      }
    })

    console.log(`✅ Loaded ${members.length} members for group ${groupId}`)

    return NextResponse.json({ success: true, members })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
