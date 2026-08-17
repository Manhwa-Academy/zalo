/**
 * Database operations for Zalo messages
 * Replaces .zalo-messages.json file system storage
 */

import pool from './postgres'

export interface ZaloMessage {
  id?: string
  msgId?: string
  cliMsgId?: string
  threadId: string
  content: any
  messageType?: string
  senderId?: string
  senderName?: string
  isSelf?: boolean
  timestamp?: number
  replied?: boolean
  isUndo?: boolean
  avatar?: string
  quote?: any
  from?: string
  fromName?: string
}

/**
 * Save a message to database
 */
export async function saveMessage(userId: string, message: ZaloMessage): Promise<void> {
  if (!pool) {
    console.warn('⚠️ Database pool not available, skipping message save')
    return
  }

  try {
    const metadata = {
      avatar: message.avatar,
      quote: message.quote
    }

    // Ensure msg_id is not null for ON CONFLICT to work
    // Use cliMsgId, or generate a unique ID based on thread + timestamp + content
    let msgId = message.msgId
    if (!msgId) {
      if (message.cliMsgId) {
        msgId = message.cliMsgId
      } else {
        // Generate unique ID: thread_timestamp_hash
        const contentHash = message.content?.toString().substring(0, 20) || ''
        msgId = `${message.threadId}_${message.timestamp || Date.now()}_${contentHash.replace(/[^a-zA-Z0-9]/g, '')}`
      }
    }

    await pool.query(`
      INSERT INTO zalo_messages (
        user_id, msg_id, cli_msg_id, thread_id, content,
        message_type, sender_id, sender_name, is_self,
        timestamp, replied, is_undo, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      ON CONFLICT (user_id, thread_id, msg_id) 
      WHERE msg_id IS NOT NULL
      DO UPDATE SET
        content = EXCLUDED.content,
        replied = EXCLUDED.replied,
        is_undo = EXCLUDED.is_undo,
        metadata = EXCLUDED.metadata
    `, [
      userId,
      msgId, // Always has a value now
      message.cliMsgId || null,
      message.threadId,
      typeof message.content === 'string' ? message.content : JSON.stringify(message.content),
      message.messageType || 'text',
      message.senderId || message.from || null,
      message.senderName || message.fromName || null,
      message.isSelf || false,
      message.timestamp || Date.now(),
      message.replied || false,
      message.isUndo || false,
      JSON.stringify(metadata)
    ])
  } catch (error) {
    console.error('❌ Error saving message to database:', error)
    throw error
  }
}

/**
 * Save multiple messages in batch
 */
export async function saveMessages(userId: string, messages: ZaloMessage[]): Promise<void> {
  if (!pool) {
    console.warn('⚠️ Database pool not available, skipping messages save')
    return
  }

  if (messages.length === 0) return

  try {
    // Use transaction for better performance
    await pool.query('BEGIN')

    for (const message of messages) {
      await saveMessage(userId, message)
    }

    await pool.query('COMMIT')
  } catch (error) {
    await pool.query('ROLLBACK')
    console.error('❌ Error saving messages batch:', error)
    throw error
  }
}

/**
 * Get messages for a specific thread
 */
export async function getThreadMessages(
  userId: string,
  threadId: string,
  limit: number = 100
): Promise<ZaloMessage[]> {
  if (!pool) {
    console.warn('⚠️ Database pool not available')
    return []
  }

  try {
    const result = await pool.query(`
      SELECT 
        id, msg_id as "msgId", cli_msg_id as "cliMsgId",
        thread_id as "threadId", content, message_type as "messageType",
        sender_id as "senderId", sender_name as "senderName",
        is_self as "isSelf", timestamp, replied, is_undo as "isUndo",
        metadata
      FROM zalo_messages
      WHERE user_id = $1 AND thread_id = $2
      ORDER BY timestamp DESC
      LIMIT $3
    `, [userId, threadId, limit])

    return result.rows.map((row: any) => ({
      id: row.id,
      msgId: row.msgId,
      cliMsgId: row.cliMsgId,
      threadId: row.threadId,
      content: row.content,
      messageType: row.messageType,
      from: row.senderId,
      fromName: row.senderName,
      isSelf: row.isSelf,
      timestamp: row.timestamp,
      replied: row.replied,
      isUndo: row.isUndo,
      avatar: row.metadata?.avatar,
      quote: row.metadata?.quote
    }))
  } catch (error) {
    console.error('❌ Error getting thread messages:', error)
    return []
  }
}

/**
 * Get all messages for a user
 */
export async function getAllMessages(userId: string, limit: number = 1000): Promise<ZaloMessage[]> {
  if (!pool) {
    console.warn('⚠️ Database pool not available')
    return []
  }

  try {
    const result = await pool.query(`
      SELECT 
        id, msg_id as "msgId", cli_msg_id as "cliMsgId",
        thread_id as "threadId", content, message_type as "messageType",
        sender_id as "senderId", sender_name as "senderName",
        is_self as "isSelf", timestamp, replied, is_undo as "isUndo",
        metadata
      FROM zalo_messages
      WHERE user_id = $1
      ORDER BY timestamp DESC
      LIMIT $2
    `, [userId, limit])

    return result.rows.map((row: any) => ({
      id: row.id,
      msgId: row.msgId,
      cliMsgId: row.cliMsgId,
      threadId: row.threadId,
      content: row.content,
      messageType: row.messageType,
      from: row.senderId,
      fromName: row.senderName,
      isSelf: row.isSelf,
      timestamp: row.timestamp,
      replied: row.replied,
      isUndo: row.isUndo,
      avatar: row.metadata?.avatar,
      quote: row.metadata?.quote
    }))
  } catch (error) {
    console.error('❌ Error getting all messages:', error)
    return []
  }
}

/**
 * Mark message as replied
 */
export async function markMessageReplied(userId: string, msgId: string): Promise<void> {
  if (!pool) return

  try {
    await pool.query(`
      UPDATE zalo_messages
      SET replied = true
      WHERE user_id = $1 AND msg_id = $2
    `, [userId, msgId])
  } catch (error) {
    console.error('❌ Error marking message as replied:', error)
  }
}

/**
 * Delete message when undone/recalled (instead of marking)
 */
export async function deleteMessageOnUndo(userId: string, msgId: string): Promise<void> {
  if (!pool) return

  try {
    await pool.query(`
      DELETE FROM zalo_messages
      WHERE user_id = $1 AND msg_id = $2
    `, [userId, msgId])
    
    console.log(`🗑️ [DB] Deleted undone message from database: ${msgId}`)
  } catch (error) {
    console.error('❌ Error deleting undone message:', error)
  }
}

/**
 * Delete old messages (cleanup)
 */
export async function deleteOldMessages(userId: string, daysOld: number = 30): Promise<number> {
  if (!pool) return 0

  try {
    const result = await pool.query(`
      DELETE FROM zalo_messages
      WHERE user_id = $1 
      AND created_at < NOW() - INTERVAL '${daysOld} days'
    `, [userId])

    return result.rowCount || 0
  } catch (error) {
    console.error('❌ Error deleting old messages:', error)
    return 0
  }
}

/**
 * Count messages
 */
export async function countMessages(userId: string, threadId?: string): Promise<number> {
  if (!pool) return 0

  try {
    const query = threadId
      ? 'SELECT COUNT(*) FROM zalo_messages WHERE user_id = $1 AND thread_id = $2'
      : 'SELECT COUNT(*) FROM zalo_messages WHERE user_id = $1'
    
    const params = threadId ? [userId, threadId] : [userId]
    const result = await pool.query(query, params)
    
    return parseInt(result.rows[0].count) || 0
  } catch (error) {
    console.error('❌ Error counting messages:', error)
    return 0
  }
}
