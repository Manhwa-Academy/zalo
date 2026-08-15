import { NextResponse } from 'next/server'
import { Zalo } from 'zca-js'
import { 
  setCurrentZaloApi, 
  setCurrentZaloUserInfo,
  clearCurrentZaloApi,
  getCurrentUserId
} from '@/lib/multi-user-zalo'
import { imageMetadataGetter } from '@/lib/image-metadata-getter'

interface ImportCredentials {
  imei: string
  cookie: any
  userAgent: string
  language?: string
}

function findAvatarInObj(obj: any): string {
  if (!obj || typeof obj !== 'object') return ''

  if (typeof obj.avatar === 'string' && obj.avatar.startsWith('http')) return obj.avatar
  if (typeof obj.avatarUrl === 'string' && obj.avatarUrl.startsWith('http')) return obj.avatarUrl
  if (typeof obj.avt === 'string' && obj.avt.startsWith('http')) return obj.avt
  if (typeof obj.avatar_240 === 'string' && obj.avatar_240.startsWith('http')) return obj.avatar_240
  if (typeof obj.avatar_120 === 'string' && obj.avatar_120.startsWith('http')) return obj.avatar_120

  for (const key of Object.keys(obj)) {
    const val = obj[key]
    if (typeof val === 'string' && val.startsWith('http') && (key.toLowerCase().includes('ava') || key.toLowerCase().includes('thumb'))) {
      return val
    }
    if (typeof val === 'object' && val !== null) {
      const found = findAvatarInObj(val)
      if (found) return found
    }
  }
  return ''
}

async function populateUserInfo(zaloApi: any) {
  let userInfo = {
    displayName: 'User',
    phoneNumber: 'N/A',
    userId: 'Unknown',
    avatar: '',
  }

  try {
    const apiObj = zaloApi as any
    if (typeof apiObj.getOwnId === 'function') {
      const ownId = apiObj.getOwnId()
      if (ownId) userInfo.userId = String(ownId)
    }

    if (typeof apiObj.fetchAccountInfo === 'function') {
      const accInfo = await apiObj.fetchAccountInfo()
      console.log('👤 Raw fetchAccountInfo response:', JSON.stringify(accInfo, null, 2))
      const profile = accInfo?.profile || accInfo?.data || accInfo
      if (profile) {
        userInfo.displayName = profile.displayName || profile.name || profile.zName || profile.dName || userInfo.displayName
        userInfo.userId = profile.userId || profile.uid || profile.zaloId || userInfo.userId
        userInfo.phoneNumber = profile.phoneNumber || profile.phone || profile.sdt || userInfo.phoneNumber
        userInfo.avatar = findAvatarInObj(accInfo)
      }
    }

    if (!userInfo.avatar && typeof apiObj.getUserInfo === 'function' && userInfo.userId !== 'Unknown') {
      try {
        const uRes = await apiObj.getUserInfo(userInfo.userId)
        userInfo.avatar = findAvatarInObj(uRes)
      } catch (e) {}
    }

    if (!userInfo.avatar && typeof apiObj.getAvatarUrlProfile === 'function' && userInfo.userId !== 'Unknown') {
      try {
        const avtRes = await apiObj.getAvatarUrlProfile(userInfo.userId)
        userInfo.avatar = findAvatarInObj(avtRes)
      } catch (e) {}
    }
  } catch (infoErr) {
    console.error('⚠️ Could not fetch extra user info:', infoErr)
  }

  console.log('👤 Final userInfo populated:', userInfo)
  await setCurrentZaloUserInfo(userInfo)
  return userInfo
}

export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId()
    const body = await request.json()
    const credentials: ImportCredentials = body.credentials

    // Validate credentials structure
    if (!credentials || !credentials.cookie || !credentials.imei || !credentials.userAgent) {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ. Thiếu cookie, imei hoặc userAgent' },
        { status: 400 }
      )
    }

    console.log(`📥 [Import] Starting import for user: ${userId}`)

    // Create a hash of credentials to detect duplicates
    const credentialsString = JSON.stringify({
      imei: credentials.imei,
      userAgent: credentials.userAgent,
      cookiePreview: JSON.stringify(credentials.cookie).substring(0, 100)
    })
    const crypto = require('crypto')
    const credentialsHash = crypto.createHash('md5').update(credentialsString).digest('hex')
    
    console.log(`🔑 [Import] Credentials hash: ${credentialsHash}`)

    // Check if this hash was already imported
    const { UserManager } = await import('@/lib/user-manager')
    const existingSession = await UserManager.getZaloSession(userId)
    
    if (existingSession?.userInfo?._importHash && existingSession.userInfo._importHash === credentialsHash) {
      console.log(`⚠️ [Import] This credentials file was already imported before`)
      const importedAt = existingSession.userInfo._importedAt 
        ? new Date(existingSession.userInfo._importedAt).toLocaleString('vi-VN')
        : 'trước đó'
      
      return NextResponse.json(
        { error: `⚠️ File này đã được nhập vào lúc ${importedAt}!\n\nKhông thể nhập lại cùng một file. Vui lòng export file mới hoặc sử dụng file khác.` },
        { status: 400 }
      )
    }

    // Clear existing session first
    await clearCurrentZaloApi()

    // Create new Zalo instance with imported credentials
    const zalo = new Zalo({ selfListen: true, imageMetadataGetter })
    
    // Login with imported credentials
    const zaloApi = await zalo.login(credentials)

    if (!zaloApi) {
      throw new Error('Không thể đăng nhập với credentials đã nhập')
    }

    console.log('✅ [Import] Successfully logged in with imported credentials')

    // Populate user info
    const userInfo = await populateUserInfo(zaloApi)
    
    // Check if this Zalo account already exists for another user
    if (userInfo.userId && userInfo.userId !== 'Unknown') {
      console.log(`🔍 Checking if Zalo user ${userInfo.userId} already exists...`)
      const { UserManager } = await import('@/lib/user-manager')
      const existingUser = await UserManager.getUserByZaloId(userInfo.userId)
      
      if (existingUser && existingUser.id !== userId) {
        console.log(`✅ Found existing user ${existingUser.id} for Zalo ID ${userInfo.userId}`)
        console.log(`🔗 Linking current session to existing user instead of creating duplicate`)
        
        // Link current session to existing user
        const { getSessionId } = await import('@/lib/session-cookie')
        const currentSessionId = getSessionId()
        await UserManager.linkSessionToUser(currentSessionId, existingUser.id)
        
        console.log(`✅ Successfully merged sessions. New session will use user ${existingUser.id}`)
      }
    }

    // Save to current session WITH hash in userInfo
    const userInfoWithHash = {
      ...userInfo,
      _importHash: credentialsHash, // Store hash to detect re-import
      _importedAt: new Date().toISOString()
    }
    
    await setCurrentZaloUserInfo(userInfoWithHash)
    await setCurrentZaloApi(zaloApi)

    console.log('✅ [Import] Import completed successfully with hash tracking')

    return NextResponse.json({
      success: true,
      userInfo,
      message: 'Nhập tài khoản thành công!'
    })
  } catch (error: any) {
    console.error('❌ [Import] Error:', error)
    
    // More specific error messages
    let errorMessage = 'Lỗi khi nhập tài khoản'
    if (error.message?.includes('cookie') || error.message?.includes('credentials')) {
      errorMessage = 'Dữ liệu credentials không hợp lệ hoặc đã hết hạn'
    } else if (error.message?.includes('network') || error.message?.includes('connect')) {
      errorMessage = 'Lỗi kết nối. Vui lòng kiểm tra internet'
    }

    return NextResponse.json(
      { error: error.message || errorMessage },
      { status: 500 }
    )
  }
}
