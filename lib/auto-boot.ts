import { Zalo } from 'zca-js'
import { setZaloApi, getZaloApi, setZaloUserInfo } from './zalo-instance'
import { attachListenerToApi } from './zalo-listener-manager'
import { imageMetadataGetter } from './image-metadata-getter'
import { dataFilePath } from './data-dir'
import fs from 'fs'

const SESSION_FILE = dataFilePath('.zalo-session.json')

/**
 * Auto-boot: Attempt to restore Zalo session and start the listener
 * automatically when the server process starts. This is critical for
 * Railway deployment where the bot must run 24/7 without a browser.
 */
async function autoBootZalo() {
  // Already logged in
  if (getZaloApi()) {
    console.log('✅ [AutoBoot] Zalo API already active, skipping')
    return
  }

  // No saved session
  if (!fs.existsSync(SESSION_FILE)) {
    console.log('⚠️ [AutoBoot] No saved session found. Please login via the web UI first.')
    return
  }

  try {
    console.log('🚀 [AutoBoot] Found saved session, attempting auto-login...')
    const sessionRaw = fs.readFileSync(SESSION_FILE, 'utf-8')
    const credentials = JSON.parse(sessionRaw)
    const zalo = new Zalo({ selfListen: true, imageMetadataGetter })
    const zaloApi = await zalo.login(credentials)

    console.log('✅ [AutoBoot] Auto-login successful!')
    setZaloApi(zaloApi) // This also calls attachListenerToApi internally

    // Populate user info
    try {
      let userInfo: any = {
        displayName: 'User',
        phoneNumber: 'N/A',
        userId: 'Unknown',
        avatar: '',
      }

      const apiObj = zaloApi as any
      if (typeof apiObj.getOwnId === 'function') {
        const ownId = apiObj.getOwnId()
        if (ownId) userInfo.userId = String(ownId)
      }

      if (typeof apiObj.fetchAccountInfo === 'function') {
        const accInfo = await apiObj.fetchAccountInfo()
        const profile = accInfo?.profile || accInfo?.data || accInfo
        if (profile) {
          userInfo.displayName = profile.displayName || profile.name || profile.zName || userInfo.displayName
          userInfo.userId = profile.userId || profile.uid || profile.zaloId || userInfo.userId
        }
      }

      setZaloUserInfo(userInfo)
      console.log(`✅ [AutoBoot] User info loaded: ${userInfo.displayName} (${userInfo.userId})`)
    } catch (e) {
      console.warn('⚠️ [AutoBoot] Could not fetch user info:', e)
    }

    // Ensure listener is running
    attachListenerToApi(zaloApi)
    console.log('🎧 [AutoBoot] Listener attached and running! Bot is now active 24/7.')
  } catch (err: any) {
    console.error('❌ [AutoBoot] Auto-login failed:', err.message || err)
    console.log('💡 [AutoBoot] Please login via the web UI to generate a new session.')
  }
}

// Flag to prevent multiple auto-boots
let autoBootStarted = false

export function startAutoBoot() {
  if (autoBootStarted) return
  autoBootStarted = true

  // Delay slightly to let Next.js finish initializing
  setTimeout(() => {
    console.log('🔄 [AutoBoot] Starting auto-boot process...')
    autoBootZalo().catch((err) => {
      console.error('❌ [AutoBoot] Unhandled error:', err)
    })
  }, 2000)
}

// Auto-execute on import (server-side only)
if (typeof window === 'undefined') {
  startAutoBoot()
}
