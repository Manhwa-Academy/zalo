import { NextResponse } from 'next/server'
import { getCurrentZaloApi } from '@/lib/multi-user-zalo'

export const dynamic = 'force-dynamic'

// POST /api/zalo/add-friend - Find user by phone and send friend request
export async function POST(request: Request) {
  try {
    const zaloApi = await getCurrentZaloApi() as any
    
    if (!zaloApi) {
      return NextResponse.json({ error: 'Chưa đăng nhập Zalo' }, { status: 401 })
    }

    const { action, phone, userId, message } = await request.json()

    // Action 1: Find user by phone number
    if (action === 'find') {
      if (!phone) {
        return NextResponse.json({ error: 'Thiếu số điện thoại' }, { status: 400 })
      }

      try {
        // Use findUser API to search by phone
        console.log('🔍 [Find User] Searching for phone:', phone)
        const result = await zaloApi.findUser(phone)
        console.log('🔍 [Find User] Raw result:', JSON.stringify(result, null, 2))
        
        if (!result || result.error) {
          console.error('❌ [Find User] Not found or error:', result?.error)
          return NextResponse.json({ 
            error: 'Không tìm thấy người dùng với số điện thoại này',
            details: result?.error 
          }, { status: 404 })
        }

        // Extract user data - try multiple possible structures
        const userData = result.data || result
        console.log('📋 [Find User] Extracted userData:', JSON.stringify(userData, null, 2))
        console.log('📋 [Find User] All keys:', Object.keys(userData || {}))

        const userResponse = {
          userId: userData?.uid || userData?.userId || userData?.id || userData?.zaloId || 'Unknown',
          displayName: userData?.displayName || userData?.zaloName || userData?.dName || userData?.name || userData?.display_name || userData?.fullName || userData?.username || 'Unknown User',
          avatar: userData?.avatar || userData?.avatarUrl || userData?.avt || userData?.avatar_240 || userData?.thumb || '',
          phone: phone,
          isFriend: userData?.isFriend || userData?.is_friend || false,
          canAddFriend: userData?.canAddFriend !== false && userData?.can_add_friend !== false,
        }
        
        console.log('✅ [Find User] Final response:', JSON.stringify(userResponse, null, 2))

        // Return user info
        return NextResponse.json({
          success: true,
          user: userResponse
        })
      } catch (error: any) {
        console.error('❌ Find user error:', error)
        return NextResponse.json({ 
          error: 'Không thể tìm kiếm người dùng',
          details: error.message 
        }, { status: 500 })
      }
    }

    // Action 2: Send friend request
    if (action === 'send') {
      if (!userId) {
        return NextResponse.json({ error: 'Thiếu userId' }, { status: 400 })
      }

      try {
        // Default message if not provided
        const requestMessage = message || 'Xin chào, mình là Hoàng Kiều Phong. Kết bạn với mình nhé!'
        
        console.log('📤 [Send Friend Request] userId:', userId)
        console.log('📤 [Send Friend Request] message:', requestMessage)
        
        // ✅ CORRECT ORDER: sendFriendRequest(message, userId)
        // NOT: sendFriendRequest(userId, message) ❌
        const result = await zaloApi.sendFriendRequest(requestMessage, userId)
        
        console.log('✅ [Send Friend Request] Result:', JSON.stringify(result, null, 2))
        
        if (!result && result !== "") {
          return NextResponse.json({ 
            error: 'Không thể gửi lời mời kết bạn',
            details: 'API returned no result'
          }, { status: 500 })
        }

        return NextResponse.json({
          success: true,
          message: 'Đã gửi lời mời kết bạn thành công!',
          data: result
        })
      } catch (error: any) {
        console.error('❌ Send friend request error:', error)
        return NextResponse.json({ 
          error: 'Không thể gửi lời mời kết bạn',
          details: error.message,
          code: error.code
        }, { status: 500 })
      }
    }

    // Action 3: Get sent friend requests list
    if (action === 'list_sent') {
      try {
        const result = await zaloApi.getSentFriendRequest()
        
        if (!result || result.error) {
          return NextResponse.json({ 
            error: 'Không thể lấy danh sách lời mời đã gửi',
            details: result?.error 
          }, { status: 500 })
        }

        return NextResponse.json({
          success: true,
          requests: result.data || []
        })
      } catch (error: any) {
        console.error('❌ Get sent requests error:', error)
        return NextResponse.json({ 
          error: 'Không thể lấy danh sách lời mời',
          details: error.message 
        }, { status: 500 })
      }
    }

    // Action 4: Cancel/Undo friend request
    if (action === 'cancel') {
      if (!userId) {
        return NextResponse.json({ error: 'Thiếu userId' }, { status: 400 })
      }

      try {
        console.log('🔙 [Undo Friend Request] userId:', userId)
        
        // Use undoFriendRequest API
        const result = await zaloApi.undoFriendRequest(userId)
        
        console.log('✅ [Undo Friend Request] Result:', JSON.stringify(result, null, 2))
        
        // API returns empty string "" on success
        if (result === "" || result === null || result === undefined) {
          return NextResponse.json({
            success: true,
            message: 'Đã hủy lời mời kết bạn thành công!'
          })
        }
        
        // If there's an error property
        if (typeof result === 'object' && (result as any).error) {
          return NextResponse.json({ 
            error: 'Không thể hủy lời mời kết bạn',
            details: (result as any).error 
          }, { status: 500 })
        }

        return NextResponse.json({
          success: true,
          message: 'Đã hủy lời mời kết bạn thành công!'
        })
      } catch (error: any) {
        console.error('❌ Undo friend request error:', error)
        return NextResponse.json({ 
          error: 'Không thể hủy lời mời kết bạn',
          details: error.message,
          code: error.code
        }, { status: 500 })
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    console.error('❌ Add friend API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
