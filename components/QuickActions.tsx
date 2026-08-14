import React, { useState } from 'react'

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
            <svg className="w-6 h-6 mb-2 text-warning" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
            </svg>
            Reset thống kê
          </button>

          <button
            onClick={onExportLogs}
            className="btn bg-dark-300 hover:bg-primary/20 text-sm flex flex-col items-center justify-center py-4 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <svg className="w-6 h-6 mb-2 text-primary" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2z"/>
            </svg>
            Export logs
          </button>

          <button
            onClick={() => setShowModal(true)}
            className="btn bg-dark-300 hover:bg-danger/20 text-sm flex flex-col items-center justify-center py-4 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <svg className="w-6 h-6 mb-2 text-danger" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
            </svg>
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
                <div className="w-10 h-10 rounded-2xl bg-danger/20 border border-danger/30 flex items-center justify-center text-danger text-xl">
                  🗑️
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
                ✕
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
                  💬
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-sky-300 transition-colors">
                    1. Xóa trong tin nhắn
                  </h4>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Xóa sạch lịch sử hiển thị tin nhắn trong giao diện Zalo Chat
                  </p>
                </div>
              </button>

              {/* Option 2: Xóa mỗi phần log */}
              <button
                onClick={() => handleSelectOption('logs_only')}
                className="w-full text-left p-4 rounded-2xl bg-dark-300/80 hover:bg-amber-500/15 border border-white/5 hover:border-amber-500/40 transition-all group flex items-start space-x-3"
              >
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-base mt-0.5 group-hover:scale-110 transition-transform">
                  📋
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                    2. Xóa mỗi phần log
                  </h4>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Xóa lịch sử sự kiện Bot trong Dashboard & file tin nhắn tự động
                  </p>
                </div>
              </button>

              {/* Option 3: Xóa cả hai */}
              <button
                onClick={() => handleSelectOption('both')}
                className="w-full text-left p-4 rounded-2xl bg-dark-300/80 hover:bg-danger/20 border border-white/5 hover:border-danger/40 transition-all group flex items-start space-x-3"
              >
                <div className="w-8 h-8 rounded-xl bg-danger/20 text-danger flex items-center justify-center font-bold text-base mt-0.5 group-hover:scale-110 transition-transform">
                  💥
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-red-400 transition-colors">
                    3. Xóa cả hai
                  </h4>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Xóa hoàn toàn cả Lịch sử Chat Zalo lẫn Log sự kiện Bot
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
