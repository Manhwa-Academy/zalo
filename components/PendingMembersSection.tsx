import React, { useState, useEffect } from 'react'
import { UserPlus, ChevronDown, Loader2, CheckCircle, XCircle, RefreshCw } from 'lucide-react'

interface PendingMember {
  id: string
  name: string
  avatar: string
}

interface PendingMembersSectionProps {
  groupId: string
}

export default function PendingMembersSection({ groupId }: PendingMembersSectionProps) {
  const [loading, setLoading] = useState(false)
  const [pendingMembers, setPendingMembers] = useState<PendingMember[]>([])
  const [showSection, setShowSection] = useState(false)
  const [processing, setProcessing] = useState<Record<string, boolean>>({})

  // Load pending members when section is opened
  useEffect(() => {
    if (showSection) {
      loadPendingMembers()
    }
  }, [groupId, showSection])

  const loadPendingMembers = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/zalo/pending-members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_pending',
          groupId,
        }),
      })

      const data = await res.json()

      if (data.success) {
        setPendingMembers(data.data.users || [])
      } else {
        console.error('Failed to load pending members:', data.error)
      }
    } catch (error) {
      console.error('Error loading pending members:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReview = async (memberId: string, isApprove: boolean) => {
    setProcessing(prev => ({ ...prev, [memberId]: true }))
    
    try {
      const res = await fetch('/api/zalo/pending-members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'review',
          groupId,
          members: memberId,
          isApprove,
        }),
      })

      const data = await res.json()

      if (data.success && data.data[0]?.success) {
        alert(isApprove ? '✅ Đã chấp nhận thành viên!' : '❌ Đã từ chối thành viên!')
        // Remove from list
        setPendingMembers(prev => prev.filter(m => m.id !== memberId))
      } else {
        const message = data.data[0]?.message || data.error
        alert(`⚠️ ${message}`)
      }
    } catch (error) {
      console.error('Error reviewing member:', error)
      alert('❌ Có lỗi xảy ra!')
    } finally {
      setProcessing(prev => ({ ...prev, [memberId]: false }))
    }
  }

  return (
    <div className="p-4 border-b border-white/10 bg-dark-300/20">
      {/* Toggle header */}
      <button
        onClick={() => setShowSection(!showSection)}
        className="w-full flex items-center justify-between py-2 text-left group"
      >
        <div className="flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-sky-400" />
          <span className="text-xs font-bold text-white group-hover:text-primary transition-colors">
            Yêu cầu tham gia
            {pendingMembers.length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-[10px] rounded-full font-bold">
                {pendingMembers.length}
              </span>
            )}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showSection ? 'rotate-180' : ''}`} />
      </button>

      {/* Expanded content */}
      {showSection && (
        <div className="mt-3 space-y-3 animate-slideIn">
          {loading ? (
            <div className="text-center py-4 text-xs text-gray-400 flex flex-col items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Đang tải...</span>
            </div>
          ) : pendingMembers.length === 0 ? (
            <div className="text-center py-6 text-xs text-gray-400">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-400" />
              <p>Không có yêu cầu tham gia nào</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {pendingMembers.map((member) => (
                <div
                  key={member.id}
                  className="bg-dark-400 border border-white/10 rounded-xl p-3 flex items-center gap-3"
                >
                  {/* Avatar */}
                  {member.avatar ? (
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-10 h-10 rounded-xl object-cover border border-white/10 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary font-bold text-sm flex items-center justify-center flex-shrink-0">
                      {member.name.charAt(0)}
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white truncate">
                      {member.name}
                    </p>
                    <p className="text-[10px] text-gray-400 font-mono">
                      ID: {member.id}
                    </p>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => handleReview(member.id, true)}
                      disabled={processing[member.id]}
                      className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Chấp nhận"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleReview(member.id, false)}
                      disabled={processing[member.id]}
                      className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-red-500/20 border border-red-500/40 text-red-300 hover:bg-red-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Từ chối"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Refresh button */}
          {!loading && (
            <button
              onClick={loadPendingMembers}
              className="w-full py-2 px-3 rounded-lg text-[11px] font-semibold text-gray-400 hover:text-white transition-colors flex items-center justify-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Làm mới danh sách</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
