import React, { useState } from 'react'
import { Shield, Upload, Lock, Settings, MessageSquare, User, Download, Info, AlertCircle } from 'lucide-react'

interface ZaloAccountManagerProps {
  onImportSuccess?: () => void
}

export default function ZaloAccountManager({ onImportSuccess }: ZaloAccountManagerProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Export Zalo credentials
  const handleExport = async () => {
    setIsExporting(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/zalo/export-account', {
        method: 'POST',
      })

      const data = await response.json()

      if (response.ok) {
        // Create downloadable JSON file with full backup
        const exportData = {
          version: '2.0',
          exported_at: new Date().toISOString(),
          credentials: data.credentials,
          botSettings: data.botSettings,
          messages: data.messages,
          userInfo: data.userInfo,
        }

        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
          type: 'application/json',
        })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `zalo-backup-${Date.now()}.json`
        link.click()
        URL.revokeObjectURL(url)

        setSuccess('✅ Đã xuất backup đầy đủ (credentials + settings + messages)!')
      } else {
        setError(data.error || 'Xuất tài khoản thất bại')
      }
    } catch (err) {
      setError('Lỗi kết nối')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="card">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        <Shield className="w-5 h-5 text-primary" />
        <span>Quản lý Tài khoản Zalo</span>
      </h3>

      <p className="text-sm text-gray-400 mb-4">
        Xuất toàn bộ dữ liệu (credentials + settings + messages) để khôi phục trên thiết bị khác
      </p>

      {/* Messages */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
          {success}
        </div>
      )}

      {/* Export Button */}
      <div className="flex justify-center">
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="btn btn-primary flex items-center justify-center gap-2 min-w-[200px]"
        >
          <Upload className="w-4 h-4" />
          <span>{isExporting ? 'Đang xuất...' : 'Xuất tài khoản'}</span>
        </button>
      </div>

      {/* Info Box */}
      <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
        <p className="text-xs text-blue-300 font-semibold mb-2 flex items-center gap-1">
          <Info className="w-4 h-4" />
          Nội dung backup bao gồm:
        </p>
        <ul className="text-xs text-gray-400 space-y-1">
          <li className="flex items-start gap-2">
            <Lock className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            <span><strong>Credentials:</strong> Thông tin đăng nhập Zalo</span>
          </li>
          <li className="flex items-start gap-2">
            <Settings className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            <span><strong>Bot Settings:</strong> Cấu hình bot (auto-reply, AI, whitelist...)</span>
          </li>
          <li className="flex items-start gap-2">
            <MessageSquare className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            <span><strong>Messages:</strong> 100 tin nhắn gần đây nhất</span>
          </li>
          <li className="flex items-start gap-2">
            <User className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            <span><strong>User Info:</strong> Thông tin profile (tên, avatar...)</span>
          </li>
          <li className="flex items-start gap-2">
            <Download className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            <span><strong>Nhập:</strong> Sử dụng nút "Nhập tài khoản" ở trang đăng nhập (QR page)</span>
          </li>
          <li className="flex items-start gap-2">
            <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            <span><strong>Bảo mật:</strong> Không chia sẻ file này cho người khác!</span>
          </li>
        </ul>
      </div>
    </div>
  )
}
