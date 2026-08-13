import React from 'react'

interface BotStatusProps {
  isConnected: boolean
  isListening: boolean
  lastActivity?: string
}

export default function BotStatus({ isConnected, isListening, lastActivity }: BotStatusProps) {
  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold mb-2">Trạng thái kết nối</h3>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-success animate-pulse' : 'bg-gray-500'}`}></div>
              <span className="text-sm">{isConnected ? 'Đã kết nối Zalo' : 'Chưa kết nối'}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isListening ? 'bg-primary animate-pulse' : 'bg-gray-500'}`}></div>
              <span className="text-sm">{isListening ? 'Đang lắng nghe tin nhắn' : 'Chưa lắng nghe'}</span>
            </div>
          </div>
        </div>
        
        {lastActivity && (
          <div className="text-right">
            <p className="text-xs text-gray-400">Hoạt động gần nhất</p>
            <p className="text-sm font-medium">{lastActivity}</p>
          </div>
        )}
      </div>
      
      <div className="mt-4 p-3 bg-primary/10 rounded-lg border border-primary/30">
        <p className="text-xs text-gray-300">
          💡 <strong>Mẹo:</strong> Bot sẽ tự động trả lời TẤT CẢ tin nhắn khi được bật. 
          Bạn có thể tùy chỉnh để chỉ trả lời người/nhóm cụ thể trong phiên bản nâng cao.
        </p>
      </div>
    </div>
  )
}
