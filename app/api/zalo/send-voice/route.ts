import { NextResponse } from 'next/server'
import { getCurrentZaloApi } from '@/lib/multi-user-zalo'
import fs from 'fs'
import path from 'path'
import os from 'os'

/**
 * POST - Gửi tin nhắn thoại (voice message)
 * API: sendVoice(options: { voiceUrl, ttl? }, threadId, type?)
 * Pattern: Upload file first -> get voiceUrl -> send with voiceUrl
 */
export async function POST(request: Request) {
  try {
    const zaloApi = await getCurrentZaloApi()
    if (!zaloApi) {
      return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
    }

    const formData = await request.formData()
    const threadId = formData.get('threadId') as string
    const threadType = Number(formData.get('threadType') || 0)
    const file = formData.get('audio') as File | null
    const ttl = Number(formData.get('ttl') || 0) // Time to live, default 0 (unlimited)
    
    if (!threadId || !file) {
      return NextResponse.json({ 
        error: 'Missing threadId or audio file' 
      }, { status: 400 })
    }

    console.log('🎤 [Send Voice] Step 1: Uploading voice file:', { 
      threadId, 
      threadType, 
      fileName: file.name,
      fileSize: file.size,
      ttl
    })

    // Save audio to temp file
    const tempDir = os.tmpdir()
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const filePath = path.join(tempDir, `zalo_voice_${Date.now()}_${safeName}`)
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    fs.writeFileSync(filePath, buffer)

    console.log('💾 [Send Voice] Saved to temp:', filePath)

    // Step 1: Upload file to get voiceUrl
    const uploadResult = await zaloApi.uploadAttachment(filePath, threadId, threadType)
    console.log('📤 [Send Voice] Upload result:', uploadResult)

    // Extract voiceUrl from upload result
    let voiceUrl: string
    if (Array.isArray(uploadResult)) {
      voiceUrl = uploadResult[0]?.fileUrl || uploadResult[0]?.normalUrl
    } else {
      voiceUrl = uploadResult.fileUrl || uploadResult.normalUrl
    }

    if (!voiceUrl) {
      throw new Error('Failed to get voiceUrl from upload result')
    }

    console.log('🎤 [Send Voice] Step 2: Sending voice message with URL:', voiceUrl)

    // Step 2: Send voice message with voiceUrl
    const options = {
      voiceUrl,
      ttl
    }
    const result = await zaloApi.sendVoice(options, threadId, threadType)
    
    console.log('✅ [Send Voice] Result:', result)

    // Clean up temp file
    try {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
    } catch (e) {
      console.warn('Failed to delete temp voice file:', e)
    }

    return NextResponse.json({ 
      success: true,
      result,
      voiceUrl
    })
  } catch (error: any) {
    console.error('❌ [Send Voice] Error:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to send voice message' 
    }, { status: 500 })
  }
}
