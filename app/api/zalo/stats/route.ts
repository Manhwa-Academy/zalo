import { NextResponse } from 'next/server'
import { getStatsData, recordStatMessage, resetStatsData } from '@/lib/bot-stats'

export const dynamic = 'force-dynamic'

export async function GET() {
  const stats = await getStatsData()
  return NextResponse.json(stats)
}

export async function POST(request: Request) {
  try {
    const { action, threadId } = await request.json()
    
    if (action === 'newMessage') {
      recordStatMessage(false, threadId)
    }
    
    if (action === 'replied') {
      recordStatMessage(true, threadId)
    }
    
    if (action === 'reset') {
      // Reset in-memory stats
      resetStatsData()
      
      // Reset database - delete stats for current user
      try {
        const { getCurrentUserId } = await import('@/lib/multi-user-zalo')
        const userId = await getCurrentUserId()
        
        if (userId) {
          const pool = (await import('@/lib/postgres')).default
          if (pool) {
            await pool.query('DELETE FROM zalo_stats WHERE user_id = $1', [userId])
            console.log('✅ [Stats] Deleted stats from database for user:', userId)
          }
        }
      } catch (error: any) {
        console.error('❌ [Stats] Failed to delete stats from database:', error)
      }
    }
    
    return NextResponse.json({ success: true, stats: await getStatsData() })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
