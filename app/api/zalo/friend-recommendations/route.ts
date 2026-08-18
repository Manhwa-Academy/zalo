import { NextRequest, NextResponse } from 'next/server'
import { getCurrentZaloApi } from '@/lib/multi-user-zalo'

export const dynamic = 'force-dynamic'

/**
 * GET /api/zalo/friend-recommendations
 * Get friend recommendations (suggestions)
 */
export async function GET(req: NextRequest) {
  try {
    const zaloApi = await getCurrentZaloApi()
    if (!zaloApi) {
      return NextResponse.json({ error: 'Bạn chưa đăng nhập Zalo' }, { status: 401 })
    }

    // Check if getFriendRecommendations method exists
    if (typeof zaloApi.getFriendRecommendations !== 'function') {
      return NextResponse.json({ 
        error: 'Chức năng này chưa được hỗ trợ',
        recommendations: [] 
      }, { status: 200 })
    }

    const result = await zaloApi.getFriendRecommendations()
    
    console.log('📋 [Friend Recommendations] Raw result:', result)
    
    // Parse recommendations data - could be object or array
    let recommendationsRaw: any[] = []
    
    if (Array.isArray(result)) {
      recommendationsRaw = result
    } else if (result && typeof result === 'object') {
      // If it's an object, convert to array
      if (result.data && Array.isArray(result.data)) {
        recommendationsRaw = result.data
      } else if (result.data && typeof result.data === 'object') {
        recommendationsRaw = Object.values(result.data)
      } else {
        recommendationsRaw = Object.values(result)
      }
    }
    
    console.log('📋 [Friend Recommendations] Parsed raw:', recommendationsRaw.length, 'items')
    
    // Fetch full user info for each recommendation
    const recommendations = await Promise.all(
      recommendationsRaw.map(async (rec: any) => {
        const userId = rec.userId || rec.uid || rec.id || rec.friendId || ''
        
        if (!userId) {
          console.warn('⚠️ [Friend Recommendations] Missing userId for:', rec)
          return null
        }
        
        try {
          // Fetch user info from Zalo API
          const userInfoResult = await zaloApi.getUserInfo(userId)
          const userInfo = userInfoResult?.data?.[userId] || userInfoResult?.[userId] || userInfoResult?.data || userInfoResult
          
          console.log(`👤 [Friend Recommendations] User ${userId}:`, {
            displayName: userInfo?.displayName,
            avatar: userInfo?.avatar,
            hasInfo: !!userInfo
          })
          
          return {
            userId,
            displayName: userInfo?.displayName || userInfo?.name || rec.displayName || rec.name || `User ${userId.slice(-4)}`,
            zaloName: userInfo?.zaloName || rec.zaloName || '',
            avatar: userInfo?.avatar || userInfo?.avatarUrl || userInfo?.avatar_240 || userInfo?.avatar_120 || rec.avatar || '',
            mutualFriends: rec.mutualFriends || rec.numMutualFriends || 0,
            reason: rec.reason || rec.source || 'Gợi ý kết bạn'
          }
        } catch (error) {
          console.error(`❌ [Friend Recommendations] Failed to get user info for ${userId}:`, error)
          return {
            userId,
            displayName: rec.displayName || rec.name || `User ${userId.slice(-4)}`,
            zaloName: rec.zaloName || '',
            avatar: rec.avatar || '',
            mutualFriends: rec.mutualFriends || 0,
            reason: rec.reason || 'Gợi ý kết bạn'
          }
        }
      })
    )
    
    // Filter out nulls
    const validRecommendations = recommendations.filter(r => r !== null)
    
    console.log('✅ [Friend Recommendations] Final:', validRecommendations.length, 'valid recommendations')
    
    return NextResponse.json({
      success: true,
      recommendations: validRecommendations,
      count: validRecommendations.length
    })
  } catch (error: any) {
    console.error('❌ Get friend recommendations error:', error)
    return NextResponse.json(
      { 
        error: error.message || 'Không thể lấy gợi ý kết bạn',
        recommendations: []
      },
      { status: 500 }
    )
  }
}
