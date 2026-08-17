import React, { useState, useEffect, useRef, useCallback } from 'react'

interface Message {
  id: string | number
  msgId?: string | number
  cliMsgId?: string | number
  globalMsgId?: string | number
  threadId: string
  from: string
  fromName: string
  avatar?: string
  content: string
  timestamp: string
  type: 'Group' | 'User'
  replied?: boolean
  isSelf?: boolean
  isUndo?: boolean
  attachments?: any[]
  photoUrl?: string
  imageUrl?: string
  videoUrl?: string
  quote?: {
    id: string | number
    msgId?: string | number
    fromName: string
    content: string
  }
}

// Convert raw message content (possibly JSON) into short sidebar preview text
function getLastMessagePreview(content: any): string {
  if (!content) return ''
  
  // Check if this is an undo event - don't show it
  if (typeof content === 'string') {
    const trimmed = content.trim()
    if (trimmed.startsWith('[{') && trimmed.includes('"actionType"') && trimmed.includes('"clientDelMsgId"')) {
      return '' // Hide undo event messages
    }
  }
  
  if (typeof content === 'object' && content !== null) {
    if (content.catId || content.cateId || content.type === 'sticker') return '[Nhãn dán]'
    if (content.type === 'link') return `[🔗 ${content.title || content.url || 'Link'}]`
    if (content.type === 'image' || content.photoUrl || content.imageUrl) return '[Hình ảnh]'
    if (content.type === 'file') return `[Tập tin: ${content.name || 'File'}]`
    if (content.href || content.thumb || content.url) return '[Hình ảnh]'
    if (content.title) return content.title
    if (content.description) return content.description
    return '[Media]'
  }
  const str = String(content)
  const trimmed = str.trim()
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed)
      if (parsed.catId || parsed.cateId || parsed.type === 'sticker' || (parsed.id && !parsed.type)) return '[Nhãn dán]'
      if (parsed.type === 'link') return `[🔗 ${parsed.title || parsed.url || 'Link'}]`
      if (parsed.type === 'image' || parsed.photoUrl || parsed.imageUrl) return '[Hình ảnh]'
      if (parsed.type === 'file') return `[Tập tin: ${parsed.name || 'File'}]`
      if (parsed.href || parsed.thumb || parsed.url) return '[Hình ảnh]'
      if (parsed.title) return parsed.title
      if (parsed.description) return parsed.description
      return '[Media]'
    } catch (e) {}
  }
  return str
}

function renderMessageContent(
  content: any,
  knownNames: string[] = [],
  onMediaClick?: (url: string) => void,
  mediaCache?: Record<string, string>,
  setMediaCache?: React.Dispatch<React.SetStateAction<Record<string, string>>>
) {
  if (!content) return null

  // Check if content is a JSON object or stringified JSON payload (e.g. photo/attachment/link)
  let parsedObj: any = null
  if (typeof content === 'object' && content !== null) {
    parsedObj = content
  } else if (typeof content === 'string' && content.trim().startsWith('{') && content.trim().endsWith('}')) {
    try {
      parsedObj = JSON.parse(content)
      console.log('🔍 Parsed JSON content:', parsedObj)
    } catch (e) {
      console.error('❌ Failed to parse JSON:', e)
    }
  }

  if (parsedObj) {
    console.log('🔍 Checking parsedObj:', {
      hasType: !!parsedObj.type,
      type: parsedObj.type,
      hasCatId: !!parsedObj.catId,
      hasId: !!parsedObj.id,
      isSticker: parsedObj.type === 'sticker'
    })
    
    if (parsedObj.type === 'sticker' || parsedObj.catId || parsedObj.cateId || (parsedObj.id && !parsedObj.type)) {
      const catId = parsedObj.catId || parsedObj.cateId || 1
      const stkId = parsedObj.id || parsedObj.stickerId || parsedObj.stkId || '10065'
      
      // Use Zalo API endpoint for stickers - most reliable method
      let stickerUrl = parsedObj.url || ''
      
      // Fix old broken URLs
      if (stickerUrl.includes('stk.zaloapp.com')) {
        stickerUrl = `https://zalo-api.zadn.vn/api/emoticon/sticker/webpc?eid=${stkId}&size=130&version=1`
      }
      
      // If no URL provided, use API endpoint
      if (!stickerUrl) {
        stickerUrl = `https://zalo-api.zadn.vn/api/emoticon/sticker/webpc?eid=${stkId}&size=130&version=1`
      }
      
      console.log('✅ Rendering sticker:', { catId, stkId, stickerUrl })
      
      return (
        <div className="py-1">
          <img
            src={stickerUrl}
            alt="Sticker Zalo"
            className="w-32 h-32 object-contain hover:scale-105 transition-transform duration-200 cursor-pointer drop-shadow-md"
            onError={(e) => {
              console.error('❌ Sticker image failed to load:', stickerUrl)
              const target = e.target as HTMLImageElement
              // Fallback chain: Try alternative URLs
              if (!target.dataset.fallbackAttempt) {
                target.dataset.fallbackAttempt = '1'
                target.src = `https://stk.za.zaloapp.com/stickers/${catId}/${stkId}.png`
              } else if (target.dataset.fallbackAttempt === '1') {
                target.dataset.fallbackAttempt = '2'
                target.src = `https://stk.za.zaloapp.com/static/stickers/${catId}/${stkId}.png`
              }
            }}
          />
        </div>
      )
    }

    if (parsedObj.type === 'file') {
      const fileName = parsedObj.name || 'Tập tin'
      const fileExt = fileName.split('.').pop()?.toLowerCase() || ''
      
      // Determine icon and color based on file type
      let icon = '📄'
      let colorClass = 'sky'
      
      if (['mp4', 'avi', 'mov', 'mkv', 'flv', 'wmv'].includes(fileExt)) {
        icon = '🎬'
        colorClass = 'purple'
      } else if (['mp3', 'wav', 'ogg', 'flac', 'm4a'].includes(fileExt)) {
        icon = '🎵'
        colorClass = 'pink'
      } else if (['pdf'].includes(fileExt)) {
        icon = '📕'
        colorClass = 'red'
      } else if (['doc', 'docx'].includes(fileExt)) {
        icon = '📘'
        colorClass = 'blue'
      } else if (['xls', 'xlsx', 'csv'].includes(fileExt)) {
        icon = '📊'
        colorClass = 'green'
      } else if (['ppt', 'pptx'].includes(fileExt)) {
        icon = '📙'
        colorClass = 'orange'
      } else if (['zip', 'rar', '7z', 'tar', 'gz'].includes(fileExt)) {
        icon = '📦'
        colorClass = 'amber'
      } else if (['js', 'ts', 'py', 'java', 'cpp', 'c', 'html', 'css', 'json', 'xml'].includes(fileExt)) {
        icon = '💻'
        colorClass = 'cyan'
      } else if (['txt', 'md'].includes(fileExt)) {
        icon = '📝'
        colorClass = 'gray'
      }
      
      return (
        <div className="p-2.5 bg-dark-300/90 border border-white/15 rounded-xl flex items-center gap-3 max-w-xs shadow-md">
          <div className={`w-10 h-10 rounded-lg bg-${colorClass}-500/20 border border-${colorClass}-400/30 flex items-center justify-center text-xl flex-shrink-0`}>
            {icon}
          </div>
          <div className="flex flex-col truncate flex-1">
            <span className="text-xs font-bold text-white truncate">{fileName}</span>
            {parsedObj.size && parsedObj.size > 0 && (
              <span className="text-[10px] text-gray-400 font-mono">
                {parsedObj.size > 1024 * 1024 
                  ? `${(parsedObj.size / (1024 * 1024)).toFixed(2)} MB`
                  : `${(parsedObj.size / 1024).toFixed(0)} KB`
                }
              </span>
            )}
            {parsedObj.caption && <span className="text-xs text-gray-200 mt-1">{parsedObj.caption}</span>}
            <span className={`text-[10px] text-${colorClass}-400 font-medium mt-0.5`}>[{fileExt.toUpperCase() || 'FILE'}]</span>
          </div>
        </div>
      )
    }

    const isImageObject =
      parsedObj.type === 'image' ||
      parsedObj.photoUrl ||
      parsedObj.imageUrl ||
      parsedObj.href ||
      parsedObj.thumb ||
      (typeof parsedObj.name === 'string' && /\.(png|jpe?g|webp|gif)$/i.test(parsedObj.name))

    let imgUrl = parsedObj.url || parsedObj.href || parsedObj.thumb || parsedObj.photoUrl || parsedObj.imageUrl || parsedObj.hdUrl || parsedObj.normalUrl || null
    if (!imgUrl && parsedObj.params && typeof parsedObj.params === 'string') {
      try {
        const pObj = JSON.parse(parsedObj.params)
        imgUrl = pObj.hd || pObj.url || pObj.src || pObj.hdUrl || pObj.thumb
      } catch (e) {}
    }

    // IMPORTANT: If this is a Giphy GIF, try to use cached Giphy URL instead of Zalo CDN
    // This prevents 403 errors when Zalo CDN URLs expire
    const fileName = parsedObj.name || ''
    const giphyId = parsedObj.giphyId || ''
    
    if (fileName || giphyId) {
      try {
        // Priority 1: Check component state (mediaCache from database)
        if (mediaCache && fileName && mediaCache[fileName]) {
          imgUrl = mediaCache[fileName]
          console.log('🎬 Using mediaCache (DB) by filename:', fileName)
        }
        else if (mediaCache && giphyId && mediaCache[`giphy_id_${giphyId}`]) {
          imgUrl = mediaCache[`giphy_id_${giphyId}`]
          console.log('🎬 Using mediaCache (DB) by Giphy ID:', giphyId)
        }
        // Priority 2: Try localStorage cache
        else {
          const giphyCache = JSON.parse(localStorage.getItem('giphy_cache') || '{}')
          let cachedUrl: string | null = null
          
          // Try lookup by filename
          if (fileName && giphyCache[fileName]) {
            cachedUrl = giphyCache[fileName]
            console.log('🎬 Using localStorage cache by filename:', fileName)
          }
          // Try lookup by Giphy ID
          else if (giphyId && giphyCache[`giphy_id_${giphyId}`]) {
            cachedUrl = giphyCache[`giphy_id_${giphyId}`]
            console.log('🎬 Using localStorage cache by Giphy ID:', giphyId)
          }
          
          if (cachedUrl && setMediaCache) {
            imgUrl = cachedUrl
            // Update mediaCache state for next render
            setMediaCache(prev => ({ ...prev, [fileName || `giphy_id_${giphyId}`]: cachedUrl! }))
          }
        }
      } catch (e) {
        console.error('Error loading cached URL:', e)
      }
    }

    const titleText = parsedObj.title || parsedObj.description || parsedObj.caption || parsedObj.text || parsedObj.name || ''

    if (imgUrl && String(imgUrl).trim() !== '') {
      const cleanImgUrl = String(imgUrl).replace(/\\/g, '')
      const isGiphyUrl = cleanImgUrl.includes('giphy.com')
      
      return (
        <div className="space-y-1.5 max-w-xs">
          <img
            src={cleanImgUrl}
            alt={titleText || (isGiphyUrl ? 'GIF Giphy' : 'Ảnh Zalo')}
            className="rounded-xl max-h-60 w-full object-cover border border-white/10 shadow hover:opacity-90 hover:scale-[1.01] transition-all cursor-pointer"
            onClick={(e) => {
              e.stopPropagation()
              if (onMediaClick) onMediaClick(cleanImgUrl)
            }}
            onError={(e) => {
              console.error('❌ Image failed to load:', cleanImgUrl)
              const target = e.target as HTMLImageElement
              const parent = target.parentElement
              
              // CRITICAL FIX: Only show error UI if parent doesn't already have fallback content
              // This prevents duplicate error messages when multiple render cycles occur
              if (parent && !parent.querySelector('.error-fallback-ui')) {
                // Hide broken image
                target.style.display = 'none'
                
                // Add error fallback UI (only once)
                parent.innerHTML = `
                  <div class="error-fallback-ui p-3 bg-dark-300/90 border border-red-500/30 rounded-2xl flex items-center gap-3 max-w-xs shadow-md">
                    <div class="w-10 h-10 rounded-xl bg-red-500/20 border border-red-400/30 flex items-center justify-center text-xl flex-shrink-0">
                      🖼️
                    </div>
                    <div class="flex flex-col truncate flex-1">
                      <span class="text-xs font-bold text-white truncate">${titleText || 'Hình ảnh'}</span>
                      <span class="text-[10px] text-red-400 font-medium">[URL đã hết hạn]</span>
                    </div>
                  </div>
                `
              }
            }}
          />
          {titleText && <p className="text-xs text-gray-100 font-medium break-words">{titleText}</p>}
        </div>
      )
    }

    // LINK PREVIEW - Render link with preview card
    if (parsedObj.type === 'link') {
      const linkUrl = parsedObj.url || ''
      const linkTitle = parsedObj.title || linkUrl
      const linkDesc = parsedObj.description || ''
      const linkThumb = parsedObj.thumbnail || ''
      
      return (
        <div className="max-w-xs">
          <a 
            href={linkUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="block p-3 bg-dark-300/90 border border-sky-500/30 rounded-2xl hover:border-sky-400/50 hover:bg-dark-300 transition-all shadow-md group"
          >
            {linkThumb && (
              <div className="mb-2 rounded-lg overflow-hidden border border-white/10">
                <img
                  src={linkThumb}
                  alt={linkTitle}
                  className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-200"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    // Just hide the image if it fails to load, don't show error text
                    const parent = target.parentElement
                    if (parent) {
                      parent.style.display = 'none'
                    }
                  }}
                />
              </div>
            )}
            <div className="space-y-1">
              <div className="flex items-start gap-2">
                <span className="text-sky-400 text-sm flex-shrink-0 mt-0.5">🔗</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white truncate group-hover:text-sky-300 transition-colors">
                    {linkTitle}
                  </p>
                  {linkDesc && (
                    <p className="text-[10px] text-gray-400 line-clamp-2 mt-0.5">
                      {linkDesc}
                    </p>
                  )}
                  <p className="text-[9px] text-sky-400/70 truncate mt-1 font-mono">
                    {linkUrl}
                  </p>
                </div>
              </div>
            </div>
          </a>
        </div>
      )
    }

    if (isImageObject) {
      return (
        <div className="p-3 bg-dark-300/90 border border-white/15 rounded-2xl flex items-center gap-3 max-w-xs shadow-md">
          <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-xl flex-shrink-0">
            🖼️
          </div>
          <div className="flex flex-col truncate flex-1">
            <span className="text-xs font-bold text-white truncate">{titleText || 'Hình ảnh Zalo'}</span>
            <span className="text-[10px] text-sky-400 font-medium">[Hình ảnh]</span>
          </div>
        </div>
      )
    }

    if (titleText && titleText.trim() !== '') {
      return <span className="text-xs text-gray-100">{titleText}</span>
    }
  }

  let textContent = ''
  if (typeof content === 'string') {
    textContent = content
  } else {
    textContent = String(content)
  }

  if (!textContent) return null

  // Special case: Detect GIF filenames like "giphy_xxx.gif" or any .gif/.png/.jpg file
  // For Giphy GIFs, try to reconstruct preview from cached data
  const isMediaFileName = /\.(gif|png|jpe?g|webp)$/i.test(textContent.trim()) && !textContent.includes(' ')
  
  if (isMediaFileName) {
    // Try to get cached Giphy URL from localStorage
    let cachedUrl: string | null = null
    const fileName = textContent.trim()
    
    try {
      const giphyCache = localStorage.getItem('giphy_cache')
      if (giphyCache) {
        const cache = JSON.parse(giphyCache)
        cachedUrl = cache[fileName]
        
        // Also try to lookup by giphy ID if filename is giphy_xxx.gif
        if (!cachedUrl && fileName.startsWith('giphy_')) {
          const giphyId = fileName.replace('giphy_', '').replace(/\.(gif|png|jpe?g|webp)$/i, '')
          cachedUrl = cache[`giphy_id_${giphyId}`]
          console.log(`🔍 Looking up Giphy cache by ID: ${giphyId}, found:`, !!cachedUrl)
        }
      }
    } catch (e) {}
    
    // If we have cached URL, render as image
    if (cachedUrl) {
      return (
        <div className="space-y-1.5 max-w-xs">
          <img
            src={cachedUrl}
            alt={fileName}
            className="rounded-xl max-h-60 w-full object-cover border border-white/10 shadow hover:opacity-90 hover:scale-[1.01] transition-all cursor-pointer"
            onClick={(e) => {
              e.stopPropagation()
              if (onMediaClick) onMediaClick(cachedUrl)
            }}
            onError={(e) => {
              // If image fails to load, show fallback
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
            }}
          />
          <p className="text-xs text-gray-300 font-medium">{fileName}</p>
        </div>
      )
    }
    
    // Fallback: Show icon with filename
    const isGif = /\.gif$/i.test(fileName)
    const icon = isGif ? '🎬' : '🖼️'
    const label = isGif ? '[GIF Animation]' : '[Hình ảnh]'
    const colorClass = isGif ? 'purple' : 'sky'
    
    return (
      <div className={`p-3 bg-dark-300/90 border border-white/15 rounded-2xl flex items-center gap-3 max-w-xs shadow-md`}>
        <div className={`w-10 h-10 rounded-xl bg-${colorClass}-500/20 border border-${colorClass}-400/30 flex items-center justify-center text-xl flex-shrink-0 ${isGif ? 'animate-pulse' : ''}`}>
          {icon}
        </div>
        <div className="flex flex-col truncate flex-1">
          <span className="text-xs font-bold text-white truncate">{fileName}</span>
          <span className={`text-[10px] text-${colorClass}-400 font-medium`}>{label}</span>
        </div>
      </div>
    )
  }

  // Clean and sort valid known names by length descending
  const validNames = Array.from(
    new Set(knownNames.filter((n) => n && typeof n === 'string' && n.trim().length > 0))
  ).sort((a, b) => b.length - a.length)

  // Decode Zalo icon codes (/-strong, /-heart, etc.) to emoji
  const decodeZaloIcons = (text: string): string => {
    const iconMap: Record<string, string> = {
      '/-strong': '👍',
      '/-heart': '❤️',
      '/-haha': '😂',
      '/-wow': '😮',
      '/-cry': '😢',
      '/-angry': '😠',
      '/-sad': '😞',
      '/-love': '🥰',
      '/-cool': '😎',
      '/-smile': '😊',
      '/-laugh': '🤣',
      '/-wink': '😉',
      '/-kiss': '😘',
      '/-fun': '🤪',
      '/-surprised': '😲',
      '/-confounded': '😖',
      '/-sweat': '😅',
      '/-shy': '😳',
      '/-sleepy': '😴',
      '/-mask': '😷'
    }
    
    let decoded = text
    for (const [code, emoji] of Object.entries(iconMap)) {
      decoded = decoded.replace(new RegExp(code.replace('/', '\\/'), 'g'), emoji)
    }
    return decoded
  }

  // Decode icons first
  textContent = decodeZaloIcons(textContent)

  // URL pattern to detect links
  const urlPattern = /(https?:\/\/[^\s]+)/gi
  
  // Split by URLs first
  const urlParts = textContent.split(urlPattern)
  const processedParts: (string | React.ReactNode)[] = []
  
  urlParts.forEach((part, partIdx) => {
    // Check if this part is a URL
    if (part.match(/^https?:\/\//i)) {
      // This is a URL - render as clickable link
      processedParts.push(
        <a
          key={`url-${partIdx}`}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sky-400 hover:text-sky-300 underline font-medium break-all"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      )
    } else {
      // This is regular text - process for @mentions
      // 1. Escaped exact match for known names
      const escapedNames = validNames.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))

      // 2. Title-case multi-word pattern for Vietnamese names:
      const upperLetter = '[A-ZÀÁẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬĐÈÉẺẼẸÊẾỀỂỄỆÌÍỈĨỊÒÓỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÙÚỦŨỤƯỨỪỬỮỰỲÝỶỸỴ\\u4e00-\\u9fff]'
      const nameWord = `${upperLetter}[a-zàáảãạăắằẳẵặâấầnẩẫậnđèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúũụưứừửữựỳýỷỹỵ0-9_\\u4e00-\\u9fff]*`
      const titleCasePattern = `${nameWord}(?:\\s+${nameWord})*`

      let patternStr: string
      if (escapedNames.length > 0) {
        patternStr = `@(?:${escapedNames.join('|')}|${titleCasePattern}|[^\\s@]+)`
      } else {
        patternStr = `@(?:${titleCasePattern}|[^\\s@]+)`
      }

      const regex = new RegExp(`(${patternStr})(?=\\s|$|[.,!?]|$)`, 'g')
      let lastIdx = 0
      let match: RegExpExecArray | null

      while ((match = regex.exec(part)) !== null) {
        if (match.index > lastIdx) {
          processedParts.push(part.substring(lastIdx, match.index))
        }
        const mentionText = match[0]
        processedParts.push(
          <span
            key={`mention-${partIdx}-${match.index}`}
            className="inline-block text-sky-300 font-bold bg-sky-500/25 px-1.5 py-0.5 rounded-md border border-sky-400/40 cursor-pointer hover:underline mx-0.5 shadow-sm"
          >
            {mentionText}
          </span>
        )
        lastIdx = regex.lastIndex
      }

      if (lastIdx < part.length) {
        processedParts.push(part.substring(lastIdx))
      }
    }
  })

  // Render with newline preservation
  const renderWithNewlines = (node: string | React.ReactNode, key?: number) => {
    if (typeof node !== 'string') return node
    const lines = node.split('\n')
    if (lines.length <= 1) return node
    return lines.map((line, i) => (
      <React.Fragment key={`${key ?? 'nl'}-${i}`}>
        {line}
        {i < lines.length - 1 && <br />}
      </React.Fragment>
    ))
  }

  if (processedParts.length > 0) {
    return <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{processedParts.map((p, i) => renderWithNewlines(p, i))}</span>
  }
  return <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{textContent}</span>
}

interface Conversation {
  threadId: string
  name: string
  avatar?: string
  type: 'Group' | 'User'
  lastMessage: string
  lastTime: string
  lastTimestamp?: number
  totalMember?: number
  isBotEnabled?: boolean
}

interface ZaloChatViewProps {
  logs: Message[]
  userInfo: any
  botEnabled: boolean
  whitelist: string[]
  onWhitelistChange: (list: string[]) => void
  onSwitchToDashboard: () => void
  mutedThreadIds?: Set<string>
  onMutedThreadIdsChange?: (newSet: Set<string>) => void
  navigateToThreadId?: string | null
  onNavigateToThreadHandled?: () => void
}

export default function ZaloChatView({
  logs,
  userInfo,
  botEnabled,
  whitelist,
  onWhitelistChange,
  onSwitchToDashboard,
  mutedThreadIds = new Set(),
  onMutedThreadIdsChange,
  navigateToThreadId,
  onNavigateToThreadHandled,
}: ZaloChatViewProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeThreadId, setActiveThreadId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('zalo_active_thread_id')
    }
    return null
  })
  const [inputText, setInputText] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTab, setFilterTab] = useState<'all' | 'user' | 'group'>('all')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Merge new log entries into existing conversations (don't replace the full list!)
  useEffect(() => {
    if (!logs || logs.length === 0) return

    setConversations((prev) => {
      const map = new Map<string, Conversation>()
      // 1. Keep ALL existing conversations (friends, groups from API)
      prev.forEach((c) => map.set(c.threadId, c))

      // 2. Update/add conversations that appear in logs
      // Process logs in reverse order (newest first) to ensure latest message wins
      const sortedLogs = [...logs].sort((a, b) => {
        const timeA = new Date(a.timestamp).getTime()
        const timeB = new Date(b.timestamp).getTime()
        return timeB - timeA // Descending (newest first)
      })

      // Track which threads we've already updated (to only use the newest message per thread)
      const updatedThreads = new Set<string>()

      sortedLogs.forEach((log) => {
        const threadId = String(log.threadId || '')
        if (!threadId || updatedThreads.has(threadId)) return

        const existing = map.get(threadId)
        const logTime = new Date(log.timestamp).getTime()

        // Always update if this is the newest message for this thread
        const preview = getLastMessagePreview(log.content)
        const timeStr = new Date(log.timestamp).toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
        })

        map.set(threadId, {
          ...(existing || {}),
          threadId,
          name: existing?.name || log.fromName || threadId,
          avatar: existing?.avatar || log.avatar,
          type: existing?.type || log.type || 'User',
          lastMessage: preview || 'Tin nhắn mới',
          lastTime: timeStr,
          lastTimestamp: logTime,
        } as Conversation)

        updatedThreads.add(threadId)
      })

      const list = Array.from(map.values())
      // Sort by lastTimestamp descending (newest first)
      list.sort((a, b) => (b.lastTimestamp || 0) - (a.lastTimestamp || 0))
      return list
    })
  }, [logs])

  // Navigate to thread when notification is clicked
  useEffect(() => {
    if (navigateToThreadId) {
      setActiveThreadId(navigateToThreadId)
      if (typeof window !== 'undefined') {
        localStorage.setItem('zalo_active_thread_id', navigateToThreadId)
      }
      onNavigateToThreadHandled?.()
    }
  }, [navigateToThreadId])

  // Toggle mute/unmute notifications for a thread
  const toggleMuteThread = (threadId: string) => {
    const next = new Set(mutedThreadIds)
    if (next.has(threadId)) {
      next.delete(threadId)
    } else {
      next.add(threadId)
    }
    onMutedThreadIdsChange?.(next)
  }

  const [historyMessages, setHistoryMessages] = useState<Record<string, Message[]>>({})
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncNotice, setSyncNotice] = useState<string | null>(null)
  const [avatarMap, setAvatarMap] = useState<Record<string, string>>({})
  const [groupMembers, setGroupMembers] = useState<Record<string, { id: string; name: string; avatar: string }[]>>({})
  const [friendsList, setFriendsList] = useState<{ id: string; name: string; avatar: string }[]>([])
  const [showMentionMenu, setShowMentionMenu] = useState(false)
  const [mentionQuery, setMentionQuery] = useState('')
  const [chatBg, setChatBg] = useState<string>('default')
  const [showBgModal, setShowBgModal] = useState(false)

  // Sticker & File Attachment States
  const [showStickerPicker, setShowStickerPicker] = useState(false)
  const [stickerTab, setStickerTab] = useState<'stickers' | 'emojis'>('stickers')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const stickerPickerRef = useRef<HTMLDivElement>(null)

  // Giphy sticker state
  const GIPHY_API_KEY = 'GlVGYHkr3WSBnllca54iNt0yFbjz7L65'
  const [giphyStickers, setGiphyStickers] = useState<any[]>([])
  const [giphySearch, setGiphySearch] = useState('')
  const [giphyLoading, setGiphyLoading] = useState(false)
  const giphySearchTimerRef = useRef<any>(null)

  // Fetch trending Giphy stickers on first open
  useEffect(() => {
    if (showStickerPicker && stickerTab === 'stickers' && giphyStickers.length === 0 && !giphySearch) {
      setGiphyLoading(true)
      fetch(`https://api.giphy.com/v1/stickers/trending?api_key=${GIPHY_API_KEY}&limit=30&rating=g`)
        .then((r) => r.json())
        .then((data) => setGiphyStickers(data.data || []))
        .catch(() => {})
        .finally(() => setGiphyLoading(false))
    }
  }, [showStickerPicker, stickerTab])

  // Debounced Giphy search
  const searchGiphy = (query: string) => {
    setGiphySearch(query)
    if (giphySearchTimerRef.current) clearTimeout(giphySearchTimerRef.current)
    if (!query.trim()) {
      // Reset to trending
      setGiphyLoading(true)
      fetch(`https://api.giphy.com/v1/stickers/trending?api_key=${GIPHY_API_KEY}&limit=30&rating=g`)
        .then((r) => r.json())
        .then((data) => setGiphyStickers(data.data || []))
        .catch(() => {})
        .finally(() => setGiphyLoading(false))
      return
    }
    giphySearchTimerRef.current = setTimeout(() => {
      setGiphyLoading(true)
      fetch(`https://api.giphy.com/v1/stickers/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=30&rating=g`)
        .then((r) => r.json())
        .then((data) => setGiphyStickers(data.data || []))
        .catch(() => {})
        .finally(() => setGiphyLoading(false))
    }, 400)
  }

  // Close sticker picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showStickerPicker &&
        stickerPickerRef.current &&
        !stickerPickerRef.current.contains(event.target as Node)
      ) {
        // Check if click is on the toggle button itself
        const target = event.target as HTMLElement
        const isToggleButton = target.closest('[data-sticker-toggle]')
        
        if (!isToggleButton) {
          setShowStickerPicker(false)
        }
      }
    }

    if (showStickerPicker) {
      // Add listener when picker is shown
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showStickerPicker])

  const POPULAR_EMOJIS = ['😂', '🥰', '😍', '😭', '😎', '🤣', '👍', '❤️', '🔥', '🎉', '🙏', '✨', '💡', '🚀', '💯', '🤝', '😊', '🤔', '😅', '🥳', '💩', '🤡', '👻', '💀']

  const handleSendSticker = async (stk: { id: string; cateId: number; type?: number; url?: string }) => {
    if (!activeThreadId) return
    setIsSending(true)
    setShowStickerPicker(false)

    const activeConv = conversations.find((c) => c.threadId === activeThreadId)
    const threadType = activeConv?.type === 'Group' ? 1 : 0

    const formData = new FormData()
    formData.append('threadId', activeThreadId)
    formData.append('threadType', String(threadType))
    formData.append('sticker', JSON.stringify(stk))

    try {
      const res = await fetch('/api/zalo/messages', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (!data.success) {
        alert(data.error || 'Lỗi gửi nhãn dán')
      }
    } catch (err: any) {
      console.error('Failed to send sticker:', err)
    } finally {
      setIsSending(false)
    }
  }

  // Send a Giphy sticker as an image file attachment
  const handleSendGiphySticker = async (gif: any) => {
    if (!activeThreadId) return
    setIsSending(true)
    setShowStickerPicker(false)

    const activeConv = conversations.find((c) => c.threadId === activeThreadId)
    const threadType = activeConv?.type === 'Group' ? 1 : 0

    // Get the GIF URL (use downsized for smaller size)
    const gifUrl = gif.images?.downsized?.url || gif.images?.fixed_height?.url || gif.images?.original?.url
    const previewUrl = gif.images?.fixed_height?.url || gif.images?.downsized?.url || gif.images?.original?.url
    if (!gifUrl) {
      alert('Không tìm thấy URL sticker')
      setIsSending(false)
      return
    }

    const fileName = `giphy_${gif.id || Date.now()}.gif`

    // 1. Instantly add local optimistic message with Giphy preview
    const localContent = JSON.stringify({
      type: 'image',
      name: gif.title || fileName || 'Sticker GIF',
      caption: '',
      url: previewUrl,
      giphyId: gif.id,
    })

    const tempSentMsg: Message = {
      id: Date.now(),
      threadId: activeThreadId,
      from: 'Self',
      fromName: 'Bạn (Chính mình)',
      content: localContent,
      timestamp: new Date().toISOString(),
      type: activeConv?.type || 'User',
      isSelf: true,
    }

    setHistoryMessages((prev) => ({
      ...prev,
      [activeThreadId]: [...(prev[activeThreadId] || []), tempSentMsg],
    }))

    // Bump conversation to top
    setConversations((prev) => {
      const map = new Map<string, Conversation>()
      prev.forEach((c) => map.set(c.threadId, c))
      const existing = map.get(activeThreadId)
      if (existing) {
        map.set(activeThreadId, {
          ...existing,
          lastMessage: 'Bạn: [Sticker GIF]',
          lastTime: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          lastTimestamp: Date.now(),
        })
      }
      const list = Array.from(map.values())
      list.sort((a, b) => (b.lastTimestamp || 0) - (a.lastTimestamp || 0))
      return list
    })

    // 2. Download and send via API
    try {
      const response = await fetch(gifUrl)
      const blob = await response.blob()
      const file = new File([blob], fileName, { type: 'image/gif' })

      // Cache the Giphy URL in localStorage for future reference
      try {
        const giphyCache = JSON.parse(localStorage.getItem('giphy_cache') || '{}')
        giphyCache[fileName] = previewUrl
        giphyCache[`giphy_id_${gif.id}`] = previewUrl // Also save by Giphy ID
        localStorage.setItem('giphy_cache', JSON.stringify(giphyCache))
        
        // 🆕 Update component state immediately
        setMediaCache(prev => ({
          ...prev,
          [fileName]: previewUrl,
          [`giphy_id_${gif.id}`]: previewUrl
        }))
        
        console.log(`💾 Cached Giphy URL in localStorage for ${fileName}:`, previewUrl)
        
        // Also save to server database cache with Giphy ID
        await fetch('/api/zalo/media-cache', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            fileName, 
            url: previewUrl,
            giphyId: gif.id,
            mediaType: 'gif'
          }),
        }).catch(() => {})
      } catch (e) {
        console.warn('Failed to cache Giphy URL:', e)
      }

      const formData = new FormData()
      formData.append('threadId', activeThreadId)
      formData.append('threadType', String(threadType))
      formData.append('message', '')
      formData.append('file', file)
      formData.append('fileName', fileName) // Pass filename explicitly
      formData.append('giphyId', gif.id) // Pass Giphy ID for database caching

      const res = await fetch('/api/zalo/messages', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (!data.success) {
        alert(data.error || 'Lỗi gửi sticker Giphy')
      }
    } catch (err: any) {
      console.error('Failed to send Giphy sticker:', err)
    } finally {
      setIsSending(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setSelectedFile(file)
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = () => setFilePreviewUrl(reader.result as string)
      reader.readAsDataURL(file)
    } else {
      setFilePreviewUrl(null)
    }
  }

  // Sync wallpaper from localStorage & backend settings on client mount
  useEffect(() => {
    const initBg = async () => {
      // 1. Try local storage first - user's direct local choice takes highest priority
      try {
        const savedBg = localStorage.getItem('zalo_chat_background')
        if (savedBg) {
          setChatBg(savedBg)
          return
        }
      } catch (e) {}

      // 2. Fallback to backend settings file only if localStorage is empty
      try {
        const res = await fetch('/api/zalo/settings')
        if (res.ok) {
          const settings = await res.json()
          if (settings.chatBackground) {
            setChatBg(settings.chatBackground)
            try {
              localStorage.setItem('zalo_chat_background', settings.chatBackground)
            } catch (e) {}
          }
        }
      } catch (e) {}
    }
    initBg()
  }, [])

  // Sync media cache from server to localStorage on mount
  useEffect(() => {
    const syncMediaCache = async () => {
      try {
        const res = await fetch('/api/zalo/media-cache')
        if (res.ok) {
          const data = await res.json()
          if (data.success && data.cache) {
            // Merge server cache with existing localStorage cache
            const existing = JSON.parse(localStorage.getItem('giphy_cache') || '{}')
            const merged = { ...existing, ...data.cache }
            
            // Also create giphy_id_xxx entries for faster lookup
            Object.keys(merged).forEach(key => {
              if (key.startsWith('giphy_') && key.endsWith('.gif')) {
                const giphyId = key.replace('giphy_', '').replace('.gif', '')
                merged[`giphy_id_${giphyId}`] = merged[key]
              }
            })
            
            localStorage.setItem('giphy_cache', JSON.stringify(merged))
            
            // 🆕 Update component state for immediate use
            setMediaCache(merged)
            
            console.log('💾 Synced media cache from server:', Object.keys(merged).length, 'entries')
            console.log('📦 Cache sample:', Object.keys(merged).slice(0, 3))
          }
        }
      } catch (e) {
        console.warn('Failed to sync media cache:', e)
      }
    }
    syncMediaCache()
  }, [])

  const updateChatBg = async (newBg: string) => {
    setChatBg(newBg)
    try {
      localStorage.setItem('zalo_chat_background', newBg)
    } catch (e) {
      console.warn('Unable to save chat background to localStorage:', e)
    }
    // Save to backend settings file (.zalo-settings.json)
    try {
      await fetch('/api/zalo/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatBackground: newBg }),
      })
    } catch (e) {}
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/zalo/upload-background', {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        const data = await res.json()
        if (data.bgUrl) {
          updateChatBg(data.bgUrl)
        }
      }
    } catch (err) {
      console.error('Failed to upload custom background image:', err)
    }
  }

  const [replyingToMessage, setReplyingToMessage] = useState<Message | null>(null)
  const [forwardingMessage, setForwardingMessage] = useState<Message | null>(null)
  const [contextMenu, setContextMenu] = useState<{ msg: Message; x: number; y: number } | null>(null)
  const [pinnedMessage, setPinnedMessage] = useState<Message | null>(null)
  const [starredMsgIds, setStarredMsgIds] = useState<Set<string | number>>(new Set())
  const [recalledMsgIds, setRecalledMsgIds] = useState<Set<string | number>>(new Set())
  const [deletedLocallyMsgIds, setDeletedLocallyMsgIds] = useState<Set<string | number>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('zalo_deleted_locally_msg_ids')
        if (saved) return new Set(JSON.parse(saved))
      } catch (e) {}
    }
    return new Set()
  })
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false)
  const [selectedMsgIds, setSelectedMsgIds] = useState<Set<string | number>>(new Set())
  const [detailModalMsg, setDetailModalMsg] = useState<Message | null>(null)
  const [forwardSearchQuery, setForwardSearchQuery] = useState('')
  const [forwardSuccessMap, setForwardSuccessMap] = useState<Record<string, boolean>>({})

  // Pinned threads & Right Info Drawer state
  const [pinnedThreadIds, setPinnedThreadIds] = useState<Set<string>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('zalo_pinned_thread_ids')
        if (saved) return new Set(JSON.parse(saved))
      } catch (e) {}
    }
    return new Set()
  })

  const [showRightInfoDrawer, setShowRightInfoDrawer] = useState(false)
  const [showHeaderActionMenu, setShowHeaderActionMenu] = useState(false)
  const actionMenuRef = useRef<HTMLDivElement>(null)

  // Persist deletedLocallyMsgIds to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('zalo_deleted_locally_msg_ids', JSON.stringify(Array.from(deletedLocallyMsgIds)))
    } catch (e) {
      console.warn('Failed to save deleted messages to localStorage:', e)
    }
  }, [deletedLocallyMsgIds])

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(e.target as Node)) {
        setShowHeaderActionMenu(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])
  const [drawerTab, setDrawerTab] = useState<'members' | 'media'>('members')
  const [mediaSubTab, setMediaSubTab] = useState<'photos' | 'videos' | 'links'>('photos')
  const [drawerMembers, setDrawerMembers] = useState<{ id: string; name: string; avatar: string }[]>([])
  const [loadingDrawerMembers, setLoadingDrawerMembers] = useState(false)
  const [memberSearchQuery, setMemberSearchQuery] = useState('')
  const [mediaPreviewModalUrl, setMediaPreviewModalUrl] = useState<string | null>(null)
  const chatScrollContainerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll chat area to bottom when active thread or messages update
  const scrollToBottom = () => {
    if (chatScrollContainerRef.current) {
      chatScrollContainerRef.current.scrollTop = chatScrollContainerRef.current.scrollHeight
    }
  }

  useEffect(() => {
    // Scroll immediately and after short delay for image rendering
    scrollToBottom()
    const timer = setTimeout(scrollToBottom, 150)
    return () => clearTimeout(timer)
  }, [activeThreadId, logs.length, historyMessages])

  // Online / Last Active status tracker state
  const [userLastActiveMap, setUserLastActiveMap] = useState<Record<string, number>>({})

  // Media cache state (for Giphy URLs from database)
  const [mediaCache, setMediaCache] = useState<Record<string, string>>({})

  // Helper to parse arbitrary timestamp format into Unix milliseconds
  const parseTimestamp = (raw: any): number => {
    if (!raw) return 0
    if (typeof raw === 'number') {
      return raw > 1e11 ? raw : raw * 1000
    }
    if (typeof raw === 'string') {
      const trimmed = raw.trim()
      if (!isNaN(Number(trimmed))) {
        const num = Number(trimmed)
        return num > 1e11 ? num : num * 1000
      }
      // Handle "HH:mm" e.g. "17:03" or "14:38"
      const timeMatch = trimmed.match(/^(\d{1,2}):(\d{2})$/)
      if (timeMatch) {
        const today = new Date()
        today.setHours(parseInt(timeMatch[1], 10), parseInt(timeMatch[2], 10), 0, 0)
        return today.getTime()
      }
      // Standard Date parse fallback
      const parsedDate = new Date(trimmed).getTime()
      if (!isNaN(parsedDate)) return parsedDate
    }
    return 0
  }

  // Track online activity status based ONLY on incoming user messages & Zalo API
  useEffect(() => {
    const newMap: Record<string, number> = {}

    if (historyMessages) {
      Object.entries(historyMessages).forEach(([tId, msgs]) => {
        if (Array.isArray(msgs)) {
          msgs.forEach((m) => {
            // Only consider incoming messages sent by the recipient (not self/bot auto-replies)
            if (!m.isSelf && m.from && String(m.from) !== String(userInfo?.userId)) {
              const ts = parseTimestamp(m.timestamp)
              if (ts > 0) {
                newMap[tId] = Math.max(newMap[tId] || 0, ts)
                newMap[String(m.from)] = Math.max(newMap[String(m.from)] || 0, ts)
              }
            }
          })
        }
      })
    }

    if (Array.isArray(logs)) {
      logs.forEach((log) => {
        if (!log.isSelf && log.from && String(log.from) !== String(userInfo?.userId)) {
          const ts = parseTimestamp(log.timestamp) || Date.now()
          if (log.threadId) newMap[String(log.threadId)] = Math.max(newMap[String(log.threadId)] || 0, ts)
          newMap[String(log.from)] = Math.max(newMap[String(log.from)] || 0, ts)
        }
      })
    }

    setUserLastActiveMap((prev) => ({ ...newMap, ...prev }))
  }, [historyMessages, logs, userInfo?.userId])

  // Fetch ground-truth presence / lastActiveTs directly from Zalo API periodically
  const activeThreadType = React.useMemo(() => {
    const conv = conversations.find((c) => c.threadId === activeThreadId)
    return conv?.type || 'User'
  }, [activeThreadId, conversations])

  useEffect(() => {
    if (!activeThreadId) return
    if (activeThreadType === 'Group') return

    const fetchStatus = () => {
      fetch(`/api/zalo/user-status?userId=${encodeURIComponent(activeThreadId)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.lastActiveTs > 0) {
            setUserLastActiveMap((prev) => ({
              ...prev,
              [activeThreadId]: data.lastActiveTs,
            }))
          }
        })
        .catch(() => {}) // Silent fail, don't log
    }

    fetchStatus()
    const interval = setInterval(fetchStatus, 30000)
    return () => clearInterval(interval)
  }, [activeThreadId, activeThreadType])

  // 🆕 Fetch online status for ALL user conversations (not just active one)
  // Use a stable key derived from user thread IDs to avoid re-fetching on every conversation update
  const userThreadIdsKey = React.useMemo(() => {
    return conversations
      .filter((c) => c.type === 'User')
      .map((c) => c.threadId)
      .sort()
      .join(',')
  }, [conversations])

  useEffect(() => {
    if (!userInfo || !userThreadIdsKey) return

    const userThreadIds = userThreadIdsKey.split(',').filter(Boolean)
    if (userThreadIds.length === 0) return

    const fetchAllUserStatuses = async () => {
      // Fetch status for all user conversations in parallel
      const promises = userThreadIds.map((threadId) =>
        fetch(`/api/zalo/user-status?userId=${encodeURIComponent(threadId)}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.success && data.lastActiveTs > 0) {
              return { threadId, lastActiveTs: data.lastActiveTs }
            }
            return null
          })
          .catch(() => null) // Silent fail
      )

      const results = await Promise.all(promises)
      const statusMap: Record<string, number> = {}
      
      results.forEach((result) => {
        if (result && result.lastActiveTs > 0) {
          statusMap[result.threadId] = result.lastActiveTs
        }
      })

      if (Object.keys(statusMap).length > 0) {
        setUserLastActiveMap((prev) => ({ ...prev, ...statusMap }))
      }
    }

    // Initial fetch
    fetchAllUserStatuses()

    // Refresh every 60 seconds
    const interval = setInterval(fetchAllUserStatuses, 60000)
    return () => clearInterval(interval)
  }, [userInfo, userThreadIdsKey])

  const getUserOnlineStatus = (threadId: string) => {
    const lastActiveTs = userLastActiveMap[threadId]
    if (lastActiveTs && lastActiveTs > 0) {
      const diffMs = Date.now() - lastActiveTs
      const diffMins = Math.floor(diffMs / (60 * 1000))
      const diffHours = Math.floor(diffMs / (60 * 60 * 1000))

      // Active within last 3 minutes -> Online
      if (diffMs >= 0 && diffMins < 3) {
        return { isOnline: true, statusText: 'Vừa truy cập (Đang hoạt động)' }
      }
      // Active within last 60 minutes -> X phút trước
      if (diffMs >= 0 && diffMins < 60) {
        const mins = Math.max(1, diffMins)
        return { isOnline: false, statusText: `Truy cập ${mins} phút trước` }
      }
      // Active within last 24 hours -> X giờ trước (Strict Math.floor e.g. 2.8h -> 2h)
      if (diffMs >= 0 && diffHours < 24) {
        const hours = Math.max(1, diffHours)
        return { isOnline: false, statusText: `Truy cập ${hours} giờ trước` }
      }
      // Active more than 24 hours ago -> X ngày trước
      if (diffMs >= 0) {
        const days = Math.max(1, Math.floor(diffMs / (24 * 60 * 60 * 1000)))
        return { isOnline: false, statusText: `Truy cập ${days} ngày trước` }
      }
    }

    // Default fallback for unknown status: Not online
    return { isOnline: false, statusText: 'Truy cập lâu trước đây' }
  }

  const togglePinThread = (threadId: string) => {
    setPinnedThreadIds((prev) => {
      const next = new Set(prev)
      if (next.has(threadId)) {
        next.delete(threadId)
        setSyncNotice('📌 Đã bỏ ghim hội thoại!')
      } else {
        next.add(threadId)
        setSyncNotice('📌 Đã ghim hội thoại lên đầu danh sách!')
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem('zalo_pinned_thread_ids', JSON.stringify(Array.from(next)))
      }
      return next
    })
  }

  const handleLeaveGroup = async (groupId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn rời khỏi nhóm này? Hành động này sẽ rời nhóm trên cả Zalo App và Web!')) {
      return
    }
    setSyncNotice('🚪 Đang thực hiện rời nhóm...')
    try {
      const res = await fetch('/api/zalo/leave-group', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId }),
      })
      const data = await res.json()
      if (data.success) {
        setSyncNotice('✅ Đã rời nhóm thành công!')
        setConversations((prev) => prev.filter((c) => String(c.threadId) !== String(groupId)))
        setActiveThreadId(null)
        setShowRightInfoDrawer(false)
      } else {
        setSyncNotice(`❌ Lỗi rời nhóm: ${data.error || 'Vui lòng thử lại'}`)
      }
    } catch (e: any) {
      setSyncNotice(`❌ Lỗi rời nhóm: ${e.message}`)
    }
  }

  // Load group members for drawer when activeThreadId changes
  useEffect(() => {
    if (!activeThreadId) return
    const activeConv = conversations.find((c) => String(c.threadId) === String(activeThreadId))
    if (activeConv?.type === 'Group') {
      setLoadingDrawerMembers(true)
      fetch(`/api/zalo/group-members?groupId=${activeThreadId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.members)) {
            setDrawerMembers(data.members)
          }
        })
        .catch((e) => console.error('Failed to load group members for drawer:', e))
        .finally(() => setLoadingDrawerMembers(false))
    } else {
      setDrawerMembers([])
      setDrawerTab('media')
    }
  }, [activeThreadId, conversations])

  useEffect(() => {
    const handleClose = () => setContextMenu(null)
    window.addEventListener('click', handleClose)
    window.addEventListener('scroll', handleClose, true)
    return () => {
      window.removeEventListener('click', handleClose)
      window.removeEventListener('scroll', handleClose, true)
    }
  }, [])

  useEffect(() => {
    const handleClearChatHistory = () => {
      console.log('🧹 Clearing local chat history in ZaloChatView...')
      setHistoryMessages({})
      if (typeof window !== 'undefined') {
        localStorage.removeItem('zalo_cached_chat_history')
      }
    }
    window.addEventListener('zalo_clear_chat_history', handleClearChatHistory)
    return () => window.removeEventListener('zalo_clear_chat_history', handleClearChatHistory)
  }, [])

  useEffect(() => {
    if (!syncNotice) return
    const timer = setTimeout(() => {
      setSyncNotice(null)
    }, 3000)
    return () => clearTimeout(timer)
  }, [syncNotice])

  const handleCopyMessage = (text: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text)
    } else {
      try {
        const el = document.createElement('textarea')
        el.value = text
        document.body.appendChild(el)
        el.select()
        document.execCommand('copy')
        document.body.removeChild(el)
      } catch (e) {}
    }
    setContextMenu(null)
    setSyncNotice('📋 Đã chép tin nhắn vào bộ nhớ tạm!')
  }

  const handlePinMessage = (msg: Message) => {
    setPinnedMessage(msg)
    setContextMenu(null)
    setSyncNotice('📌 Đã ghim tin nhắn!')
  }

  const handleToggleStar = (msgId: string | number) => {
    setStarredMsgIds((prev) => {
      const next = new Set(prev)
      if (next.has(msgId)) next.delete(msgId)
      else next.add(msgId)
      return next
    })
    setContextMenu(null)
    setSyncNotice('⭐ Đã thay đổi trạng thái đánh dấu tin nhắn!')
  }

  const handleStartMultiSelect = (msgId: string | number) => {
    setIsMultiSelectMode(true)
    setSelectedMsgIds(new Set([msgId]))
    setContextMenu(null)
    setSyncNotice('📑 Đã bật chế độ chọn nhiều tin nhắn')
  }

  const handleToggleSelectMsg = (msgId: string | number) => {
    setSelectedMsgIds((prev) => {
      const next = new Set(prev)
      if (next.has(msgId)) next.delete(msgId)
      else next.add(msgId)
      return next
    })
  }

  const handleDeleteLocalMessage = (msgId: string | number) => {
    // Add to locally deleted set
    setDeletedLocallyMsgIds((prev) => new Set(prev).add(msgId))
    
    // Also remove from historyMessages
    if (activeThreadId) {
      setHistoryMessages((prev) => ({
        ...prev,
        [activeThreadId]: (prev[activeThreadId] || []).filter((m) => m.id !== msgId),
      }))
    }
    
    setContextMenu(null)
    setSyncNotice('🗑️ Đã xóa tin nhắn ở phía bạn (chỉ ẩn trên web này)')
  }

  const handleRecallMessage = async (msg: Message) => {
    if (!msg.isSelf) {
      setSyncNotice('⚠️ Bạn chỉ có thể thu hồi tin nhắn do chính bạn gửi!')
      setContextMenu(null)
      return
    }
    setRecalledMsgIds((prev) => new Set(prev).add(msg.id))
    setContextMenu(null)
    const targetThreadId = String(activeThreadId || msg.threadId || '')
    const activeThread = conversations.find((c) => String(c.threadId) === targetThreadId)
    const threadType = activeThread?.type || msg.type || 'User'

    // Update conversation sidebar preview immediately
    setConversations((prev) =>
      prev.map((c) => {
        if (String(c.threadId) === targetThreadId) {
          return {
            ...c,
            lastMessage: (msg.isSelf ? 'Bạn: ' : '') + 'Tin nhắn đã được thu hồi',
          }
        }
        return c
      })
    )

    // Update history messages content in local state
    setHistoryMessages((prev) => ({
      ...prev,
      [targetThreadId]: (prev[targetThreadId] || []).map((m) =>
        m.id === msg.id || (m.msgId && String(m.msgId) === String(msg.msgId))
          ? { ...m, content: 'Tin nhắn đã được thu hồi', isUndo: true }
          : m
      ),
    }))

    try {
      console.log('🔄 [handleRecallMessage] Attempting to recall message:', {
        msgId: msg.msgId,
        cliMsgId: msg.cliMsgId,
        id: msg.id,
        globalMsgId: (msg as any).globalMsgId,
        threadId: targetThreadId,
        threadType,
      })
      
      const res = await fetch('/api/zalo/undo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId: String((msg as any).globalMsgId || msg.msgId || msg.id),
          cliMsgId: String(msg.cliMsgId || msg.msgId || msg.id),
          threadId: targetThreadId,
          threadType,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setSyncNotice('🔄 Đã thu hồi tin nhắn trên Zalo!')
      } else {
        setSyncNotice(`⚠️ Lỗi thu hồi Zalo: ${data.error || 'Không thể thu hồi'}`)
      }
    } catch (e: any) {
      setSyncNotice('🔄 Đã thu hồi tin nhắn!')
    }
  }

  const handleSendForward = async (targetThreadId: string, targetType: 'Group' | 'User') => {
    if (!forwardingMessage) return
    try {
      const threadTypeNum = targetType === 'Group' ? 1 : 0
      const res = await fetch('/api/zalo/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threadId: targetThreadId,
          threadType: threadTypeNum,
          message: forwardingMessage.content,
        }),
      })
      if (res.ok) {
        setForwardSuccessMap((prev) => ({ ...prev, [targetThreadId]: true }))
      }
    } catch (e) {
      console.error('Forward error:', e)
    }
  }

  const availableMentionMembers = React.useMemo(() => {
    const activeConv = conversations.find((c) => c.threadId === activeThreadId)
    const isGroup = activeConv?.type === 'Group' || (!!activeThreadId && activeThreadId.length > 15)

    const list: { id: string; name: string; avatar: string; isAll?: boolean }[] = [
      { id: 'all_tag', name: 'ALL (Tất cả thành viên)', avatar: '', isAll: true },
    ]

    const groupMems = activeThreadId ? groupMembers[activeThreadId] || [] : []
    const seenIds = new Set<string>()

    groupMems.forEach((m) => {
      if (m.id && !seenIds.has(m.id)) {
        seenIds.add(m.id)
        list.push(m)
      }
    })

    // Only include friends list if it's a 1-on-1 User chat
    if (!isGroup) {
      friendsList.forEach((f) => {
        if (f.id && !seenIds.has(f.id)) {
          seenIds.add(f.id)
          list.push(f)
        }
      })
    }

    return list
  }, [activeThreadId, groupMembers, friendsList, conversations])

  const currentGroupMemberNames = React.useMemo(() => {
    return availableMentionMembers.map((m) => m.name.replace(' (Tất cả thành viên)', ''))
  }, [availableMentionMembers])

  // 1. Load groups & friends on mount to seed conversation list
  const fetchData = useCallback(async () => {
    try {
      console.log('🔍 [fetchData] Starting to fetch groups and friends...')
      
      const [groupsRes, friendsRes] = await Promise.allSettled([
        fetch('/api/zalo/groups'),
        fetch('/api/zalo/friends'),
      ])

      console.log('📊 [fetchData] Groups response:', groupsRes.status, groupsRes.status === 'fulfilled' ? groupsRes.value.status : 'rejected')
      console.log('📊 [fetchData] Friends response:', friendsRes.status, friendsRes.status === 'fulfilled' ? friendsRes.value.status : 'rejected')

      const fetchedConvs: Conversation[] = []

      if (groupsRes.status === 'fulfilled' && groupsRes.value.ok) {
        const gData = await groupsRes.value.json()
        console.log('✅ [fetchData] Groups data:', gData.groups?.length || 0, 'groups')
        if (gData.groups && Array.isArray(gData.groups)) {
          gData.groups.forEach((g: any) => {
            fetchedConvs.push({
              threadId: String(g.id),
              name: g.name || `Nhóm ${g.id}`,
              avatar: g.avatar || '',
              type: 'Group',
              lastMessage: 'Cuộc trò chuyện nhóm',
              lastTime: '',
              totalMember: g.totalMember || 0,
            })
          })
        }
      }

      if (friendsRes.status === 'fulfilled' && friendsRes.value.ok) {
        const fData = await friendsRes.value.json()
        console.log('✅ [fetchData] Friends data received:', fData)
        
        if (fData.friends && Array.isArray(fData.friends)) {
          console.log('👥 [fetchData] Processing', fData.friends.length, 'friends')
          
          const mapUpdates: Record<string, string> = {}
          const fList: { id: string; name: string; avatar: string }[] = []

          fData.friends.forEach((f: any) => {
            const fid = String(f.id)
            let fname = f.name || ''
            
            // Check for special Zalo threads (My Documents, Cloud, etc.)
            if (!fname) {
              // Detect cloud storage / My Documents by ID
              // Known patterns: 787248696178218846 (My Documents)
              if (fid === '787248696178218846' || (fid.startsWith('787') && fid.length > 15)) {
                fname = 'My Documents'
              } else {
                // Generic fallback
                fname = `Người dùng ${fid.slice(-4)}`
              }
            }
            
            if (f.avatar) {
              mapUpdates[fid] = f.avatar
              if (f.name) mapUpdates[f.name] = f.avatar
            }
            fList.push({ id: fid, name: fname, avatar: f.avatar || '' })

            fetchedConvs.push({
              threadId: fid,
              name: fname,
              avatar: f.avatar || '',
              type: 'User',
              lastMessage: 'Bạn bè Zalo',
              lastTime: '',
            })
          })
          setFriendsList(fList)
          console.log('✅ [fetchData] Set friendsList:', fList.length, 'friends')
          console.log('✅ [fetchData] Added', fData.friends.length, 'friends to fetchedConvs')
          setAvatarMap((prev) => ({ ...prev, ...mapUpdates }))
        }
      }

      console.log('📋 [fetchData] Total fetchedConvs:', fetchedConvs.length, '(Groups + Friends)')

      setConversations((prev) => {
        console.log('🔧 [setConversations] Previous conversations:', prev.length)
        
        const map = new Map<string, Conversation>()
        // 1. Seed with existing conversations from logs
        prev.forEach((c) => map.set(c.threadId, c))

        // 2. Override with official fetched friends & groups from Zalo API
        fetchedConvs.forEach((official) => {
          const existing = map.get(official.threadId)
          if (existing) {
            map.set(official.threadId, {
              ...existing,
              name: official.name, // Real friend name (e.g. nguyễn vna thắng)
              avatar: official.avatar || existing.avatar,
              type: official.type,
            })
          } else {
            map.set(official.threadId, official)
          }
        })

        const list = Array.from(map.values())
        list.sort((a, b) => (b.lastTimestamp || 0) - (a.lastTimestamp || 0))
        
        const userCount = list.filter(c => c.type === 'User').length
        const groupCount = list.filter(c => c.type === 'Group').length
        console.log('✅ [setConversations] Final conversations:', list.length, `(${userCount} Users, ${groupCount} Groups)`)
        
        return list
      })
    } catch (e) {
      console.error('❌ [fetchData] Failed to fetch initial chat data:', e)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Handle Manual Sync Messages from Phone
  const handleManualSync = async () => {
    if (isSyncing) return
    setIsSyncing(true)
    setSyncNotice('🔄 Đang gửi yêu cầu đồng bộ tin nhắn từ điện thoại...')

    try {
      await fetchData()

      if (activeThreadId) {
        const activeConv = conversations.find((c) => c.threadId === activeThreadId)
        const convType = activeConv?.type || 'User'
        const res = await fetch(`/api/zalo/history?threadId=${activeThreadId}&type=${convType}`)
        if (res.ok) {
          const data = await res.json()
          if (data.messages && Array.isArray(data.messages)) {
            setHistoryMessages((prev) => ({
              ...prev,
              [activeThreadId]: data.messages,
            }))
          }
        }
      }

      setSyncNotice('✅ Đã đồng bộ tin nhắn & làm mới dữ liệu từ điện thoại!')
    } catch (e) {
      setSyncNotice('⚠️ Đã gửi yêu cầu đồng bộ tin nhắn.')
    } finally {
      setIsSyncing(false)
      setTimeout(() => setSyncNotice(null), 4000)
    }
  }

  // Handle Send Message (text or file)
  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault()
    
    if (!activeThreadId) return
    if (!inputText.trim() && !selectedFile) return
    if (isSending) return

    setIsSending(true)
    
    const activeConv = conversations.find((c) => c.threadId === activeThreadId)
    const threadType = activeConv?.type === 'Group' ? 1 : 0

    try {
      const formData = new FormData()
      formData.append('threadId', activeThreadId)
      formData.append('threadType', String(threadType))
      formData.append('message', inputText.trim())

      // Add quote/reply data if replying to a message
      if (replyingToMessage) {
        formData.append('quote', JSON.stringify({
          id: replyingToMessage.id,
          msgId: replyingToMessage.msgId,
          fromName: replyingToMessage.fromName,
          content: typeof replyingToMessage.content === 'string' 
            ? replyingToMessage.content 
            : JSON.stringify(replyingToMessage.content)
        }))
      }

      if (selectedFile) {
        formData.append('file', selectedFile)
        formData.append('fileName', selectedFile.name)
      }

      // Optimistic UI update
      const tempMsg: Message = {
        id: Date.now(),
        threadId: activeThreadId,
        from: userInfo?.userId || 'self',
        fromName: 'Bạn (Chính mình)',
        avatar: userInfo?.avatar,
        content: selectedFile ? `[Đang gửi: ${selectedFile.name}]` : inputText.trim(),
        timestamp: new Date().toISOString(),
        type: activeConv?.type || 'User',
        isSelf: true,
        quote: replyingToMessage ? {
          id: replyingToMessage.id,
          msgId: replyingToMessage.msgId,
          fromName: replyingToMessage.fromName,
          content: typeof replyingToMessage.content === 'string' 
            ? replyingToMessage.content 
            : '[Media]'
        } : undefined
      }

      setHistoryMessages((prev) => ({
        ...prev,
        [activeThreadId]: [...(prev[activeThreadId] || []), tempMsg]
      }))

      // Clear input
      setInputText('')
      setSelectedFile(null)
      setFilePreviewUrl(null)
      setReplyingToMessage(null)

      // Reset textarea height
      const textarea = document.querySelector('textarea')
      if (textarea) {
        textarea.style.height = 'auto'
      }

      // Send to API
      const res = await fetch('/api/zalo/messages', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (!data.success) {
        setSyncNotice(`⚠️ Lỗi gửi tin nhắn: ${data.error || 'Vui lòng thử lại'}`)
        // Remove optimistic message on error
        setHistoryMessages((prev) => ({
          ...prev,
          [activeThreadId]: (prev[activeThreadId] || []).filter(m => m.id !== tempMsg.id)
        }))
      } else {
        // Update conversation last message
        setConversations((prev) =>
          prev.map((c) =>
            c.threadId === activeThreadId
              ? {
                  ...c,
                  lastMessage: 'Bạn: ' + (selectedFile ? `[File: ${selectedFile.name}]` : inputText.trim()),
                  lastTime: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
                  lastTimestamp: Date.now(),
                }
              : c
          )
        )
      }
    } catch (err: any) {
      console.error('Failed to send message:', err)
      setSyncNotice('⚠️ Lỗi gửi tin nhắn. Vui lòng thử lại!')
    } finally {
      setIsSending(false)
      // Auto scroll to bottom
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    }
  }

  // 2. Sync conversations from incoming message logs
  useEffect(() => {
    if (!logs || logs.length === 0) return

    setConversations((prev) => {
      const map = new Map<string, Conversation>()
      prev.forEach((c) => map.set(c.threadId, c))

      // Process logs in chronological order to find last messages
      const reversedLogs = [...logs].reverse()
      reversedLogs.forEach((msg) => {
        const tid = String(msg.threadId)
        const existing = map.get(tid)

        const msgTime = msg.timestamp ? new Date(msg.timestamp).getTime() : Date.now()
        const timeStr = msg.timestamp
          ? new Date(msg.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
          : ''

        let convName = existing?.name
        if (!convName || convName === 'Bạn (Chính mình)') {
          if (!msg.isSelf && msg.fromName && msg.fromName !== 'Bạn (Chính mình)') {
            convName = msg.fromName
          } else {
            convName = msg.type === 'Group' ? `Nhóm ${tid}` : `Bạn ${tid.slice(-4)}`
          }
        }

        map.set(tid, {
          threadId: tid,
          name: convName,
          avatar: existing?.avatar || '',
          type: msg.type || existing?.type || 'User',
          lastMessage: (msg.isSelf ? 'Bạn: ' : '') + getLastMessagePreview(msg.content),
          lastTime: timeStr || existing?.lastTime || '',
          lastTimestamp: Math.max(existing?.lastTimestamp || 0, msgTime),
          totalMember: existing?.totalMember,
        })
      })

      const updatedList = Array.from(map.values())
      updatedList.sort((a, b) => (b.lastTimestamp || 0) - (a.lastTimestamp || 0))
      return updatedList
    })
  }, [logs])

  // Fetch past chat history from Zalo when selecting a conversation
  useEffect(() => {
    if (!activeThreadId) return
    const activeConv = conversations.find((c) => c.threadId === activeThreadId)
    const isGroupThread = activeConv?.type === 'Group' || (activeThreadId && activeThreadId.length > 15)
    const convType = isGroupThread ? 'Group' : (activeConv?.type || 'User')

    const fetchHistory = async () => {
      setIsLoadingHistory(true)
      try {
        const res = await fetch(`/api/zalo/history?threadId=${activeThreadId}&type=${convType}`)
        if (res.ok) {
          const data = await res.json()
          if (data.memberAvatars) {
            setAvatarMap((prev) => ({ ...prev, ...data.memberAvatars }))
          }
          if (data.members && Array.isArray(data.members) && data.members.length > 0) {
            setGroupMembers((prev) => ({
              ...prev,
              [activeThreadId]: data.members,
            }))
          }
          if (data.messages && Array.isArray(data.messages)) {
            setHistoryMessages((prev) => ({
              ...prev,
              [activeThreadId]: data.messages,
            }))

            if (data.messages.length > 0) {
              const latestMsg = data.messages[data.messages.length - 1]
              const latestTs = latestMsg.timestamp ? new Date(latestMsg.timestamp).getTime() : 0

              setConversations((prev) => {
                const map = new Map<string, Conversation>()
                prev.forEach((c) => map.set(c.threadId, c))
                const existing = map.get(activeThreadId)
                if (existing) {
                  map.set(activeThreadId, {
                    ...existing,
                    lastMessage: (latestMsg.isSelf ? 'Bạn: ' : '') + getLastMessagePreview(latestMsg.content),
                    lastTime: new Date(latestMsg.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
                    lastTimestamp: Math.max(existing.lastTimestamp || 0, latestTs),
                  })
                }
                const list = Array.from(map.values())
                list.sort((a, b) => (b.lastTimestamp || 0) - (a.lastTimestamp || 0))
                return list
              })
            }
          }
        }
      } catch (e) {
        console.error('Fetch history error:', e)
      } finally {
        setIsLoadingHistory(false)
      }
    }

    if (isGroupThread) {
      fetch(`/api/zalo/group-members?groupId=${activeThreadId}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.members && Array.isArray(data.members) && data.members.length > 0) {
            setGroupMembers((prev) => ({
              ...prev,
              [activeThreadId]: data.members,
            }))
            const mapUpdates: Record<string, string> = {}
            data.members.forEach((m: any) => {
              if (m.avatar) {
                mapUpdates[m.id] = m.avatar
                if (m.name) mapUpdates[m.name] = m.avatar
              }
            })
            setAvatarMap((prev) => ({ ...prev, ...mapUpdates }))
          }
        })
        .catch((err) => console.error('Fetch group-members error:', err))
    }

    fetchHistory()

    if (convType === 'Group') {
      fetch(`/api/zalo/group-members?groupId=${activeThreadId}`)
        .then((r) => r.json())
        .then((gData) => {
          if (gData.members && Array.isArray(gData.members)) {
            setGroupMembers((prev) => ({
              ...prev,
              [activeThreadId]: gData.members,
            }))
            const newMap: Record<string, string> = {}
            gData.members.forEach((m: any) => {
              if (m.avatar) {
                newMap[m.id] = m.avatar
                newMap[m.name] = m.avatar
              }
            })
            setAvatarMap((prev) => ({ ...prev, ...newMap }))
          }
        })
        .catch(() => {})
    }
  }, [activeThreadId])

  // Select active conversation from localStorage or first conversation
  useEffect(() => {
    if (conversations.length > 0) {
      const savedId = typeof window !== 'undefined' ? localStorage.getItem('zalo_active_thread_id') : null
      if (savedId && conversations.some((c) => c.threadId === savedId)) {
        if (activeThreadId !== savedId) {
          setActiveThreadId(savedId)
        }
      } else if (!activeThreadId) {
        const firstId = conversations[0].threadId
        setActiveThreadId(firstId)
        if (typeof window !== 'undefined') {
          localStorage.setItem('zalo_active_thread_id', firstId)
        }
      }
    }
  }, [conversations])

  // Auto-load history when activeThreadId changes
  useEffect(() => {
    if (!activeThreadId) return
    
    // Load history if not loaded yet
    if (!historyMessages[activeThreadId] || historyMessages[activeThreadId].length === 0) {
      const conv = conversations.find((c) => c.threadId === activeThreadId)
      if (!conv) return
      
      console.log(`📥 Auto-loading history for active thread: ${activeThreadId}`)
      
      fetch(`/api/zalo/history?threadId=${activeThreadId}&type=${conv.type}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.messages)) {
            setHistoryMessages((prev) => ({
              ...prev,
              [activeThreadId]: data.messages,
            }))
            console.log(`✅ Loaded ${data.messages.length} messages for thread ${activeThreadId}`)
          }
        })
        .catch((e) => console.error('Failed to auto-load history:', e))
    }
  }, [activeThreadId, conversations])

  // Auto scroll to bottom of chat history when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs, historyMessages, activeThreadId])

  // Toggle whitelist (auto-reply enable for group)
  const toggleWhitelistGroup = (threadId: string) => {
    const exists = whitelist.includes(threadId)
    const newList = exists ? whitelist.filter((id) => id !== threadId) : [...whitelist, threadId]
    onWhitelistChange(newList)
  }

  const activeConv = conversations.find((c) => c.threadId === activeThreadId)

  // Merge chat history with real-time incoming SSE logs with smart deduplication
  const activeHistory = (activeThreadId ? historyMessages[activeThreadId] : []) || []
  const activeRealtimeLogs = logs.filter((m) => String(m.threadId) === String(activeThreadId))

  const rawCombined = [...activeHistory, ...activeRealtimeLogs]
  const activeMessages: Message[] = []

  const parseTs = (ts: any) => {
    if (!ts) return 0
    if (typeof ts === 'number') return ts > 1e11 ? ts : ts * 1000
    const parsed = Date.parse(ts)
    if (!isNaN(parsed)) return parsed
    if (typeof ts === 'string' && ts.includes(':')) {
      const parts = ts.split(':')
      const h = parseInt(parts[0], 10)
      const m = parseInt(parts[1], 10)
      if (!isNaN(h) && !isNaN(m)) {
        const d = new Date()
        d.setHours(h, m, 0, 0)
        return d.getTime()
      }
    }
    return 0
  }

  rawCombined.forEach((msg) => {
    // Skip locally deleted messages
    if (deletedLocallyMsgIds.has(msg.id)) {
      return // Skip this deleted message
    }
    
    // Skip undo event messages (JSON arrays with actionType)
    if (typeof msg.content === 'string') {
      const trimmed = msg.content.trim()
      if (trimmed.startsWith('[{') && trimmed.includes('"actionType"') && trimmed.includes('"clientDelMsgId"')) {
        return // Skip this undo event message
      }
    }

    // Skip messages that have been recalled/undone
    if (msg.isUndo) {
      return // Skip recalled messages
    }

    const dupIdx = activeMessages.findIndex((existing) => {
      if (existing.msgId && msg.msgId && String(existing.msgId) === String(msg.msgId)) return true
      if (existing.cliMsgId && msg.cliMsgId && String(existing.cliMsgId) === String(msg.cliMsgId)) return true
      if (String(existing.id) === String(msg.id)) return true

      const existingText = typeof existing.content === 'string'
        ? existing.content
        : (typeof existing.content === 'object' && existing.content !== null
          ? ((existing.content as any).catId || (existing.content as any).id ? '[Nhãn dán / Sticker]' : JSON.stringify(existing.content))
          : String(existing.content || ''))

      const msgText = typeof msg.content === 'string'
        ? msg.content
        : (typeof msg.content === 'object' && msg.content !== null
          ? ((msg.content as any).catId || (msg.content as any).id ? '[Nhãn dán / Sticker]' : JSON.stringify(msg.content))
          : String(msg.content || ''))

      const isSameContent = existingText.trim() === msgText.trim()
      const isSameSender = existing.isSelf === msg.isSelf
      
      const t1 = parseTs(existing.timestamp)
      const t2 = parseTs(msg.timestamp)
      const timeDiff = (t1 > 0 && t2 > 0) ? Math.abs(t1 - t2) : 0

      // 1. Exact string match + same sender + within 15 seconds
      if (isSameContent && isSameSender && (timeDiff < 15000 || t1 === 0 || t2 === 0)) return true

      // 2. Check if both have msgId - if different msgIds, they are different messages (don't merge)
      if (existing.msgId && msg.msgId && String(existing.msgId) !== String(msg.msgId)) {
        return false // Different messages, don't merge
      }

      // 3. Both are self-sent image messages within 15 seconds -> merge temp local image with Zalo listener/history response
      const isImgA = existingText.includes('"type":"image"') || existingText.includes('[Hình ảnh]') || existingText.includes('"href"') || existingText.includes('"thumb"') || existingText.includes('giphy.com')
      const isImgB = msgText.includes('"type":"image"') || msgText.includes('[Hình ảnh]') || msgText.includes('"href"') || msgText.includes('"thumb"') || msgText.includes('giphy.com')
      if (isSameSender && existing.isSelf && isImgA && isImgB && (timeDiff < 15000 || t1 === 0 || t2 === 0)) return true

      // 4. Both are self-sent file messages within 15 seconds
      const isFileA = existingText.includes('"type":"file"') || existingText.includes('[Tập tin]')
      const isFileB = msgText.includes('"type":"file"') || msgText.includes('[Tập tin]')
      if (isSameSender && existing.isSelf && isFileA && isFileB && (timeDiff < 15000 || t1 === 0 || t2 === 0)) return true

      return false
    })

    if (dupIdx === -1) {
      activeMessages.push(msg)
    } else {
      const existing = activeMessages[dupIdx]
      
      // Smart merge: Keep the content with better quality (prioritize Giphy URLs over Zalo CDN)
      const extractGiphyUrl = (str: any): string | null => {
        if (typeof str !== 'string') return null
        try {
          const parsed = JSON.parse(str)
          // Check if this is a Giphy URL (from mediaCache/localStorage)
          if (parsed.url && String(parsed.url).includes('giphy.com')) {
            return parsed.url
          }
          if (parsed.href && String(parsed.href).includes('giphy.com')) {
            return parsed.href
          }
        } catch {}
        return null
      }
      
      const hasRealUrl = (str: any) => {
        if (typeof str !== 'string') return false
        try {
          const parsed = JSON.parse(str)
          return parsed.url && parsed.url.startsWith('http')
        } catch {
          return str.includes('"url":"http') || str.includes('"href":"http') || str.includes('"thumb":"http')
        }
      }
      
      const existingGiphyUrl = extractGiphyUrl(existing.content)
      const msgGiphyUrl = extractGiphyUrl(msg.content)
      const existingHasUrl = hasRealUrl(existing.content)
      const msgHasUrl = hasRealUrl(msg.content)
      
      // Priority 1: Keep Giphy URL (never expires)
      let preferredContent = existing.content
      if (msgGiphyUrl) {
        preferredContent = msg.content // New message has Giphy URL
      } else if (existingGiphyUrl) {
        preferredContent = existing.content // Keep existing Giphy URL
      } else if (msgHasUrl && !existingHasUrl) {
        preferredContent = msg.content // New message has some URL
      } else if (existingHasUrl) {
        preferredContent = existing.content // Keep existing URL
      } else {
        preferredContent = msg.content || existing.content
      }

      activeMessages[dupIdx] = {
        ...existing,
        ...msg,
        content: preferredContent,
      }
    }
  })

  // Sort messages by timestamp (oldest first, newest last)
  // If timestamps are equal, sort by msgId/cliMsgId for consistent ordering
  activeMessages.sort((a, b) => {
    const tsA = parseTs(a.timestamp)
    const tsB = parseTs(b.timestamp)
    
    if (tsA !== tsB) {
      return tsA - tsB // Primary sort: timestamp ascending (oldest → newest)
    }
    
    // Secondary sort: msgId/cliMsgId for messages with same timestamp
    const idA = parseInt(String(a.msgId || a.cliMsgId || a.id || '0'))
    const idB = parseInt(String(b.msgId || b.cliMsgId || b.id || '0'))
    return idA - idB // Ascending order (smaller ID = older)
  })

  // Filtered conversation list
  const filteredConversations = conversations.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.threadId.includes(searchQuery)
    if (filterTab === 'user') return matchesSearch && c.type === 'User'
    if (filterTab === 'group') return matchesSearch && c.type === 'Group'
    return matchesSearch
  })

  const isGroupBotWhitelisted = activeThreadId ? whitelist.includes(activeThreadId) : false

  return (
    <div className="relative flex-1 min-h-0 bg-dark-300 rounded-2xl md:rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex animate-slideIn">
      {/* Toast Notice */}
      {syncNotice && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-sky-600/90 text-white text-xs px-4 py-2 rounded-2xl shadow-xl border border-white/20 flex items-center gap-2 animate-pulse">
          <span>{syncNotice}</span>
        </div>
      )}

      {/* 1. Leftmost Icon Navigation Bar */}
      <div className="hidden md:flex w-16 bg-dark-400 border-r border-white/10 flex-col items-center py-4 justify-between select-none">
        <div className="flex flex-col items-center gap-6">
          <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shadow-lg text-white font-bold text-lg">
            Z
          </div>

          <button
            title="Chat Zalo"
            className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center transition-all"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </button>

          <button
            onClick={onSwitchToDashboard}
            title="Quản lý Bot & Presets"
            className="w-10 h-10 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-all"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
          </button>
        </div>

        {/* Bottom User Avatar */}
        <div className="relative group">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary p-0.5 shadow-md">
            {userInfo?.avatar ? (
              <img src={userInfo.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
            ) : (
              <div className="w-full h-full rounded-full bg-dark-200 flex items-center justify-center text-xs font-bold text-white">
                {userInfo?.displayName?.charAt(0) || 'U'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Middle Conversation List Column */}
      <div className={`${activeThreadId ? 'hidden md:flex' : 'flex'} w-full md:w-80 bg-dark-200 border-r border-white/10 flex-col`}>
        {/* Search & Header */}
        <div className="p-4 border-b border-white/10 space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Tìm kiếm trò chuyện..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-dark-300 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-primary"
              />
              <svg className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              title="Đồng bộ tin nhắn từ điện thoại"
              className="px-2.5 py-2 bg-sky-600/20 hover:bg-sky-600/30 border border-sky-500/40 text-sky-400 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all disabled:opacity-50"
            >
              <span className={isSyncing ? 'animate-spin' : ''}>🔄</span>
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex bg-dark-300 p-1 rounded-xl text-xs">
            <button
              onClick={() => setFilterTab('all')}
              className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${
                filterTab === 'all' ? 'bg-primary text-white shadow' : 'text-gray-400 hover:text-white'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setFilterTab('user')}
              className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${
                filterTab === 'user' ? 'bg-primary text-white shadow' : 'text-gray-400 hover:text-white'
              }`}
            >
              Cá nhân ({conversations.filter((c) => c.type === 'User').length})
            </button>
            <button
              onClick={() => setFilterTab('group')}
              className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${
                filterTab === 'group' ? 'bg-primary text-white shadow' : 'text-gray-400 hover:text-white'
              }`}
            >
              Nhóm ({conversations.filter((c) => c.type === 'Group').length})
            </button>
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto divide-y divide-white/5">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-xs">
              Chưa có cuộc trò chuyện nào. Khi có tin nhắn đến, trò chuyện sẽ hiển thị ở đây.
            </div>
          ) : (
            [...filteredConversations]
              .sort((a, b) => {
                const isAPinned = pinnedThreadIds.has(String(a.threadId))
                const isBPinned = pinnedThreadIds.has(String(b.threadId))
                if (isAPinned && !isBPinned) return -1
                if (!isAPinned && isBPinned) return 1
                return 0
              })
              .map((conv) => {
                const isActive = conv.threadId === activeThreadId
                const isWhitelisted = whitelist.includes(conv.threadId)
                const isPinned = pinnedThreadIds.has(String(conv.threadId))
                const isMuted = mutedThreadIds.has(String(conv.threadId))

                return (
                  <div
                    key={conv.threadId}
                    onClick={async () => {
                      setActiveThreadId(conv.threadId)
                      if (typeof window !== 'undefined') {
                        localStorage.setItem('zalo_active_thread_id', conv.threadId)
                      }
                      
                      // Auto-load history if not loaded yet
                      if (!historyMessages[conv.threadId] || historyMessages[conv.threadId].length === 0) {
                        console.log(`📥 Auto-loading history for thread: ${conv.threadId}`)
                        try {
                          const res = await fetch(`/api/zalo/history?threadId=${conv.threadId}&type=${conv.type}`)
                          if (res.ok) {
                            const data = await res.json()
                            if (data.success && Array.isArray(data.messages)) {
                              setHistoryMessages((prev) => ({
                                ...prev,
                                [conv.threadId]: data.messages,
                              }))
                              console.log(`✅ Loaded ${data.messages.length} messages for thread ${conv.threadId}`)
                            }
                          }
                        } catch (e) {
                          console.error('Failed to auto-load history:', e)
                        }
                      }
                    }}
                    className={`p-3 flex items-center gap-3 cursor-pointer transition-all hover:bg-white/5 ${
                      isActive ? 'bg-primary/15 border-l-4 border-primary' : ''
                    } ${isPinned ? 'bg-amber-500/5' : ''}`}
                  >
                    <div className="relative">
                      {conv.avatar ? (
                        <img src={conv.avatar} alt={conv.name} className="w-11 h-11 rounded-2xl object-cover" />
                      ) : (
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-600 to-blue-500 flex items-center justify-center text-white font-bold text-sm shadow">
                          {conv.type === 'Group' ? '👨‍👩‍👧' : conv.name.charAt(0)}
                        </div>
                      )}

                      {conv.type === 'Group' ? (
                        <span className="absolute -bottom-1 -right-1 bg-dark-300 text-[10px] text-sky-400 font-bold px-1 rounded-md border border-white/10">
                          Group
                        </span>
                      ) : (
                        (() => {
                          const status = getUserOnlineStatus(conv.threadId)
                          return (
                            <span
                              className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-dark-200 shadow ${
                                status.isOnline ? 'bg-emerald-400 ring-1 ring-emerald-400/50 animate-pulse' : 'bg-gray-500'
                              }`}
                              title={status.statusText}
                            />
                          )
                        })()
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-semibold text-white truncate max-w-[130px] flex items-center gap-1">
                          {isPinned && <span className="text-amber-400 text-[10px]" title="Đã ghim">📌</span>}
                          {isMuted && <span className="text-gray-500 text-[10px]" title="Đã tắt thông báo">🔕</span>}
                          <span className="truncate">{conv.name}</span>
                        </h4>
                        <span className="text-[10px] text-gray-400">{conv.lastTime}</span>
                      </div>

                      <p className="text-[11px] text-gray-400 truncate mt-0.5">
                        {conv.lastMessage}
                      </p>

                      {conv.type === 'Group' && (
                        <div className="mt-1 flex items-center gap-1.5">
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                              isWhitelisted ? 'bg-success/20 text-success' : 'bg-gray-700 text-gray-400'
                            }`}
                          >
                            {isWhitelisted ? '🤖 Auto-Reply Bật' : '🤖 Auto-Reply Tắt'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })
          )}
        </div>
      </div>

      {/* 3. Right Chat History & Input Area */}
      <div className={`${activeThreadId ? 'flex' : 'hidden md:flex'} flex-1 bg-dark-300 flex-col min-w-0`}>
        {activeConv ? (
          <>
            {/* Top Chat Header */}
            <div className={`sticky top-0 p-3 sm:p-4 bg-dark-200 border-b border-white/10 flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 z-50 shadow-lg ${showRightInfoDrawer ? 'hidden' : 'flex'}`}>
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                {/* Mobile Back Button */}
                <button
                  onClick={() => setActiveThreadId(null)}
                  className="md:hidden p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1 flex-shrink-0"
                  title="Quay lại danh sách"
                >
                  <span>←</span>
                  <span className="hidden sm:inline">Danh sách</span>
                </button>

                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-primary/20 flex items-center justify-center text-primary font-bold flex-shrink-0">
                  {activeConv.avatar ? (
                    <img src={activeConv.avatar} alt={activeConv.name} className="w-full h-full rounded-2xl object-cover" />
                  ) : (
                    activeConv.name.charAt(0)
                  )}
                </div>

                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5 truncate">
                    <span className="truncate">{activeConv.name}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 bg-white/10 rounded text-gray-300 flex-shrink-0">
                      ID: {activeConv.threadId}
                    </span>
                  </h3>
                  <div className="text-[11px] sm:text-xs text-gray-400 truncate flex items-center gap-1.5 mt-0.5">
                    {activeConv.type === 'Group' ? (
                      <span>{activeConv.totalMember || 0} thành viên • Nhóm Zalo</span>
                    ) : (
                      (() => {
                        const status = getUserOnlineStatus(activeConv.threadId)
                        return (
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                status.isOnline ? 'bg-emerald-400 ring-2 ring-emerald-400/30 animate-pulse' : 'bg-gray-500'
                              }`}
                            />
                            <span className={status.isOnline ? 'text-emerald-400 font-semibold' : 'text-gray-400'}>
                              {status.statusText}
                            </span>
                          </div>
                        )
                      })()
                    )}
                  </div>
                </div>
              </div>

              {/* Bot Control & Action Buttons for Active Chat */}
              <div className={`flex items-center gap-1 sm:gap-1.5 flex-shrink-0 relative ${showRightInfoDrawer ? 'hidden md:flex' : 'flex'}`}>
                {activeConv.type === 'Group' && (
                  <button
                    onClick={() => toggleWhitelistGroup(activeConv.threadId)}
                    className={`btn text-[10px] sm:text-xs py-1 sm:py-1.5 px-1.5 sm:px-2.5 flex items-center gap-0.5 sm:gap-1 rounded-lg sm:rounded-xl border transition-all flex-shrink-0 ${
                      isGroupBotWhitelisted
                        ? 'bg-success/20 border-success/40 text-success'
                        : 'bg-dark-300 border-white/10 text-gray-400 hover:text-white'
                    }`}
                    title={isGroupBotWhitelisted ? 'Tắt Auto-Reply nhóm' : 'Bật Auto-Reply nhóm'}
                  >
                    <span className="text-sm sm:text-base">🤖</span>
                    <span className="hidden xl:inline">Auto-Reply: {isGroupBotWhitelisted ? 'Đang BẬT' : 'Đang TẮT'}</span>
                    <span className="xl:hidden">{isGroupBotWhitelisted ? 'BẬT' : 'TẮT'}</span>
                  </button>
                )}

                {/* Dropdown Menu for extra actions */}
                <div ref={actionMenuRef} className="relative">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowHeaderActionMenu((prev) => !prev)
                    }}
                    className="btn text-[10px] sm:text-xs py-1 sm:py-1.5 px-2 sm:px-3 flex items-center gap-0.5 sm:gap-1 rounded-lg sm:rounded-xl border border-white/15 bg-dark-300 hover:bg-white/10 text-gray-200 transition-all flex-shrink-0 shadow cursor-pointer"
                    title="Menu tính năng"
                  >
                    <span className="text-sm sm:text-base">⚡</span>
                    <span className="hidden sm:inline font-medium">Thao tác</span>
                    <span className="sm:hidden font-medium">Menu</span>
                    <span className="text-[8px] sm:text-[9px]">▼</span>
                  </button>

                  {showHeaderActionMenu && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="
                        fixed mt-2 w-56 max-w-[calc(100vw-2rem)]
                        bg-dark-100 border border-white/20 rounded-2xl shadow-2xl overflow-hidden 
                        z-[9999] backdrop-blur-xl animate-fadeIn divide-y divide-white/10
                      "
                      style={{
                        top: actionMenuRef.current
                          ? `${actionMenuRef.current.getBoundingClientRect().bottom + 8}px`
                          : '0px',
                        left: window.innerWidth < 640
                          ? '50%'
                          : actionMenuRef.current
                            ? `${actionMenuRef.current.getBoundingClientRect().right - 224}px`
                            : '0px',
                        transform: window.innerWidth < 640 ? 'translateX(-50%)' : 'none'
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          handleManualSync()
                          setShowHeaderActionMenu(false)
                        }}
                        disabled={isSyncing}
                        className="w-full px-4 py-3 flex items-center gap-3 text-left text-xs text-sky-300 hover:bg-white/10 transition-all font-medium cursor-pointer"
                      >
                        <span className={isSyncing ? 'animate-spin text-base' : 'text-base'}>🔄</span>
                        <span>{isSyncing ? 'Đang đồng bộ...' : 'Đồng bộ tin nhắn'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setShowBgModal(true)
                          setShowHeaderActionMenu(false)
                        }}
                        className="w-full px-4 py-3 flex items-center gap-3 text-left text-xs text-purple-300 hover:bg-white/10 transition-all font-medium cursor-pointer"
                      >
                        <span className="text-base">🎨</span>
                        <span>Đổi hình nền Chat</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onSwitchToDashboard()
                          setShowHeaderActionMenu(false)
                        }}
                        className="w-full px-4 py-3 flex items-center gap-3 text-left text-xs text-gray-200 hover:bg-white/10 transition-all font-medium cursor-pointer"
                      >
                        <span className="text-base">⚙️</span>
                        <span>Cài đặt Bot Zalo</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (activeConv) togglePinThread(String(activeConv.threadId))
                          setShowHeaderActionMenu(false)
                        }}
                        className="w-full px-4 py-3 flex items-center gap-3 text-left text-xs text-amber-300 hover:bg-white/10 transition-all font-medium cursor-pointer"
                      >
                        <span className="text-base">📌</span>
                        <span>{activeConv && pinnedThreadIds.has(String(activeConv.threadId)) ? 'Bỏ ghim hội thoại' : 'Ghim hội thoại lên đầu'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (activeConv) toggleMuteThread(String(activeConv.threadId))
                          setShowHeaderActionMenu(false)
                        }}
                        className={`w-full px-4 py-3 flex items-center gap-3 text-left text-xs hover:bg-white/10 transition-all font-medium cursor-pointer ${
                          activeConv && mutedThreadIds.has(String(activeConv.threadId))
                            ? 'text-emerald-400'
                            : 'text-orange-300'
                        }`}
                      >
                        <span className="text-base">{activeConv && mutedThreadIds.has(String(activeConv.threadId)) ? '🔔' : '🔕'}</span>
                        <span>{activeConv && mutedThreadIds.has(String(activeConv.threadId)) ? 'Bật lại thông báo' : 'Tắt thông báo'}</span>
                      </button>
                      {activeConv?.type === 'Group' && (
                        <button
                          type="button"
                          onClick={() => {
                            handleLeaveGroup(String(activeConv.threadId))
                            setShowHeaderActionMenu(false)
                          }}
                          className="w-full px-4 py-3 flex items-center gap-3 text-left text-xs text-red-400 hover:bg-white/10 transition-all font-medium cursor-pointer"
                        >
                          <span className="text-base">🚪</span>
                          <span>Rời khỏi nhóm này</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Primary Information Button - GUARANTEED ALWAYS FULL & VISIBLE */}
                <button
                  onClick={() => setShowRightInfoDrawer(!showRightInfoDrawer)}
                  title="Thông tin hội thoại"
                  className={`btn text-[10px] sm:text-xs py-1 sm:py-1.5 px-2 sm:px-3 flex items-center gap-1 sm:gap-1.5 rounded-lg sm:rounded-xl border transition-all flex-shrink-0 font-bold shadow-lg ${
                    showRightInfoDrawer
                      ? 'bg-primary border-primary text-white ring-2 ring-primary/40'
                      : 'bg-gradient-to-r from-sky-600 to-blue-600 border-sky-500 text-white hover:brightness-110'
                  }`}
                >
                  <span className="text-sm sm:text-base">ℹ️</span>
                  <span className="hidden sm:inline">Thông tin</span>
                  <span className="sm:hidden">Info</span>
                </button>
              </div>
            </div>

            {/* Pinned Message Bar */}
            {pinnedMessage && (
              <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/30 flex items-center justify-between text-xs text-amber-300 animate-slideDown backdrop-blur-sm">
                <div className="flex items-center gap-2 truncate">
                  <span className="text-amber-400 font-bold">📌 Tin nhắn ghim:</span>
                  <span className="text-gray-200 truncate">"{pinnedMessage.content}"</span>
                </div>
                <button
                  onClick={() => setPinnedMessage(null)}
                  className="text-amber-400 hover:text-white text-xs px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/40 transition-colors"
                >
                  Bỏ ghim
                </button>
              </div>
            )}

            {/* Dynamic list of known member names for mention rendering */}
            {(() => {
              const currentGroupMemberNames = [
                'ALL',
                'Tất cả',
                'Tất cả thành viên',
                ...(groupMembers[activeThreadId || ''] || []).map((m) => m.name),
                ...activeMessages.map((m) => m.fromName),
                ...conversations.map((c) => c.name),
              ]
              const isImageBg = chatBg && (chatBg.startsWith('/') || chatBg.startsWith('http') || chatBg.startsWith('data:'))
              const isGradientBg = chatBg && chatBg.includes('gradient')

              return (
                <div
                  ref={chatScrollContainerRef}
                  className={`flex-1 p-4 overflow-y-auto space-y-4 relative transition-all duration-300 ${
                    chatBg === 'default' || !chatBg ? 'bg-gradient-to-b from-dark-300 via-dark-300 to-dark-400' : ''
                  }`}
                  style={{
                    backgroundImage: isImageBg
                      ? `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url("${chatBg}")`
                      : isGradientBg
                      ? chatBg
                      : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    backgroundAttachment: 'fixed',
                  }}
                >
              {isLoadingHistory ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3 relative z-10">
                  <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-xs text-gray-400">Đang đồng bộ lịch sử tin nhắn từ Zalo...</p>
                </div>
              ) : activeMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-2 opacity-60 relative z-10">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-3xl mb-2">
                    💬
                  </div>
                  <h4 className="text-sm font-bold text-white">Chưa có tin nhắn hiển thị</h4>
                  <p className="text-xs text-gray-400 max-w-xs">
                    Tin nhắn mới nhận hoặc tự gửi sẽ xuất hiện tức thì tại đây theo thời gian thực.
                  </p>
                </div>
              ) : (
                activeMessages.map((msg, idx) => {
                  const isMine = msg.isSelf

                  // Check if previous message is from the exact same sender & type
                  const prevMsg = idx > 0 ? activeMessages[idx - 1] : null
                  const isSameSenderAsPrev =
                    !!prevMsg &&
                    prevMsg.isSelf === msg.isSelf &&
                    ((prevMsg.from && msg.from && prevMsg.from === msg.from) ||
                      (prevMsg.fromName && msg.fromName && prevMsg.fromName === msg.fromName))

                  const isFirstInGroup = !isSameSenderAsPrev

                  const avatarSrc =
                    msg.avatar ||
                    avatarMap[msg.from] ||
                    avatarMap[msg.fromName] ||
                    (activeConv?.type === 'User' && !isMine ? activeConv?.avatar : '')

                  const initialLetter =
                    (isMine ? userInfo?.displayName : msg.fromName)?.charAt(0)?.toUpperCase() ||
                    (isMine ? 'B' : 'U')

                  return (
                    <div
                      key={msg.id || idx}
                      data-msg-id={msg.globalMsgId || msg.msgId || msg.id}
                      className={`flex gap-2.5 items-start ${
                        isMine ? 'flex-row-reverse' : 'flex-row'
                      } ${isFirstInGroup ? 'mt-3' : 'mt-1'} animate-slideIn group relative z-10`}
                    >
                      {/* Sender Avatar Container */}
                      <div className="flex-shrink-0 w-8 h-8">
                        {isFirstInGroup ? (
                          !isMine ? (
                            avatarSrc ? (
                              <img
                                src={avatarSrc}
                                alt={msg.fromName}
                                className="w-8 h-8 rounded-full object-cover border border-white/15 shadow-md"
                                onError={(e) => {
                                  ;(e.target as HTMLElement).style.display = 'none'
                                }}
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-600 to-indigo-600 border border-white/15 flex items-center justify-center text-white font-bold text-xs shadow-md">
                                {initialLetter}
                              </div>
                            )
                          ) : userInfo?.avatar ? (
                            <img
                              src={userInfo.avatar}
                              alt="Chính mình"
                              className="w-8 h-8 rounded-full object-cover border border-primary/40 shadow-md"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-blue-600 border border-white/15 flex items-center justify-center text-white font-bold text-xs shadow-md">
                              {initialLetter}
                            </div>
                          )
                        ) : null}
                      </div>

                      {/* Message Bubble Column */}
                      <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} max-w-[75%]`}>
                        {isFirstInGroup && (
                          <div className="flex items-center gap-2 px-1 mb-1">
                            <span className="text-[11px] text-gray-300 font-semibold">{msg.fromName}</span>
                            <span className="text-[9px] text-gray-400 font-mono">
                              {msg.timestamp
                                ? new Date(msg.timestamp).toLocaleTimeString('vi-VN', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : ''}
                            </span>
                            {msg.replied && (
                              <span className="text-[9px] bg-primary/20 text-primary border border-primary/30 px-1.5 py-0.2 rounded font-bold">
                                🤖 Auto-reply
                              </span>
                            )}
                          </div>
                        )}

                        {/* Recalled Message View or Standard Message Bubble */}
                        {recalledMsgIds.has(msg.id) || msg.isUndo || msg.content === 'Tin nhắn đã được thu hồi' ? (
                          <div className="px-4 py-2 text-xs italic text-gray-300 bg-dark-200 border border-white/20 rounded-2xl flex items-center gap-2 shadow-md relative z-10">
                            <span className="opacity-80 text-sm">🔄</span>
                            <span>Tin nhắn đã được thu hồi</span>
                          </div>
                        ) : (
                          <div className={`flex items-center gap-1.5 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                            {/* Multi-select Checkbox */}
                            {isMultiSelectMode && (
                              <input
                                type="checkbox"
                                checked={selectedMsgIds.has(msg.id)}
                                onChange={() => handleToggleSelectMsg(msg.id)}
                                className="w-4 h-4 rounded border-gray-600 bg-dark-300 text-sky-500 focus:ring-sky-500 cursor-pointer"
                              />
                            )}

                            {/* Message Bubble */}
                            {(() => {
                              const isMediaMsg = (() => {
                                if (typeof msg.content === 'object' && msg.content !== null) return true
                                if (typeof msg.content === 'string') {
                                  const trimmed = msg.content.trim()
                                  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
                                    try {
                                      const parsed = JSON.parse(trimmed)
                                      if (
                                        parsed.type === 'image' ||
                                        parsed.type === 'sticker' ||
                                        parsed.url ||
                                        parsed.href ||
                                        parsed.thumb ||
                                        parsed.photoUrl ||
                                        parsed.imageUrl ||
                                        parsed.catId ||
                                        parsed.cateId ||
                                        parsed.id
                                      ) {
                                        return true
                                      }
                                    } catch (e) {}
                                  }
                                }
                                return false
                              })()

                              return (
                                <div
                                  className={`text-xs leading-relaxed break-words transition-all relative ${
                                    isMediaMsg
                                      ? 'p-0 bg-transparent shadow-none border-none'
                                      : isMine
                                      ? `px-4 py-2.5 shadow-lg bg-gradient-to-r from-primary to-blue-600 text-white ${
                                          isFirstInGroup ? 'rounded-2xl rounded-tr-none' : 'rounded-2xl'
                                        }`
                                      : `px-4 py-2.5 shadow-lg bg-dark-200 border border-white/10 text-gray-100 ${
                                          isFirstInGroup ? 'rounded-2xl rounded-tl-none' : 'rounded-2xl'
                                        } hover:border-white/20`
                                  }`}
                                >
                                  {starredMsgIds.has(msg.id) && (
                                    <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-black rounded-full w-4 h-4 flex items-center justify-center text-[9px] shadow font-bold z-20">
                                      ★
                                    </span>
                                  )}

                                  {/* Quoted/Replied Message Preview */}
                                  {msg.quote && (
                                    <div
                                      onClick={() => {
                                        // Scroll to quoted message - try ALL possible ID fields
                                        const quoteIds = [
                                          msg.quote?.id,
                                          msg.quote?.msgId,
                                        ].filter(Boolean)
                                        
                                        console.log('🔍 [Click Quote] Searching for quoted message:', {
                                          quoteIds,
                                          fullQuote: msg.quote,
                                          currentMessage: { id: msg.id, msgId: msg.msgId, globalMsgId: msg.globalMsgId }
                                        })
                                        
                                        let quotedEl: Element | null = null
                                        
                                        // Try each ID
                                        for (const qid of quoteIds) {
                                          quotedEl = document.querySelector(`[data-msg-id="${qid}"]`)
                                          if (quotedEl) {
                                            console.log(`✅ [Click Quote] Found with ID: ${qid}`)
                                            break
                                          }
                                        }
                                        
                                        // If not found by ID, try to find by content match
                                        if (!quotedEl && msg.quote?.content) {
                                          console.log('🔍 [Click Quote] Trying content match...')
                                          const allMessages = activeMessages
                                          const matchedMsg = allMessages.find(m => {
                                            const mContent = typeof m.content === 'string' ? m.content : ''
                                            const qContent = msg.quote?.content || ''
                                            return mContent.includes(qContent) || qContent.includes(mContent)
                                          })
                                          
                                          if (matchedMsg) {
                                            const matchId = matchedMsg.globalMsgId || matchedMsg.msgId || matchedMsg.id
                                            quotedEl = document.querySelector(`[data-msg-id="${matchId}"]`)
                                            if (quotedEl) {
                                              console.log('✅ [Click Quote] Found by content match')
                                            }
                                          }
                                        }
                                        
                                        if (quotedEl) {
                                          quotedEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
                                          // Highlight effect
                                          quotedEl.classList.add('ring-2', 'ring-amber-400', 'ring-opacity-70', 'transition-all')
                                          setTimeout(() => {
                                            quotedEl?.classList.remove('ring-2', 'ring-amber-400', 'ring-opacity-70', 'transition-all')
                                          }, 2000)
                                        } else {
                                          const availableIds = Array.from(document.querySelectorAll('[data-msg-id]'))
                                            .map(el => el.getAttribute('data-msg-id'))
                                            .slice(0, 10)
                                          console.warn('⚠️ [Click Quote] Message not found.', {
                                            searchedFor: quoteIds,
                                            availableIds,
                                            totalMessages: activeMessages.length
                                          })
                                          setSyncNotice('⚠️ Tin nhắn gốc không tìm thấy (có thể đã bị xóa hoặc nằm ngoài lịch sử)')
                                        }
                                      }}
                                      className={`mb-2 p-2 rounded-lg border-l-4 cursor-pointer transition-all hover:opacity-80 hover:scale-[1.01] ${
                                        isMine 
                                          ? 'bg-white/10 border-white/40' 
                                          : 'bg-dark-300/80 border-sky-500/60'
                                      }`}
                                    >
                                      <div className="flex items-center gap-1.5 mb-0.5">
                                        <svg className="w-3 h-3 opacity-60" fill="currentColor" viewBox="0 0 24 24">
                                          <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/>
                                        </svg>
                                        <span className="text-[10px] font-bold opacity-70">
                                          {msg.quote.fromName}
                                        </span>
                                      </div>
                                      <p className="text-[11px] opacity-80 truncate">
                                        {typeof msg.quote.content === 'string' 
                                          ? (msg.quote.content.length > 60 
                                              ? msg.quote.content.substring(0, 60) + '...' 
                                              : msg.quote.content)
                                          : '[Media]'}
                                      </p>
                                    </div>
                                  )}

                                  {/* Actual Message Content */}
                                  {renderMessageContent(msg.content, currentGroupMemberNames, (url) => setMediaPreviewModalUrl(url), mediaCache, setMediaCache)}
                                </div>
                              )
                            })()}

                            {/* Hover Action Buttons Toolbar (Trả lời, Chia sẻ, ...) */}
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center gap-1 bg-dark-400/90 backdrop-blur border border-white/10 px-1.5 py-1 rounded-full shadow-lg">
                              {/* 1. Trả lời */}
                              <button
                                type="button"
                                onClick={() => setReplyingToMessage(msg)}
                                className="p-1 hover:bg-white/15 text-gray-300 hover:text-white rounded-full transition-all relative group/btn"
                                title="Trả lời"
                              >
                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/>
                                </svg>
                                <span className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 hidden group-hover/btn:block bg-black/90 text-white text-[10px] px-2 py-0.5 rounded shadow whitespace-nowrap z-30 pointer-events-none">
                                  Trả lời
                                </span>
                              </button>

                              {/* 2. Chia sẻ */}
                              <button
                                type="button"
                                onClick={() => setForwardingMessage(msg)}
                                className="p-1 hover:bg-white/15 text-gray-300 hover:text-sky-400 rounded-full transition-all relative group/btn"
                                title="Chia sẻ"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                                <span className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 hidden group-hover/btn:block bg-black/90 text-white text-[10px] px-2 py-0.5 rounded shadow whitespace-nowrap z-30 pointer-events-none">
                                  Chia sẻ
                                </span>
                              </button>

                              {/* 3. Thao tác khác (...) */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  const rect = e.currentTarget.getBoundingClientRect()
                                  const menuHeight = 310
                                  const menuWidth = 220
                                  let y = rect.bottom + 4
                                  if (rect.bottom + menuHeight > window.innerHeight && rect.top - menuHeight > 0) {
                                    y = rect.top - menuHeight - 4
                                  }
                                  let x = isMine ? rect.right - menuWidth : rect.left
                                  if (x < 10) x = 10
                                  if (x + menuWidth > window.innerWidth) x = window.innerWidth - menuWidth - 10

                                  setContextMenu({ msg, x, y })
                                }}
                                className="p-1 hover:bg-white/15 text-gray-300 hover:text-white rounded-full transition-all relative group/btn"
                                title="Thao tác khác"
                              >
                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                  <circle cx="5" cy="12" r="2"/>
                                  <circle cx="12" cy="12" r="2"/>
                                  <circle cx="19" cy="12" r="2"/>
                                </svg>
                                <span className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 hidden group-hover/btn:block bg-black/90 text-white text-[10px] px-2 py-0.5 rounded shadow whitespace-nowrap z-30 pointer-events-none">
                                  Khác
                                </span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>
          )
        })()}

            {/* Mention Dropdown Popup Menu (Only for Group chats) */}
            {showMentionMenu && activeThreadId && activeConv?.type === 'Group' && (
              <div className="mx-4 mb-2 bg-dark-200/95 border border-sky-500/40 rounded-2xl shadow-2xl overflow-hidden z-50 animate-fadeIn backdrop-blur-md">
                <div className="px-3 py-2 bg-sky-950/80 border-b border-sky-500/20 text-[11px] font-bold text-sky-300 flex justify-between items-center">
                  <div className="flex items-center gap-1.5">
                    <span>💬</span>
                    <span>Nhắc tên thành viên (@)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowMentionMenu(false)}
                    className="text-gray-400 hover:text-white text-xs px-1"
                  >
                    ✕
                  </button>
                </div>
                <div className="max-h-48 overflow-y-auto divide-y divide-white/5">
                  {(availableMentionMembers.filter((m) =>
                    m.name.toLowerCase().includes(mentionQuery)
                  )).length === 0 ? (
                    <div className="p-3 text-xs text-gray-400 text-center">Không tìm thấy thành viên</div>
                  ) : (
                    availableMentionMembers
                      .filter((m) => m.name.toLowerCase().includes(mentionQuery))
                      .slice(0, 10)
                      .map((m) => {
                        const tagText = m.isAll ? 'ALL' : m.name
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => {
                              const lastAtIndex = inputText.lastIndexOf('@')
                              if (lastAtIndex !== -1) {
                                setInputText(inputText.slice(0, lastAtIndex) + `@${tagText} `)
                              }
                              setShowMentionMenu(false)
                            }}
                            className="w-full px-3 py-2 flex items-center gap-2.5 text-left hover:bg-sky-600/25 transition-all group"
                          >
                            {m.isAll ? (
                              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-[10px] font-bold text-white shadow">
                                @
                              </div>
                            ) : m.avatar ? (
                              <img
                                src={m.avatar}
                                alt={m.name}
                                className="w-7 h-7 rounded-full object-cover border border-white/10"
                              />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-sky-600 flex items-center justify-center text-[10px] font-bold text-white shadow">
                                {m.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <span className={`text-xs font-medium truncate ${m.isAll ? 'text-sky-300 font-bold' : 'text-gray-200 group-hover:text-sky-300'}`}>
                              {m.name}
                            </span>
                          </button>
                        )
                      })
                  )}
                </div>
              </div>
            )}

            {/* Reply Preview Banner */}
            {replyingToMessage && (
              <div className="mx-4 mb-2 p-2.5 bg-dark-200/95 border border-sky-500/40 rounded-2xl shadow-xl flex items-center justify-between animate-slideUp backdrop-blur-md">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-1.5 h-8 bg-sky-500 rounded-full flex-shrink-0" />
                  <div className="flex flex-col truncate">
                    <span className="text-[11px] font-bold text-sky-400">
                      Trả lời {replyingToMessage.fromName}
                    </span>
                    <span className="text-[11px] text-gray-300 truncate">
                      {replyingToMessage.content}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setReplyingToMessage(null)}
                  className="text-gray-400 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Multi-Select Toolbar or Bottom Message Input Form */}
            {isMultiSelectMode ? (
              <div className="p-3 bg-dark-200 border-t border-white/10 flex items-center justify-between animate-slideUp">
                <span className="text-xs font-semibold text-sky-400 flex items-center gap-2">
                  <span>📑</span>
                  <span>Đã chọn {selectedMsgIds.size} tin nhắn</span>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedMsgIds.size === 0) return
                      const firstId = Array.from(selectedMsgIds)[0]
                      const targetMsg = activeMessages.find((m) => m.id === firstId)
                      if (targetMsg) setForwardingMessage(targetMsg)
                    }}
                    disabled={selectedMsgIds.size === 0}
                    className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold disabled:opacity-40 transition-all shadow"
                  >
                    Chia sẻ
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      selectedMsgIds.forEach((id) => handleDeleteLocalMessage(id))
                      setIsMultiSelectMode(false)
                      setSelectedMsgIds(new Set())
                    }}
                    disabled={selectedMsgIds.size === 0}
                    className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-semibold disabled:opacity-40 transition-all shadow"
                  >
                    Xóa ở phía tôi
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMultiSelectMode(false)
                      setSelectedMsgIds(new Set())
                    }}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-gray-300 rounded-xl text-xs font-semibold transition-all"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative bg-dark-200 border-t border-white/10">
                {/* File Attachment Preview Banner */}
                {selectedFile && (
                  <div className="p-3 bg-dark-300/90 border-b border-white/10 flex items-center justify-between animate-slideDown">
                    <div className="flex items-center gap-3 overflow-hidden">
                      {filePreviewUrl ? (
                        <img src={filePreviewUrl} alt="Preview" className="w-12 h-12 rounded-lg object-cover border border-white/10" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-sky-600/20 border border-sky-500/30 flex items-center justify-center text-xl text-sky-400 font-bold">
                          📄
                        </div>
                      )}
                      <div className="flex flex-col truncate">
                        <span className="text-xs font-bold text-white truncate">{selectedFile.name}</span>
                        <span className="text-[10px] text-gray-400 font-mono">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null)
                        setFilePreviewUrl(null)
                      }}
                      className="text-gray-400 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* Sticker & Emoji Picker Popup Panel */}
                {showStickerPicker && (
                  <div
                    ref={stickerPickerRef}
                    className="absolute bottom-full mb-2 right-3 w-80 sm:w-96 bg-dark-100 border border-white/20 rounded-2xl shadow-2xl overflow-hidden z-[999] backdrop-blur-xl animate-fadeIn flex flex-col"
                  >
                    {/* Header Tabs */}
                    <div className="flex border-b border-white/10 bg-dark-300/80 p-1">
                      <button
                        type="button"
                        onClick={() => setStickerTab('stickers')}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${
                          stickerTab === 'stickers' ? 'bg-primary text-white shadow' : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        🖼️ Sticker GIF
                      </button>
                      <button
                        type="button"
                        onClick={() => setStickerTab('emojis')}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${
                          stickerTab === 'emojis' ? 'bg-primary text-white shadow' : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        😃 Biểu cảm Emoji
                      </button>
                    </div>

                    {/* Content Panel */}
                    <div className="flex flex-col max-h-80">
                      {stickerTab === 'stickers' ? (
                        <>
                          {/* Giphy Search Bar */}
                          <div className="p-2 border-b border-white/10">
                            <input
                              type="text"
                              placeholder="🔍 Tìm sticker GIF (VD: hello, love, cat...)"
                              value={giphySearch}
                              onChange={(e) => searchGiphy(e.target.value)}
                              className="w-full bg-dark-300 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-primary"
                            />
                          </div>
                          <div className="p-2 overflow-y-auto flex-1 custom-scrollbar" style={{ maxHeight: '260px' }}>
                            {giphyLoading ? (
                              <div className="flex items-center justify-center py-8">
                                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-xs text-gray-400 ml-2">Đang tải sticker...</span>
                              </div>
                            ) : giphyStickers.length === 0 ? (
                              <div className="text-center py-8 text-xs text-gray-400">
                                Không tìm thấy sticker nào. Thử từ khóa khác!
                              </div>
                            ) : (
                              <div className="grid grid-cols-3 gap-1.5">
                                {giphyStickers.map((gif: any) => {
                                  const previewUrl = gif.images?.fixed_height_small?.url || gif.images?.preview_gif?.url || gif.images?.fixed_height?.url
                                  return (
                                    <button
                                      key={gif.id}
                                      type="button"
                                      onClick={() => handleSendGiphySticker(gif)}
                                      className="relative rounded-xl overflow-hidden hover:ring-2 hover:ring-primary transition-all group/gif bg-dark-300 aspect-square"
                                      title={gif.title || 'Sticker GIF'}
                                    >
                                      <img
                                        src={previewUrl}
                                        alt={gif.title || 'GIF'}
                                        className="w-full h-full object-cover group-hover/gif:scale-105 transition-transform"
                                        loading="lazy"
                                      />
                                      <div className="absolute inset-0 bg-black/0 group-hover/gif:bg-black/20 transition-colors flex items-end justify-center">
                                        <span className="text-[9px] text-white/0 group-hover/gif:text-white/80 pb-1 font-medium transition-colors truncate px-1">Gửi</span>
                                      </div>
                                    </button>
                                  )
                                })}
                              </div>
                            )}
                            {/* Giphy Attribution */}
                            <div className="flex items-center justify-center pt-2 pb-1 gap-1.5 opacity-50">
                              <span className="text-[9px] text-gray-400">Powered by</span>
                              <img src="https://giphy.com/static/img/giphy_logo_square_social.png" alt="Giphy" className="h-3 rounded" />
                              <span className="text-[9px] text-gray-400 font-bold">GIPHY</span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="p-3 overflow-y-auto custom-scrollbar" style={{ maxHeight: '260px' }}>
                          <div className="grid grid-cols-6 gap-2">
                            {POPULAR_EMOJIS.map((emoji, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => {
                                  setInputText((prev) => prev + emoji)
                                }}
                                className="p-2 hover:bg-white/10 rounded-xl text-xl text-center transition-transform hover:scale-125"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Bottom Message Input Form */}
                <form onSubmit={handleSendMessage} className="p-3 flex items-end gap-2">
                  {/* Hidden File Inputs */}
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="*/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {/* 1. Image Upload Button */}
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    title="Gửi hình ảnh"
                    className="p-2 text-gray-300 hover:text-sky-400 hover:bg-white/10 rounded-xl transition-all"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </button>

                  {/* 2. File Upload Button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    title="Gửi tập tin/tài liệu"
                    className="p-2 text-gray-300 hover:text-emerald-400 hover:bg-white/10 rounded-xl transition-all"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                  </button>

                  {/* 3. Sticker & Emoji Picker Toggle Button */}
                  <button
                    type="button"
                    data-sticker-toggle
                    onClick={() => setShowStickerPicker((prev) => !prev)}
                    title="Sticker & Biểu cảm Emoji"
                    className={`p-2 rounded-xl transition-all ${
                      showStickerPicker ? 'text-amber-400 bg-amber-500/20' : 'text-gray-300 hover:text-amber-400 hover:bg-white/10'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>

                  {/* Text Input Field - Textarea for multi-line + Ctrl+V image paste */}
                  <textarea
                    rows={1}
                    placeholder={
                      activeConv?.type === 'Group'
                        ? 'Nhập tin nhắn (gõ @ để tag người dùng)...'
                        : 'Nhập tin nhắn...'
                    }
                    value={inputText}
                    onChange={(e) => {
                      const val = e.target.value
                      setInputText(val)
                      // Auto-resize textarea height
                      const el = e.target
                      el.style.height = 'auto'
                      el.style.height = Math.min(el.scrollHeight, 160) + 'px'
                      if (activeConv?.type === 'Group') {
                        const lastAtIndex = val.lastIndexOf('@')
                        if (lastAtIndex !== -1 && lastAtIndex >= val.length - 20) {
                          const q = val.slice(lastAtIndex + 1)
                          if (!q.includes('\n')) {
                            setMentionQuery(q.toLowerCase())
                            setShowMentionMenu(true)
                            return
                          }
                        }
                      }
                      setShowMentionMenu(false)
                    }}
                    onKeyDown={(e) => {
                      // Enter to send, Shift+Enter for newline
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage()
                      }
                    }}
                    onPaste={(e) => {
                      const items = e.clipboardData?.items
                      if (!items) return
                      for (let i = 0; i < items.length; i++) {
                        const item = items[i]
                        if (item.type.startsWith('image/')) {
                          e.preventDefault()
                          const file = item.getAsFile()
                          if (file) {
                            setSelectedFile(file)
                            const reader = new FileReader()
                            reader.onload = () => setFilePreviewUrl(reader.result as string)
                            reader.readAsDataURL(file)
                          }
                          return
                        }
                      }
                    }}
                    className="flex-1 bg-dark-300 border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-primary resize-none overflow-y-auto"
                    style={{ maxHeight: '160px', minHeight: '38px' }}
                  />

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={(!inputText.trim() && !selectedFile) || isSending}
                    className="btn btn-primary text-xs py-2.5 px-5 rounded-2xl flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg"
                  >
                    {isSending ? (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <>
                        <span>Gửi</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-50">
            <p className="text-sm text-gray-400">Chọn một cuộc trò chuyện ở danh sách bên trái để bắt đầu nhắn tin</p>
          </div>
        )}
      </div>

      {/* Right Information & Media Side Drawer */}
      {showRightInfoDrawer && activeConv && (
        <div className="w-full md:w-80 bg-dark-200 border-l border-white/10 flex flex-col h-full animate-slideIn select-none z-40 overflow-hidden flex-shrink-0">
          {/* Drawer Header */}
          <div className="sticky top-0 p-4 bg-dark-300 border-b border-white/10 flex items-center justify-between z-50">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>ℹ️</span>
              <span>Thông tin hội thoại</span>
            </h3>
            <button
              onClick={() => setShowRightInfoDrawer(false)}
              className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors text-xs font-bold"
            >
              ✕
            </button>
          </div>

          {/* Profile Overview */}
          <div className="p-5 border-b border-white/10 flex flex-col items-center text-center space-y-3 bg-dark-300/40">
            <div className="w-16 h-16 rounded-3xl bg-primary/20 p-0.5 shadow-lg relative">
              {activeConv.avatar ? (
                <img src={activeConv.avatar} alt={activeConv.name} className="w-full h-full rounded-3xl object-cover" />
              ) : (
                <div className="w-full h-full rounded-3xl bg-gradient-to-tr from-sky-600 to-blue-500 flex items-center justify-center text-white font-bold text-xl">
                  {activeConv.type === 'Group' ? '👨‍👩‍👧' : activeConv.name.charAt(0)}
                </div>
              )}
              {pinnedThreadIds.has(String(activeConv.threadId)) && (
                <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-full shadow">
                  📌
                </span>
              )}
            </div>

            <div className="w-full px-2 text-center">
              <h4 className="text-sm font-bold text-white truncate">{activeConv.name}</h4>
              <div className="text-xs text-gray-400 mt-1 truncate flex items-center justify-center gap-1.5">
                {activeConv.type === 'Group' ? (
                  <span>Nhóm Zalo • {drawerMembers.length || activeConv.totalMember || 0} thành viên</span>
                ) : (
                  (() => {
                    const status = getUserOnlineStatus(activeConv.threadId)
                    return (
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            status.isOnline ? 'bg-emerald-400 ring-2 ring-emerald-400/40 animate-pulse' : 'bg-gray-500'
                          }`}
                        />
                        <span className={status.isOnline ? 'text-emerald-400 font-semibold' : 'text-gray-400'}>
                          {status.statusText}
                        </span>
                      </div>
                    )
                  })()
                )}
              </div>
            </div>

            {/* Quick Actions (Pin & Leave Group) */}
            <div className="flex items-center gap-2 w-full pt-1">
              <button
                onClick={() => togglePinThread(String(activeConv.threadId))}
                className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                  pinnedThreadIds.has(String(activeConv.threadId))
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                    : 'bg-dark-300 border-white/10 text-gray-300 hover:text-white'
                }`}
              >
                <span>📌</span>
                <span>{pinnedThreadIds.has(String(activeConv.threadId)) ? 'Bỏ ghim' : 'Ghim hội thoại'}</span>
              </button>

              {activeConv.type === 'Group' && (
                <button
                  onClick={() => handleLeaveGroup(String(activeConv.threadId))}
                  className="py-2 px-2.5 rounded-xl text-xs font-bold border border-red-500/40 bg-red-600/20 text-red-300 hover:bg-red-600/30 transition-all flex items-center justify-center gap-1.5"
                  title="Rời nhóm Zalo trên Web & App"
                >
                  <span>🚪</span>
                  <span>Rời nhóm</span>
                </button>
              )}
            </div>
          </div>

          {/* Drawer Main Tabs */}
          <div className="flex border-b border-white/10 bg-dark-300/60 p-1 text-xs font-bold">
            {activeConv.type === 'Group' && (
              <button
                onClick={() => setDrawerTab('members')}
                className={`flex-1 py-2 rounded-xl transition-all text-center ${
                  drawerTab === 'members' ? 'bg-primary text-white shadow' : 'text-gray-400 hover:text-white'
                }`}
              >
                👥 Thành viên ({drawerMembers.length})
              </button>
            )}
            <button
              onClick={() => setDrawerTab('media')}
              className={`flex-1 py-2 rounded-xl transition-all text-center ${
                drawerTab === 'media' ? 'bg-primary text-white shadow' : 'text-gray-400 hover:text-white'
              }`}
            >
              📁 Đa phương tiện
            </button>
          </div>

          {/* Drawer Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {drawerTab === 'members' && activeConv.type === 'Group' ? (
              <div className="space-y-3">
                {/* Search member input */}
                <input
                  type="text"
                  placeholder="Tìm thành viên nhóm..."
                  value={memberSearchQuery}
                  onChange={(e) => setMemberSearchQuery(e.target.value)}
                  className="w-full bg-dark-300 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-primary"
                />

                {loadingDrawerMembers ? (
                  <div className="text-center py-8 text-xs text-gray-400 animate-pulse">
                    ⏳ Đang tải danh sách thành viên...
                  </div>
                ) : drawerMembers.length === 0 ? (
                  <div className="text-center py-8 text-xs text-gray-400">
                    Chưa tải được danh sách thành viên.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                    {drawerMembers
                      .filter((m) => m.name.toLowerCase().includes(memberSearchQuery.toLowerCase()))
                      .map((mem) => (
                        <div key={mem.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-all">
                          {mem.avatar ? (
                            <img src={mem.avatar} alt={mem.name} className="w-8 h-8 rounded-xl object-cover border border-white/10" />
                          ) : (
                            <div className="w-8 h-8 rounded-xl bg-primary/20 text-primary font-bold text-xs flex items-center justify-center">
                              {mem.name.charAt(0)}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-white truncate">{mem.name}</p>
                            <p className="text-[10px] text-gray-400 font-mono">ID: {mem.id}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Media Sub-tabs */}
                {(() => {
                  const currentHistory = (activeThreadId ? historyMessages[activeThreadId] : []) || []
                  
                  const photos = currentHistory.filter((msg) => {
                    if (msg.photoUrl || msg.imageUrl) return true
                    if (msg.attachments && Array.isArray(msg.attachments)) {
                      return msg.attachments.some((att: any) => att.type === 'photo' || att.type === 'image' || String(att.url).match(/\.(jpeg|jpg|gif|png|webp)/i))
                    }
                    return typeof msg.content === 'string' && msg.content.match(/https?:\/\/[^\s]+?\.(jpeg|jpg|gif|png|webp)/i)
                  })

                  const videos = currentHistory.filter((msg) => {
                    if (msg.videoUrl) return true
                    if (msg.attachments && Array.isArray(msg.attachments)) {
                      return msg.attachments.some((att: any) => att.type === 'video' || String(att.url).match(/\.(mp4|webm|mov)/i))
                    }
                    return typeof msg.content === 'string' && msg.content.match(/https?:\/\/[^\s]+?\.(mp4|webm|mov)/i)
                  })

                  const links = currentHistory.filter((msg) => {
                    return typeof msg.content === 'string' && /https?:\/\/[^\s]+/i.test(msg.content)
                  })

                  return (
                    <>
                      <div className="flex gap-1 text-[11px] bg-dark-300 p-1 rounded-xl border border-white/5 font-bold">
                        <button
                          onClick={() => setMediaSubTab('photos')}
                          className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
                            mediaSubTab === 'photos' ? 'bg-purple-600 text-white shadow' : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          🖼️ Ảnh ({photos.length})
                        </button>
                        <button
                          onClick={() => setMediaSubTab('videos')}
                          className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
                            mediaSubTab === 'videos' ? 'bg-purple-600 text-white shadow' : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          🎬 Video ({videos.length})
                        </button>
                        <button
                          onClick={() => setMediaSubTab('links')}
                          className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
                            mediaSubTab === 'links' ? 'bg-purple-600 text-white shadow' : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          🔗 Links ({links.length})
                        </button>
                      </div>

                      {/* Photos Grid */}
                      {mediaSubTab === 'photos' && (
                        <div>
                          {photos.length === 0 ? (
                            <p className="text-xs text-gray-400 text-center py-8">Chưa có hình ảnh nào được gửi.</p>
                          ) : (
                            <div className="grid grid-cols-3 gap-2 max-h-[380px] overflow-y-auto pr-1">
                              {photos.map((m, idx) => {
                                const src = m.photoUrl || m.imageUrl || (m.attachments && m.attachments[0]?.url) || (m.content.match(/https?:\/\/[^\s]+?\.(jpeg|jpg|gif|png|webp)/i)?.[0]) || ''
                                return (
                                  <div
                                    key={idx}
                                    onClick={() => setMediaPreviewModalUrl(src)}
                                    className="aspect-square bg-dark-300 rounded-xl overflow-hidden cursor-pointer hover:opacity-80 transition-opacity border border-white/10 group relative shadow"
                                  >
                                    <img src={src} alt="Photo" className="w-full h-full object-cover" />
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Videos List */}
                      {mediaSubTab === 'videos' && (
                        <div>
                          {videos.length === 0 ? (
                            <p className="text-xs text-gray-400 text-center py-8">Chưa có video nào được gửi.</p>
                          ) : (
                            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                              {videos.map((m, idx) => {
                                const src = m.videoUrl || (m.attachments && m.attachments[0]?.url) || (m.content.match(/https?:\/\/[^\s]+?\.(mp4|webm|mov)/i)?.[0]) || ''
                                return (
                                  <div key={idx} className="bg-dark-300 rounded-xl p-2 border border-white/10 space-y-1">
                                    <video src={src} controls className="w-full rounded-lg max-h-36 object-cover" />
                                    <p className="text-[10px] text-gray-400 truncate">{m.fromName || 'Zalo'} • {m.timestamp}</p>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Links List */}
                      {mediaSubTab === 'links' && (
                        <div>
                          {links.length === 0 ? (
                            <p className="text-xs text-gray-400 text-center py-8">Chưa có liên kết nào được gửi.</p>
                          ) : (
                            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                              {links.map((m, idx) => {
                                const urls = m.content.match(/https?:\/\/[^\s]+/gi) || []
                                return (
                                  <div key={idx} className="bg-dark-300 rounded-xl p-3 border border-white/10 space-y-1">
                                    {urls.map((url: string, uIdx: number) => (
                                      <a
                                        key={uIdx}
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-sky-400 hover:underline block truncate font-medium"
                                      >
                                        🔗 {url}
                                      </a>
                                    ))}
                                    <p className="text-[10px] text-gray-400 truncate">{m.fromName || 'Zalo'} • {m.timestamp}</p>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )
                })()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Media Fullscreen Preview Modal */}
      {mediaPreviewModalUrl && (
        <div
          className="fixed inset-0 z-[999999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn cursor-pointer"
          onClick={() => setMediaPreviewModalUrl(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setMediaPreviewModalUrl(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 text-2xl font-bold bg-white/10 w-8 h-8 rounded-full flex items-center justify-center"
            >
              ✕
            </button>
            {mediaPreviewModalUrl.match(/\.(mp4|webm|mov)/i) ? (
              <video src={mediaPreviewModalUrl} controls autoPlay className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl" />
            ) : (
              <img src={mediaPreviewModalUrl} alt="Preview" className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl" />
            )}
          </div>
        </div>
      )}

      {/* Forward Message Modal (Chia sẻ tin nhắn) */}
      {forwardingMessage && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-dark-300 border border-white/15 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            {/* Modal Header */}
            <div className="p-4 bg-dark-400 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">➜</span>
                <h3 className="text-sm font-bold text-white">Chia sẻ tin nhắn</h3>
              </div>
              <button
                onClick={() => {
                  setForwardingMessage(null)
                  setForwardSuccessMap({})
                }}
                className="text-gray-400 hover:text-white text-base p-1"
              >
                ✕
              </button>
            </div>

            {/* Message Preview */}
            <div className="p-3 bg-dark-200/60 border-b border-white/5 m-3 rounded-2xl">
              <span className="text-[10px] text-gray-400 font-bold block mb-1">Nội dung chia sẻ:</span>
              <p className="text-xs text-gray-200 line-clamp-3 bg-dark-400 p-2.5 rounded-xl border border-white/5 font-sans">
                "{forwardingMessage.content}"
              </p>
            </div>

            {/* Search Input */}
            <div className="px-3 pb-2">
              <input
                type="text"
                placeholder="Tìm trò chuyện để chia sẻ..."
                value={forwardSearchQuery}
                onChange={(e) => setForwardSearchQuery(e.target.value)}
                className="w-full bg-dark-200 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-sky-500"
              />
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 divide-y divide-white/5">
              {conversations
                .filter((c) => c.name.toLowerCase().includes(forwardSearchQuery.toLowerCase()))
                .map((conv) => {
                  const isSent = forwardSuccessMap[conv.threadId]
                  return (
                    <div key={conv.threadId} className="pt-2 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        {conv.avatar ? (
                          <img src={conv.avatar} alt={conv.name} className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-sky-600 flex items-center justify-center text-white font-bold text-xs">
                            {conv.name.charAt(0)}
                          </div>
                        )}
                        <span className="text-xs text-gray-200 font-medium truncate">{conv.name}</span>
                      </div>
                      <button
                        onClick={() => handleSendForward(conv.threadId, conv.type)}
                        disabled={isSent}
                        className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                          isSent
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : 'bg-primary hover:bg-primary-hover text-white shadow'
                        }`}
                      >
                        {isSent ? '✓ Đã chia sẻ' : 'Chia sẻ'}
                      </button>
                    </div>
                  )
                })}
            </div>
          </div>
        </div>
      )}

      {/* Message Detail Modal (Xem chi tiết) */}
      {detailModalMsg && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-sm bg-dark-300 border border-white/15 rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-4 bg-dark-400 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>ℹ️</span> Chi tiết tin nhắn
              </h3>
              <button onClick={() => setDetailModalMsg(null)} className="text-gray-400 hover:text-white">
                ✕
              </button>
            </div>
            <div className="p-4 space-y-3 text-xs text-gray-300">
              <div>
                <span className="text-gray-400 block text-[10px]">Người gửi:</span>
                <span className="font-semibold text-white">{detailModalMsg.fromName} ({detailModalMsg.from})</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px]">Thời gian:</span>
                <span className="font-semibold text-white">
                  {detailModalMsg.timestamp ? new Date(detailModalMsg.timestamp).toLocaleString('vi-VN') : 'Không rõ'}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px]">Nội dung:</span>
                <p className="bg-dark-200 p-2.5 rounded-xl border border-white/10 mt-1 text-white whitespace-pre-wrap">
                  {detailModalMsg.content}
                </p>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px]">Mã tin nhắn (ID):</span>
                <span className="font-mono text-[11px] text-sky-400">{String(detailModalMsg.id)}</span>
              </div>
            </div>
            <div className="p-3 bg-dark-400 text-right">
              <button
                onClick={() => setDetailModalMsg(null)}
                className="px-4 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold transition-all"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Fixed Context Menu Overlay (Zero Clipping!) */}
      {contextMenu && (() => {
        // Calculate position to prevent overflow
        const menuWidth = 224 // w-56 = 14rem = 224px
        const menuHeight = 400 // Approximate height
        const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1920
        const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 1080
        
        let finalX = contextMenu.x
        let finalY = contextMenu.y
        
        // Adjust X if menu would overflow right
        if (finalX + menuWidth > viewportWidth) {
          finalX = viewportWidth - menuWidth - 16 // 16px padding
        }
        
        // Adjust Y if menu would overflow bottom
        if (finalY + menuHeight > viewportHeight) {
          finalY = viewportHeight - menuHeight - 16 // 16px padding
        }
        
        // Ensure minimum padding from edges
        finalX = Math.max(16, finalX)
        finalY = Math.max(16, finalY)
        
        return (
          <div
            style={{ top: `${finalY}px`, left: `${finalX}px` }}
            className="fixed w-56 bg-dark-200/98 border border-white/20 rounded-2xl shadow-2xl py-2 z-[9999] backdrop-blur-xl animate-fadeIn text-xs text-gray-200 select-none max-h-[calc(100vh-32px)] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
          {/* Copy */}
          <button
            type="button"
            onClick={() => handleCopyMessage(contextMenu.msg.content)}
            className="w-full px-3.5 py-2 text-left hover:bg-white/10 flex items-center gap-3 transition-colors"
          >
            <span className="text-base">📋</span>
            <span className="font-medium">Copy tin nhắn</span>
          </button>

          {/* Ghim */}
          <button
            type="button"
            onClick={() => handlePinMessage(contextMenu.msg)}
            className="w-full px-3.5 py-2 text-left hover:bg-white/10 flex items-center gap-3 transition-colors"
          >
            <span className="text-base">📌</span>
            <span className="font-medium">Ghim tin nhắn</span>
          </button>

          {/* Đánh dấu */}
          <button
            type="button"
            onClick={() => handleToggleStar(contextMenu.msg.id)}
            className="w-full px-3.5 py-2 text-left hover:bg-white/10 flex items-center gap-3 transition-colors"
          >
            <span className="text-base">⭐</span>
            <span className="font-medium">
              {starredMsgIds.has(contextMenu.msg.id) ? 'Bỏ đánh dấu tin nhắn' : 'Đánh dấu tin nhắn'}
            </span>
          </button>

          {/* Chọn nhiều */}
          <button
            type="button"
            onClick={() => handleStartMultiSelect(contextMenu.msg.id)}
            className="w-full px-3.5 py-2 text-left hover:bg-white/10 flex items-center gap-3 transition-colors"
          >
            <span className="text-base">📑</span>
            <span className="font-medium">Chọn nhiều tin nhắn</span>
          </button>

          {/* Xem chi tiết */}
          <button
            type="button"
            onClick={() => {
              setDetailModalMsg(contextMenu.msg)
              setContextMenu(null)
            }}
            className="w-full px-3.5 py-2 text-left hover:bg-white/10 flex items-center gap-3 transition-colors"
          >
            <span className="text-base">ℹ️</span>
            <span className="font-medium">Xem chi tiết</span>
          </button>

          {/* Tuỳ chọn khác */}
          <button
            type="button"
            onClick={() => {
              setSyncNotice('⚙️ Tùy chọn nâng cao: Đã tạo bản sao tin nhắn')
              setContextMenu(null)
            }}
            className="w-full px-3.5 py-2 text-left hover:bg-white/10 flex items-center gap-3 transition-colors"
          >
            <span className="text-base">⚙️</span>
            <span className="font-medium">Tuỳ chọn khác</span>
          </button>

          <div className="my-1.5 border-t border-white/10" />

          {/* Thu hồi (Chỉ hiện nếu là tin nhắn của chính mình gửi) */}
          {contextMenu.msg.isSelf && (
            <button
              type="button"
              onClick={() => handleRecallMessage(contextMenu.msg)}
              className="w-full px-3.5 py-2 text-left text-red-400 hover:bg-red-500/15 flex items-center gap-3 transition-colors font-semibold"
            >
              <span className="text-base">🔄</span>
              <span>Thu hồi</span>
            </button>
          )}

          {/* Xóa chỉ ở phía tôi */}
          <button
            type="button"
            onClick={() => handleDeleteLocalMessage(contextMenu.msg.id)}
            className="w-full px-3.5 py-2 text-left text-red-400 hover:bg-red-500/15 flex items-center gap-3 transition-colors font-semibold"
          >
            <span className="text-base">🗑️</span>
            <span>Xóa chỉ ở phía tôi</span>
          </button>
        </div>
        )
      })()}

      {/* Change Background Modal */}
      {showBgModal && (
        <div className="fixed inset-0 z-[99999] bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-dark-200 border border-white/15 rounded-3xl shadow-2xl max-w-md w-full p-5 space-y-5 animate-scaleUp text-gray-200 select-none">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 text-xl shadow">
                  🎨
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Đổi hình nền trò chuyện</h3>
                  <p className="text-xs text-gray-400">Tùy chỉnh hình nền khung chat theo sở thích</p>
                </div>
              </div>
              <button
                onClick={() => setShowBgModal(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Presets Grid */}
            <div className="grid grid-cols-2 gap-3">
              {/* Option 1: /background.png */}
              <button
                type="button"
                onClick={() => updateChatBg('/background.png')}
                className={`group relative h-28 rounded-2xl overflow-hidden border-2 transition-all text-left p-3 flex flex-col justify-end ${
                  chatBg === '/background.png' ? 'border-purple-500 ring-2 ring-purple-500/50' : 'border-white/10 hover:border-white/30'
                }`}
              >
                <img
                  src="/background.png"
                  alt="Background PNG"
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform"
                  onError={(e) => {
                    ;(e.target as HTMLElement).style.display = 'none'
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
                <span className="relative z-10 text-xs font-bold text-white flex items-center gap-1">
                  🖼️ background.png
                </span>
              </button>

              {/* Option 2: /aris.png */}
              <button
                type="button"
                onClick={() => updateChatBg('/aris.png')}
                className={`group relative h-28 rounded-2xl overflow-hidden border-2 transition-all text-left p-3 flex flex-col justify-end ${
                  chatBg === '/aris.png' ? 'border-purple-500 ring-2 ring-purple-500/50' : 'border-white/10 hover:border-white/30'
                }`}
              >
                <img
                  src="/aris.png"
                  alt="Aris PNG"
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
                <span className="relative z-10 text-xs font-bold text-white flex items-center gap-1">
                  🌸 aris.png
                </span>
              </button>

              {/* Option 3: Cosmic Blue Gradient */}
              <button
                type="button"
                onClick={() => updateChatBg('linear-gradient(to bottom right, #0f172a, #1e1b4b, #311042)')}
                className={`relative h-28 rounded-2xl overflow-hidden border-2 transition-all p-3 flex flex-col justify-end bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 ${
                  chatBg.includes('311042') ? 'border-purple-500 ring-2 ring-purple-500/50' : 'border-white/10 hover:border-white/30'
                }`}
              >
                <span className="text-xs font-bold text-white">🌌 Cosmic Gradient</span>
              </button>

              {/* Option 4: Mặc định Dark */}
              <button
                type="button"
                onClick={() => updateChatBg('default')}
                className={`relative h-28 rounded-2xl overflow-hidden border-2 transition-all p-3 flex flex-col justify-end bg-gradient-to-b from-dark-300 to-dark-400 ${
                  chatBg === 'default' || !chatBg ? 'border-purple-500 ring-2 ring-purple-500/50' : 'border-white/10 hover:border-white/30'
                }`}
              >
                <span className="text-xs font-bold text-white">🖤 Mặc định (Đen tối)</span>
              </button>
            </div>

            {/* Upload Custom Wallpaper */}
            <div className="pt-2 border-t border-white/10 space-y-2">
              <label className="block text-xs font-bold text-gray-300">📁 Hoặc chọn ảnh bất kỳ từ máy tính:</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="w-full text-xs text-gray-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-purple-600/30 file:text-purple-300 hover:file:bg-purple-600/40 cursor-pointer"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowBgModal(false)}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white transition-colors shadow-lg"
              >
                Đóng & Lưu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Media Preview Lightbox Modal */}
      {mediaPreviewModalUrl && (
        <div
          className="fixed inset-0 z-[999999] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 sm:p-8 animate-fadeIn select-none"
          onClick={() => setMediaPreviewModalUrl(null)}
        >
          <div
            className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setMediaPreviewModalUrl(null)}
              className="absolute -top-12 right-0 text-white/90 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all text-xs font-bold flex items-center gap-1.5 px-3.5 shadow-lg border border-white/10 cursor-pointer"
            >
              <span>✕</span>
              <span>Đóng (ESC)</span>
            </button>

            {/* Content: Video or Image */}
            {mediaPreviewModalUrl.match(/\.(mp4|webm|ogg|mov)(\?.*)?$/i) ? (
              <video
                src={mediaPreviewModalUrl}
                controls
                autoPlay
                className="max-w-full max-h-[75vh] rounded-2xl shadow-2xl border border-white/20"
              />
            ) : (
              <img
                src={mediaPreviewModalUrl}
                alt="Xem ảnh Zalo chi tiết"
                className="max-w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl border border-white/20"
              />
            )}

            {/* Action Toolbar */}
            <div className="mt-5 flex items-center justify-center gap-3">
              <a
                href={mediaPreviewModalUrl}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="btn text-xs py-2 px-4 bg-primary hover:bg-primary/80 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all"
              >
                <span>📥</span>
                <span>Tải ảnh/video về máy</span>
              </a>
              <a
                href={mediaPreviewModalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn text-xs py-2 px-4 bg-white/10 hover:bg-white/20 text-gray-200 rounded-xl font-bold flex items-center gap-2 border border-white/15 transition-all"
              >
                <span>🌐</span>
                <span>Mở trong tab mới</span>
              </a>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(mediaPreviewModalUrl)
                  alert('Đã chép liên kết media!')
                }}
                className="btn text-xs py-2 px-4 bg-white/10 hover:bg-white/20 text-gray-200 rounded-xl font-bold flex items-center gap-2 border border-white/15 transition-all cursor-pointer"
              >
                <span>🔗</span>
                <span>Sao chép Link</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
