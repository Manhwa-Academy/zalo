import { NextRequest, NextResponse } from 'next/server'
import { getCurrentZaloApi } from '@/lib/multi-user-zalo'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, groupId, page, blockFutureInvite } = body

    const zaloApi = await getCurrentZaloApi()
    if (!zaloApi) {
      return NextResponse.json({ error: 'Chưa đăng nhập Zalo' }, { status: 401 })
    }

    // GET_LIST - Lấy danh sách lời mời nhóm
    if (action === 'get_list') {
      console.log('📤 Getting group invite box list')
      
      const result = await zaloApi.getGroupInviteBoxList({
        page: page || 0,
        invPerPage: 20,
      })
      
      console.log('✅ Invite box list:', result)
      
      return NextResponse.json({
        success: true,
        data: {
          invitations: result.invitations.map((inv: any) => ({
            groupId: inv.groupInfo.groupId,
            groupName: inv.groupInfo.name,
            groupAvatar: inv.groupInfo.avt,
            groupDesc: inv.groupInfo.desc,
            totalMembers: inv.groupInfo.totalMember,
            inviter: {
              id: inv.inviterInfo.id,
              name: inv.inviterInfo.dName || inv.inviterInfo.zaloName,
              avatar: inv.inviterInfo.avatar,
            },
            creator: {
              id: inv.grCreatorInfo.id,
              name: inv.grCreatorInfo.dName || inv.grCreatorInfo.zaloName,
              avatar: inv.grCreatorInfo.avatar,
            },
            expiredTs: inv.expiredTs,
            type: inv.type,
          })),
          total: result.total,
          hasMore: result.hasMore,
        },
      })
    }

    // GET_INFO - Lấy chi tiết lời mời
    if (action === 'get_info') {
      if (!groupId) {
        return NextResponse.json(
          { error: 'Thiếu groupId' },
          { status: 400 }
        )
      }

      console.log('📤 Getting invite box info for group:', groupId)
      
      const result = await zaloApi.getGroupInviteBoxInfo({
        groupId,
        mcount: 5,
      })
      
      console.log('✅ Invite box info:', result)
      
      return NextResponse.json({
        success: true,
        data: {
          group: {
            id: result.groupInfo.groupId,
            name: result.groupInfo.name,
            avatar: result.groupInfo.avt,
            desc: result.groupInfo.desc,
            totalMembers: result.groupInfo.totalMember,
          },
          inviter: {
            id: result.inviterInfo.id,
            name: result.inviterInfo.dName || result.inviterInfo.zaloName,
            avatar: result.inviterInfo.avatar,
          },
          creator: {
            id: result.grCreatorInfo.id,
            name: result.grCreatorInfo.dName || result.grCreatorInfo.zaloName,
            avatar: result.grCreatorInfo.avatar,
          },
          expiredTs: result.expiredTs,
          type: result.type,
        },
      })
    }

    // JOIN - Chấp nhận lời mời
    if (action === 'join') {
      if (!groupId) {
        return NextResponse.json(
          { error: 'Thiếu groupId' },
          { status: 400 }
        )
      }

      console.log('📤 Joining group via invite box:', groupId)
      
      await zaloApi.joinGroupInviteBox(groupId)
      
      console.log('✅ Joined group successfully')
      
      return NextResponse.json({
        success: true,
        message: 'Đã tham gia nhóm thành công',
      })
    }

    // DELETE - Từ chối/xóa lời mời
    if (action === 'delete') {
      if (!groupId) {
        return NextResponse.json(
          { error: 'Thiếu groupId' },
          { status: 400 }
        )
      }

      console.log('📤 Deleting invite box:', groupId, 'blockFuture:', blockFutureInvite)
      
      const result = await zaloApi.deleteGroupInviteBox(
        groupId,
        blockFutureInvite || false
      )
      
      console.log('✅ Delete result:', result)
      
      return NextResponse.json({
        success: true,
        data: {
          deletedIds: result.delInvitaionIds,
          errors: result.errMap,
        },
      })
    }

    return NextResponse.json(
      { error: 'Action không hợp lệ. Sử dụng: get_list, get_info, join, delete' },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('❌ Error managing invite box:', error)
    return NextResponse.json(
      {
        error: 'Không thể quản lý hộp thư mời nhóm',
        details: error.message || String(error),
      },
      { status: 500 }
    )
  }
}
