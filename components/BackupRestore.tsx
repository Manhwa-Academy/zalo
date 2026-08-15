import React, { useState, useRef } from 'react'

interface BackupRestoreProps {
  onBackupComplete?: () => void
  onRestoreComplete?: () => void
}

export default function BackupRestore({ onBackupComplete, onRestoreComplete }: BackupRestoreProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [backupPreview, setBackupPreview] = useState<any>(null)
  const [restoreSettings, setRestoreSettings] = useState(true)
  const [restoreMessages, setRestoreMessages] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Export backup
  const handleExport = async () => {
    setIsExporting(true)
    try {
      const res = await fetch('/api/zalo/backup')
      const data = await res.json()

      if (data.success && data.backup) {
        // Create download
        const blob = new Blob([JSON.stringify(data.backup, null, 2)], {
          type: 'application/json',
        })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
        const userName = data.backup.userInfo?.displayName || 'user'
        link.download = `zalo-backup-${userName}-${timestamp}.json`
        
        link.click()
        URL.revokeObjectURL(url)

        alert(`✅ Đã xuất backup thành công!\n\n📊 Thống kê:\n- Settings: ✅\n- Tin nhắn: ${data.backup.stats?.exportedMessages || 0} tin`)
        onBackupComplete?.()
      } else {
        throw new Error(data.error || 'Failed to export backup')
      }
    } catch (error: any) {
      console.error('Export backup failed:', error)
      alert(`❌ Lỗi khi xuất backup: ${error.message}`)
    } finally {
      setIsExporting(false)
    }
  }

  // Select file for import
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setSelectedFile(file)

    // Read and preview file
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const backup = JSON.parse(event.target?.result as string)
        
        if (backup.version !== '1.0') {
          throw new Error('Unsupported backup version')
        }

        setBackupPreview(backup)
        setShowImportModal(true)
      } catch (error: any) {
        alert(`❌ File backup không hợp lệ: ${error.message}`)
        setSelectedFile(null)
      }
    }
    reader.readAsText(file)
  }

  // Import/Restore backup
  const handleImport = async () => {
    if (!backupPreview) return

    setIsImporting(true)
    try {
      const res = await fetch('/api/zalo/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          backup: backupPreview,
          restoreSettings,
          restoreMessages,
        }),
      })

      const data = await res.json()

      if (data.success) {
        alert(`✅ Khôi phục thành công!\n\n${data.message}\n\n⚠️ Tải lại trang để áp dụng thay đổi.`)
        setShowImportModal(false)
        setSelectedFile(null)
        setBackupPreview(null)
        onRestoreComplete?.()
        
        // Reload page after 1s
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      } else {
        throw new Error(data.error || 'Failed to restore backup')
      }
    } catch (error: any) {
      console.error('Import backup failed:', error)
      alert(`❌ Lỗi khi khôi phục: ${error.message}`)
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <>
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2">
              <span>💾</span>
              <span>Backup & Restore</span>
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Sao lưu và khôi phục settings + tin nhắn
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Export Backup Button */}
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="btn bg-primary/20 hover:bg-primary/30 border border-primary/40 text-white flex flex-col items-center justify-center py-6 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? (
              <>
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-2"></div>
                <span className="text-sm font-semibold">Đang xuất...</span>
              </>
            ) : (
              <>
                <svg className="w-8 h-8 mb-2 text-primary" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2z"/>
                </svg>
                <span className="text-sm font-semibold">📤 Xuất Backup</span>
                <span className="text-xs text-gray-400 mt-1">Tải file backup về máy</span>
              </>
            )}
          </button>

          {/* Import Backup Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="btn bg-success/20 hover:bg-success/30 border border-success/40 text-white flex flex-col items-center justify-center py-6 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-8 h-8 mb-2 text-success" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6-.67l-2.59 2.58L9 12.5l5-5 5 5-1.41 1.41L13 11.33V21h-2z"/>
            </svg>
            <span className="text-sm font-semibold">📥 Nhập Backup</span>
            <span className="text-xs text-gray-400 mt-1">Khôi phục từ file</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Info Box */}
        <div className="p-3 bg-sky-500/10 border border-sky-500/30 rounded-xl">
          <p className="text-xs text-sky-300 leading-relaxed">
            <strong>💡 Mẹo:</strong> Sử dụng Backup để:
            <br />• 🔄 Sync settings giữa nhiều thiết bị
            <br />• 💾 Lưu trữ cấu hình và tin nhắn quan trọng
            <br />• 🔁 Khôi phục nhanh khi cần thiết
          </p>
        </div>
      </div>

      {/* Import Preview Modal */}
      {showImportModal && backupPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-dark-200 border border-white/15 rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col animate-scaleUp">
            {/* Header */}
            <div className="p-5 border-b border-dark-300 bg-dark-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span>📥</span>
                    <span>Xác nhận Khôi phục</span>
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Xem trước và chọn dữ liệu cần khôi phục
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowImportModal(false)
                    setSelectedFile(null)
                    setBackupPreview(null)
                  }}
                  className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Backup Info */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              {/* Backup Metadata */}
              <div className="p-4 bg-dark-300/60 rounded-xl border border-dark-200">
                <p className="text-xs text-gray-400 mb-2 font-semibold">📦 Thông tin Backup:</p>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">👤 Người dùng:</span>
                    <span className="text-white font-medium">{backupPreview.userInfo?.displayName || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">📅 Xuất lúc:</span>
                    <span className="text-white font-medium">
                      {new Date(backupPreview.exportedAt).toLocaleString('vi-VN')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">💬 Tin nhắn:</span>
                    <span className="text-white font-medium">{backupPreview.stats?.exportedMessages || 0} tin</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">⚙️ Settings:</span>
                    <span className="text-success font-medium">✅ Có</span>
                  </div>
                </div>
              </div>

              {/* Options */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-gray-300">🎯 Chọn dữ liệu cần khôi phục:</p>

                {/* Restore Settings */}
                <label className="flex items-start p-3 rounded-xl border cursor-pointer transition-all hover:bg-white/5 ${restoreSettings ? 'border-primary bg-primary/10' : 'border-dark-200'}">
                  <input
                    type="checkbox"
                    checked={restoreSettings}
                    onChange={(e) => setRestoreSettings(e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-primary cursor-pointer"
                  />
                  <div className="ml-3">
                    <p className="text-sm font-semibold text-white">⚙️ Bot Settings</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Khôi phục cấu hình bot (tin nhắn tự động, phạm vi reply, whitelist, preset messages...)
                    </p>
                  </div>
                </label>

                {/* Restore Messages */}
                <label className={`flex items-start p-3 rounded-xl border cursor-pointer transition-all hover:bg-white/5 ${restoreMessages ? 'border-primary bg-primary/10' : 'border-dark-200'}`}>
                  <input
                    type="checkbox"
                    checked={restoreMessages}
                    onChange={(e) => setRestoreMessages(e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-primary cursor-pointer"
                  />
                  <div className="ml-3">
                    <p className="text-sm font-semibold text-white">💬 Tin nhắn</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Khôi phục lịch sử tin nhắn ({backupPreview.stats?.exportedMessages || 0} tin) - Sẽ merge với tin nhắn hiện tại
                    </p>
                  </div>
                </label>
              </div>

              {/* Warning */}
              <div className="p-3 bg-warning/10 border border-warning/30 rounded-xl">
                <p className="text-xs text-warning leading-relaxed">
                  <strong>⚠️ Lưu ý:</strong> Settings sẽ ghi đè lên cấu hình hiện tại. Tin nhắn sẽ được merge (không ghi đè).
                </p>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-5 border-t border-dark-300 bg-dark-100 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowImportModal(false)
                  setSelectedFile(null)
                  setBackupPreview(null)
                }}
                disabled={isImporting}
                className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-sm font-bold text-gray-300 transition-colors disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleImport}
                disabled={isImporting || (!restoreSettings && !restoreMessages)}
                className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/80 text-sm font-bold text-white transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isImporting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Đang khôi phục...</span>
                  </>
                ) : (
                  <>
                    <span>✅</span>
                    <span>Khôi phục ngay</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
