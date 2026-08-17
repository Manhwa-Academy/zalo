import { NextResponse } from 'next/server'
import pool from '@/lib/postgres'
import { getCurrentUserId } from '@/lib/multi-user-zalo'

export const dynamic = 'force-dynamic'

/**
 * POST /api/zalo/search-messages
 * Search messages using PostgreSQL Full-Text Search
 */
export async function POST(req: Request) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { threadId, query } = await req.json()

    if (!threadId || !query) {
      return NextResponse.json({ error: 'Missing threadId or query' }, { status: 400 })
    }

    console.log('🔍 [Search Messages] userId:', userId, 'threadId:', threadId, 'query:', query)

    if (!pool) {
      console.warn('⚠️ Database pool not available')
      return NextResponse.json({ success: false, messages: [], count: 0 })
    }

    // Use PostgreSQL Full-Text Search
    const result = await pool.query(
      `
      SELECT 
        id,
        msg_id,
        cli_msg_id,
        thread_id,
        content,
        message_type,
        sender_id,
        sender_name,
        is_self,
        timestamp,
        replied,
        is_undo,
        metadata,
        ts_rank(search_vector, plainto_tsquery('simple', $3)) AS rank
      FROM zalo_messages
      WHERE 
        user_id = $1
        AND thread_id = $2
        AND search_vector @@ plainto_tsquery('simple', $3)
        AND message_type NOT IN ('image', 'file', 'sticker', 'link')
        AND is_undo = false
      ORDER BY timestamp ASC
      LIMIT 1000
      `,
      [userId, threadId, query]
    )

    const messages = result.rows.map((row) => ({
      id: row.id,
      msgId: row.msg_id,
      cliMsgId: row.cli_msg_id,
      threadId: row.thread_id,
      content: row.content,
      type: row.message_type,
      from: row.sender_id,
      fromName: row.sender_name,
      isSelf: row.is_self,
      timestamp: row.timestamp ? new Date(Number(row.timestamp)).toISOString() : new Date().toISOString(),
      replied: row.replied,
      isUndo: row.is_undo,
      ...row.metadata,
      rank: row.rank,
    }))

    console.log('🔍 [Search Messages] Found:', messages.length, 'results')

    return NextResponse.json({
      success: true,
      messages,
      count: messages.length,
    })
  } catch (error) {
    console.error('❌ [Search Messages] Error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to search messages', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    )
  }
}
