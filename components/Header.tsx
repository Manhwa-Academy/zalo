import React, { useState, useEffect } from 'react'

interface HeaderProps {
  userInfo: any
  onLogout: () => void
}

export default function Header({ userInfo, onLogout }: HeaderProps) {
  const [notifPermission, setNotifPermission] = useState<string>('default')

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotifPermission(Notification.permission)
    }
  }, [])

  const requestNotifPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const perm = await Notification.requestPermission()
      setNotifPermission(perm)
      if (perm === 'granted') {
        try {
          new Notification('🔔 Zalo Auto Reply Bot', {
            body: 'Đã bật thông báo tin nhắn mới thành công!',
            icon: '/aris.png',
          })
        } catch (e) {}
      }
    }
  }

  return (
    <header className="card mb-2 flex flex-col sm:flex-row items-center justify-between gap-2 p-2 sm:p-3">
      <div className="flex items-center space-x-2.5 sm:space-x-3 w-full sm:w-auto">
        <img 
          src="/aris.png" 
          alt="Logo" 
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover flex-shrink-0"
        />
        <div>
          <h1 className="text-sm sm:text-lg font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent leading-tight">
            Zalo Auto Reply Bot
          </h1>
          <p className="text-[10px] sm:text-xs text-gray-400">Tự động trả lời tin nhắn thông minh</p>
        </div>
      </div>
      
      {userInfo && (
        <div className="flex items-center justify-between sm:justify-end space-x-2.5 sm:space-x-3 w-full sm:w-auto pt-1 sm:pt-0 border-t sm:border-t-0 border-white/10">
          {/* Notification Toggle Button */}
          <button
            onClick={requestNotifPermission}
            title={notifPermission === 'granted' ? 'Đã bật thông báo tin nhắn' : 'Nhấn để bật thông báo tin nhắn mới'}
            className={`btn text-xs py-1 px-2.5 flex items-center gap-1.5 rounded-xl border transition-all ${
              notifPermission === 'granted'
                ? 'bg-success/20 border-success/40 text-success'
                : 'bg-amber-500/20 border-amber-500/40 text-amber-300 hover:bg-amber-500/30'
            }`}
          >
            <span>🔔</span>
            <span className="hidden sm:inline">
              {notifPermission === 'granted' ? 'Thông báo: BẬT' : 'Bật thông báo'}
            </span>
            <span className="sm:hidden">
              {notifPermission === 'granted' ? 'BẬT' : 'Bật'}
            </span>
          </button>

          <div className="text-left sm:text-right">
            <p className="font-medium text-xs truncate max-w-[120px]">{userInfo.displayName || 'User'}</p>
            <p className="text-[10px] text-gray-400">{userInfo.phoneNumber || 'N/A'}</p>
          </div>
          <button
            onClick={onLogout}
            className="btn btn-danger text-xs py-1 px-2.5"
          >
            Đăng xuất
          </button>
        </div>
      )}
    </header>
  )
}
