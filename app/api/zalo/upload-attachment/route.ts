import { NextResponse } from 'next/server'
import { getCurrentZaloApi } from '@/lib/multi-user-zalo'
import fs from 'fs'
import path from 'path'
import os from 'os'

/**
 * POST - Upload file attachment
 * API: uploadAttachment(source: string | string[], threadId, type?)
 * Returns: UploadAttachmentResponse with URLs (normalUrl/hdUrl for images, fileUrl for others)
 */
export async function POST(request: Request) {
  try {
    const zaloApi = await getCurrentZaloApi()
    if (!zaloApi) {
      return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const threadId = formData.get('threadId') as string
    const threadType = Number(formData.get('threadType') || 0)
    
    if (!file || !threadId) {
      return NextResponse.json({ 
        error: 'Missing file or threadId' 
      }, { status: 400 })
    }

    console.log('📎 [Upload Attachment] Uploading:', { 
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      threadId,
      threadType
    })

    // Save file to temp
    const tempDir = os.tmpdir()
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const filePath = path.join(tempDir, `zalo_attachment_${Date.now()}_${safeName}`)
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    fs.writeFileSync(filePath, buffer)

    console.log('💾 [Upload Attachment] Saved to temp:', filePath)

    // Upload attachment with threadId and threadType
    const result = await zaloApi.uploadAttachment(filePath, threadId, threadType)
    
    console.log('✅ [Upload Attachment] Result:', result)

    // Extract URLs from result
    let urls: string[] = []
    if (Array.isArray(result)) {
      urls = result.map(item => 
        item.normalUrl || item.hdUrl || item.fileUrl || ''
      ).filter(Boolean)
    } else {
      const url = result.normalUrl || result.hdUrl || result.fileUrl
      if (url) urls.push(url)
    }

    // Clean up temp file
    try {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
    } catch (e) {
      console.warn('Failed to delete temp file:', e)
    }

    return NextResponse.json({ 
      success: true,
      result,
      urls,
      fileName: file.name,
      fileSize: file.size
    })
  } catch (error: any) {
    console.error('❌ [Upload Attachment] Error:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to upload attachment' 
    }, { status: 500 })
  }
}
