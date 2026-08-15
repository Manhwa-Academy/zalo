/**
 * AUTO-BOOT DISABLED FOR MULTI-USER
 * 
 * In multi-user architecture, each user logs in via QR code through the web UI.
 * Sessions are stored in PostgreSQL database per user.
 * No need for global auto-boot.
 */

export function startAutoBoot() {
  console.log('ℹ️ [AutoBoot] Disabled in multi-user mode. Users login via web UI.')
}

// No-op in multi-user mode
if (typeof window === 'undefined') {
  console.log('ℹ️ [AutoBoot] Multi-user mode - each user logs in separately')
}
