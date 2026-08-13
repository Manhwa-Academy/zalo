import { attachListenerToApi } from './zalo-listener-manager'

declare global {
  var __zaloApiInstance__: any
  var __zaloUserInfo__: any
}

export function setZaloApi(api: any) {
  ;(globalThis as any).__zaloApiInstance__ = api
  console.log('✅ Global zaloApi set:', !!api)
  if (api) {
    attachListenerToApi(api)
  }
}

export function getZaloApi() {
  const api = (globalThis as any).__zaloApiInstance__ || null
  return api
}

export function setZaloUserInfo(userInfo: any) {
  ;(globalThis as any).__zaloUserInfo__ = userInfo
}

export function getZaloUserInfo() {
  return (globalThis as any).__zaloUserInfo__ || {
    displayName: 'User',
    phoneNumber: 'N/A',
    userId: 'Unknown',
  }
}

export function clearZaloApi() {
  ;(globalThis as any).__zaloApiInstance__ = null
  ;(globalThis as any).__zaloUserInfo__ = null
  console.log('🗑️ Global zaloApi cleared')
}
