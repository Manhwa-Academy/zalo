import { NextResponse } from 'next/server'
import { Zalo, LoginQRCallbackEventType } from 'zca-js'
import { 
  getCurrentZaloApi, 
  setCurrentZaloApi, 
  setCurrentZaloUserInfo,
  getCurrentZaloUserInfo,
  loadCurrentZaloSession,
  clearCurrentZaloApi,
  getCurrentUserId
} from '@/lib/multi-user-zalo'
import { imageMetadataGetter } from '@/lib/image-metadata-getter'
import { getQrState, updateQrState, resetQrState } from '@/lib/qr-state'

// Map để track login progress theo userId
const loginInProgressMap = new Map<string, boolean>()

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
        console.log('👤 Raw getUserInfo response:', JSON.stringify(uRes, null, 2))
        userInfo.avatar = findAvatarInObj(uRes)
      } catch (e) {}
    }

    if (!userInfo.avatar && typeof apiObj.getAvatarUrlProfile === 'function' && userInfo.userId !== 'Unknown') {
      try {
        const avtRes = await apiObj.getAvatarUrlProfile(userInfo.userId)
        console.log('👤 Raw getAvatarUrlProfile response:', JSON.stringify(avtRes, null, 2))
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
  const userId = await getCurrentUserId()
  
  let force = false
  try {
    const body = await request.json().catch(() => ({}))
    force = !!body.force
  } catch (e) {}

  const loginInProgress = loginInProgressMap.get(userId)
  if (loginInProgress && !force) {
    return NextResponse.json({
      success: false,
      message: 'Login already in progress',
      qrState: getQrState()
    })
  }

  try {
    loginInProgressMap.set(userId, true)

    // Try to load existing session from database
    let zaloApi = await getCurrentZaloApi()
    if (!zaloApi && !force) {
      zaloApi = await loadCurrentZaloSession()
    }

    if (zaloApi && !force) {
      const userInfo = await populateUserInfo(zaloApi)
      loginInProgressMap.set(userId, false)
      updateQrState({ status: 'success' })
      return NextResponse.json({
        success: true,
        userInfo,
        message: 'Đã tự động đăng nhập từ phiên làm việc trước!'
      })
    }

    console.log('📱 Starting login process & generating web QR code...')
    resetQrState()
    updateQrState({ status: 'generating' })

    const zalo = new Zalo({ selfListen: true, imageMetadataGetter })

    zaloApi = await zalo.loginQR(
      {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
      },
      (event: any) => {
        console.log('📱 Login QR Event type:', event.type)
        if (event.type === LoginQRCallbackEventType.QRCodeGenerated || event.type === 0) {
          const rawImage = event.data?.image || ''
          const qrDataUrl = rawImage.startsWith('data:')
            ? rawImage
            : `data:image/png;base64,${rawImage}`

          console.log('📸 Generated QR Code image for web view!')
          updateQrState({
            status: 'qr_ready',
            qrImage: qrDataUrl,
            error: null,
          })

          try {
            if (typeof event.actions?.saveToFile === 'function') {
              event.actions.saveToFile('qr.png')
            }
          } catch (e) {}
        } else if (event.type === LoginQRCallbackEventType.QRCodeScanned || event.type === 2) {
          console.log('👤 QR Code Scanned by:', event.data?.display_name)
          updateQrState({
            status: 'scanned',
            scannedUser: {
              name: event.data?.display_name || 'Người dùng',
              avatar: event.data?.avatar || '',
            },
          })
        } else if (event.type === LoginQRCallbackEventType.QRCodeExpired || event.type === 1) {
          console.log('⚠️ QR Code Expired')
          updateQrState({
            status: 'expired',
            error: 'Mã QR đã hết hạn. Vui lòng tạo mã mới!',
          })
        } else if (event.type === LoginQRCallbackEventType.QRCodeDeclined || event.type === 3) {
          console.log('❌ QR Code Declined on phone')
          updateQrState({
            status: 'declined',
            error: 'Đăng nhập đã bị từ chối trên điện thoại!',
          })
        }
      }
    )

    if (!zaloApi) {
      throw new Error('Đăng nhập không thành công (zaloApi null)')
    }

    await setCurrentZaloApi(zaloApi)
    
    console.log('✅ Web QR Login successful!')
    updateQrState({ status: 'success' })
    loginInProgressMap.set(userId, false)

    let userInfo = await getCurrentZaloUserInfo()
    try {
      userInfo = await populateUserInfo(zaloApi)
    } catch (infoErr) {
      console.error('Error populating user info:', infoErr)
    }
    
    return NextResponse.json({ 
      success: true,
      userInfo,
      message: 'Đăng nhập thành công!'
    })
  } catch (error: any) {
    loginInProgressMap.set(userId, false)
    console.error('Login error:', error)
    updateQrState({
      status: 'error',
      error: error.message || 'Thất bại khi đăng nhập'
    })
    return NextResponse.json({ 
      success: false,
      error: error.message || 'Login failed',
      qrState: getQrState()
    }, { status: 500 })
  }
}

export async function GET() {
  let zaloApi = await getCurrentZaloApi()
  if (!zaloApi) {
    zaloApi = await loadCurrentZaloSession()
  }
  
  if (!zaloApi) {
    return NextResponse.json({
      loggedIn: false,
      qrState: getQrState()
    })
  }

  let userInfo = await getCurrentZaloUserInfo()
  if (!userInfo || userInfo.displayName === 'User') {
    try {
      userInfo = await populateUserInfo(zaloApi)
    } catch (e) {}
  }

  return NextResponse.json({ 
    loggedIn: true,
    userInfo,
    qrState: getQrState()
  })
}
