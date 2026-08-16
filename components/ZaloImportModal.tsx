'use client'

import { useState } from 'react'

interface ZaloImportModalProps {
  onClose: () => void
  onSuccess: () => void
}

export default function ZaloImportModal({ onClose, onSuccess }: ZaloImportModalProps) {
  const [importData, setImportData] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [successDetails, setSuccessDetails] = useState<{
    hasSettings: boolean
    messageCount: number
  } | null>(null)

  const handleImport = async () => {
    if (!importData.trim()) {
      setError('Vui lòng nhập dữ liệu tài khoản')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const parsedData = JSON.parse(importData)

      // Support both v1.0 (old format) and v2.0 (new format with settings)
      const credentials = parsedData.credentials || parsedData.account || parsedData
      const botSettings = parsedData.botSettings
      const messages = parsedData.messages
      const userInfo = parsedData.userInfo

      const response = await fetch('/api/zalo/import-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          credentials,
          botSettings,
          messages,
          userInfo,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        console.log('✅ [Frontend] Import successful')
        
        // Show custom success modal
        setSuccessDetails({
          hasSettings: !!botSettings,
          messageCount: messages?.length || 0,
        })
        setShowSuccess(true)
        
        // Close modal and reload session immediately after showing success
        setTimeout(() => {
          onSuccess() // This will close QR modal and reload Zalo session
        }, 1500) // Shorter delay - just enough to see success message
      } else {
        setError(data.error || 'Nhập tài khoản thất bại')
      }
    } catch (err: any) {
      console.error('❌ [Frontend] Import error:', err)
      if (err instanceof SyntaxError) {
        setError('Dữ liệu không hợp lệ (JSON format sai)')
      } else {
        setError('Lỗi kết nối')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string
        const json = JSON.parse(text)
        setImportData(JSON.stringify(json, null, 2))
        setError(null)
      } catch (err) {
        setError('File không hợp lệ')
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      {/* Success Modal */}
      {showSuccess && successDetails && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[10000] animate-fadeIn">
          <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-2 border-green-400/50 rounded-3xl p-8 max-w-md w-full mx-4 animate-scaleIn shadow-2xl">
            <div className="text-center space-y-4">
              {/* Success Icon */}
              <div className="w-20 h-20 mx-auto bg-green-500/30 border-2 border-green-400/50 rounded-full flex items-center justify-center animate-bounce">
                <span className="text-5xl">✅</span>
              </div>
              
              {/* Title */}
              <h3 className="text-2xl font-bold text-white">
                Nhập tài khoản thành công!
              </h3>
              
              {/* Details */}
              <div className="space-y-2 text-left bg-dark-300/50 border border-white/10 rounded-xl p-4">
                <div className="flex items-center gap-2 text-green-300">
                  <span className="text-lg">✅</span>
                  <span className="text-sm font-medium">Đã nhập tài khoản Zalo thành công</span>
                </div>
                {successDetails.hasSettings && (
                  <div className="flex items-center gap-2 text-blue-300">
                    <span className="text-lg">⚙️</span>
                    <span className="text-sm font-medium">Đã khôi phục cài đặt bot</span>
                  </div>
                )}
                {successDetails.messageCount > 0 && (
                  <div className="flex items-center gap-2 text-purple-300">
                    <span className="text-lg">💬</span>
                    <span className="text-sm font-medium">Đã khôi phục {successDetails.messageCount} tin nhắn</span>
                  </div>
                )}
              </div>
              
              {/* Loading */}
              <div className="flex items-center justify-center gap-2 text-gray-300">
                <div className="w-4 h-4 border-2 border-gray-400 border-t-white rounded-full animate-spin"></div>
                <span className="text-sm">Đang tải giao diện chat...</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Import Modal */}
      <div className="bg-dark-200 rounded-2xl border border-white/10 p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto animate-slideIn">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <span>📥</span>
            <span>Nhập Tài khoản Zalo</span>
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-sm text-blue-300">
            <p className="font-semibold mb-1">💡 Hướng dẫn:</p>
            <ul className="text-xs space-y-1">
              <li>• Upload file JSON đã xuất từ Dashboard</li>
              <li>• Hoặc paste JSON trực tiếp vào ô bên dưới</li>
              <li>• Sau khi import thành công, sẽ tự động đăng nhập Zalo</li>
            </ul>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Chọn file JSON đã xuất:
            </label>
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-400
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-primary/20 file:text-primary
                hover:file:bg-primary/30 cursor-pointer"
            />
          </div>

          {/* Manual Paste */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Hoặc paste JSON trực tiếp:
            </label>
            <textarea
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              placeholder='{"imei":"...","cookie":{...},"userAgent":"..."}'
              className="w-full h-48 p-3 rounded-lg bg-dark-100/50 border border-white/10 text-sm font-mono resize-none focus:outline-none focus:border-primary/50"
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleImport}
              disabled={loading || !importData.trim()}
              className="btn btn-primary flex-1"
            >
              {loading ? 'Đang nhập...' : '📥 Nhập tài khoản'}
            </button>
            <button
              onClick={onClose}
              className="btn btn-secondary"
            >
              Hủy
            </button>
          </div>

          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <p className="text-xs text-amber-300">
              <strong>⚠️ Lưu ý bảo mật:</strong> File JSON chứa thông tin đăng nhập Zalo. 
              Không chia sẻ cho người khác!
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
