import { NextResponse } from 'next/server'
import { getBotSettings, updateBotSettings } from '@/lib/bot-settings'

export async function GET() {
  return NextResponse.json(getBotSettings())
}

export async function POST(request: Request) {
  try {
    const updates = await request.json()
    const updatedSettings = updateBotSettings(updates)
    console.log('⚙️ Updated bot settings:', updatedSettings)
    return NextResponse.json({ success: true, settings: updatedSettings })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}


