import { NextResponse } from 'next/server'
import { Zalo } from 'zca-js'
import { setZaloApi, getZaloApi, setZaloUserInfo, getZaloUserInfo } from '@/lib/zalo-instance'
import fs from 'fs'
import path from 'path'

const SESSION_FILE = path.join(process.cwd(), '.zalo-session.json')
let loginInProgress = false

function saveSessionFromApi(zaloApi: any) {
  try {
    const ctx = typeof zaloApi.getContext === 'function' ? zaloApi.getContext() : null
    if (ctx && ctx.cookie) {
      let cookieData = ctx.cookie
      if (typeof ctx.cookie.toJSON === 'function') {
        cookieData = ctx.cookie.toJSON()
      }
      const credentials = {
        cookie: cookieData,
        imei: ctx.imei,
        userAgent: ctx.userAgent,
        language: ctx.language || 'vi',
      }
      fs.writeFileSync(SESSION_FILE, JSON.stringify(credentials, null, 2))
      console.log('💾 Session saved to .zalo-session.json')
    }
  } catch (err) {
    console.error('Failed to save session:', err)
  }
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
  setZaloUserInfo(userInfo)
  return userInfo
}

async function loginFromSavedSession(): Promise<any> {
  if (!fs.existsSync(SESSION_FILE)) return null
  try {
    console.log('📂 Found saved session file, attempting auto-login...')
    const sessionRaw = fs.readFileSync(SESSION_FILE, 'utf-8')
    const credentials = JSON.parse(sessionRaw)
    const zalo = new Zalo({ selfListen: true })
    const zaloApi = await zalo.login(credentials)
    console.log('✅ Auto-login from session successful!')
    setZaloApi(zaloApi)
    await populateUserInfo(zaloApi)
    return zaloApi
  } catch (err: any) {
    console.error('❌ Auto-login from session failed:', err.message || err)
    try {
      if (fs.existsSync(SESSION_FILE)) fs.unlinkSync(SESSION_FILE)
    } catch (e) {}
    return null
  }
}

export async function POST() {
  if (loginInProgress) {
    return NextResponse.json({ error: 'Login already in progress' }, { status: 400 })
  }

  try {
    loginInProgress = true

    let zaloApi = getZaloApi()
    if (!zaloApi) {
      zaloApi = await loginFromSavedSession()
    }

    if (zaloApi) {
      const userInfo = await populateUserInfo(zaloApi)
      loginInProgress = false
      return NextResponse.json({
        success: true,
        userInfo,
        message: 'Đã tự động đăng nhập từ phiên làm việc trước!'
      })
    }

    console.log('📱 Starting login process...')
    console.log('⚠️  Please scan QR code in terminal!')
    
    const zalo = new Zalo({ selfListen: true })
    zaloApi = await zalo.loginQR()
    
    setZaloApi(zaloApi)
    saveSessionFromApi(zaloApi)
    
    console.log('✅ Login successful!')
    
    const userInfo = await populateUserInfo(zaloApi)
    
    console.log('👤 User Info:', userInfo)
    
    loginInProgress = false
    
    return NextResponse.json({ 
      success: true,
      userInfo,
      message: 'Đăng nhập thành công!'
    })
  } catch (error: any) {
    loginInProgress = false
    console.error('Login error:', error)
    return NextResponse.json({ 
      error: error.message || 'Login failed' 
    }, { status: 500 })
  }
}

export async function GET() {
  let zaloApi = getZaloApi()
  if (!zaloApi) {
    zaloApi = await loginFromSavedSession()
  }
  if (!zaloApi) {
    return NextResponse.json({ loggedIn: false })
  }
  const userInfo = await populateUserInfo(zaloApi)
  return NextResponse.json({ 
    loggedIn: true,
    userInfo
  })
}
