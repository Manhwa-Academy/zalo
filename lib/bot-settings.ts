import fs from 'fs'
import { dataFilePath } from './data-dir'

export interface BotSettings {
  enabled: boolean
  autoReplyMessage: string
  replyScope: 'all' | 'user_only' | 'group_only' | 'whitelist'
  whitelist: string[]
  blacklist: string[]
  useRandomPreset: boolean
  presetMessages: string[]
  chatBackground?: string
  aiEnabled?: boolean
  aiPersonality?: string
  aiMaxLength?: number
  aiTriggerMode?: string
}

const SETTINGS_FILE = dataFilePath('.zalo-settings.json')

const DEFAULT_PRESETS = [
  'E-Eto... tôi là Monica Everett... xin hãy chiếu cố cho tôi từ bây giờ nhé... 🌸✨🥺🤍',
  'U-Um... nếu tôi trốn sau cánh cửa thì xin đừng kéo tôi ra nhé... 🚪🥺💦',
  'Fuee... c-chuyện này khó quá đi mất... (⁠՚⁠﹏⁠՚⁠)💦',
  'A-Anou... đừng nói cho mọi người biết nhé... tôi tin bạn đó... 🥺🌸🤍✨',
  'S-Sono... nếu có thể giúp được mọi người thì tôi rất vui... 🍀🤍✨',
]

const DEFAULT_SETTINGS: BotSettings = {
  enabled: false,
  autoReplyMessage: 'Xin chào! Tôi đang bận, sẽ phản hồi bạn sớm nhất có thể. 🙏',
  replyScope: 'all',
  whitelist: [],
  blacklist: [],
  useRandomPreset: false,
  presetMessages: DEFAULT_PRESETS,
  chatBackground: 'default',
  aiEnabled: false,
  aiPersonality: 'friendly',
  aiMaxLength: 200,
  aiTriggerMode: 'smart',
}

export function getBotSettings(): BotSettings {
  if (!(globalThis as any).__zaloBotSettings__) {
    let settings = { ...DEFAULT_SETTINGS }
    try {
      if (fs.existsSync(SETTINGS_FILE)) {
        const data = fs.readFileSync(SETTINGS_FILE, 'utf-8')
        const parsed = JSON.parse(data)
        settings = { ...DEFAULT_SETTINGS, ...parsed }
        // Ensure presetMessages has 5 items
        if (!Array.isArray(settings.presetMessages) || settings.presetMessages.length === 0) {
          settings.presetMessages = DEFAULT_PRESETS
        } else {
          // Fill up to 5 items if fewer
          while (settings.presetMessages.length < 5) {
            settings.presetMessages.push(DEFAULT_PRESETS[settings.presetMessages.length] || '')
          }
        }
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
