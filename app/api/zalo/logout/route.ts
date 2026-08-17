import { NextResponse } from 'next/server'
import { clearCurrentZaloApi } from '@/lib/multi-user-zalo'

export async function POST() {
  try {
    // Clear Zalo API from memory but KEEP session in database
    // This allows user to scan QR for new device while keeping old session
    await clearCurrentZaloApi(false) // false = don't delete from DB
    
    return NextResponse.json({ 
      success: true,
      message: 'Đã logout Zalo. Session cũ vẫn được giữ trong database.' 
    })
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message || 'Logout failed' 
    }, { status: 500 })
  }
}
