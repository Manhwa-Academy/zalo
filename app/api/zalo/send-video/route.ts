import { NextResponse } from 'next/server'
import { getCurrentZaloApi } from '@/lib/multi-user-zalo'
import fs from 'fs'
import path from 'path'
import os from 'os'

/**
 * POST - Gửi video
 * 
 * Note: zca-js API expects videoUrl and thumbnailUrl (URLs, not file paths)
 * So we need to upload the video first, then send with URLs
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
    const msg = formData.get('msg') as string | null
    const file = formData.get('video') as File | null
    
    if (!threadId || !file) {
      return NextResponse.json({ 
        error: 'Missing threadId or video file' 
      }, { status: 400 })
    }

    console.log('🎥 [Send Video] Step 1: Uploading video...', { 
      threadId, 
      threadType, 
      fileName: file.name,
      fileSize: file.size 
    })

    // Save video to temp file
    const tempDir = os.tmpdir()
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const filePath = path.join(tempDir, `zalo_video_${Date.now()}_${safeName}`)
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    fs.writeFileSync(filePath, buffer)

    console.log('💾 [Send Video] Step 2: Saved to temp:', filePath)

    // Upload attachment to get URL
    console.log('📤 [Send Video] Step 3: Uploading to Zalo...')
    const uploadResult = await zaloApi.uploadAttachment(filePath, threadId, threadType)
    
    console.log('✅ [Send Video] Step 4: Upload result:', uploadResult)

    // Extract URLs from upload result
    const videoData = Array.isArray(uploadResult) ? uploadResult[0] : uploadResult
    
    if (!videoData || videoData.fileType !== 'video') {
      throw new Error('Upload failed or invalid video data')
    }

    // Prepare video options for sendVideo
    const options = {
      msg: msg || undefined,
      videoUrl: videoData.fileUrl,
      thumbnailUrl: videoData.fileUrl, // Use same URL as thumbnail if no separate thumb
      duration: undefined, // Auto-detect
      width: undefined,
      height: undefined,
      ttl: undefined
    }

    console.log('📤 [Send Video] Step 5: Sending video message...')
    
    // Send video message
    const result = await zaloApi.sendVideo(options, threadId, threadType)
    
    console.log('✅ [Send Video] Step 6: Result:', result)

    // Clean up temp file
    try {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
    } catch (e) {
      console.warn('Failed to delete temp video:', e)
    }

    return NextResponse.json({ 
      success: true,
      msgId: result?.msgId,
      result 
    })
  } catch (error: any) {
    console.error('❌ [Send Video] Error:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to send video' 
    }, { status: 500 })
  }
}
