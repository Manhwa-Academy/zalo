import React, { useState, useEffect, useRef } from 'react'

interface HeaderProps {
  userInfo: any
  onLogout: () => void
  onLogoutAllDevices?: () => void
}

export default function Header({ userInfo, onLogout, onLogoutAllDevices }: HeaderProps) {
  const [notifPermission, setNotifPermission] = useState<string>('default')
  const [showUserMenu, setShowUserMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotifPermission(Notification.permission)
    }
  }, [])

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
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

  const handleLogout = () => {
    setShowUserMenu(false)
    onLogout()
  }

  const handleLogoutAllDevices = () => {
    setShowUserMenu(false)
    if (onLogoutAllDevices) {
      onLogoutAllDevices()
    }
  }

  const handleSettings = () => {
    setShowUserMenu(false)
    // Navigate to settings - can be extended later
    alert('Tính năng cài đặt đang được phát triển')
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

          {/* User Menu Dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-dark-200/80 border border-white/10 hover:border-primary/40 transition-all"
            >
              <div className="text-left">
                <p className="font-medium text-xs truncate max-w-[120px]">{userInfo.displayName || 'User'}</p>
                <p className="text-[10px] text-gray-400">{userInfo.phoneNumber || 'N/A'}</p>
              </div>
              <svg
                className={`w-4 h-4 text-gray-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown Menu - Fixed z-index and positioning */}
            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-dark-200/98 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl overflow-hidden z-[9999] animate-slideIn">
                <div className="py-1">
                  {/* Settings */}
                  <button
                    onClick={handleSettings}
                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-white/10 transition-colors flex items-center gap-3 text-gray-300 hover:text-white"
                  >
                    <span className="text-lg">⚙️</span>
                    <span>Cài đặt</span>
                  </button>

                  <div className="h-px bg-white/10 my-1"></div>

                  {/* Logout This Device */}
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-white/10 transition-colors flex items-center gap-3 text-gray-300 hover:text-white"
                  >
                    <span className="text-lg">🚪</span>
                    <span>Đăng xuất thiết bị này</span>
                  </button>

                  {/* Logout All Devices */}
                  <button
                    onClick={handleLogoutAllDevices}
                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-red-500/10 transition-colors flex items-center gap-3 text-red-400 hover:text-red-300"
                  >
                    <span className="text-lg">🚫</span>
                    <span>Đăng xuất tất cả thiết bị</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
