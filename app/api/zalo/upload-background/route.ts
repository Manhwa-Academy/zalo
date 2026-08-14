import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { updateBotSettings } from '@/lib/bot-settings'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const publicDir = path.join(process.cwd(), 'public')
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true })
    }

    const filePath = path.join(publicDir, 'custom-background.png')
    fs.writeFileSync(filePath, buffer)

    const bgUrl = `/custom-background.png?t=${Date.now()}`
    updateBotSettings({ chatBackground: bgUrl })

    return NextResponse.json({ success: true, bgUrl })
  } catch (error: any) {
    console.error('Failed to upload background:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
