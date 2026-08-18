import React, { useState, useEffect } from 'react'
import { 
  X, User, UserCircle2, Hash, Phone, Calendar, 
  Users2, Mail, Loader2, AlertCircle, MessageCircle,
  UserPlus, UserMinus, UserX
} from 'lucide-react'

interface UserInfoModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  userName?: string
  userAvatar?: string
  onOpenChat?: (threadId: string, userName: string, userAvatar: string) => void // 🆕 Callback to open chat
}

export default function UserInfoModal({ 
  isOpen, 
  onClose, 
  userId,
  userName,
  userAvatar,
  onOpenChat
}: UserInfoModalProps) {
  const [userInfo, setUserInfo] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && userId) {
      fetchUserInfo()
    }
  }, [isOpen, userId])

  const fetchUserInfo = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Fetch user info from Zalo API
      const res = await fetch(`/api/zalo/user-info?userId=${encodeURIComponent(userId)}`)
      const data = await res.json()
      
      if (data.success && data.userInfo) {
        setUserInfo(data.userInfo)
        console.log('👤 User info:', data.userInfo)
      } else {
        setError(data.error || 'Không thể tải thông tin người dùng')
      }
    } catch (error) {
      console.error('Failed to fetch user info:', error)
      setError('Lỗi khi tải thông tin')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-dark-200 border border-sky-500/30 rounded-3xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-hidden animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-sky-950/80 to-blue-950/80 border-b border-sky-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UserCircle2 className="w-6 h-6 text-sky-400" />
            <h3 className="text-lg font-bold text-white">Thông tin cá nhân</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-180px)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
              <p className="text-red-400 text-sm">{error}</p>
              <button
                onClick={fetchUserInfo}
                className="mt-4 px-4 py-2 bg-sky-500/20 hover:bg-sky-500/30 text-sky-400 rounded-xl text-sm font-semibold transition-all"
              >
                Thử lại
              </button>
            </div>
          ) : userInfo ? (
            <div className="p-6 space-y-4">
              {/* Avatar & Name */}
              <div className="flex flex-col items-center text-center">
                {userInfo.avatar || userAvatar ? (
                  <img
                    src={userInfo.avatar || userAvatar}
                    alt={userInfo.displayName || userName || 'User'}
                    className="w-24 h-24 rounded-full border-4 border-sky-500/30 object-cover shadow-lg mb-3"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white text-3xl font-bold border-4 border-sky-500/30 shadow-lg mb-3">
                    {(userInfo.displayName || userName || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <h4 className="text-xl font-bold text-white">
                  {userInfo.displayName || userInfo.zaloName || userName || 'Người dùng'}
                </h4>
                {userInfo.zaloName && userInfo.displayName !== userInfo.zaloName && (
                  <p className="text-sm text-gray-400 mt-1">@{userInfo.zaloName}</p>
                )}
              </div>

              {/* User Info Details */}
              <div className="p-4 bg-dark-300/30 border border-white/10 rounded-2xl space-y-2">
                {userInfo.displayName && (
                  <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                    <span className="text-xs text-gray-400 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" />
                      Tên hiển thị:
                    </span>
                    <span className="text-xs text-white font-medium">{userInfo.displayName}</span>
                  </div>
                )}
                
                {userInfo.zaloName && (
                  <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                    <span className="text-xs text-gray-400 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5" />
                      Zalo Name:
                    </span>
                    <span className="text-xs text-white font-medium">{userInfo.zaloName}</span>
                  </div>
                )}
                
                {userInfo.status && (
                  <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                    <span className="text-xs text-gray-400 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Tiểu sử:
                    </span>
                    <span className="text-xs text-white font-medium truncate max-w-[200px]">{userInfo.status}</span>
                  </div>
                )}
                
                {userInfo.gender !== undefined && userInfo.gender !== null && (
                  <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                    <span className="text-xs text-gray-400 flex items-center gap-1.5">
                      <Users2 className="w-3.5 h-3.5" />
                      Giới tính:
                    </span>
                    <span className="text-xs text-white font-medium flex items-center gap-1.5">
                      {userInfo.gender === 0 ? (
                        <>
                          <UserCircle2 className="w-3.5 h-3.5 text-gray-400" />
                          Không xác định
                        </>
                      ) : userInfo.gender === 1 ? (
                        <>
                          <User className="w-3.5 h-3.5 text-blue-400" />
                          Nam
                        </>
                      ) : (
                        <>
                          <User className="w-3.5 h-3.5 text-pink-400" />
                          Nữ
                        </>
                      )}
                    </span>
                  </div>
                )}
                
                {/* Only show DOB if it's valid (not 0) */}
                {(userInfo.sdob || (userInfo.dob && userInfo.dob > 0)) && (
                  <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                    <span className="text-xs text-gray-400 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      Ngày sinh:
                    </span>
                    <span className="text-xs text-white font-medium">
                      {userInfo.sdob || new Date(userInfo.dob * 1000).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                )}
                
                {/* Only show phone number if it exists and not empty */}
                {userInfo.phoneNumber && userInfo.phoneNumber.trim() !== '' && (
                  <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                    <span className="text-xs text-gray-400 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5" />
                      Số điện thoại:
                    </span>
                    <span className="text-xs text-white font-medium">{userInfo.phoneNumber}</span>
                  </div>
                )}
                
                {userInfo.userId && (
                  <div className="flex justify-between items-center py-1.5">
                    <span className="text-xs text-gray-400 flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5" />
                      User ID:
                    </span>
                    <span className="text-xs text-gray-500 font-mono">
                      {userInfo.userId.substring(0, 12)}...
                    </span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className={`grid gap-3 ${userInfo.isFr !== 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                <button
                  onClick={() => {
                    // Open chat with this user
                    if (onOpenChat && userInfo) {
                      onOpenChat(
                        userId, 
                        userInfo.displayName || userInfo.zaloName || userName || 'Người dùng',
                        userInfo.avatar || userAvatar || ''
                      )
                    }
                    onClose()
                  }}
                  className="px-4 py-3 bg-gradient-to-r from-sky-600 to-blue-600 hover:brightness-110 text-white rounded-xl text-sm font-bold transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  Nhắn tin
                </button>
                
                {/* Only show "Add Friend" if not already friend */}
                {userInfo.isFr !== 1 && (
                  <button
                    onClick={() => {
                      // TODO: Add friend action
                      console.log('Add friend:', userId)
                    }}
                    className="px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:brightness-110 text-white rounded-xl text-sm font-bold transition-all shadow-lg flex items-center justify-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    Kết bạn
                  </button>
                )}
              </div>

              {/* Note */}
              <div className="p-3 bg-amber-950/30 border border-amber-500/30 rounded-xl">
                <p className="text-xs text-amber-400">
                  <AlertCircle className="w-3 h-3 inline mr-1" />
                  Một số thông tin có thể bị ẩn do cài đặt riêng tư của người dùng
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
