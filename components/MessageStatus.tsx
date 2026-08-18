import React, { useState } from 'react'
import { Loader2, Check, CheckCheck, X, Eye } from 'lucide-react'

interface MessageStatusProps {
  status?: 'sending' | 'sent' | 'delivered' | 'seen'
  seenBy?: Array<{
    userId: string
    userName: string
    avatar?: string
    seenAt: number
  }>
  isGroup?: boolean
  timestamp?: string
}

export default function MessageStatus({ status = 'sent', seenBy = [], isGroup = false, timestamp }: MessageStatusProps) {
  const [showSeenByModal, setShowSeenByModal] = useState(false)

  // Render checkmark icon based on status
  const renderCheckmark = () => {
    if (status === 'sending') {
      return (
        <div className="flex items-center gap-1 text-gray-500 text-[10px]">
          <Loader2 className="w-3 h-3 animate-spin" />
          <span>Đang gửi...</span>
        </div>
      )
    }

    if (status === 'sent') {
      return (
        <div className="flex items-center gap-0.5 text-gray-400" title="Đã gửi">
          <Check className="w-3 h-3" />
        </div>
      )
    }

    if (status === 'delivered') {
      return (
        <div className="flex items-center gap-0.5 text-gray-400" title="Đã nhận">
          <CheckCheck className="w-3 h-3" />
        </div>
      )
    }

    if (status === 'seen') {
      // Only show "seen by" modal if we have actual seenBy data (length > 0)
      const hasSeenByData = isGroup && seenBy && seenBy.length > 0
      
      return (
        <div 
          className={`flex items-center gap-0.5 text-sky-400 ${hasSeenByData ? 'cursor-pointer hover:text-sky-300' : ''}`}
          title={hasSeenByData ? `Đã xem bởi ${seenBy.length} người - Click để xem chi tiết` : 'Đã xem'}
          onClick={() => hasSeenByData && setShowSeenByModal(true)}
        >
          <CheckCheck className="w-3 h-3" />
        </div>
      )
    }

    return null
  }

  // Format seen time
  const formatSeenTime = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Vừa xong'
    if (diffMins < 60) return `${diffMins} phút trước`
    
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours} giờ trước`
    
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <>
      {renderCheckmark()}

      {/* Modal: Seen By List (for group chats) */}
      {showSeenByModal && isGroup && seenBy.length > 0 && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] animate-fadeIn"
          onClick={() => setShowSeenByModal(false)}
        >
          <div 
            className="bg-dark-200 border border-sky-500/30 rounded-3xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-5 py-4 bg-gradient-to-r from-sky-950/80 to-blue-950/80 border-b border-sky-500/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-sky-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">Đã xem bởi {seenBy.length} người</h3>
                  {timestamp && (
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      Tin nhắn gửi lúc {new Date(timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setShowSeenByModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Seen By List */}
            <div className="max-h-96 overflow-y-auto p-4 space-y-2">
              {seenBy.map((user, index) => (
                <div
                  key={`${user.userId}-${index}`}
                  className="flex items-center gap-3 p-3 bg-dark-300/50 hover:bg-dark-300 rounded-xl transition-colors border border-white/5 hover:border-sky-500/30"
                >
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.userName}
                        className="w-10 h-10 rounded-full border-2 border-sky-500/30 shadow-md object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold border-2 border-sky-500/30 shadow-md">
                        {user.userName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">
                      {user.userName}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      Đã xem {formatSeenTime(user.seenAt)}
                    </p>
                  </div>

                  {/* Checkmark */}
                  <div className="flex-shrink-0 text-sky-400">
                    <CheckCheck className="w-5 h-5" />
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 bg-dark-300/50 border-t border-white/5 text-center">
              <button
                onClick={() => setShowSeenByModal(false)}
                className="text-xs text-sky-400 hover:text-sky-300 font-medium transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
