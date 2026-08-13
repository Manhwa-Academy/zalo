import fs from 'fs'
import path from 'path'

export interface BotSettings {
  enabled: boolean
  autoReplyMessage: string
  replyScope: 'all' | 'user_only' | 'group_only' | 'whitelist'
  whitelist: string[]
  blacklist: string[]
}

const SETTINGS_FILE = path.join(process.cwd(), '.zalo-settings.json')

const DEFAULT_SETTINGS: BotSettings = {
  enabled: false,
  autoReplyMessage: 'Xin chào! Tôi đang bận, sẽ phản hồi bạn sớm nhất có thể. 🙏',
  replyScope: 'all',
  whitelist: [],
  blacklist: [],
}

export function getBotSettings(): BotSettings {
  if (!(globalThis as any).__zaloBotSettings__) {
    let settings = { ...DEFAULT_SETTINGS }
    try {
      if (fs.existsSync(SETTINGS_FILE)) {
        const data = fs.readFileSync(SETTINGS_FILE, 'utf-8')
        settings = { ...DEFAULT_SETTINGS, ...JSON.parse(data) }
      }
    } catch (e) {
      console.error('Failed to load bot settings from file:', e)
    }
    ;(globalThis as any).__zaloBotSettings__ = settings
  }
  return (globalThis as any).__zaloBotSettings__
}

export function updateBotSettings(updates: Partial<BotSettings>): BotSettings {
  const current = getBotSettings()
  const updated = { ...current, ...updates }
  ;(globalThis as any).__zaloBotSettings__ = updated
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(updated, null, 2))
  } catch (e) {
    console.error('Failed to save bot settings to file:', e)
  }
  return updated
}
