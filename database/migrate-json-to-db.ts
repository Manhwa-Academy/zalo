/**
 * Migrate data from JSON files to PostgreSQL
 * Run: npx ts-node database/migrate-json-to-db.ts
 */

import { promises as fs } from 'fs'
import path from 'path'
import { db } from '../lib/db'

const MESSAGES_FILE = path.join(process.cwd(), '.zalo-messages.json')
const STATS_FILE = path.join(process.cwd(), '.zalo-stats.json')

interface Message {
  id: string
  msgId?: string
  cliMsgId?: string
  threadId: string
  content: any
  from?: string
  fromName?: string
  isSelf?: boolean
  timestamp?: number
  replied?: boolean
  isUndo?: boolean
  avatar?: string
  quote?: any
}

interface Stats {
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

async function migrateMessages(userId: string) {
  console.log('🔄 Migrating messages from JSON to database...')
  
  try {
    // Check if file exists
    try {
      await fs.access(MESSAGES_FILE)
    } catch {
      console.log('⚠️  No messages file found, skipping...')
      return
    }

    // Read JSON file
    const rawData = await fs.readFile(MESSAGES_FILE, 'utf-8')
    const messages: Message[] = JSON.parse(rawData)
    
    console.log(`📥 Found ${messages.length} messages to migrate`)

    // Insert messages in batches
    let inserted = 0
    const batchSize = 100

    for (let i = 0; i < messages.length; i += batchSize) {
      const batch = messages.slice(i, i + batchSize)
      
      for (const msg of batch) {
        try {
          await db.query(`
            INSERT INTO zalo_messages (
              user_id, msg_id, cli_msg_id, thread_id, content,
              sender_id, sender_name, is_self, timestamp,
              replied, is_undo, metadata
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            ON CONFLICT DO NOTHING
          `, [
            userId,
            msg.msgId || null,
            msg.cliMsgId || null,
            msg.threadId,
            typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
            msg.from || null,
            msg.fromName || null,
            msg.isSelf || false,
            msg.timestamp || null,
            msg.replied || false,
            msg.isUndo || false,
            JSON.stringify({ avatar: msg.avatar, quote: msg.quote })
          ])
          inserted++
        } catch (err) {
          console.error(`❌ Failed to insert message ${msg.id}:`, err)
        }
      }
      
      console.log(`   Processed ${Math.min(i + batchSize, messages.length)}/${messages.length}`)
    }

    console.log(`✅ Migrated ${inserted} messages successfully`)

    // Create backup of JSON file
    const backupFile = `${MESSAGES_FILE}.backup-${Date.now()}`
    await fs.copyFile(MESSAGES_FILE, backupFile)
    console.log(`💾 Backup created: ${backupFile}`)

  } catch (error) {
    console.error('❌ Error migrating messages:', error)
    throw error
  }
}

async function migrateStats(userId: string) {
  console.log('🔄 Migrating stats from JSON to database...')
  
  try {
    // Check if file exists
    try {
      await fs.access(STATS_FILE)
    } catch {
      console.log('⚠️  No stats file found, skipping...')
      return
    }

    // Read JSON file
    const rawData = await fs.readFile(STATS_FILE, 'utf-8')
    const stats: Stats = JSON.parse(rawData)
    
    console.log('📊 Found stats:', stats)

    // Insert overall stats (thread_id = NULL)
    await db.query(`
      INSERT INTO zalo_stats (
        user_id, thread_id, stats_date,
        total_received, total_sent, total_auto_replied,
        received_today, sent_today, auto_replied_today
      ) VALUES ($1, NULL, CURRENT_DATE, $2, $3, $4, $2, $3, $4)
      ON CONFLICT (user_id, thread_id, stats_date) 
      DO UPDATE SET
        total_received = EXCLUDED.total_received,
        total_sent = EXCLUDED.total_sent,
        total_auto_replied = EXCLUDED.total_auto_replied,
        received_today = EXCLUDED.received_today,
        sent_today = EXCLUDED.sent_today,
        auto_replied_today = EXCLUDED.auto_replied_today,
        updated_at = CURRENT_TIMESTAMP
    `, [
      userId,
      stats.totalReceived || 0,
      stats.totalSent || 0,
      stats.totalAutoReplied || 0
    ])

    console.log('✅ Migrated overall stats')

    // Insert per-thread stats
    if (stats.byThread) {
      let threadCount = 0
      for (const [threadId, threadStats] of Object.entries(stats.byThread)) {
        try {
          await db.query(`
            INSERT INTO zalo_stats (
              user_id, thread_id, thread_name, stats_date,
              total_received, total_sent, total_auto_replied,
              received_today, sent_today, auto_replied_today
            ) VALUES ($1, $2, $3, CURRENT_DATE, $4, $5, $6, $4, $5, $6)
            ON CONFLICT (user_id, thread_id, stats_date)
            DO UPDATE SET
              total_received = EXCLUDED.total_received,
              total_sent = EXCLUDED.total_sent,
              total_auto_replied = EXCLUDED.total_auto_replied,
              thread_name = EXCLUDED.thread_name,
              updated_at = CURRENT_TIMESTAMP
          `, [
            userId,
            threadId,
            threadStats.name || null,
            threadStats.received || 0,
            threadStats.sent || 0,
            threadStats.autoReplied || 0
          ])
          threadCount++
        } catch (err) {
          console.error(`❌ Failed to insert stats for thread ${threadId}:`, err)
        }
      }
      console.log(`✅ Migrated ${threadCount} thread stats`)
    }

    // Create backup of JSON file
    const backupFile = `${STATS_FILE}.backup-${Date.now()}`
    await fs.copyFile(STATS_FILE, backupFile)
    console.log(`💾 Backup created: ${backupFile}`)

  } catch (error) {
    console.error('❌ Error migrating stats:', error)
    throw error
  }
}

async function main() {
  console.log('🚀 Starting migration from JSON files to PostgreSQL...\n')

  // Get user ID from database (use first user or prompt)
  const result = await db.query('SELECT id FROM users LIMIT 1')
  
  if (result.rows.length === 0) {
    console.error('❌ No users found in database. Please create a user first.')
    process.exit(1)
  }

  const userId = result.rows[0].id
  console.log(`👤 Using user ID: ${userId}\n`)

  // Run migrations
  await migrateMessages(userId)
  console.log('')
  await migrateStats(userId)
  
  console.log('\n✅ Migration completed successfully!')
  console.log('⚠️  JSON files have been backed up and can be safely deleted after verification.')
  
  process.exit(0)
}

main().catch((error) => {
  console.error('💥 Migration failed:', error)
  process.exit(1)
})
