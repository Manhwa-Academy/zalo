import React, { useState, useEffect } from 'react'
import { Lock, X, Keyboard, Eye, Info, Loader2, Check } from 'lucide-react'

interface PrivacySettingsProps {
  onClose: () => void
}

export default function PrivacySettings({ onClose }: PrivacySettingsProps) {
  const [enableTypingIndicator, setEnableTypingIndicator] = useState(true)
  const [enableReadReceipts, setEnableReadReceipts] = useState(true)
  const [loading, setLoading] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedTyping = localStorage.getItem('zalo_enable_typing_indicator')
    const savedReceipts = localStorage.getItem('zalo_enable_read_receipts')
    
    if (savedTyping !== null) {
      setEnableTypingIndicator(savedTyping === 'true')
    }
    if (savedReceipts !== null) {
      setEnableReadReceipts(savedReceipts === 'true')
    }
  }, [])

  const handleSave = () => {
    setLoading(true)
    
    // Save to localStorage
    localStorage.setItem('zalo_enable_typing_indicator', String(enableTypingIndicator))
    localStorage.setItem('zalo_enable_read_receipts', String(enableReadReceipts))
    
    // Show success message
    setTimeout(() => {
      setLoading(false)
      setSaveSuccess(true)
      
      // Auto close after 1 second
      setTimeout(() => {
        onClose()
      }, 1000)
    }, 500)
  }

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-dark-200 border border-sky-500/30 rounded-3xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-sky-950/80 to-blue-950/80 border-b border-sky-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Lock className="w-6 h-6 text-sky-400" />
            <div>
              <h3 className="text-base font-bold text-white">Cài đặt riêng tư</h3>
              <p className="text-xs text-gray-400 mt-0.5">Quản lý quyền riêng tư và trạng thái</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Typing Indicator Setting */}
          <div className="bg-dark-300/50 border border-white/10 rounded-2xl p-4 hover:border-sky-500/30 transition-all">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Keyboard className="w-5 h-5 text-sky-400" />
                  <h4 className="text-sm font-bold text-white">Gửi trạng thái đang nhập</h4>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Khi bật, người khác sẽ thấy bạn đang gõ tin nhắn. Khi tắt, họ sẽ không nhận được thông báo này.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                <input
                  type="checkbox"
                  checked={enableTypingIndicator}
                  onChange={(e) => setEnableTypingIndicator(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-sky-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
              </label>
            </div>
          </div>

          {/* Read Receipts Setting */}
          <div className="bg-dark-300/50 border border-white/10 rounded-2xl p-4 hover:border-sky-500/30 transition-all">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="w-5 h-5 text-sky-400" />
                  <h4 className="text-sm font-bold text-white">Gửi xác nhận đã đọc</h4>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Khi bật, người gửi sẽ thấy bạn đã đọc tin nhắn của họ (biểu tượng ✓✓ màu xanh). Khi tắt, họ chỉ thấy tin nhắn đã gửi (✓).
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                <input
                  type="checkbox"
                  checked={enableReadReceipts}
                  onChange={(e) => setEnableReadReceipts(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-sky-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
              </label>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
            <div className="flex items-start gap-2">
              <Info className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <p className="text-xs text-amber-200 leading-relaxed">
                <strong>Lưu ý:</strong> Cài đặt này chỉ ảnh hưởng đến tin nhắn mới. Tin nhắn cũ vẫn giữ nguyên trạng thái đã gửi trước đó.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-dark-300/50 border-t border-white/5 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white rounded-xl hover:bg-dark-400/50 transition-all"
          >
            Hủy
          </button>
          
          <button
            onClick={handleSave}
            disabled={loading || saveSuccess}
            className={`px-6 py-2 text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${
              saveSuccess
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang lưu...</span>
              </>
            ) : saveSuccess ? (
              <>
                <Check className="w-4 h-4" />
                <span>Đã lưu!</span>
              </>
            ) : (
              'Lưu cài đặt'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
