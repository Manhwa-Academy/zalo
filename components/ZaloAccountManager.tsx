import React, { useState } from 'react'

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
        // Create downloadable JSON file
        const exportData = {
          exported_at: new Date().toISOString(),
          account: data.credentials,
          version: '1.0',
        }

        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
          type: 'application/json',
        })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `zalo-account-${Date.now()}.json`
        link.click()
        URL.revokeObjectURL(url)

        setSuccess('✅ Đã xuất tài khoản Zalo thành công!')
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
        <span>🔐</span>
        <span>Quản lý Tài khoản Zalo</span>
      </h3>

      <p className="text-sm text-gray-400 mb-4">
        Xuất tài khoản Zalo để đăng nhập trên nhiều thiết bị mà không cần quét QR lại
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
          <span>📤</span>
          <span>{isExporting ? 'Đang xuất...' : 'Xuất tài khoản'}</span>
        </button>
      </div>

      {/* Info Box */}
      <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
        <p className="text-xs text-blue-300 font-semibold mb-2">💡 Hướng dẫn:</p>
        <ul className="text-xs text-gray-400 space-y-1">
          <li>• <strong>Xuất:</strong> Lưu file JSON chứa credentials Zalo</li>
          <li>• <strong>Nhập:</strong> Sử dụng nút "📥 Nhập tài khoản" ở trang đăng nhập (QR page)</li>
          <li>• <strong>Bảo mật:</strong> Không chia sẻ file này cho người khác!</li>
          <li>• <strong>Multi-device:</strong> 1 tài khoản Zalo login nhiều thiết bị</li>
        </ul>
      </div>
    </div>
  )
}
