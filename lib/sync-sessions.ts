/**
 * Sync messages across multiple sessions of the same Zalo account
 * This solves the problem where the same user logs in from multiple devices
 * but messages don't sync between them
 */

import pool from './postgres'

/**
 * Get all user_ids (sessions) for a given Zalo user ID
 */
export async function getAllSessionsForZaloUser(zaloUserId: string): Promise<string[]> {
  if (!pool) return []
  
  try {
    // Find all sessions that have the same Zalo user ID in their user_info
    const result = await pool.query(`
      SELECT DISTINCT u.id as user_id
      FROM users u
      JOIN zalo_sessions zs ON zs.user_id = u.id
      WHERE zs.user_info->>'userId' = $1
      ORDER BY u.last_active DESC
    `, [zaloUserId])
    
    return result.rows.map(r => r.user_id)
  } catch (error) {
    console.error('❌ [Sync] Error getting sessions for Zalo user:', error)
    return []
  }
}

/**
 * Get messages from ALL sessions of the same Zalo user
 */
export async function getMessagesForZaloUser(
  zaloUserId: string,
  threadId: string,
  limit: number = 50
): Promise<any[]> {
  if (!pool) return []
  
  try {
    // Get all sessions for this Zalo user
    const sessions = await getAllSessionsForZaloUser(zaloUserId)
    
    if (sessions.length === 0) return []
    
    console.log(`📱 [Sync] Found ${sessions.length} sessions for Zalo user ${zaloUserId}`)
    
    // Query messages from ALL sessions, ordered by timestamp, deduplicated by msg_id
    const result = await pool.query(`
      SELECT DISTINCT ON (msg_id, cli_msg_id)
        id, user_id, msg_id, cli_msg_id, thread_id, content,
        message_type, sender_id, sender_name, is_self, timestamp,
        created_at, replied, is_undo, metadata
      FROM messages
      WHERE user_id = ANY($1)
        AND thread_id = $2
      ORDER BY msg_id DESC, cli_msg_id DESC, timestamp DESC
      LIMIT $3
    `, [sessions, threadId, limit])
    
    console.log(`✅ [Sync] Loaded ${result.rows.length} messages from ${sessions.length} sessions`)
    
    return result.rows
  } catch (error) {
    console.error('❌ [Sync] Error getting messages for Zalo user:', error)
    return []
  }
}

/**
 * Save message to ALL sessions of the same Zalo user
 * This ensures messages are synced across devices
 */
export async function saveMessageToAllSessions(
  zaloUserId: string,
  message: {
    msgId: string | number
    cliMsgId: string | number
    threadId: string
    content: any
    messageType: string
    senderId: string
    senderName: string
    isSelf: boolean
    timestamp: number
    replied?: boolean
    isUndo?: boolean
    avatar?: string
    quote?: any
  }
): Promise<void> {
  if (!pool) return
  
  try {
    // Get all sessions for this Zalo user
    const sessions = await getAllSessionsForZaloUser(zaloUserId)
    
    if (sessions.length === 0) {
      console.warn('⚠️ [Sync] No sessions found for Zalo user:', zaloUserId)
      return
    }
    
    console.log(`💾 [Sync] Saving message to ${sessions.length} sessions`)
    
    // Insert message for each session (with conflict handling)
    for (const sessionUserId of sessions) {
      try {
        await pool.query(`
          INSERT INTO messages (
            user_id, msg_id, cli_msg_id, thread_id, content,
            message_type, sender_id, sender_name, is_self, timestamp,
            replied, is_undo, metadata
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, to_timestamp($10 / 1000.0), $11, $12, $13)
          ON CONFLICT (user_id, msg_id) DO UPDATE SET
            content = EXCLUDED.content,
            is_undo = EXCLUDED.is_undo,
            metadata = EXCLUDED.metadata
        `, [
          sessionUserId,
          String(message.msgId),
          String(message.cliMsgId),
          message.threadId,
          typeof message.content === 'object' ? JSON.stringify(message.content) : message.content,
          message.messageType,
          message.senderId,
          message.senderName,
          message.isSelf,
          message.timestamp,
          message.replied || false,
          message.isUndo || false,
          JSON.stringify({
            avatar: message.avatar || '',
            quote: message.quote || null
          })
        ])
      } catch (err: any) {
        // Ignore duplicate key errors
        if (err.code !== '23505') {
          console.error(`❌ [Sync] Error saving to session ${sessionUserId}:`, err.message)
        }
      }
    }
    
    console.log(`✅ [Sync] Message saved to all sessions`)
  } catch (error) {
    console.error('❌ [Sync] Error saving message to all sessions:', error)
  }
}
