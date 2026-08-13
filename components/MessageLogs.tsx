import React from 'react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

interface MessageLog {
  id: number
  timestamp: Date
  from: string
  content: string
  type: string
  replied: boolean
}

interface MessageLogsProps {
  logs: MessageLog[]
}

export default function MessageLogs({ logs }: MessageLogsProps) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold">Lịch sử tin nhắn</h3>
          <p className="text-sm text-gray-400">Theo dõi tin nhắn đến và phản hồi tự động</p>
        </div>
        <span className="badge bg-primary/20 text-primary">
          {logs.length} tin nhắn
        </span>
      </div>
      
      <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
        {logs.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-dark-300 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
              </svg>
            </div>
            <p className="text-gray-400">Chưa có tin nhắn nào</p>
            <p className="text-sm text-gray-500 mt-2">Bot sẽ tự động ghi lại khi có người nhắn tin</p>
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className="bg-dark-300 rounded-lg p-4 border border-dark-200 hover:border-primary/50 transition-colors animate-slideIn"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-sm font-bold">
                    {((log as any).fromName || log.from || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium">{(log as any).fromName || log.from}</p>
                    <p className="text-xs text-gray-400">
                      {format(new Date(log.timestamp), 'HH:mm:ss - dd/MM/yyyy', { locale: vi })}
                    </p>
                  </div>
                </div>
                <span className={`badge ${log.replied ? 'badge-success' : 'badge-warning'}`}>
                  {log.replied ? '✅ Đã trả lời' : '⏳ Chờ xử lý'}
                </span>
              </div>
              
              <div className="ml-13">
                <p className="text-sm bg-dark-200 rounded-lg p-3 break-words">
                  {log.content}
                </p>
                <div className="flex items-center space-x-2 mt-2">
                  <span className="text-xs text-gray-500">
                    {log.type === 'User' ? '👤 Tin nhắn cá nhân' : '👥 Tin nhắn nhóm'}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      {logs.length > 0 && (
        <div className="mt-4 pt-4 border-t border-dark-300 text-center">
          <p className="text-xs text-gray-500">
            Hiển thị {logs.length} tin nhắn gần nhất
          </p>
        </div>
      )}
    </div>
  )
}
