import { NextResponse } from 'next/server'
import fs from 'fs'
import { dataFilePath } from '@/lib/data-dir'

const SESSION_FILE = dataFilePath('.zalo-session.json')

// Save session to file
export async function POST(request: Request) {
  try {
    const sessionData = await request.json()
    
    fs.writeFileSync(SESSION_FILE, JSON.stringify(sessionData, null, 2))
    
    return NextResponse.json({ success: true, message: 'Session saved' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Load session from file
export async function GET() {
  try {
    if (fs.existsSync(SESSION_FILE)) {
      const data = fs.readFileSync(SESSION_FILE, 'utf-8')
      const sessionData = JSON.parse(data)
      
      return NextResponse.json({ 
        success: true, 
        session: sessionData 
      })
    }
    
    return NextResponse.json({ 
      success: false, 
      message: 'No session found' 
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Delete session
export async function DELETE() {
  try {
    if (fs.existsSync(SESSION_FILE)) {
      fs.unlinkSync(SESSION_FILE)
    }
    
    return NextResponse.json({ success: true, message: 'Session deleted' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
