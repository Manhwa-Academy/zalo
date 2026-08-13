import { NextResponse } from 'next/server'
import { getStatsData, recordStatMessage, resetStatsData } from '@/lib/bot-stats'

export async function GET() {
  return NextResponse.json(getStatsData())
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
      resetStatsData()
    }
    
    return NextResponse.json({ success: true, stats: getStatsData() })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
