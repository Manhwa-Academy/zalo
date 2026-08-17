import { NextRequest, NextResponse } from 'next/server'
import { serveMediaFile } from '@/lib/download-and-cache-media'

/**
 * GET /api/media/[filename]
 * Serve cached media files
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const { filename } = params

    if (!filename) {
      return NextResponse.json({ error: 'Filename required' }, { status: 400 })
    }

    const result = serveMediaFile(filename)

    if (!result) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Convert Buffer to ArrayBuffer for NextResponse
    const arrayBuffer = result.buffer.buffer.slice(
      result.buffer.byteOffset,
      result.buffer.byteOffset + result.buffer.byteLength
    )

    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': result.contentType,
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      },
    })
  } catch (error: any) {
    console.error('❌ [Media API] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
