import React, { useState, useEffect } from 'react'
import { Link2, ChevronDown, Loader2, CheckCircle, Copy, Share2, RefreshCw, Sparkles } from 'lucide-react'

interface GroupLinkSectionProps {
  groupId: string
}

export default function GroupLinkSection({ groupId }: GroupLinkSectionProps) {
  const [loading, setLoading] = useState(false)
  const [groupLink, setGroupLink] = useState<string | null>(null)
  const [linkEnabled, setLinkEnabled] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showSection, setShowSection] = useState(false)

  // Load group link on mount
  useEffect(() => {
    if (showSection) {
      loadGroupLink()
    }
  }, [groupId, showSection])

  const loadGroupLink = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/zalo/group-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_link',
          groupId,
        }),
      })

      const data = await res.json()

      if (data.success) {
        setGroupLink(data.data.link || null)
        setLinkEnabled(data.data.enabled || false)
      } else {
        console.error('Failed to load group link:', data.error)
      }
    } catch (error) {
      console.error('Error loading group link:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEnableLink = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/zalo/group-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'enable_link',
          groupId,
        }),
      })

      const data = await res.json()

      if (data.success) {
        setGroupLink(data.data.link)
        setLinkEnabled(true)
        alert('✅ Đã tạo link mời nhóm thành công!')
      } else {
        alert(`❌ Lỗi: ${data.error}`)
      }
    } catch (error) {
      console.error('Error enabling group link:', error)
      alert('❌ Không thể tạo link mời nhóm')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyLink = () => {
    if (groupLink) {
      navigator.clipboard.writeText(groupLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleShareLink = () => {
    if (groupLink && navigator.share) {
      navigator
        .share({
          title: 'Link mời nhóm Zalo',
          text: 'Tham gia nhóm Zalo của chúng tôi!',
          url: groupLink,
        })
        .catch((error) => {
          console.log('Error sharing:', error)
          // Fallback to copy
          handleCopyLink()
        })
    } else {
      // Fallback to copy if share not supported
      handleCopyLink()
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
          <Link2 className="w-4 h-4 text-sky-400" />
          <span className="text-xs font-bold text-white group-hover:text-primary transition-colors">
            Link mời nhóm
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
          ) : !linkEnabled || !groupLink ? (
            <div className="space-y-3">
              <p className="text-xs text-gray-400 text-center">
                Link mời nhóm chưa được tạo hoặc đã bị tắt.
              </p>
              <button
                onClick={handleEnableLink}
                disabled={loading}
                className="w-full py-2.5 px-3 rounded-xl text-xs font-bold bg-gradient-to-r from-primary to-blue-600 hover:brightness-110 text-white transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Tạo link mời nhóm</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Link display */}
              <div className="bg-dark-400 border border-white/10 rounded-xl p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 font-semibold flex items-center gap-1">
                    <Link2 className="w-3 h-3" />
                    Link mời:
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                    linkEnabled
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                  }`}>
                    {linkEnabled ? (
                      <>
                        <CheckCircle className="w-3 h-3" />
                        Đang bật
                      </>
                    ) : (
                      'Đã tắt'
                    )}
                  </span>
                </div>
                
                <div className="bg-dark-300 border border-white/10 rounded-lg p-2">
                  <p className="text-xs text-sky-300 font-mono break-all select-all">
                    {groupLink}
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleCopyLink}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                    copied
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                      : 'bg-dark-300 border-white/10 text-gray-300 hover:text-white hover:border-primary'
                  }`}
                >
                  {copied ? (
                    <>
                      <CheckCircle className="w-3 h-3" />
                      <span>Đã copy!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy link</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleShareLink}
                  className="py-2 px-3 rounded-xl text-xs font-bold border border-white/10 bg-dark-300 text-gray-300 hover:text-white hover:border-sky-500 transition-all flex items-center justify-center gap-1.5"
                >
                  <Share2 className="w-3 h-3" />
                  <span>Chia sẻ</span>
                </button>
              </div>

              {/* Refresh button */}
              <button
                onClick={loadGroupLink}
                disabled={loading}
                className="w-full py-2 px-3 rounded-lg text-[11px] font-semibold text-gray-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Làm mới link</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
