import { NextResponse } from 'next/server'
import { Zalo } from 'zca-js'
import { 
  setCurrentZaloApi, 
  setCurrentZaloUserInfo,
  clearCurrentZaloApi,
  getCurrentUserId
} from '@/lib/multi-user-zalo'
import { imageMetadataGetter } from '@/lib/image-metadata-getter'
import pool from '@/lib/postgres'

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
    const botSettings = body.botSettings
    const messages = body.messages
    const userInfoData = body.userInfo
    const exportMetadata = body.exportMetadata // Get export metadata

    // Validate credentials structure
    if (!credentials || !credentials.cookie || !credentials.imei || !credentials.userAgent) {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ. Thiếu cookie, imei hoặc userAgent' },
        { status: 400 }
      )
    }

    console.log(`📥 [Import] Starting import for user: ${userId}`)
    
    // Get export timestamp (from file metadata if available)
    const exportTimestamp = exportMetadata?.exportTimestamp || Date.now()
    const exportedAtDisplay = exportMetadata?.exportedAtLocal || new Date(exportTimestamp).toLocaleString('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      hour12: false
    })
    
    console.log(`📅 [Import] File exported at: ${exportedAtDisplay}`)

    // Create a hash of credentials to detect duplicates
    const credentialsString = JSON.stringify({
      imei: credentials.imei,
      userAgent: credentials.userAgent,
      cookiePreview: JSON.stringify(credentials.cookie).substring(0, 100),
      exportTimestamp, // Include export timestamp in hash
    })
    const crypto = require('crypto')
    const credentialsHash = crypto.createHash('md5').update(credentialsString).digest('hex')
    
    console.log(`🔑 [Import] Credentials hash: ${credentialsHash}`)

    // Check if this hash was already imported by ANY user (global check)
    const { UserManager } = await import('@/lib/user-manager')
    
    // Check globally across all users
    if (pool) {
      const globalHashCheck = await pool.query(
        `SELECT zs.user_info->>'_importedAt' as imported_at, u.session_id
         FROM zalo_sessions zs
         JOIN users u ON u.id = zs.user_id
         WHERE zs.user_info->>'_importHash' = $1
         AND zs.is_active = true
         LIMIT 1`,
        [credentialsHash]
      )
      
      if (globalHashCheck.rows.length > 0) {
        const importedAtRaw = globalHashCheck.rows[0].imported_at
        const importedAt = importedAtRaw
          ? new Date(importedAtRaw).toLocaleString('vi-VN', {
              timeZone: 'Asia/Ho_Chi_Minh',
              hour12: false
            })
          : 'trước đó'
        
        console.log(`⚠️ [Import] This credentials file was already imported globally at ${importedAt}`)
        return NextResponse.json(
          { error: `⚠️ File exported lúc ${exportedAtDisplay} đã được nhập trên thiết bị khác vào lúc ${importedAt}!\n\nKhông thể nhập lại cùng một file trên nhiều thiết bị. Vui lòng export file mới từ thiết bị đang dùng.` },
          { status: 400 }
        )
      }
    }

    // Also check current user session
    const existingSession = await UserManager.getZaloSession(userId)
    
    if (existingSession?.userInfo?._importHash && existingSession.userInfo._importHash === credentialsHash) {
      console.log(`⚠️ [Import] This credentials file was already imported before`)
      const importedAtRaw = existingSession.userInfo._importedAt
      const importedAt = importedAtRaw
        ? new Date(importedAtRaw).toLocaleString('vi-VN', {
            timeZone: 'Asia/Ho_Chi_Minh',
            hour12: false
          })
        : 'trước đó'
      
      return NextResponse.json(
        { error: `⚠️ File exported lúc ${exportedAtDisplay} đã được nhập vào lúc ${importedAt}!\n\nKhông thể nhập lại cùng một file. Vui lòng export file mới hoặc sử dụng file khác.` },
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
    
    // Save to current session WITH hash in userInfo (no merging - allow multiple devices)
    const userInfoWithHash = {
      ...userInfo,
      _importHash: credentialsHash, // Store hash to detect re-import
      _importedAt: new Date().toISOString(), // When this file was imported
      _exportedAt: exportMetadata?.exportedAt || new Date().toISOString(), // When this file was exported
      _exportTimestamp: exportTimestamp, // Export timestamp for display
    }
    
    // IMPORTANT: Save zaloApi FIRST so it's in memory when we save userInfo
    await setCurrentZaloApi(zaloApi)
    await setCurrentZaloUserInfo(userInfoWithHash)

    // Restore bot settings if provided
    if (botSettings) {
      try {
        const { UserManager } = await import('@/lib/user-manager')
        await UserManager.updateBotSettings(userId, botSettings)
        console.log('✅ [Import] Restored bot settings')
      } catch (e) {
        console.warn('⚠️ [Import] Could not restore bot settings:', e)
      }
    }

    // Restore messages if provided
    if (messages && Array.isArray(messages) && messages.length > 0) {
      try {
        const fs = await import('fs')
        const { dataFilePath } = await import('@/lib/data-dir')
        const messagesFile = dataFilePath('.zalo-messages.json')
        
        // Append to existing messages
        let existingMessages = []
        if (fs.existsSync(messagesFile)) {
          const data = fs.readFileSync(messagesFile, 'utf-8')
          existingMessages = JSON.parse(data)
        }
        
        const combined = [...existingMessages, ...messages]
        // Keep last 500 messages
        const trimmed = combined.slice(-500)
        
        fs.writeFileSync(messagesFile, JSON.stringify(trimmed, null, 2), 'utf-8')
        console.log(`✅ [Import] Restored ${messages.length} messages`)
      } catch (e) {
        console.warn('⚠️ [Import] Could not restore messages:', e)
      }
    }

    console.log('✅ [Import] Import completed successfully with hash tracking')

    return NextResponse.json({
      success: true,
      userInfo,
      restoredSettings: !!botSettings,
      restoredMessages: messages?.length || 0,
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
