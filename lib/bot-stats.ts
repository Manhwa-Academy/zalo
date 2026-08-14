import fs from 'fs'
import path from 'path'

const STATS_FILE = path.join(process.cwd(), '.zalo-stats.json')

interface StatsStructure {
  totalMessages: number
  repliedMessages: number
  activeChats: string[]
}

function loadStats(): StatsStructure {
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

function saveStats() {
  try {
    const data = {
      totalMessages: currentStats.totalMessages,
      repliedMessages: currentStats.repliedMessages,
      activeChats: Array.from(currentStats.activeChats),
    }
    fs.writeFileSync(STATS_FILE, JSON.stringify(data, null, 2), 'utf-8')
  } catch (e) {}
}

const initialLoaded = loadStats()
const currentStats = {
  totalMessages: initialLoaded.totalMessages,
  repliedMessages: initialLoaded.repliedMessages,
  activeChats: new Set<string>(initialLoaded.activeChats),
}

export function recordStatMessage(autoReplied: boolean, threadId?: string) {
  currentStats.totalMessages++
  if (threadId) currentStats.activeChats.add(String(threadId))
  if (autoReplied) {
    currentStats.repliedMessages++
  }
  saveStats()
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
  saveStats()
}
