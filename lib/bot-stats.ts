let stats = {
  totalMessages: 0,
  repliedMessages: 0,
  activeChats: new Set<string>(),
}

export function recordStatMessage(autoReplied: boolean, threadId?: string) {
  stats.totalMessages++
  if (threadId) stats.activeChats.add(String(threadId))
  if (autoReplied) {
    stats.repliedMessages++
  }
}

export function getStatsData() {
  return {
    totalMessages: stats.totalMessages,
    repliedMessages: stats.repliedMessages,
    activeChats: stats.activeChats.size,
  }
}

export function resetStatsData() {
  stats = {
    totalMessages: 0,
    repliedMessages: 0,
    activeChats: new Set<string>(),
  }
}
