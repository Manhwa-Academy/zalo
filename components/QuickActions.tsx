import React from 'react'

interface QuickActionsProps {
  onResetStats: () => void
  onExportLogs: () => void
  onClearLogs: () => void
}

export default function QuickActions({ onResetStats, onExportLogs, onClearLogs }: QuickActionsProps) {
  return (
    <div className="card">
      <h3 className="text-lg font-bold mb-4">Thao tác nhanh</h3>
      
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={onResetStats}
          className="btn bg-dark-300 hover:bg-warning/20 text-sm flex flex-col items-center justify-center py-4"
        >
          <svg className="w-6 h-6 mb-2" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
          </svg>
          Reset thống kê
        </button>
        
        <button
          onClick={onExportLogs}
          className="btn bg-dark-300 hover:bg-primary/20 text-sm flex flex-col items-center justify-center py-4"
        >
          <svg className="w-6 h-6 mb-2" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2z"/>
          </svg>
          Export logs
        </button>
        
        <button
          onClick={onClearLogs}
          className="btn bg-dark-300 hover:bg-danger/20 text-sm flex flex-col items-center justify-center py-4"
        >
          <svg className="w-6 h-6 mb-2" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
          </svg>
          Xóa logs
        </button>
      </div>
    </div>
  )
}
