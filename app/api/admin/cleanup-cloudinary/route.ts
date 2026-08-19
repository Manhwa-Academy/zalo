import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'
import pool from '@/lib/postgres'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Admin endpoint to cleanup orphaned Cloudinary files
 * Deletes voice files that are older than X days or no longer in database
 */
export async function POST(request: NextRequest) {
  try {
    const { daysOld = 30, dryRun = true } = await request.json()

    console.log('🧹 Starting Cloudinary cleanup...', { daysOld, dryRun })

    // Get all voice files from Cloudinary
    const cloudinaryFiles: any[] = []
    let nextCursor: string | undefined = undefined

    do {
      const result = await cloudinary.api.resources({
        type: 'upload',
        resource_type: 'video',
        prefix: 'zalo-voice-messages/',
        max_results: 500,
        next_cursor: nextCursor
      })

      cloudinaryFiles.push(...result.resources)
      nextCursor = result.next_cursor
    } while (nextCursor)

    console.log(`📊 Found ${cloudinaryFiles.length} voice files in Cloudinary`)

    // Get all voice message IDs from database
    if (!pool) {
      return NextResponse.json(
        { success: false, error: 'Database not available' },
        { status: 500 }
      )
    }
    
    const dbResult = await pool.query(`
      SELECT content 
      FROM zalo_messages 
      WHERE message_type = 'voice'
      AND content LIKE '%cloudinaryId%'
    `)

    if (!dbResult) {
      return NextResponse.json(
        { success: false, error: 'Database query failed' },
        { status: 500 }
      )
    }

    const dbCloudinaryIds = new Set<string>()
    for (const row of dbResult.rows) {
      try {
        const content = typeof row.content === 'string' ? JSON.parse(row.content) : row.content
        if (content.cloudinaryId) {
          dbCloudinaryIds.add(content.cloudinaryId)
        }
      } catch (e) {
        // Skip invalid JSON
      }
    }

    console.log(`📊 Found ${dbCloudinaryIds.size} voice messages in database`)

    // Find orphaned files
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)

    const orphanedFiles: any[] = []
    const oldFiles: any[] = []

    for (const file of cloudinaryFiles) {
      const publicId = file.public_id
      const createdAt = new Date(file.created_at)
      const isOld = createdAt < cutoffDate
      const isOrphaned = !dbCloudinaryIds.has(publicId)

      if (isOrphaned || isOld) {
        if (isOrphaned) orphanedFiles.push(file)
        if (isOld) oldFiles.push(file)
      }
    }

    console.log(`🗑️ Found ${orphanedFiles.length} orphaned files`)
    console.log(`🗑️ Found ${oldFiles.length} old files (>${daysOld} days)`)

    // Combine and deduplicate
    const filesToDelete = Array.from(
      new Set([...orphanedFiles, ...oldFiles].map(f => f.public_id))
    )

    console.log(`🗑️ Total files to delete: ${filesToDelete.length}`)

    if (dryRun) {
      return NextResponse.json({
        success: true,
        dryRun: true,
        stats: {
          totalFiles: cloudinaryFiles.length,
          dbFiles: dbCloudinaryIds.size,
          orphanedFiles: orphanedFiles.length,
          oldFiles: oldFiles.length,
          toDelete: filesToDelete.length
        },
        filesToDelete: filesToDelete.slice(0, 20), // Preview first 20
        message: 'Dry run completed. Set dryRun=false to actually delete files.'
      })
    }

    // Actually delete files
    const deleted: string[] = []
    const failed: Array<{ id: string; error: string }> = []

    for (const publicId of filesToDelete) {
      try {
        const result = await cloudinary.uploader.destroy(publicId, {
          resource_type: 'video'
        })

        if (result.result === 'ok') {
          deleted.push(publicId)
          console.log(`✅ Deleted: ${publicId}`)
        } else {
          failed.push({ id: publicId, error: result.result })
          console.warn(`⚠️ Failed to delete: ${publicId} - ${result.result}`)
        }
      } catch (error: any) {
        failed.push({ id: publicId, error: error.message })
        console.error(`❌ Error deleting ${publicId}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      dryRun: false,
      stats: {
        totalFiles: cloudinaryFiles.length,
        dbFiles: dbCloudinaryIds.size,
        orphanedFiles: orphanedFiles.length,
        oldFiles: oldFiles.length,
        toDelete: filesToDelete.length,
        deleted: deleted.length,
        failed: failed.length
      },
      deleted,
      failed: failed.slice(0, 10), // Show first 10 failures
      message: `Cleanup completed. Deleted ${deleted.length} files.`
    })

  } catch (error: any) {
    console.error('❌ Error in Cloudinary cleanup:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to cleanup Cloudinary',
        details: error.toString()
      }, 
      { status: 500 }
    )
  }
}
