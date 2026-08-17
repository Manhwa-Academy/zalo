import React, { useState, useEffect, useRef } from 'react'
import GeminiSettings from './GeminiSettings'

interface HeaderProps {
  userInfo: any
  onLogout: () => void
  onLogoutAllDevices?: () => void
}

interface AppSettings {
  notificationSound: boolean
  replyDelay: number
  learningMode: boolean
  autoMarkRead: boolean
  maxReplyLength: number
  geminiApiKey: string
  geminiModel: string
  darkMode: boolean
  animations: boolean
  fontSize: string
  saveHistory: boolean
  autoDeleteDays: string
}

export default function Header({ userInfo, onLogout, onLogoutAllDevices }: HeaderProps) {
  const [notifPermission, setNotifPermission] = useState<string>('default')
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  
  // Settings state
  const [settings, setSettings] = useState<AppSettings>({
    notificationSound: true,
    replyDelay: 2,
    learningMode: false,
    autoMarkRead: true,
    maxReplyLength: 500,
    geminiApiKey: '',
    geminiModel: 'gemini-3.1-flash-lite',
    darkMode: true,
    animations: true,
    fontSize: 'medium',
    saveHistory: true,
    autoDeleteDays: 'never'
  })
  const [isLoadingSettings, setIsLoadingSettings] = useState(true)

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotifPermission(Notification.permission)
    }
    
    // Load settings from database
    loadSettingsFromDatabase()
  }, [])

  const loadSettingsFromDatabase = async () => {
    try {
      const response = await fetch('/api/settings')
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.settings) {
          setSettings(data.settings)
          console.log('✅ [Header] Loaded settings from database:', data.settings)
        }
      }
    } catch (error) {
      console.error('❌ [Header] Failed to load settings:', error)
    } finally {
      setIsLoadingSettings(false)
    }
  }

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
    setShowSettingsModal(true)
  }

  const saveSettings = async () => {
    try {
      // Save to database
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })

      if (!response.ok) {
        throw new Error('Failed to save settings')
      }

      // Apply settings
      applySettings()
      
      // Close modal
      setShowSettingsModal(false)
      
      // Show success notification
      if (notifPermission === 'granted') {
        try {
          new Notification('⚙️ Cài đặt đã lưu', {
            body: 'Các thay đổi đã được đồng bộ tới tất cả thiết bị!',
            icon: '/aris.png',
          })
        } catch (e) {}
      }

      console.log('✅ [Header] Settings saved to database')
    } catch (error) {
      console.error('❌ [Header] Failed to save settings:', error)
      alert('Lỗi: Không thể lưu cài đặt. Vui lòng thử lại!')
    }
  }

  const applySettings = () => {
    // Apply font size to body
    document.body.classList.remove('text-sm', 'text-base', 'text-lg')
    if (settings.fontSize === 'small') document.body.classList.add('text-sm')
    else if (settings.fontSize === 'large') document.body.classList.add('text-lg')
    else document.body.classList.add('text-base')

    // Apply animations
    if (!settings.animations) {
      document.body.classList.add('no-animations')
    } else {
      document.body.classList.remove('no-animations')
    }

    // Store settings globally for other components to access
    if (typeof window !== 'undefined') {
      (window as any).zaloBotSettings = settings
    }
  }

  // Apply settings on mount and when settings change
  useEffect(() => {
    applySettings()
  }, [settings])

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

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[10000] p-4 animate-fadeIn" onClick={() => setShowSettingsModal(false)}>
          <div className="bg-dark-100 border border-white/20 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-scaleIn" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-primary/20 to-secondary/20 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">⚙️</span>
                <h2 className="text-xl font-bold text-white">Cài đặt</h2>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-gray-300 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)] space-y-5">
              {/* Notification Settings */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>🔔</span>
                  <span>Thông báo</span>
                </h3>
                <div className="bg-dark-200/50 border border-white/10 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">Thông báo trình duyệt</p>
                      <p className="text-xs text-gray-400 mt-0.5">Nhận thông báo khi có tin nhắn mới</p>
                    </div>
                    <button
                      onClick={requestNotifPermission}
                      className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                        notifPermission === 'granted'
                          ? 'bg-success/20 border border-success/40 text-success'
                          : 'bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30'
                      }`}
                    >
                      {notifPermission === 'granted' ? '✅ Đã bật' : 'Bật thông báo'}
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between pt-3 border-t border-white/10">
                    <div>
                      <p className="text-sm font-medium text-white">Âm thanh thông báo</p>
                      <p className="text-xs text-gray-400 mt-0.5">Phát âm thanh khi có tin nhắn</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={settings.notificationSound}
                        onChange={(e) => setSettings({...settings, notificationSound: e.target.checked})}
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Auto Reply Settings */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>🤖</span>
                  <span>Tự động trả lời</span>
                </h3>
                <div className="bg-dark-200/50 border border-white/10 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">Độ trễ phản hồi</p>
                      <p className="text-xs text-gray-400 mt-0.5">Thời gian chờ trước khi bot trả lời</p>
                    </div>
                    <select 
                      className="bg-dark-300 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-primary/50 outline-none"
                      value={settings.replyDelay}
                      onChange={(e) => setSettings({...settings, replyDelay: Number(e.target.value)})}
                    >
                      <option value="0">Ngay lập tức</option>
                      <option value="2">2 giây</option>
                      <option value="5">5 giây</option>
                      <option value="10">10 giây</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center justify-between pt-3 border-t border-white/10">
                    <div>
                      <p className="text-sm font-medium text-white">Chế độ học tập</p>
                      <p className="text-xs text-gray-400 mt-0.5">Bot sẽ chỉ ghi nhận tin nhắn, không trả lời</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={settings.learningMode}
                        onChange={(e) => setSettings({...settings, learningMode: e.target.checked})}
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-white/10">
                    <div>
                      <p className="text-sm font-medium text-white">Độ dài trả lời tối đa</p>
                      <p className="text-xs text-gray-400 mt-0.5">Giới hạn số ký tự trong phản hồi của bot</p>
                    </div>
                    <input
                      type="number"
                      min="100"
                      max="2000"
                      step="50"
                      value={settings.maxReplyLength}
                      onChange={(e) => setSettings({...settings, maxReplyLength: Number(e.target.value)})}
                      className="bg-dark-300 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-primary/50 outline-none w-24 text-right"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-white/10">
                    <div>
                      <p className="text-sm font-medium text-white">Tự động xác nhận đã đọc</p>
                      <p className="text-xs text-gray-400 mt-0.5">Đánh dấu tin nhắn là đã đọc tự động</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={settings.autoMarkRead}
                        onChange={(e) => setSettings({...settings, autoMarkRead: e.target.checked})}
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Gemini AI Settings */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>✨</span>
                  <span>Cấu hình Gemini AI</span>
                </h3>
                <div className="bg-dark-200/50 border border-white/10 rounded-xl p-4">
                  <GeminiSettings
                    geminiApiKey={settings.geminiApiKey}
                    geminiModel={settings.geminiModel}
                    onApiKeyChange={(key) => setSettings({...settings, geminiApiKey: key})}
                    onModelChange={(model) => setSettings({...settings, geminiModel: model})}
                  />
                </div>
              </div>

              {/* Display Settings */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>🎨</span>
                  <span>Giao diện</span>
                </h3>
                <div className="bg-dark-200/50 border border-white/10 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">Chế độ tối</p>
                      <p className="text-xs text-gray-400 mt-0.5">Giao diện tối bảo vệ mắt</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked disabled />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary opacity-50"></div>
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 italic">Hiện tại chỉ hỗ trợ chế độ tối</p>
                  
                  <div className="flex items-center justify-between pt-3 border-t border-white/10">
                    <div>
                      <p className="text-sm font-medium text-white">Hiệu ứng động</p>
                      <p className="text-xs text-gray-400 mt-0.5">Animation và hiệu ứng chuyển cảnh</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={settings.animations}
                        onChange={(e) => setSettings({...settings, animations: e.target.checked})}
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-white/10">
                    <div>
                      <p className="text-sm font-medium text-white">Kích thước chữ</p>
                      <p className="text-xs text-gray-400 mt-0.5">Điều chỉnh cỡ chữ hiển thị</p>
                    </div>
                    <select 
                      className="bg-dark-300 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-primary/50 outline-none"
                      value={settings.fontSize}
                      onChange={(e) => setSettings({...settings, fontSize: e.target.value})}
                    >
                      <option value="small">Nhỏ</option>
                      <option value="medium">Trung bình</option>
                      <option value="large">Lớn</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Data & Privacy */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>🔒</span>
                  <span>Dữ liệu & Bảo mật</span>
                </h3>
                <div className="bg-dark-200/50 border border-white/10 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">Lưu lịch sử tin nhắn</p>
                      <p className="text-xs text-gray-400 mt-0.5">Lưu trữ tin nhắn để xem lại sau</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={settings.saveHistory}
                        onChange={(e) => setSettings({...settings, saveHistory: e.target.checked})}
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-white/10">
                    <div>
                      <p className="text-sm font-medium text-white">Tự động xóa tin nhắn cũ</p>
                      <p className="text-xs text-gray-400 mt-0.5">Xóa tin nhắn sau một khoảng thời gian</p>
                    </div>
                    <select 
                      className="bg-dark-300 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-primary/50 outline-none"
                      value={settings.autoDeleteDays}
                      onChange={(e) => setSettings({...settings, autoDeleteDays: e.target.value})}
                    >
                      <option value="never">Không bao giờ</option>
                      <option value="7">7 ngày</option>
                      <option value="30">30 ngày</option>
                      <option value="90">90 ngày</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* About */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>ℹ️</span>
                  <span>Thông tin</span>
                </h3>
                <div className="bg-dark-200/50 border border-white/10 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">Phiên bản</span>
                    <span className="text-xs font-mono text-white">v1.0.0</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-white/10">
                    <span className="text-xs text-gray-400">Người dùng</span>
                    <span className="text-xs text-white">{userInfo?.displayName || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-white/10">
                    <span className="text-xs text-gray-400">Số điện thoại</span>
                    <span className="text-xs font-mono text-white">{userInfo?.phoneNumber || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-dark-200/50 border-t border-white/10 flex justify-end gap-3">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-5 py-2.5 rounded-xl bg-dark-300 hover:bg-dark-200 text-white text-sm font-medium transition-all border border-white/10"
              >
                Đóng
              </button>
              <button
                onClick={saveSettings}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-secondary hover:brightness-110 text-white text-sm font-medium transition-all shadow-lg"
              >
                💾 Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
