/**
 * Database operations for Zalo messages
 * Replaces .zalo-messages.json file system storage
 */

import { db } from './db'

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
  try {
    const metadata = {
      avatar: message.avatar,
      quote: message.quote
    }

    await db.query(`
      INSERT INTO zalo_messages (
        user_id, msg_id, cli_msg_id, thread_id, content,
        message_type, sender_id, sender_name, is_self,
        timestamp, replied, is_undo, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      ON CONFLICT (user_id, thread_id, msg_id) DO UPDATE SET
        content = EXCLUDED.content,
        replied = EXCLUDED.replied,
        is_undo = EXCLUDED.is_undo,
        metadata = EXCLUDED.metadata
    `, [
      userId,
      message.msgId || null,
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
  if (messages.length === 0) return

  try {
    // Use transaction for better performance
    await db.query('BEGIN')

    for (const message of messages) {
      await saveMessage(userId, message)
    }

    await db.query('COMMIT')
  } catch (error) {
    await db.query('ROLLBACK')
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
  try {
    const result = await db.query(`
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
  try {
    const result = await db.query(`
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
  try {
    await db.query(`
      UPDATE zalo_messages
      SET replied = true
      WHERE user_id = $1 AND msg_id = $2
    `, [userId, msgId])
  } catch (error) {
    console.error('❌ Error marking message as replied:', error)
  }
}

/**
 * Mark message as undone/recalled
 */
export async function markMessageUndone(userId: string, msgId: string): Promise<void> {
  try {
    await db.query(`
      UPDATE zalo_messages
      SET is_undo = true
      WHERE user_id = $1 AND msg_id = $2
    `, [userId, msgId])
  } catch (error) {
    console.error('❌ Error marking message as undone:', error)
  }
}

/**
 * Delete old messages (cleanup)
 */
export async function deleteOldMessages(userId: string, daysOld: number = 30): Promise<number> {
  try {
    const result = await db.query(`
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
  try {
    const query = threadId
      ? 'SELECT COUNT(*) FROM zalo_messages WHERE user_id = $1 AND thread_id = $2'
      : 'SELECT COUNT(*) FROM zalo_messages WHERE user_id = $1'
    
    const params = threadId ? [userId, threadId] : [userId]
    const result = await db.query(query, params)
    
    return parseInt(result.rows[0].count) || 0
  } catch (error) {
    console.error('❌ Error counting messages:', error)
    return 0
  }
}
