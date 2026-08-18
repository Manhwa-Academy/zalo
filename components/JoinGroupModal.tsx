import React, { useState } from 'react'
import { X, Search, Users, ArrowLeft, CheckCircle, Loader2, Info, User } from 'lucide-react'

interface JoinGroupModalProps {
  onClose: () => void
  onSuccess?: (groupId: string) => void
}

interface GroupLinkInfo {
  groupId: string
  name: string
  desc: string
  avt: string
  fullAvt: string
  totalMember: number
  adminIds: string[]
  currentMems: {
    id: string
    dName: string
    avatar: string
  }[]
  hasMoreMember: number
}

export default function JoinGroupModal({ onClose, onSuccess }: JoinGroupModalProps) {
  const [link, setLink] = useState('')
  const [loading, setLoading] = useState(false)
  const [joining, setJoining] = useState(false)
  const [groupInfo, setGroupInfo] = useState<GroupLinkInfo | null>(null)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const handleGetInfo = async () => {
    if (!link.trim()) {
      setError('Vui lòng nhập link nhóm')
      return
    }

    setLoading(true)
    setError('')
    setGroupInfo(null)

    try {
      const res = await fetch('/api/zalo/join-group-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_info',
          link: link.trim()
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Không thể lấy thông tin nhóm')
      }

      setGroupInfo(data.groupInfo)
    } catch (err: any) {
      setError(err.message || 'Không thể lấy thông tin nhóm')
    } finally {
      setLoading(false)
    }
  }

  const handleJoinGroup = async () => {
    if (!groupInfo) return

    setJoining(true)
    setError('')
    setSuccessMessage('')

    try {
      const res = await fetch('/api/zalo/join-group-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'join',
          link: link.trim()
        })
      })

      const data = await res.json()
      
      console.log('📥 [Join Modal] Response:', { status: res.status, data })

      // Handle "already member" case FIRST (even if status is 400)
      if (data.alreadyMember) {
        console.log('✅ [Join Modal] Already member, showing success')
        
        // Clear any existing errors first
        setError('')
        
        // User is already a member - show success message
        setSuccessMessage(data.error || 'Bạn đã là thành viên của nhóm này rồi! ✅')
        
        // Auto close after 2.5 seconds (give time to see the message)
        setTimeout(() => {
          console.log('⏱️ [Join Modal] Auto-closing modal...')
          if (onSuccess) onSuccess(groupInfo.groupId)
          onClose()
        }, 2500)
        return
      }

      // Then check for other errors
      if (!res.ok) {
        console.log('❌ [Join Modal] Error response:', data.error)
        throw new Error(data.error || 'Không thể tham gia nhóm')
      }

      // Success
      console.log('✅ [Join Modal] Join successful')
      setSuccessMessage('Đã tham gia nhóm thành công! ✅')
      
      // Auto close after 2 seconds
      setTimeout(() => {
        if (onSuccess) onSuccess(groupInfo.groupId)
        onClose()
      }, 2000)
    } catch (err: any) {
      console.log('❌ [Join Modal] Caught error:', err.message)
      setError(err.message || 'Không thể tham gia nhóm')
    } finally {
      setJoining(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-fadeIn">
      <div className="bg-dark-200 rounded-2xl border border-white/10 p-6 max-w-md w-full mx-4 animate-scaleIn shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Tham gia nhóm</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Input Section */}
        {!groupInfo && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Link mời nhóm
              </label>
              <input
                type="text"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleGetInfo()}
                placeholder="https://zalo.me/g/..."
                className="w-full px-4 py-2 bg-dark-300 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary"
              />
              <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                <Info className="w-3 h-3" />
                <span>Dán link mời nhóm Zalo (vd: https://zalo.me/g/abcxyz)</span>
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-xs text-red-400">{error}</p>
              </div>
            )}

            <button
              onClick={handleGetInfo}
              disabled={loading || !link.trim()}
              className="w-full px-6 py-3 bg-primary hover:bg-primary/80 disabled:bg-gray-600 text-white rounded-lg transition-colors font-bold flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang kiểm tra...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Xem thông tin nhóm</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Group Info Section */}
        {groupInfo && (
          <div className="space-y-4">
            {/* Group Card */}
            <div className="p-4 bg-dark-300 border border-white/10 rounded-xl">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center flex-shrink-0">
                  {groupInfo.fullAvt || groupInfo.avt ? (
                    <img
                      src={groupInfo.fullAvt || groupInfo.avt}
                      alt={groupInfo.name || 'Nhóm'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                        const parent = e.currentTarget.parentElement
                        if (parent) {
                          parent.innerHTML = `<span class="text-2xl text-white font-bold">${(groupInfo.name || 'G')[0].toUpperCase()}</span>`
                        }
                      }}
                    />
                  ) : (
                    <span className="text-2xl text-white font-bold">
                      {(groupInfo.name || 'G')[0].toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-bold text-lg mb-1">
                    {groupInfo.name || 'Nhóm Zalo'}
                  </h3>
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    <span>{groupInfo.totalMember || 0} thành viên</span>
                  </p>
                </div>
              </div>

              {groupInfo.desc && (
                <div className="mb-4">
                  <p className="text-xs text-gray-400 mb-1">📝 Mô tả nhóm:</p>
                  <p className="text-sm text-gray-200">{groupInfo.desc}</p>
                </div>
              )}

              {/* Members Preview */}
              {groupInfo.currentMems && groupInfo.currentMems.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                    <User className="w-3 h-3" />
                    <span>Thành viên ({groupInfo.currentMems.length}{groupInfo.hasMoreMember > 0 ? '+' : ''})</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {groupInfo.currentMems.slice(0, 5).map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center gap-1.5 px-2 py-1 bg-dark-200 rounded-lg"
                        title={member.dName || member.id}
                      >
                        <div className="w-5 h-5 rounded-full overflow-hidden bg-gradient-to-br from-purple-400 to-pink-600 flex items-center justify-center flex-shrink-0">
                          {member.avatar ? (
                            <img
                              src={member.avatar}
                              alt={member.dName || 'User'}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                                const parent = e.currentTarget.parentElement
                                if (parent) {
                                  parent.innerHTML = `<span class="text-[8px] text-white font-bold">${(member.dName || 'U')[0].toUpperCase()}</span>`
                                }
                              }}
                            />
                          ) : (
                            <span className="text-[8px] text-white font-bold">
                              {(member.dName || 'U')[0].toUpperCase()}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-300 truncate max-w-[80px]">
                          {member.dName || `User ${member.id.slice(-4)}`}
                        </span>
                      </div>
                    ))}
                    {groupInfo.hasMoreMember > 0 && (
                      <div className="flex items-center px-2 py-1 bg-dark-200 rounded-lg">
                        <span className="text-xs text-gray-400">
                          +{groupInfo.hasMoreMember} khác
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && !successMessage && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-xs text-red-400">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                  <p className="text-sm text-green-300 font-semibold">{successMessage}</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setGroupInfo(null)
                  setLink('')
                }}
                className="flex-1 px-6 py-3 bg-dark-300 hover:bg-dark-400 text-white rounded-lg transition-colors font-semibold flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Quay lại</span>
              </button>
              <button
                onClick={handleJoinGroup}
                disabled={joining || !!successMessage}
                className="flex-1 px-6 py-3 bg-green-600/20 hover:bg-green-600/30 disabled:bg-gray-600 disabled:cursor-not-allowed border border-green-500/40 text-green-300 rounded-lg transition-colors font-bold flex items-center justify-center gap-2"
              >
                {successMessage ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Hoàn tất</span>
                  </>
                ) : joining ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang tham gia...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Tham gia nhóm</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-xs text-gray-400 text-center flex items-center justify-center gap-1">
              <Info className="w-3 h-3" />
              <span>Bạn sẽ tham gia nhóm trên cả Zalo App và Web</span>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
