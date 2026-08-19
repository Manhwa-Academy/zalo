import React from 'react'
import { MessageSquare, CheckCircle, Users } from 'lucide-react'

interface StatsCardsProps {
  stats: {
    totalMessages: number
    repliedMessages: number
    activeChats: number
  }
}

export default function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: 'Tổng tin nhắn',
      value: stats.totalMessages,
      icon: <MessageSquare className="w-6 h-6" />,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Đã trả lời',
      value: stats.repliedMessages,
      icon: <CheckCircle className="w-6 h-6" />,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Cuộc trò chuyện',
      value: stats.activeChats,
      icon: <Users className="w-6 h-6" />,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-500/10',
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4">
      {cards.map((card, index) => (
        <div key={index} className="card hover:scale-105 transition-transform">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">{card.title}</p>
              <p className="text-3xl font-bold">{card.value}</p>
            </div>
            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center`}>
              {card.icon}
            </div>
          </div>
          <div className="mt-4 h-2 bg-dark-300 rounded-full overflow-hidden">
            <div 
              className={`h-full bg-gradient-to-r ${card.color} transition-all duration-500`}
              style={{ width: `${Math.min((card.value / 100) * 100, 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
