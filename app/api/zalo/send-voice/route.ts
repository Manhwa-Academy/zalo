import { NextRequest, NextResponse } from 'next/server'
import { getCurrentZaloApi } from '@/lib/multi-user-zalo'
import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File
    const threadId = formData.get('threadId') as string
    const threadType = parseInt(formData.get('threadType') as string) || 0

    if (!audioFile) {
      return NextResponse.json({ success: false, error: 'No audio file provided' }, { status: 400 })
    }

    if (!threadId) {
      return NextResponse.json({ success: false, error: 'Thread ID is required' }, { status: 400 })
    }

    const api = await getCurrentZaloApi()
    if (!api) {
      return NextResponse.json({ success: false, error: 'Zalo client not available' }, { status: 401 })
    }

    // Convert File to Buffer
    const arrayBuffer = await audioFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    console.log('📤 Uploading voice to Cloudinary:', {
      fileName: audioFile.name,
      fileSize: audioFile.size,
      mimeType: audioFile.type
    })

    // Upload to Cloudinary
    const uploadResult = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'video', // 'video' resource type supports audio files
          folder: 'zalo-voice-messages',
          public_id: `voice_${Date.now()}`,
          format: 'mp3', // Convert to MP3 for better compatibility
          quality: 'auto'
        },
        (error, result) => {
          if (error) reject(error)
          else resolve(result)
        }
      )
      
      uploadStream.end(buffer)
    })

    const voiceUrl = uploadResult.secure_url
    
    console.log('✅ Voice uploaded to Cloudinary:', {
      url: voiceUrl,
      duration: uploadResult.duration,
      format: uploadResult.format
    })

    console.log('📤 Sending voice message via Zalo:', {
      threadId,
      threadType,
      voiceUrl
    })

    // Send voice message using zca-js API
    const result = await api.sendVoice(
      {
        voiceUrl: voiceUrl,
        ttl: 0 // 0 = vô hạn
      },
      threadId,
      threadType
    )

    console.log('✅ Voice message sent:', result)

    // Save message to database with Cloudinary ID for cleanup later
    try {
      const { getCurrentUserId, getCurrentZaloUserInfo } = await import('@/lib/multi-user-zalo')
      const { saveMessage } = await import('@/lib/messages-db')
      const userId = await getCurrentUserId()
      const userInfo = await getCurrentZaloUserInfo()
      
      if (userId && userInfo) {
        await saveMessage(userId, {
          msgId: result.msgId,
          threadId: threadId,
          content: JSON.stringify({
            type: 'voice',
            voiceUrl: voiceUrl,
            cloudinaryId: uploadResult.public_id, // Save for cleanup
            duration: uploadResult.duration
          }),
          messageType: 'voice',
          senderId: userInfo.userId || '',
          senderName: userInfo.displayName || '',
          isSelf: true,
          timestamp: Date.now(),
          avatar: userInfo.avatar
        })
        console.log('💾 Saved voice message to database with Cloudinary ID')
      }
    } catch (dbError) {
      console.error('⚠️ Failed to save message to DB:', dbError)
      // Don't fail the request if DB save fails
    }

    return NextResponse.json({
      success: true,
      result: {
        msgId: result.msgId,
        voiceUrl: voiceUrl,
        cloudinaryId: uploadResult.public_id
      }
    })

  } catch (error: any) {
    console.error('❌ Error sending voice message:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to send voice message',
        details: error.toString()
      }, 
      { status: 500 }
    )
  }
}
