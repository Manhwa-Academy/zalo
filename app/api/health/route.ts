import { NextResponse } from 'next/server'
import { getZaloApi } from '@/lib/zalo-instance'
import { getZaloUserInfo } from '@/lib/zalo-instance'
import { getBotSettings } from '@/lib/bot-settings'

export const dynamic = 'force-dynamic'

/**
 * Health check endpoint for Railway.
 * Railway pings this periodically to ensure the app is alive.
 */
export async function GET() {
  const zaloApi = getZaloApi()
  const userInfo = getZaloUserInfo()
  const settings = getBotSettings()

  const isLoggedIn = !!zaloApi
  const listenerActive = !!(zaloApi?.listener)
  const botEnabled = settings?.enabled ?? false

  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    zalo: {
      loggedIn: isLoggedIn,
      listenerActive,
      botEnabled,
      user: isLoggedIn ? userInfo?.displayName || 'Unknown' : null,
    },
  })
}
