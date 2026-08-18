import { NextResponse } from 'next/server'
import { getCurrentZaloApi } from '@/lib/multi-user-zalo'

export const dynamic = 'force-dynamic'

// POST /api/zalo/join-group-link - Get group info and join group via link
export async function POST(request: Request) {
  try {
    const zaloApi = await getCurrentZaloApi() as any
    
    if (!zaloApi) {
      return NextResponse.json({ error: 'Chưa đăng nhập Zalo' }, { status: 401 })
    }

    const { action, link } = await request.json()

    // Action 1: Get group info from link
    if (action === 'get_info') {
      if (!link) {
        return NextResponse.json({ error: 'Thiếu link nhóm' }, { status: 400 })
      }

      try {
        // Call API to get group info
        const result = await zaloApi.getGroupLinkInfo({
          link: link,
          memberPage: 1 // Get first page of members
        })
        
        console.log('🔍 [Join Group] API Response:', JSON.stringify(result, null, 2))
        
        if (!result || result.error) {
          return NextResponse.json({ 
            error: 'Không thể lấy thông tin nhóm',
            details: result?.error 
          }, { status: 500 })
        }

        // Extract group info from various possible locations
        const groupData = result.data || result
        
        console.log('📦 [Join Group] Group Data:', {
          groupId: groupData?.groupId || groupData?.globalId || groupData?.grid,
          name: groupData?.name || groupData?.groupName || groupData?.gName,
          totalMember: groupData?.totalMember || groupData?.totalMembers || 0,
          hasAvatar: !!(groupData?.avt || groupData?.fullAvt || groupData?.avatar)
        })

        // Return group info with fallbacks
        return NextResponse.json({
          success: true,
          groupInfo: {
            groupId: groupData?.groupId || groupData?.globalId || groupData?.grid || '',
            name: groupData?.name || groupData?.groupName || groupData?.gName || 'Nhóm Zalo',
            desc: groupData?.desc || groupData?.description || '',
            avt: groupData?.avt || groupData?.avatar || '',
            fullAvt: groupData?.fullAvt || groupData?.fullAvatar || '',
            totalMember: groupData?.totalMember || groupData?.totalMembers || 0,
            adminIds: groupData?.adminIds || [],
            currentMems: groupData?.currentMems || groupData?.members || [],
            hasMoreMember: groupData?.hasMoreMember || 0,
          }
        })
      } catch (error: any) {
        console.error('❌ Get group link info error:', error)
        return NextResponse.json({ 
          error: 'Không thể lấy thông tin nhóm',
          details: error.message 
        }, { status: 500 })
      }
    }

    // Action 2: Join group via link
    if (action === 'join') {
      if (!link) {
        return NextResponse.json({ error: 'Thiếu link nhóm' }, { status: 400 })
      }

      try {
        const trimmedLink = link.trim()
        
        // Ensure it's a full URL
        let fullUrl = trimmedLink
        if (!trimmedLink.startsWith('http')) {
          // If user provided just the code, construct full URL
          const code = trimmedLink.replace(/^\/+/, '') // Remove leading slashes
          fullUrl = `https://zalo.me/g/${code}`
        }
        
        console.log('🔗 [Join Group] Joining with URL:', fullUrl)
        
        // Join group using FULL URL (as per documentation)
        const result = await zaloApi.joinGroupLink(fullUrl)
        
        console.log('✅ [Join Group] Result:', result)
        
        if (!result || result.error) {
          return NextResponse.json({ 
            error: 'Không thể tham gia nhóm',
            details: result?.error 
          }, { status: 500 })
        }

        return NextResponse.json({
          success: true,
          message: 'Đã tham gia nhóm thành công!',
          data: result.data || result
        })
      } catch (error: any) {
        // Check for specific error codes and messages
        const errorMessage = error.message || ''
        const errorCode = error.code
        
        // Code 178: Already a member (this is not really an error - just log it)
        if (errorCode === 178 || errorMessage.includes('đã là thành viên') || errorMessage.includes('already')) {
          console.log('ℹ️ [Join Group] User is already a member (expected):', errorMessage)
          return NextResponse.json({ 
            error: 'Bạn đã là thành viên của nhóm này rồi! ✅',
            alreadyMember: true,
            details: errorMessage 
          }, { status: 400 })
        }
        
        // For actual errors, log as error
        console.error('❌ Join group link error:', error)
        
        // Code 227: Invalid link
        if (errorCode === 227 || errorMessage.includes('Invalid group link')) {
          return NextResponse.json({ 
            error: 'Link nhóm không hợp lệ hoặc đã hết hạn. Vui lòng kiểm tra lại link! 🔗',
            details: errorMessage 
          }, { status: 400 })
        }
        
        // Blocked/banned
        if (errorMessage.includes('blocked') || errorMessage.includes('banned') || errorMessage.includes('bị chặn')) {
          return NextResponse.json({ 
            error: 'Bạn đã bị chặn khỏi nhóm này! ⛔',
            details: errorMessage 
          }, { status: 403 })
        }
        
        // Requires approval
        if (errorMessage.includes('approval') || errorMessage.includes('duyệt')) {
          return NextResponse.json({ 
            error: 'Nhóm này yêu cầu admin duyệt. Vui lòng đợi admin chấp nhận! ⏳',
            details: errorMessage 
          }, { status: 400 })
        }
        
        // Generic error
        return NextResponse.json({ 
          error: 'Không thể tham gia nhóm. Vui lòng thử lại sau! ❌',
          details: errorMessage 
        }, { status: 500 })
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    console.error('❌ Join group link API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
