import React from 'react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

interface MessageLog {
  id: number
  timestamp: Date
  from: string
  content: string | any
  type: string
  replied: boolean
}

interface MessageLogsProps {
  logs: MessageLog[]
}

// Helper function to render message content with image/gif support
function renderMessageContent(content: any): React.ReactNode {
  if (!content) return null

  // Check if content is an undo/delete event JSON array - DON'T RENDER IT!
  if (typeof content === 'string') {
    const trimmed = content.trim()
    if (trimmed.startsWith('[{') && trimmed.includes('"actionType"') && trimmed.includes('"clientDelMsgId"')) {
      // This is an undo event JSON array - hide it completely
      return null
    }
  }

  // Parse content if it's a JSON string
  let parsedObj: any = null
  if (typeof content === 'object' && content !== null) {
    parsedObj = content
  } else if (typeof content === 'string' && content.trim().startsWith('{') && content.trim().endsWith('}')) {
    try {
      parsedObj = JSON.parse(content)
    } catch (e) {}
  }

  // Handle parsed object (image, sticker, file, etc.)
  if (parsedObj) {
    // Sticker detection
    if (parsedObj.catId || parsedObj.cateId || parsedObj.id || parsedObj.type === 'sticker') {
      return <span className="text-sm text-blue-400">🎭 [Nhãn dán]</span>
    }

    // File detection
    if (parsedObj.type === 'file') {
      return (
        <div className="flex items-center gap-2">
          <span className="text-xl">📄</span>
          <span className="text-sm text-gray-300">{parsedObj.name || 'Tập tin'}</span>
        </div>
      )
    }

    // Image/GIF detection
    const isImageObject =
      parsedObj.type === 'image' ||
      parsedObj.photoUrl ||
      parsedObj.imageUrl ||
      parsedObj.href ||
      parsedObj.thumb ||
      parsedObj.url ||
      (typeof parsedObj.name === 'string' && /\.(png|jpe?g|webp|gif)$/i.test(parsedObj.name))

    let imgUrl = parsedObj.url || parsedObj.href || parsedObj.thumb || parsedObj.photoUrl || parsedObj.imageUrl || parsedObj.hdUrl || parsedObj.normalUrl || null

    if (imgUrl && String(imgUrl).trim() !== '') {
      const cleanImgUrl = String(imgUrl).replace(/\\/g, '')
      const titleText = parsedObj.title || parsedObj.description || parsedObj.caption || parsedObj.name || ''
      
      return (
        <div className="space-y-2">
          <img
            src={cleanImgUrl}
            alt={titleText || 'Hình ảnh Zalo'}
            className="rounded-lg max-h-40 object-cover border border-white/10 shadow hover:opacity-90 transition-opacity cursor-pointer"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
              const parent = target.parentElement
              if (parent) {
                const fallback = document.createElement('div')
                fallback.className = 'flex items-center gap-2'
                fallback.innerHTML = '<span class="text-xl">🖼️</span><span class="text-sm text-gray-400">[Hình ảnh]</span>'
                parent.appendChild(fallback)
              }
            }}
          />
          {titleText && <p className="text-xs text-gray-300">{titleText}</p>}
        </div>
      )
    }

    // Fallback for image type without URL
    if (isImageObject) {
      return (
        <div className="flex items-center gap-2">
          <span className="text-xl">🖼️</span>
          <span className="text-sm text-gray-400">[Hình ảnh]</span>
        </div>
      )
    }

    // Generic text from object
    const titleText = parsedObj.title || parsedObj.description || parsedObj.caption || parsedObj.text || parsedObj.name || ''
    if (titleText && titleText.trim() !== '') {
      return <span className="text-sm text-gray-100">{titleText}</span>
    }
  }

  // Fallback to plain text
  const textContent = typeof content === 'string' ? content : String(content)
  return <span className="text-sm text-gray-100 break-words">{textContent}</span>
}

export default function MessageLogs({ logs }: MessageLogsProps) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold">Lịch sử tin nhắn</h3>
          <p className="text-sm text-gray-400">Tin nhắn đến từ người khác và phản hồi tự động</p>
        </div>
        <span className="badge bg-primary/20 text-primary">
          {logs.filter((l: any) => !l.isSelf && !l.isUndo).length} tin nhắn
        </span>
      </div>
      
      <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
        {logs.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-dark-300 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
              </svg>
            </div>
            <p className="text-gray-400">Chưa có tin nhắn nào</p>
            <p className="text-sm text-gray-500 mt-2">Bot sẽ tự động ghi lại khi có người nhắn tin</p>
          </div>
        ) : (
          logs
            .filter((log) => {
              // Filter out messages sent by self (only show incoming messages)
              if ((log as any).isSelf) {
                return false
              }
              // Filter out undo event messages (JSON arrays with actionType)
              if (typeof log.content === 'string') {
                const trimmed = log.content.trim()
                if (trimmed.startsWith('[{') && trimmed.includes('"actionType"') && trimmed.includes('"clientDelMsgId"')) {
                  return false
                }
              }
              // Filter out already undone/recalled messages
              if ((log as any).isUndo) {
                return false
              }
              return true
            })
            .map((log) => (
            <div
              key={log.id}
              className="bg-dark-300 rounded-lg p-4 border border-dark-200 hover:border-primary/50 transition-colors animate-slideIn"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-3">
                  {(() => {
                    const hasValidAvatar = (log as any).avatar && 
                                          String((log as any).avatar).trim() !== '' && 
                                          !String((log as any).avatar).includes('ui-avatars.com')
                    
                    const displayName = (log as any).fromName || log.from || 'U'
                    const firstLetter = displayName.charAt(0).toUpperCase()
                    
                    // Use CSS-based fallback avatar (no external service)
                    if (!hasValidAvatar) {
                      return (
                        <div 
                          className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-sm font-bold shadow-sm flex-shrink-0"
                          title={displayName}
                        >
                          {firstLetter}
                        </div>
                      )
                    }
                    
                    // Try to load real avatar
                    return (
                      <img
                        src={(log as any).avatar}
                        alt={displayName}
                        className="w-10 h-10 rounded-full object-cover border border-white/10 shadow-sm flex-shrink-0"
                        onError={(e) => {
                          // If real avatar fails, replace with CSS fallback
                          const target = e.target as HTMLImageElement
                          const parent = target.parentElement
                          if (parent) {
                            target.remove()
                            const fallback = document.createElement('div')
                            fallback.className = 'w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-sm font-bold shadow-sm flex-shrink-0'
                            fallback.textContent = firstLetter
                            fallback.title = displayName
                            parent.insertBefore(fallback, parent.firstChild)
                          }
                        }}
                      />
                    )
                  })()}
                  <div>
                    <p className="font-medium">{(log as any).fromName || log.from}</p>
                    <p className="text-xs text-gray-400">
                      {format(new Date(log.timestamp), 'HH:mm:ss', { locale: vi })}
                      <span className="mx-1">•</span>
                      {format(new Date(log.timestamp), 'dd/MM/yyyy', { locale: vi })}
                    </p>
                  </div>
                </div>
                <span className={`badge ${log.replied ? 'badge-success' : 'badge-warning'}`}>
                  {log.replied ? '✅ Đã trả lời' : '⏳ Chờ xử lý'}
                </span>
              </div>
              
              <div className="ml-13">
                {renderMessageContent(log.content)}
                <div className="flex items-center space-x-2 mt-2">
                  <span className="text-xs text-gray-500">
                    {log.type === 'User' ? '👤 Tin nhắn cá nhân' : '👥 Tin nhắn nhóm'}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      {logs.filter((l: any) => !l.isSelf && !l.isUndo).length > 0 && (
        <div className="mt-4 pt-4 border-t border-dark-300 text-center">
          <p className="text-xs text-gray-500">
            Hiển thị {logs.filter((l: any) => !l.isSelf && !l.isUndo).length} tin nhắn đến gần nhất
          </p>
        </div>
      )}
    </div>
  )
}
