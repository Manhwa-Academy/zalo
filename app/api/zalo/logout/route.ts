import { NextResponse } from 'next/server'
import { getZaloApi, clearZaloApi } from '@/lib/zalo-instance'
import fs from 'fs'
import path from 'path'

const SESSION_FILE = path.join(process.cwd(), '.zalo-session.json')

export async function POST() {
  try {
    const zaloApi = getZaloApi()
    
    if (zaloApi && zaloApi.listener) {
      try {
        zaloApi.listener.stop()
      } catch (e) {}
    }
    
    clearZaloApi()
    
    if (fs.existsSync(SESSION_FILE)) {
      try {
        fs.unlinkSync(SESSION_FILE)
      } catch (e) {}
    }
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message || 'Logout failed' 
    }, { status: 500 })
  }
}

