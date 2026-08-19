import React, { useState } from 'react'
import { RotateCcw, Download, Trash2, X, MessageSquare, FileText, Flame } from 'lucide-react'

interface QuickActionsProps {
  onResetStats: () => void
  onExportLogs: () => void
  onClearLogs: (type: 'chat_only' | 'logs_only' | 'both') => void
}

export default function QuickActions({ onResetStats, onExportLogs, onClearLogs }: QuickActionsProps) {
  const [showModal, setShowModal] = useState(false)

  const handleSelectOption = (type: 'chat_only' | 'logs_only' | 'both') => {
    onClearLogs(type)
    setShowModal(false)
  }

  return (
    <>
      <div className="card">
        <h3 className="text-lg font-bold mb-4">Thao tác nhanh</h3>

        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={onResetStats}
            className="btn bg-dark-300 hover:bg-warning/20 text-sm flex flex-col items-center justify-center py-4 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <RotateCcw className="w-6 h-6 mb-2 text-warning" />
            Reset thống kê
          </button>

          <button
            onClick={onExportLogs}
            className="btn bg-dark-300 hover:bg-primary/20 text-sm flex flex-col items-center justify-center py-4 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Download className="w-6 h-6 mb-2 text-primary" />
            Export logs
          </button>

          <button
            onClick={() => setShowModal(true)}
            className="btn bg-dark-300 hover:bg-danger/20 text-sm flex flex-col items-center justify-center py-4 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Trash2 className="w-6 h-6 mb-2 text-danger" />
            Xóa logs / Tin nhắn
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal with 3 Options */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
          <div className="bg-dark-200 border border-white/15 rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-5 animate-scaleUp">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-danger/20 border border-danger/30 flex items-center justify-center text-danger">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Tùy chọn xóa dữ liệu</h3>
                  <p className="text-xs text-gray-400">Chọn loại dữ liệu bạn muốn xóa khỏi hệ thống</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 3 Deletion Options */}
            <div className="space-y-3">
              {/* Option 1: Xóa trong tin nhắn */}
              <button
                onClick={() => handleSelectOption('chat_only')}
                className="w-full text-left p-4 rounded-2xl bg-dark-300/80 hover:bg-sky-500/15 border border-white/5 hover:border-sky-500/40 transition-all group flex items-start space-x-3"
              >
                <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-base mt-0.5 group-hover:scale-110 transition-transform">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-sky-300 transition-colors">
                    1. Xóa trống tin nhắn
                  </h4>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Xóa sạch lịch sử hiển thị tin nhắn trong giao diện Zalo Chat (chỉ giao diện)
                  </p>
                </div>
              </button>

              {/* Option 2: Xóa mỗi phần log */}
              <button
                onClick={() => handleSelectOption('logs_only')}
                className="w-full text-left p-4 rounded-2xl bg-dark-300/80 hover:bg-amber-500/15 border border-white/5 hover:border-amber-500/40 transition-all group flex items-start space-x-3"
              >
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-base mt-0.5 group-hover:scale-110 transition-transform">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                    2. Xóa mọi phần log
                  </h4>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Xóa lịch sử sự kiện Bot trong Dashboard & database (table zalo_messages)
                  </p>
                </div>
              </button>

              {/* Option 3: Xóa cả hai */}
              <button
                onClick={() => handleSelectOption('both')}
                className="w-full text-left p-4 rounded-2xl bg-dark-300/80 hover:bg-danger/20 border border-white/5 hover:border-danger/40 transition-all group flex items-start space-x-3"
              >
                <div className="w-8 h-8 rounded-xl bg-danger/20 text-danger flex items-center justify-center font-bold text-base mt-0.5 group-hover:scale-110 transition-transform">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-red-400 transition-colors">
                    3. Xóa cả hai
                  </h4>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Xóa hoàn toàn cả giao diện Chat Zalo + database logs (zalo_messages)
                  </p>
                </div>
              </button>
            </div>

            {/* Modal Footer */}
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-gray-300 transition-colors"
              >
                Hủy bỏ
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
