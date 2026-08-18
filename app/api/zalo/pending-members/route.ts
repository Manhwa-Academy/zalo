import { NextRequest, NextResponse } from 'next/server'
import { getCurrentZaloApi } from '@/lib/multi-user-zalo'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, groupId, members, isApprove } = body

    if (!groupId) {
      return NextResponse.json(
        { error: 'Thiếu groupId' },
        { status: 400 }
      )
    }

    const zaloApi = await getCurrentZaloApi()
    if (!zaloApi) {
      return NextResponse.json({ error: 'Chưa đăng nhập Zalo' }, { status: 401 })
    }

    // GET_PENDING - Lấy danh sách yêu cầu chờ duyệt
    if (action === 'get_pending') {
      console.log('🔍 Getting pending members for group:', groupId)
      console.log('🔍 GroupId type:', typeof groupId)
      console.log('🔍 GroupId value:', JSON.stringify(groupId))
      
      // Ensure groupId is a string
      const groupIdStr = String(groupId)
      
      const result = await zaloApi.getPendingGroupMembers(groupIdStr)
      
      console.log('✅ Pending members result:', JSON.stringify(result, null, 2))
      
      return NextResponse.json({
        success: true,
        data: {
          time: result.time,
          users: result.users.map((user: any) => ({
            id: user.uid,
            name: user.dpn,
            avatar: user.avatar,
          })),
        },
      })
    }

    // REVIEW - Duyệt hoặc từ chối yêu cầu
    if (action === 'review') {
      if (!members || typeof isApprove !== 'boolean') {
        return NextResponse.json(
          { error: 'Thiếu members hoặc isApprove' },
          { status: 400 }
        )
      }

      console.log('📤 Reviewing pending members:', {
        groupId,
        members,
        isApprove,
      })
      
      const result = await zaloApi.reviewPendingMemberRequest(
        {
          members: Array.isArray(members) ? members : [members],
          isApprove,
        },
        groupId
      )
      
      console.log('✅ Review result:', result)
      
      // Parse result to check status
      const results = Object.entries(result).map(([memberId, status]) => ({
        memberId,
        status,
        success: status === 0, // 0 = SUCCESS
        message: getStatusMessage(status as number),
      }))
      
      return NextResponse.json({
        success: true,
        data: results,
      })
    }

    return NextResponse.json(
      { error: 'Action không hợp lệ. Sử dụng: get_pending, review' },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('❌ Error managing pending members:', error)
    return NextResponse.json(
      {
        error: 'Không thể quản lý yêu cầu tham gia',
        details: error.message || String(error),
      },
      { status: 500 }
    )
  }
}

function getStatusMessage(status: number): string {
  switch (status) {
    case 0:
      return 'Thành công'
    case 170:
      return 'Không có trong danh sách chờ duyệt'
    case 178:
      return 'Đã là thành viên nhóm'
    case 166:
      return 'Không đủ quyền (chỉ admin/phó nhóm)'
    default:
      return `Lỗi không xác định (${status})`
  }
}
