import React, { useState } from 'react'
import { X, Search, CheckCircle, AlertTriangle, Send, ArrowLeft, XCircle, Loader2 } from 'lucide-react'

interface AddFriendModalProps {
  onClose: () => void
  onSuccess?: () => void
}

interface UserSearchResult {
  userId: string
  displayName: string
  avatar: string
  phone: string
  isFriend: boolean
  canAddFriend: boolean
}

export default function AddFriendModal({ onClose, onSuccess }: AddFriendModalProps) {
  const [phone, setPhone] = useState('')
  const [countryCode, setCountryCode] = useState('+84')
  const [searching, setSearching] = useState(false)
  const [sending, setSending] = useState(false)
  const [canceling, setCanceling] = useState(false)
  const [searchResult, setSearchResult] = useState<UserSearchResult | null>(null)
  const [message, setMessage] = useState('Xin chào, mình là Hoàng Kiều Phong. Kết bạn với mình nhé!')
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('') // 🆕 Success feedback
  const [requestSent, setRequestSent] = useState(false)
  const [sentUserId, setSentUserId] = useState<string | null>(null)

  const handleSearch = async () => {
    if (!phone.trim()) {
      setError('Vui lòng nhập số điện thoại')
      return
    }

    setSearching(true)
    setError('')
    setSearchResult(null)

    try {
      // Format phone number
      const fullPhone = phone.startsWith('0') ? phone : '0' + phone
      
      const res = await fetch('/api/zalo/add-friend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'find',
          phone: fullPhone
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Không tìm thấy người dùng')
      }

      setSearchResult(data.user)
    } catch (err: any) {
      setError(err.message || 'Không thể tìm kiếm người dùng')
    } finally {
      setSearching(false)
    }
  }

  const handleSendRequest = async () => {
    if (!searchResult) return

    setSending(true)
    setError('')

    try {
      const res = await fetch('/api/zalo/add-friend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send',
          userId: searchResult.userId,
          message: message.trim()
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Không thể gửi lời mời')
      }

      // Show success state with cancel option
      setRequestSent(true)
      setSentUserId(searchResult.userId)
      
      if (onSuccess) onSuccess()
    } catch (err: any) {
      setError(err.message || 'Không thể gửi lời mời kết bạn')
    } finally {
      setSending(false)
    }
  }

  const handleCancelRequest = async () => {
    if (!sentUserId) return

    setCanceling(true)
    setError('')
    setSuccessMessage('')

    try {
      const res = await fetch('/api/zalo/add-friend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'cancel',
          userId: sentUserId
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Không thể hủy lời mời')
      }

      // ✅ Show success message in modal instead of alert
      setSuccessMessage('✅ Đã hủy lời mời kết bạn thành công!')
      
      // Close modal after 1.5 seconds
      setTimeout(() => {
        onClose()
      }, 1500)
    } catch (err: any) {
      setError(err.message || 'Không thể hủy lời mời kết bạn')
    } finally {
      setCanceling(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-fadeIn">
      <div className="bg-dark-200 rounded-2xl border border-white/10 p-6 max-w-md w-full mx-4 animate-scaleIn shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Thêm bạn</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search Section */}
        {!searchResult && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Số điện thoại
              </label>
              <div className="flex gap-2">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="px-3 py-2 bg-dark-300 border border-white/20 rounded-lg text-white focus:outline-none focus:border-primary"
                >
                  <option value="+84">🇻🇳 (+84)</option>
                  <option value="+1">🇺🇸 (+1)</option>
                  <option value="+86">🇨🇳 (+86)</option>
                </select>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="0962949858"
                  className="flex-1 px-4 py-2 bg-dark-300 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-xs text-red-400">{error}</p>
              </div>
            )}

            <button
              onClick={handleSearch}
              disabled={searching || !phone.trim()}
              className="w-full px-6 py-3 bg-primary hover:bg-primary/80 disabled:bg-gray-600 text-white rounded-lg transition-colors font-bold flex items-center justify-center gap-2"
            >
              {searching ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang tìm kiếm...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Tìm kiếm</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Search Result */}
        {searchResult && !requestSent && (
          <div className="space-y-4">
            {/* User Card */}
            <div className="p-4 bg-dark-300 border border-white/10 rounded-xl">
              <div className="flex items-center gap-3 mb-4">
                {searchResult.avatar ? (
                  <img
                    src={searchResult.avatar}
                    alt={searchResult.displayName}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-2xl font-bold text-white">
                    {searchResult.displayName?.charAt(0) || '?'}
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-white font-bold">{searchResult.displayName}</h3>
                  <p className="text-xs text-gray-400">{searchResult.phone}</p>
                </div>
              </div>

              {searchResult.isFriend && (
                <div className="p-2 bg-success/10 border border-success/30 rounded-lg flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <p className="text-xs text-success">Đã là bạn bè</p>
                </div>
              )}

              {!searchResult.isFriend && !searchResult.canAddFriend && (
                <div className="p-2 bg-warning/10 border border-warning/30 rounded-lg flex items-center justify-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-warning" />
                  <p className="text-xs text-warning">Không thể gửi lời mời kết bạn</p>
                </div>
              )}
            </div>

            {/* Message Input */}
            {!searchResult.isFriend && searchResult.canAddFriend && (
              <>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Lời nhắn (không bắt buộc)
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    maxLength={150}
                    rows={3}
                    placeholder="Viết lời nhắn kèm theo..."
                    className="w-full px-4 py-2 bg-dark-300 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary resize-none"
                  />
                  <p className="text-xs text-gray-400 mt-1">{message.length}/150</p>
                </div>

                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <p className="text-xs text-red-400">{error}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setSearchResult(null)}
                    className="flex-1 px-6 py-3 bg-dark-300 hover:bg-dark-400 text-white rounded-lg transition-colors font-semibold flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Quay lại</span>
                  </button>
                  <button
                    onClick={handleSendRequest}
                    disabled={sending}
                    className="flex-1 px-6 py-3 bg-primary hover:bg-primary/80 disabled:bg-gray-600 text-white rounded-lg transition-colors font-bold flex items-center justify-center gap-2"
                  >
                    {sending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Đang gửi...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Gửi yêu cầu</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            )}

            {searchResult.isFriend && (
              <button
                onClick={onClose}
                className="w-full px-6 py-3 bg-dark-300 hover:bg-dark-400 text-white rounded-lg transition-colors font-semibold"
              >
                Đóng
              </button>
            )}
          </div>
        )}

        {/* Success State - Request Sent */}
        {requestSent && searchResult && (
          <div className="space-y-4">
            {/* Success Message */}
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-center">
              <div className="flex justify-center mb-2">
                <CheckCircle className="w-12 h-12 text-green-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">Đã gửi lời mời thành công!</h3>
              <p className="text-sm text-gray-300">Lời mời đã được gửi đến:</p>
            </div>

            {/* User Info */}
            <div className="p-4 bg-dark-300 border border-white/10 rounded-xl">
              <div className="flex items-center gap-3">
                {searchResult.avatar ? (
                  <img
                    src={searchResult.avatar}
                    alt={searchResult.displayName}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-xl font-bold text-white">
                    {searchResult.displayName?.charAt(0) || '?'}
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-white font-bold">{searchResult.displayName}</h3>
                  <p className="text-xs text-gray-400">{searchResult.phone}</p>
                </div>
              </div>
            </div>

            {/* Message Preview */}
            {message && (
              <div className="p-3 bg-dark-300/50 border border-white/5 rounded-lg">
                <p className="text-xs text-gray-400 mb-1">Lời nhắn đã gửi:</p>
                <p className="text-sm text-gray-200 italic">"{message}"</p>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-xs text-red-400">{error}</p>
              </div>
            )}

            {/* 🆕 Success Message for Cancel */}
            {successMessage && (
              <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg animate-fadeIn">
                <p className="text-sm text-green-400 text-center font-semibold">{successMessage}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleCancelRequest}
                disabled={canceling || !!successMessage}
                className="flex-1 px-6 py-3 bg-red-600/20 hover:bg-red-600/30 disabled:bg-gray-600 border border-red-500/40 text-red-300 rounded-lg transition-colors font-bold flex items-center justify-center gap-2"
              >
                {canceling ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang hủy...</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4" />
                    <span>Hủy lời mời</span>
                  </>
                )}
              </button>
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-dark-300 hover:bg-dark-400 text-white rounded-lg transition-colors font-semibold"
              >
                Đóng
              </button>
            </div>

            <p className="text-xs text-gray-400 text-center">
              💡 Người nhận sẽ thấy lời mời trên Zalo App của họ
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
