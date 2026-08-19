import React, { useState, useEffect } from 'react'
import { X, UserCircle, Users, Search, Phone, User } from 'lucide-react'

interface SendContactCardModalProps {
  isOpen: boolean
  onClose: () => void
  threadId: string
  threadType: 'User' | 'Group'
  threadName: string
  currentUserId: string
  currentUserName: string
  onMessageSent?: () => void // Callback when message is sent successfully
}

interface Friend {
  userId: string
  userName: string
  avatar?: string
  phoneNumber?: string
}

export default function SendContactCardModal({ 
  isOpen, 
  onClose, 
  threadId, 
  threadType,
  threadName,
  currentUserId,
  currentUserName,
  onMessageSent
}: SendContactCardModalProps) {
  const [selectedUser, setSelectedUser] = useState<Friend | null>(null)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isLoadingFriends, setIsLoadingFriends] = useState(false)
  const [friends, setFriends] = useState<Friend[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [cardType, setCardType] = useState<'self' | 'friend'>('self')

  // Load friends list
  useEffect(() => {
    if (isOpen && cardType === 'friend') {
      loadFriends()
    }
  }, [isOpen, cardType])

  const loadFriends = async () => {
    setIsLoadingFriends(true)
    try {
      const res = await fetch('/api/zalo/friends')
      const data = await res.json()
      
      if (data.success && data.friends) {
        const friendsList: Friend[] = data.friends.map((f: any) => ({
          userId: f.userId || f.uid || f.id,
          userName: f.userName || f.displayName || f.name || 'Unknown',
          avatar: f.avatar || f.avatarUrl,
          phoneNumber: f.phoneNumber || f.phone
        }))
        setFriends(friendsList)
      }
    } catch (error) {
      console.error('Failed to load friends:', error)
    } finally {
      setIsLoadingFriends(false)
    }
  }

  const filteredFriends = friends.filter(friend =>
    friend.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.userId.includes(searchQuery)
  )

  const handleSend = async () => {
    let userIdToSend = currentUserId
    let phoneToSend = phoneNumber.trim()

    if (cardType === 'friend') {
      if (!selectedUser) {
        return // Button will be disabled if no friend selected
      }
      userIdToSend = selectedUser.userId
      phoneToSend = selectedUser.phoneNumber || phoneToSend
    }

    setIsSending(true)
    try {
      const res = await fetch('/api/zalo/send-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threadId,
          threadType,
          userId: userIdToSend,
          phoneNumber: phoneToSend || undefined
        })
      })

      const data = await res.json()
      
      if (data.success) {
        // Trigger callback to parent to reload messages
        if (onMessageSent) {
          onMessageSent()
        }
        // Close modal and reset
        setSelectedUser(null)
        setPhoneNumber('')
        onClose()
      }
    } catch (error) {
      console.error('Send card error:', error)
    } finally {
      setIsSending(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-dark-200 rounded-2xl w-full max-w-lg border border-white/10 shadow-2xl flex flex-col" style={{ maxHeight: '75vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
              <UserCircle className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Gửi Danh Thiếp</h2>
              <p className="text-[10px] text-gray-400">Tới: {threadName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5" style={{ minHeight: 0 }}>
          {/* Card Type Selection */}
          <div className="flex gap-1.5">
            <button
              onClick={() => {
                setCardType('self')
                setSelectedUser(null)
              }}
              className={`flex-1 px-3 py-2 rounded-xl font-medium transition-all text-xs flex items-center justify-center gap-1.5 ${
                cardType === 'self'
                  ? 'bg-primary text-white'
                  : 'bg-dark-300/50 text-gray-400 hover:bg-dark-300'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              Của tôi
            </button>
            <button
              onClick={() => {
                setCardType('friend')
                setSelectedUser(null)
              }}
              className={`flex-1 px-3 py-2 rounded-xl font-medium transition-all text-xs flex items-center justify-center gap-1.5 ${
                cardType === 'friend'
                  ? 'bg-primary text-white'
                  : 'bg-dark-300/50 text-gray-400 hover:bg-dark-300'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Bạn bè
            </button>
          </div>

          {/* Self Card */}
          {cardType === 'self' && (
            <div className="space-y-2.5">
              <div className="bg-gradient-to-br from-primary/20 to-blue-500/20 border border-primary/30 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-10 h-10 rounded-full bg-primary/30 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-bold text-white text-sm">{currentUserName}</div>
                    <div className="text-[10px] text-gray-400">ID: {currentUserId}</div>
                  </div>
                </div>
              </div>

              {/* Phone Number (Optional) */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-gray-300 mb-1.5">
                  <Phone className="w-3.5 h-3.5" />
                  Số điện thoại <span className="text-gray-500 text-[10px] font-normal">(Tùy chọn)</span>
                </label>
                <input
                  type="text"
                  placeholder="VD: 0900000000"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full px-3 py-2 bg-dark-300/50 border border-white/10 rounded-xl text-white placeholder-gray-500 text-xs focus:outline-none focus:border-primary/50"
                  maxLength={15}
                />
              </div>
            </div>
          )}

          {/* Friend Card */}
          {cardType === 'friend' && (
            <div className="space-y-2">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                <input
                  type="text"
                  placeholder="🔍 Tìm bạn bè..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-dark-300/50 border border-white/10 rounded-xl text-white placeholder-gray-500 text-xs focus:outline-none focus:border-primary/50"
                />
              </div>

              {/* Friends List */}
              {isLoadingFriends ? (
                <div className="text-center py-6 text-gray-400">
                  <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-1.5"></div>
                  <div className="text-xs">Đang tải...</div>
                </div>
              ) : (
                <div className="space-y-0.5 overflow-y-auto bg-dark-300/30 rounded-xl border border-white/5 p-1.5" style={{ maxHeight: '180px' }}>
                  {filteredFriends.map((friend) => (
                    <button
                      key={friend.userId}
                      onClick={() => setSelectedUser(friend)}
                      className={`w-full px-2.5 py-2 text-left rounded-lg transition-all flex items-center gap-2 ${
                        selectedUser?.userId === friend.userId
                          ? 'bg-primary'
                          : 'hover:bg-white/5'
                      }`}
                    >
                      {friend.avatar ? (
                        <img
                          src={friend.avatar}
                          alt={friend.userName}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center text-white font-bold text-xs">
                          {friend.userName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className={`font-medium text-xs truncate ${
                          selectedUser?.userId === friend.userId ? 'text-white' : 'text-gray-200'
                        }`}>
                          {friend.userName}
                        </div>
                        <div className={`text-[10px] truncate ${
                          selectedUser?.userId === friend.userId ? 'text-white/70' : 'text-gray-500'
                        }`}>
                          {friend.phoneNumber || `ID: ${friend.userId}`}
                        </div>
                      </div>
                      {selectedUser?.userId === friend.userId && (
                        <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center flex-shrink-0">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                        </div>
                      )}
                    </button>
                  ))}
                  {filteredFriends.length === 0 && (
                    <div className="text-center py-6 text-gray-500 text-xs">
                      {searchQuery ? 'Không tìm thấy' : 'Chưa có bạn bè'}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Info */}
          <div className="bg-blue-500/10 border border-blue-400/20 rounded-xl p-2 text-[10px] text-blue-300">
            <span className="font-bold">💡 Lưu ý:</span> Danh thiếp sẽ được gửi dưới dạng tin nhắn đặc biệt, người nhận có thể thêm bạn trực tiếp.
          </div>
        </div>

        {/* Footer - Fixed */}
        <div className="flex items-center gap-2 p-3 border-t border-white/10 flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 px-3 py-2 bg-dark-300 hover:bg-dark-300/70 text-white rounded-xl font-medium transition-all text-xs"
            disabled={isSending}
          >
            Hủy
          </button>
          <button
            onClick={handleSend}
            disabled={(cardType === 'friend' && !selectedUser) || isSending}
            className="flex-1 px-3 py-2 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs flex items-center justify-center gap-1.5"
          >
            {isSending ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Đang gửi...
              </>
            ) : (
              <>
                <UserCircle className="w-3.5 h-3.5" />
                Gửi
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
