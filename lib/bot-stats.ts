import fs from 'fs'
import { dataFilePath } from './data-dir'
import { getCurrentUserId } from './multi-user-zalo'
import pool from './postgres'

const STATS_FILE = dataFilePath('.zalo-stats.json')

interface StatsStructure {
  totalMessages: number
  repliedMessages: number
  activeChats: string[]
}

// Legacy file-based loading (for migration)
function loadStatsFromFile(): StatsStructure {
  try {
    if (fs.existsSync(STATS_FILE)) {
      const data = fs.readFileSync(STATS_FILE, 'utf-8')
      const parsed = JSON.parse(data)
      return {
        totalMessages: typeof parsed.totalMessages === 'number' ? parsed.totalMessages : 0,
        repliedMessages: typeof parsed.repliedMessages === 'number' ? parsed.repliedMessages : 0,
        activeChats: Array.isArray(parsed.activeChats) ? parsed.activeChats : [],
      }
    }
  } catch (e) {}
  return { totalMessages: 0, repliedMessages: 0, activeChats: [] }
}

// Load stats from database
async function loadStatsFromDB(): Promise<StatsStructure> {
  try {
    if (!pool) return { totalMessages: 0, repliedMessages: 0, activeChats: [] }
    
    const userId = await getCurrentUserId()
    const result = await pool.query(
      'SELECT total_received, total_sent FROM zalo_stats WHERE user_id = $1',
      [userId]
    )
    
    if (result.rows.length > 0) {
      const row = result.rows[0]
      return {
        totalMessages: row.total_received || 0,
        repliedMessages: row.total_sent || 0,
        activeChats: [], // Will count from zalo_messages
      }
    }
  } catch (e) {
    console.error('❌ [Stats] Load from DB failed:', e)
  }
  
  return { totalMessages: 0, repliedMessages: 0, activeChats: [] }
}

// Save stats to database
async function saveStatsToDB(totalReceived: number, totalSent: number) {
  try {
    if (!pool) return
    
    const userId = await getCurrentUserId()
    await pool.query(
      `INSERT INTO zalo_stats (user_id, total_received, total_sent)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id) 
       DO UPDATE SET 
         total_received = $2,
         total_sent = $3,
         updated_at = CURRENT_TIMESTAMP`,
      [userId, totalReceived, totalSent]
    )
  } catch (e) {
    console.error('❌ [Stats] Save to DB failed:', e)
  }
}

function saveStatsToFile() {
  try {
    const data = {
      totalMessages: currentStats.totalMessages,
      repliedMessages: currentStats.repliedMessages,
      activeChats: Array.from(currentStats.activeChats),
    }
    fs.writeFileSync(STATS_FILE, JSON.stringify(data, null, 2), 'utf-8')
  } catch (e) {}
}

const initialLoaded = loadStatsFromFile()
const currentStats = {
  totalMessages: initialLoaded.totalMessages,
  repliedMessages: initialLoaded.repliedMessages,
  activeChats: new Set<string>(initialLoaded.activeChats),
}

// Initialize from database on first import
loadStatsFromDB().then(dbStats => {
  if (dbStats.totalMessages > 0 || dbStats.repliedMessages > 0) {
    currentStats.totalMessages = dbStats.totalMessages
    currentStats.repliedMessages = dbStats.repliedMessages
    console.log('✅ [Stats] Loaded from database:', dbStats)
  }
}).catch(err => {
  console.error('❌ [Stats] Failed to load from database:', err)
})

export function recordStatMessage(autoReplied: boolean, threadId?: string) {
  currentStats.totalMessages++
  if (threadId) currentStats.activeChats.add(String(threadId))
  if (autoReplied) {
    currentStats.repliedMessages++
  }
  
  // Save to both file (legacy) and database
  saveStatsToFile()
  saveStatsToDB(currentStats.totalMessages, currentStats.repliedMessages)
}

export function getStatsData() {
  return {
    totalMessages: currentStats.totalMessages,
    repliedMessages: currentStats.repliedMessages,
    activeChats: currentStats.activeChats.size,
  }
}

export function resetStatsData() {
  currentStats.totalMessages = 0
  currentStats.repliedMessages = 0
  currentStats.activeChats.clear()
  
  // Reset both file and database
  saveStatsToFile()
  saveStatsToDB(0, 0)
}
