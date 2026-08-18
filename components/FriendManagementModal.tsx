import React, { useState, useEffect } from 'react'
import { 
  X, UserPlus, UserMinus, UserX, Shield, ShieldOff, 
  Clock, Check, Loader2, Search, AlertCircle 
} from 'lucide-react'

interface SentFriendRequest {
  userId: string
  zaloName: string
  displayName: string
  avatar: string
  message: string
  time: number
}

interface FriendRecommendation {
  userId: string
  displayName: string
  zaloName: string
  avatar: string
  mutualFriends: number
  reason: string
}

interface FriendManagementModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function FriendManagementModal({ isOpen, onClose }: FriendManagementModalProps) {
  const [activeTab, setActiveTab] = useState<'sent' | 'recommendations' | 'manage'>('sent')
  const [sentRequests, setSentRequests] = useState<SentFriendRequest[]>([])
  const [recommendations, setRecommendations] = useState<FriendRecommendation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // Fetch sent friend requests
  const fetchSentRequests = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/zalo/sent-friend-requests')
      const data = await res.json()
      
      if (data.success) {
        setSentRequests(data.requests || [])
      } else {
        setMessage({ type: 'error', text: data.error || 'Không thể tải danh sách' })
      }
    } catch (error) {
      console.error('Fetch sent requests error:', error)
      setMessage({ type: 'error', text: 'Lỗi khi tải danh sách lời mời' })
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch friend recommendations
  const fetchRecommendations = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/zalo/friend-recommendations')
      const data = await res.json()
      
      if (data.success) {
        setRecommendations(data.recommendations || [])
      } else {
        setMessage({ type: 'error', text: data.error || 'Không thể tải gợi ý' })
      }
    } catch (error) {
      console.error('Fetch recommendations error:', error)
      setMessage({ type: 'error', text: 'Lỗi khi tải gợi ý kết bạn' })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      if (activeTab === 'sent') {
        fetchSentRequests()
      } else if (activeTab === 'recommendations') {
        fetchRecommendations()
      }
    }
  }, [isOpen, activeTab])

  // Cancel friend request
  const handleCancelRequest = async (userId: string) => {
    setActionLoading(userId)
    try {
      const res = await fetch('/api/zalo/add-friend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'undo' })
      })
      
      const data = await res.json()
      
      if (data.success) {
        setMessage({ type: 'success', text: 'Đã hủy lời mời kết bạn' })
        setSentRequests(prev => prev.filter(r => r.userId !== userId))
      } else {
        setMessage({ type: 'error', text: data.error || 'Không thể hủy lời mời' })
      }
    } catch (error) {
      console.error('Cancel request error:', error)
      setMessage({ type: 'error', text: 'Lỗi khi hủy lời mời' })
    } finally {
      setActionLoading(null)
      setTimeout(() => setMessage(null), 3000)
    }
  }

  // Remove friend
  const handleRemoveFriend = async (userId: string, userName: string) => {
    if (!confirm(`Bạn có chắc muốn xóa bạn bè với ${userName}?`)) return
    
    setActionLoading(userId)
    try {
      const res = await fetch('/api/zalo/remove-friend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })
      
      const data = await res.json()
      
      if (data.success) {
        setMessage({ type: 'success', text: `Đã xóa bạn bè với ${userName}` })
      } else {
        setMessage({ type: 'error', text: data.error || 'Không thể xóa bạn bè' })
      }
    } catch (error) {
      console.error('Remove friend error:', error)
      setMessage({ type: 'error', text: 'Lỗi khi xóa bạn bè' })
    } finally {
      setActionLoading(null)
      setTimeout(() => setMessage(null), 3000)
    }
  }

  // Block user
  const handleBlockUser = async (userId: string, userName: string) => {
    if (!confirm(`Bạn có chắc muốn chặn ${userName}?`)) return
    
    setActionLoading(userId)
    try {
      const res = await fetch('/api/zalo/block-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })
      
      const data = await res.json()
      
      if (data.success) {
        setMessage({ type: 'success', text: `Đã chặn ${userName}` })
      } else {
        setMessage({ type: 'error', text: data.error || 'Không thể chặn người dùng' })
      }
    } catch (error) {
      console.error('Block user error:', error)
      setMessage({ type: 'error', text: 'Lỗi khi chặn người dùng' })
    } finally {
      setActionLoading(null)
      setTimeout(() => setMessage(null), 3000)
    }
  }

  // Format time
  const formatTime = (timestamp: number) => {
    if (!timestamp) return 'Không rõ'
    const date = new Date(timestamp * 1000) // Convert seconds to ms
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Vừa xong'
    if (diffMins < 60) return `${diffMins} phút trước`
    
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours} giờ trước`
    
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 7) return `${diffDays} ngày trước`
    
    return date.toLocaleDateString('vi-VN')
  }

  // Filter requests
  const filteredRequests = sentRequests.filter(req => 
    req.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    req.zaloName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Filter recommendations
  const filteredRecommendations = recommendations.filter(rec =>
    rec.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rec.zaloName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-dark-200 border border-sky-500/30 rounded-3xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-sky-950/80 to-blue-950/80 border-b border-sky-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UserPlus className="w-6 h-6 text-sky-400" />
            <h3 className="text-lg font-bold text-white">Quản lý bạn bè</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10 bg-dark-300/50">
          <button
            onClick={() => setActiveTab('sent')}
            className={`flex-1 px-4 py-3 text-sm font-semibold transition-all ${
              activeTab === 'sent'
                ? 'text-sky-400 border-b-2 border-sky-400 bg-sky-950/20'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Clock className="w-4 h-4 inline mr-2" />
            Lời mời đã gửi
          </button>
          <button
            onClick={() => setActiveTab('recommendations')}
            className={`flex-1 px-4 py-3 text-sm font-semibold transition-all ${
              activeTab === 'recommendations'
                ? 'text-sky-400 border-b-2 border-sky-400 bg-sky-950/20'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <UserPlus className="w-4 h-4 inline mr-2" />
            Gợi ý kết bạn
          </button>
          <button
            onClick={() => setActiveTab('manage')}
            className={`flex-1 px-4 py-3 text-sm font-semibold transition-all ${
              activeTab === 'manage'
                ? 'text-sky-400 border-b-2 border-sky-400 bg-sky-950/20'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Shield className="w-4 h-4 inline mr-2" />
            Quản lý
          </button>
        </div>

        {/* Message Banner */}
        {message && (
          <div className={`px-6 py-3 flex items-center gap-3 ${
            message.type === 'success' 
              ? 'bg-green-950/50 border-b border-green-500/30 text-green-400' 
              : 'bg-red-950/50 border-b border-red-500/30 text-red-400'
          }`}>
            {message.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span className="text-sm font-medium">{message.text}</span>
          </div>
        )}

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-180px)]">
          {activeTab === 'sent' && (
            <div className="p-6">
              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-dark-300 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-sky-500/50"
                />
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
                </div>
              ) : filteredRequests.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">
                    {searchQuery ? 'Không tìm thấy kết quả' : 'Chưa có lời mời kết bạn nào'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredRequests.map((req) => (
                    <div
                      key={req.userId}
                      className="flex items-center gap-4 p-4 bg-dark-300/50 hover:bg-dark-300 rounded-2xl transition-all border border-white/5 hover:border-sky-500/30"
                    >
                      {/* Avatar */}
                      {req.avatar ? (
                        <img
                          src={req.avatar}
                          alt={req.displayName}
                          className="w-12 h-12 rounded-xl border-2 border-sky-500/30 shadow-md object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white text-sm font-bold border-2 border-sky-500/30 shadow-md">
                          {req.displayName.charAt(0).toUpperCase()}
                        </div>
                      )}

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">
                          {req.displayName || req.zaloName}
                        </p>
                        {req.message && (
                          <p className="text-xs text-gray-400 truncate mt-0.5">
                            "{req.message}"
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-0.5">
                          Gửi {formatTime(req.time)}
                        </p>
                      </div>

                      {/* Actions */}
                      <button
                        onClick={() => handleCancelRequest(req.userId)}
                        disabled={actionLoading === req.userId}
                        className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 rounded-xl text-xs font-semibold transition-all border border-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {actionLoading === req.userId ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <X className="w-3 h-3" />
                        )}
                        Hủy
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'recommendations' && (
            <div className="p-6">
              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-dark-300 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-sky-500/50"
                />
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
                </div>
              ) : filteredRecommendations.length === 0 ? (
                <div className="text-center py-12">
                  <UserPlus className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">
                    {searchQuery ? 'Không tìm thấy kết quả' : 'Chưa có gợi ý kết bạn'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredRecommendations.map((rec) => (
                    <div
                      key={rec.userId}
                      className="flex items-center gap-4 p-4 bg-dark-300/50 hover:bg-dark-300 rounded-2xl transition-all border border-white/5 hover:border-sky-500/30"
                    >
                      {/* Avatar */}
                      {rec.avatar ? (
                        <img
                          src={rec.avatar}
                          alt={rec.displayName}
                          className="w-12 h-12 rounded-xl border-2 border-sky-500/30 shadow-md object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white text-sm font-bold border-2 border-sky-500/30 shadow-md">
                          {rec.displayName.charAt(0).toUpperCase()}
                        </div>
                      )}

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">
                          {rec.displayName || rec.zaloName}
                        </p>
                        {rec.mutualFriends > 0 && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            {rec.mutualFriends} bạn chung
                          </p>
                        )}
                        {rec.reason && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            {rec.reason}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <button
                        onClick={async () => {
                          setActionLoading(rec.userId)
                          try {
                            const res = await fetch('/api/zalo/add-friend', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ 
                                userId: rec.userId,
                                action: 'send',
                                message: `Xin chào ${rec.displayName}!`
                              })
                            })
                            
                            const data = await res.json()
                            
                            if (data.success) {
                              setMessage({ type: 'success', text: 'Đã gửi lời mời kết bạn' })
                              setRecommendations(prev => prev.filter(r => r.userId !== rec.userId))
                            } else {
                              setMessage({ type: 'error', text: data.error || 'Không thể gửi lời mời' })
                            }
                          } catch (error) {
                            console.error('Add friend error:', error)
                            setMessage({ type: 'error', text: 'Lỗi khi gửi lời mời' })
                          } finally {
                            setActionLoading(null)
                            setTimeout(() => setMessage(null), 3000)
                          }
                        }}
                        disabled={actionLoading === rec.userId}
                        className="px-4 py-2 bg-sky-500/20 hover:bg-sky-500/30 text-sky-400 hover:text-sky-300 rounded-xl text-xs font-semibold transition-all border border-sky-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {actionLoading === rec.userId ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <UserPlus className="w-3 h-3" />
                        )}
                        Kết bạn
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'manage' && (
            <div className="p-6">
              <div className="text-center py-12">
                <Shield className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 text-sm mb-6">
                  Để quản lý bạn bè (xóa bạn, chặn người dùng), hãy:<br/>
                  1. Mở cuộc trò chuyện với người đó<br/>
                  2. Click vào menu <span className="text-sky-400">⋮ (More)</span> ở góc trên<br/>
                  3. Chọn "Xóa bạn bè" hoặc "Chặn người dùng"
                </p>
                
                <div className="space-y-3 max-w-sm mx-auto text-left">
                  <div className="p-3 bg-dark-300/50 rounded-xl border border-white/10">
                    <div className="flex items-center gap-2 text-sm text-white mb-1">
                      <UserMinus className="w-4 h-4 text-red-400" />
                      <span className="font-semibold">Xóa bạn bè</span>
                    </div>
                    <p className="text-xs text-gray-400 pl-6">
                      Hủy kết bạn với người dùng này
                    </p>
                  </div>
                  
                  <div className="p-3 bg-dark-300/50 rounded-xl border border-white/10">
                    <div className="flex items-center gap-2 text-sm text-white mb-1">
                      <UserX className="w-4 h-4 text-orange-400" />
                      <span className="font-semibold">Chặn người dùng</span>
                    </div>
                    <p className="text-xs text-gray-400 pl-6">
                      Chặn và không nhận tin nhắn từ người này
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
