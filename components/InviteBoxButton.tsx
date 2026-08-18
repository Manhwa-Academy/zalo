import React, { useState, useEffect } from 'react'
import { Mail, X, Loader2, Users, Clock, Check, XCircle, RefreshCw } from 'lucide-react'

interface GroupInvitation {
  groupId: string
  groupName: string
  groupAvatar: string
  groupDesc: string
  totalMembers: number
  inviter: {
    id: string
    name: string
    avatar: string
  }
  creator: {
    id: string
    name: string
    avatar: string
  }
  expiredTs: string
}

export default function InviteBoxButton() {
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [invitations, setInvitations] = useState<GroupInvitation[]>([])
  const [processing, setProcessing] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (showModal) {
      loadInvitations()
    }
  }, [showModal])

  const loadInvitations = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/zalo/invite-box', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_list',
          page: 0,
        }),
      })

      const data = await res.json()

      if (data.success) {
        setInvitations(data.data.invitations || [])
      } else {
        console.error('Failed to load invitations:', data.error)
      }
    } catch (error) {
      console.error('Error loading invitations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = async (groupId: string, groupName: string) => {
    if (!confirm(`Tham gia nhóm "${groupName}"?`)) return

    setProcessing(prev => ({ ...prev, [groupId]: true }))
    
    try {
      const res = await fetch('/api/zalo/invite-box', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'join',
          groupId,
        }),
      })

      const data = await res.json()

      if (data.success) {
        alert('✅ Đã tham gia nhóm thành công!')
        // Remove from list
        setInvitations(prev => prev.filter(inv => inv.groupId !== groupId))
      } else {
        alert(`❌ Lỗi: ${data.error}`)
      }
    } catch (error) {
      console.error('Error joining group:', error)
      alert('❌ Không thể tham gia nhóm!')
    } finally {
      setProcessing(prev => ({ ...prev, [groupId]: false }))
    }
  }

  const handleDelete = async (groupId: string, groupName: string) => {
    if (!confirm(`Từ chối lời mời "${groupName}"?`)) return

    setProcessing(prev => ({ ...prev, [groupId]: true }))
    
    try {
      const res = await fetch('/api/zalo/invite-box', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          groupId,
          blockFutureInvite: false,
        }),
      })

      const data = await res.json()

      if (data.success) {
        alert('✅ Đã từ chối lời mời!')
        // Remove from list
        setInvitations(prev => prev.filter(inv => inv.groupId !== groupId))
      } else {
        alert(`❌ Lỗi: ${data.error}`)
      }
    } catch (error) {
      console.error('Error deleting invitation:', error)
      alert('❌ Không thể xóa lời mời!')
    } finally {
      setProcessing(prev => ({ ...prev, [groupId]: false }))
    }
  }

  const formatExpiredTime = (expiredTs: string): string => {
    try {
      const expiredDate = new Date(parseInt(expiredTs))
      const now = new Date()
      const diffMs = expiredDate.getTime() - now.getTime()
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
      const diffDays = Math.floor(diffHours / 24)

      if (diffDays > 0) {
        return `Còn ${diffDays} ngày`
      } else if (diffHours > 0) {
        return `Còn ${diffHours} giờ`
      } else {
        return 'Sắp hết hạn'
      }
    } catch (e) {
      return ''
    }
  }

  return (
    <>
      {/* Button in sidebar */}
      <button
        onClick={() => setShowModal(true)}
        className="relative p-2 hover:bg-white/10 rounded-xl transition-all"
        title="Hộp thư mời nhóm"
      >
        <Mail className="w-5 h-5 text-gray-300" />
        {invitations.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold min-w-[18px] text-center">
            {invitations.length}
          </span>
        )}
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[99999] bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-dark-200 border border-white/15 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col animate-scaleUp">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <div className="flex items-center gap-3">
                <Mail className="w-6 h-6 text-sky-400" />
                <div>
                  <h2 className="text-lg font-bold text-white">Hộp thư mời nhóm</h2>
                  <p className="text-xs text-gray-400">
                    {invitations.length} lời mời đang chờ
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5">
              {loading ? (
                <div className="text-center py-12 text-sm text-gray-400 flex flex-col items-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>Đang tải lời mời...</span>
                </div>
              ) : invitations.length === 0 ? (
                <div className="text-center py-12">
                  <Mail className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                  <p className="text-sm text-gray-400">Không có lời mời nào</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {invitations.map((inv) => (
                    <div
                      key={inv.groupId}
                      className="bg-dark-300 border border-white/10 rounded-2xl p-4 space-y-3 hover:border-primary/30 transition-all"
                    >
                      {/* Group info */}
                      <div className="flex items-start gap-3">
                        {inv.groupAvatar ? (
                          <img
                            src={inv.groupAvatar}
                            alt={inv.groupName}
                            className="w-14 h-14 rounded-2xl object-cover border border-white/10 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-2xl bg-primary/20 text-primary font-bold text-xl flex items-center justify-center flex-shrink-0">
                            <Users className="w-7 h-7" />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-bold text-white truncate">
                            {inv.groupName}
                          </h3>
                          {inv.groupDesc && (
                            <p className="text-xs text-gray-400 line-clamp-2 mt-0.5">
                              {inv.groupDesc}
                            </p>
                          )}
                          <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-400">
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {inv.totalMembers} thành viên
                            </span>
                            <span className="text-amber-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatExpiredTime(inv.expiredTs)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Inviter info */}
                      <div className="flex items-center gap-2 px-3 py-2 bg-dark-400 rounded-xl border border-white/5">
                        {inv.inviter.avatar ? (
                          <img
                            src={inv.inviter.avatar}
                            alt={inv.inviter.name}
                            className="w-6 h-6 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-lg bg-sky-500/20 text-sky-300 text-[10px] font-bold flex items-center justify-center">
                            {inv.inviter.name.charAt(0)}
                          </div>
                        )}
                        <p className="text-xs text-gray-300 flex-1">
                          <span className="text-sky-300 font-semibold">{inv.inviter.name}</span> mời bạn tham gia
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleJoin(inv.groupId, inv.groupName)}
                          disabled={processing[inv.groupId]}
                          className="flex-1 py-2.5 px-4 rounded-xl text-sm font-bold bg-gradient-to-r from-primary to-blue-600 hover:brightness-110 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          <Check className="w-4 h-4" />
                          <span>Tham gia</span>
                        </button>
                        <button
                          onClick={() => handleDelete(inv.groupId, inv.groupName)}
                          disabled={processing[inv.groupId]}
                          className="px-4 py-2.5 rounded-xl text-sm font-bold border border-red-500/40 bg-red-600/20 text-red-300 hover:bg-red-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Từ chối"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {!loading && invitations.length > 0 && (
              <div className="p-4 border-t border-white/10 flex justify-center">
                <button
                  onClick={loadInvitations}
                  className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white transition-colors flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Làm mới</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
