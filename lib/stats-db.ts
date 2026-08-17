/**
 * Database operations for Zalo stats
 * Replaces .zalo-stats.json file system storage
 */

import pool from './postgres'

export interface ZaloStats {
  totalReceived: number
  totalSent: number
  totalAutoReplied: number
  byThread?: Record<string, {
    received: number
    sent: number
    autoReplied: number
    name?: string
  }>
}

/**
 * Get overall stats for a user
 */
export async function getOverallStats(userId: string): Promise<ZaloStats> {
  if (!pool) {
    return {
      totalReceived: 0,
      totalSent: 0,
      totalAutoReplied: 0
    }
  }

  try {
    // Get overall stats (thread_id = NULL)
    const overallResult = await pool.query(`
      SELECT 
        total_received as "totalReceived",
        total_sent as "totalSent",
        total_auto_replied as "totalAutoReplied"
      FROM zalo_stats
      WHERE user_id = $1 AND thread_id IS NULL AND stats_date = CURRENT_DATE
    `, [userId])

    let overall = {
      totalReceived: 0,
      totalSent: 0,
      totalAutoReplied: 0
    }

    if (overallResult.rows.length > 0) {
      overall = overallResult.rows[0]
    }

    // Get per-thread stats
    const threadsResult = await pool.query(`
      SELECT 
        thread_id as "threadId",
        thread_name as "threadName",
        total_received as "received",
        total_sent as "sent",
        total_auto_replied as "autoReplied"
      FROM zalo_stats
      WHERE user_id = $1 AND thread_id IS NOT NULL
      ORDER BY total_received DESC
    `, [userId])

    const byThread: Record<string, any> = {}
    for (const row of threadsResult.rows) {
      byThread[row.threadId] = {
        received: row.received || 0,
        sent: row.sent || 0,
        autoReplied: row.autoReplied || 0,
        name: row.threadName || undefined
      }
    }

    return {
      ...overall,
      byThread: Object.keys(byThread).length > 0 ? byThread : undefined
    }
  } catch (error) {
    console.error('❌ Error getting overall stats:', error)
    return {
      totalReceived: 0,
      totalSent: 0,
      totalAutoReplied: 0
    }
  }
}

/**
 * Increment overall received count
 */
export async function incrementReceived(userId: string): Promise<void> {
  if (!pool) return

  try {
    await pool.query(`
      INSERT INTO zalo_stats (
        user_id, thread_id, stats_date,
        total_received, received_today
      ) VALUES ($1, NULL, CURRENT_DATE, 1, 1)
      ON CONFLICT (user_id, thread_id, stats_date)
      DO UPDATE SET
        total_received = zalo_stats.total_received + 1,
        received_today = zalo_stats.received_today + 1,
        updated_at = CURRENT_TIMESTAMP
    `, [userId])
  } catch (error) {
    console.error('❌ Error incrementing received:', error)
  }
}

/**
 * Increment overall sent count
 */
export async function incrementSent(userId: string): Promise<void> {
  if (!pool) return

  try {
    await pool.query(`
      INSERT INTO zalo_stats (
        user_id, thread_id, stats_date,
        total_sent, sent_today
      ) VALUES ($1, NULL, CURRENT_DATE, 1, 1)
      ON CONFLICT (user_id, thread_id, stats_date)
      DO UPDATE SET
        total_sent = zalo_stats.total_sent + 1,
        sent_today = zalo_stats.sent_today + 1,
        updated_at = CURRENT_TIMESTAMP
    `, [userId])
  } catch (error) {
    console.error('❌ Error incrementing sent:', error)
  }
}

/**
 * Increment overall auto-replied count
 */
export async function incrementAutoReplied(userId: string): Promise<void> {
  if (!pool) return

  try {
    await pool.query(`
      INSERT INTO zalo_stats (
        user_id, thread_id, stats_date,
        total_auto_replied, auto_replied_today
      ) VALUES ($1, NULL, CURRENT_DATE, 1, 1)
      ON CONFLICT (user_id, thread_id, stats_date)
      DO UPDATE SET
        total_auto_replied = zalo_stats.total_auto_replied + 1,
        auto_replied_today = zalo_stats.auto_replied_today + 1,
        updated_at = CURRENT_TIMESTAMP
    `, [userId])
  } catch (error) {
    console.error('❌ Error incrementing auto-replied:', error)
  }
}

/**
 * Increment thread-specific received count
 */
export async function incrementThreadReceived(
  userId: string,
  threadId: string,
  threadName?: string
): Promise<void> {
  if (!pool) return

  try {
    await pool.query(`
      INSERT INTO zalo_stats (
        user_id, thread_id, thread_name, stats_date,
        total_received, received_today
      ) VALUES ($1, $2, $3, CURRENT_DATE, 1, 1)
      ON CONFLICT (user_id, thread_id, stats_date)
      DO UPDATE SET
        total_received = zalo_stats.total_received + 1,
        received_today = zalo_stats.received_today + 1,
        thread_name = COALESCE($3, zalo_stats.thread_name),
        updated_at = CURRENT_TIMESTAMP
    `, [userId, threadId, threadName || null])
  } catch (error) {
    console.error('❌ Error incrementing thread received:', error)
  }
}

/**
 * Increment thread-specific sent count
 */
export async function incrementThreadSent(
  userId: string,
  threadId: string,
  threadName?: string
): Promise<void> {
  if (!pool) return

  try {
    await pool.query(`
      INSERT INTO zalo_stats (
        user_id, thread_id, thread_name, stats_date,
        total_sent, sent_today
      ) VALUES ($1, $2, $3, CURRENT_DATE, 1, 1)
      ON CONFLICT (user_id, thread_id, stats_date)
      DO UPDATE SET
        total_sent = zalo_stats.total_sent + 1,
        sent_today = zalo_stats.sent_today + 1,
        thread_name = COALESCE($3, zalo_stats.thread_name),
        updated_at = CURRENT_TIMESTAMP
    `, [userId, threadId, threadName || null])
  } catch (error) {
    console.error('❌ Error incrementing thread sent:', error)
  }
}

/**
 * Increment thread-specific auto-replied count
 */
export async function incrementThreadAutoReplied(
  userId: string,
  threadId: string,
  threadName?: string
): Promise<void> {
  if (!pool) return

  try {
    await pool.query(`
      INSERT INTO zalo_stats (
        user_id, thread_id, thread_name, stats_date,
        total_auto_replied, auto_replied_today
      ) VALUES ($1, $2, $3, CURRENT_DATE, 1, 1)
      ON CONFLICT (user_id, thread_id, stats_date)
      DO UPDATE SET
        total_auto_replied = zalo_stats.total_auto_replied + 1,
        auto_replied_today = zalo_stats.auto_replied_today + 1,
        thread_name = COALESCE($3, zalo_stats.thread_name),
        updated_at = CURRENT_TIMESTAMP
    `, [userId, threadId, threadName || null])
  } catch (error) {
    console.error('❌ Error incrementing thread auto-replied:', error)
  }
}

/**
 * Get stats for a specific thread
 */
export async function getThreadStats(userId: string, threadId: string) {
  if (!pool) {
    return {
      received: 0,
      sent: 0,
      autoReplied: 0
    }
  }

  try {
    const result = await pool.query(`
      SELECT 
        total_received as "received",
        total_sent as "sent",
        total_auto_replied as "autoReplied",
        thread_name as "name"
      FROM zalo_stats
      WHERE user_id = $1 AND thread_id = $2
      ORDER BY stats_date DESC
      LIMIT 1
    `, [userId, threadId])

    if (result.rows.length > 0) {
      return result.rows[0]
    }

    return {
      received: 0,
      sent: 0,
      autoReplied: 0,
      name: undefined
    }
  } catch (error) {
    console.error('❌ Error getting thread stats:', error)
    return {
      received: 0,
      sent: 0,
      autoReplied: 0
    }
  }
}

/**
 * Reset stats for a user
 */
export async function resetStats(userId: string): Promise<void> {
  if (!pool) return

  try {
    await pool.query(`
      DELETE FROM zalo_stats WHERE user_id = $1
    `, [userId])
  } catch (error) {
    console.error('❌ Error resetting stats:', error)
  }
}
