import { NextResponse } from 'next/server'
import { getZaloApi } from '@/lib/zalo-instance'
import { knownGroups } from '@/lib/zalo-listener-manager'

export async function GET() {
  try {
    const zaloApi = getZaloApi() as any
    if (!zaloApi) {
      return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
    }

    const groupMap = new Map<string, any>()

    // 1. Add groups from listener knownGroups map
    if (knownGroups && knownGroups.size > 0) {
      knownGroups.forEach((g, id) => {
        groupMap.set(id, g)
      })
    }

    // 2. Fetch group IDs via getAllGroups()
    if (typeof zaloApi.getAllGroups === 'function') {
      try {
        const res = await zaloApi.getAllGroups()
        console.log('📦 Raw getAllGroups response:', JSON.stringify(res, null, 2))

        const rawData = res?.data || res
        const gridVerMap = rawData?.gridVerMap || res?.gridVerMap
        const groupIds: string[] = []

        if (gridVerMap && typeof gridVerMap === 'object') {
          groupIds.push(...Object.keys(gridVerMap))
        } else if (rawData?.gridInfoMap && typeof rawData.gridInfoMap === 'object') {
          groupIds.push(...Object.keys(rawData.gridInfoMap))
        } else if (Array.isArray(rawData)) {
          rawData.forEach((item: any) => {
            const id = item?.grid || item?.groupId || item?.id
            if (id) groupIds.push(String(id))
          })
        }

        console.log(`🔍 Found ${groupIds.length} group IDs:`, groupIds)

        // 3. Fetch detailed group info for these IDs via getGroupInfo()
        if (groupIds.length > 0 && typeof zaloApi.getGroupInfo === 'function') {
          try {
            const infoRes = await zaloApi.getGroupInfo(groupIds)
            console.log('📦 Raw getGroupInfo response:', JSON.stringify(infoRes, null, 2))

            const infoData = infoRes?.data || infoRes
            const gridMap = infoData?.gridInfoMap || infoData

            if (gridMap && typeof gridMap === 'object') {
              Object.entries(gridMap).forEach(([id, info]: [string, any]) => {
                if (info && typeof info === 'object') {
                  const gId = String(info.grid || info.groupId || id)
                  const name = info.name || info.gName || info.gridName || `Nhóm ${gId}`
                  const totalMember = info.totalMember || info.memberNum || info.memNum || 0
                  const avatar = info.avt || info.avatar || info.avatarUrl || info.fullAvt || info.gAvt || info.gAvt_240 || info.fullAvtUrl || ''
                  groupMap.set(gId, { id: gId, name, totalMember, avatar })
                }
              })
            }
          } catch (infoErr) {
            console.error('Failed to getGroupInfo:', infoErr)
            groupIds.forEach((id) => {
              if (!groupMap.has(id)) {
                groupMap.set(id, { id, name: `Nhóm ${id}`, totalMember: 0 })
              }
            })
          }
        } else {
          groupIds.forEach((id) => {
            if (!groupMap.has(id)) {
              groupMap.set(id, { id, name: `Nhóm ${id}`, totalMember: 0 })
            }
          })
        }
      } catch (err: any) {
        console.error('zaloApi.getAllGroups error:', err)
      }
    }

    const groups = Array.from(groupMap.values())
    console.log(`✅ Formatted ${groups.length} groups for frontend`)

    return NextResponse.json({ success: true, groups })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
