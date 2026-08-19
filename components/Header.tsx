import React, { useState, useEffect, useRef } from 'react'
import GeminiSettings from './GeminiSettings'
import { Bot, Save, Bell, Settings, LogOut, Ban, X, ChevronDown, Sparkles, Lock, Info, AlertTriangle, CheckCircle, XCircle, Wrench } from 'lucide-react'
import Toast from './Toast'

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
  
  // Toast state
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error' | 'info' | 'warning'>('success')
  
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
  const [debugInfo, setDebugInfo] = useState<any>(null)
  
  // Custom delay state
  const [customDelayMode, setCustomDelayMode] = useState(false)
  const [customDelayValue, setCustomDelayValue] = useState<string>('')

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotifPermission(Notification.permission)
    }
    
    // Load settings from database
    loadSettingsFromDatabase()
    
    // Load debug info
    loadDebugInfo()
  }, [])

  const loadSettingsFromDatabase = async () => {
    try {
      const response = await fetch('/api/settings')
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.settings) {
          // Set settings từ database
          setSettings(data.settings)
          console.log('✅ [Header] Loaded settings from database:', data.settings)
          
          // Check if replyDelay is a custom value (not in default options)
          const defaultDelays = [0, 2, 5, 10, 15, 20, 30]
          const replyDelay = data.settings.replyDelay !== undefined ? data.settings.replyDelay : 2
          
          if (!defaultDelays.includes(replyDelay)) {
            // Custom delay detected
            setCustomDelayMode(true)
            setCustomDelayValue(replyDelay.toString())
          } else {
            // Standard delay - make sure state is in sync
            setCustomDelayMode(false)
          }
        }
      }
    } catch (error) {
      console.error('❌ [Header] Failed to load settings:', error)
    } finally {
      setIsLoadingSettings(false)
    }
  }

  const loadDebugInfo = async () => {
    try {
      const response = await fetch('/api/debug/user-info')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setDebugInfo(data.debug)
          console.log('🐛 [Debug] User info:', data.debug)
        }
      }
    } catch (error) {
      console.error('❌ [Debug] Failed to load debug info:', error)
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
      console.log('💾 [Header] Saving settings to database:', settings)
      
      // Save to database
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })

      if (!response.ok) {
        throw new Error('Failed to save settings')
      }

      const result = await response.json()
      console.log('✅ [Header] Settings saved successfully:', result)

      // Apply settings
      applySettings()
      
      // Close modal
      setShowSettingsModal(false)
      
      // Show success toast
      setToastMessage('✅ Cài đặt đã được lưu thành công!')
      setToastType('success')
      setShowToast(true)
      
      // Show browser notification (optional)
      if (notifPermission === 'granted') {
        try {
          new Notification('⚙️ Cài đặt đã lưu', {
            body: 'Các thay đổi đã được đồng bộ tới tất cả thiết bị!',
            icon: '/aris.png',
          })
        } catch (e) {}
      }
    } catch (error) {
      console.error('❌ [Header] Failed to save settings:', error)
      
      // Show error toast
      setToastMessage('❌ Không thể lưu cài đặt. Vui lòng thử lại!')
      setToastType('error')
      setShowToast(true)
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
            <Bell className="w-4 h-4" />
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
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
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
                    <Settings className="w-4 h-4" />
                    <span>Cài đặt</span>
                  </button>

                  <div className="h-px bg-white/10 my-1"></div>

                  {/* Logout This Device */}
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-white/10 transition-colors flex items-center gap-3 text-gray-300 hover:text-white"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Đăng xuất thiết bị này</span>
                  </button>

                  {/* Logout All Devices */}
                  <button
                    onClick={handleLogoutAllDevices}
                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-red-500/10 transition-colors flex items-center gap-3 text-red-400 hover:text-red-300"
                  >
                    <Ban className="w-4 h-4" />
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
          <div className="bg-dark-100 border border-white/20 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-scaleIn" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-primary/20 to-secondary/20 border-b border-white/10 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <Settings className="w-6 h-6 text-primary" />
                <h2 className="text-xl font-bold text-white">Cài đặt</h2>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-gray-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content - Scrollable */}
            <div className="p-6 overflow-y-auto flex-1 space-y-5">
              {/* Notification Settings */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Bell className="w-4 h-4 text-primary" />
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
                      {notifPermission === 'granted' ? (
                        <span className="flex items-center gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Đã bật
                        </span>
                      ) : (
                        'Bật thông báo'
                      )}
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
                  <Bot className="w-5 h-5 text-primary" />
                  <span>Tự động trả lời</span>
                </h3>
                <div className="bg-dark-200/50 border border-white/10 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">Độ trễ phản hồi</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Thời gian chờ trước khi bot trả lời
                        {customDelayMode && customDelayValue && (
                          <span className="text-primary ml-1">
                            ({customDelayValue} giây)
                          </span>
                        )}
                        {!customDelayMode && settings.replyDelay > 0 && ![0, 2, 5, 10, 15, 20, 30].includes(settings.replyDelay) && (
                          <span className="text-primary ml-1">
                            (Tùy chỉnh: {settings.replyDelay} giây)
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <select 
                        className="bg-dark-300 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-primary/50 outline-none"
                        value={customDelayMode ? 'custom' : ([0, 2, 5, 10, 15, 20, 30].includes(settings.replyDelay) ? settings.replyDelay : 'custom')}
                        onChange={(e) => {
                          const value = e.target.value
                          console.log('🔧 [Header] Delay dropdown changed to:', value)
                          if (value === 'custom') {
                            setCustomDelayMode(true)
                            setCustomDelayValue(settings.replyDelay.toString())
                          } else {
                            setCustomDelayMode(false)
                            const newDelay = Number(value)
                            setSettings({...settings, replyDelay: newDelay})
                            console.log('✅ [Header] Updated replyDelay state to:', newDelay)
                          }
                        }}
                      >
                        <option value="0">Ngay lập tức</option>
                        <option value="2">2 giây</option>
                        <option value="5">5 giây</option>
                        <option value="10">10 giây</option>
                        <option value="15">15 giây</option>
                        <option value="20">20 giây</option>
                        <option value="30">30 giây</option>
                        <option value="custom">Tùy chỉnh...</option>
                      </select>
                      
                      {customDelayMode && (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            max="60"
                            placeholder="Nhập số giây"
                            className="bg-dark-300 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-primary/50 outline-none w-32"
                            value={customDelayValue}
                            onChange={(e) => setCustomDelayValue(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                const delay = Number(customDelayValue)
                                if (delay >= 0 && delay <= 60) {
                                  setSettings({...settings, replyDelay: delay})
                                  setCustomDelayMode(false)
                                } else {
                                  alert('Vui lòng nhập số từ 0 đến 60 giây')
                                }
                              }
                            }}
                          />
                          <button
                            onClick={() => {
                              const delay = Number(customDelayValue)
                              console.log('✅ [Header] Custom delay OK clicked, value:', delay)
                              if (delay >= 0 && delay <= 60) {
                                setSettings({...settings, replyDelay: delay})
                                console.log('✅ [Header] Updated settings.replyDelay to:', delay)
                                setCustomDelayMode(false)
                              } else {
                                alert('Vui lòng nhập số từ 0 đến 60 giây')
                              }
                            }}
                            className="bg-primary hover:bg-primary/80 text-white px-3 py-2 rounded-lg text-xs transition-colors"
                          >
                            OK
                          </button>
                          <button
                            onClick={() => {
                              setCustomDelayMode(false)
                              setCustomDelayValue('')
                            }}
                            className="bg-dark-400 hover:bg-dark-300 text-white px-3 py-2 rounded-lg text-xs transition-colors"
                          >
                            Hủy
                          </button>
                        </div>
                      )}
                    </div>
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
                  <Sparkles className="w-4 h-4 text-primary" />
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
                  <Sparkles className="w-4 h-4 text-primary" />
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
                  <Lock className="w-4 h-4 text-primary" />
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
                  <Info className="w-4 h-4 text-primary" />
                  <span>Thông tin</span>
                </h3>
                <div className="bg-dark-200/50 border border-white/10 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">Phiên bản</span>
                    <span className="text-xs font-mono text-white">v1.0.0</span>
                  </div>
                  
                  {/* Debug Info */}
                  {debugInfo && (
                    <>
                      <div className="flex justify-between items-center pt-2 border-t border-white/10">
                        <span className="text-xs text-gray-400">Database User ID</span>
                        <span className="text-xs font-mono text-white truncate max-w-[200px]" title={debugInfo.userId}>
                          {debugInfo.userId}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-400">Session ID</span>
                        <span className="text-xs font-mono text-gray-400">{debugInfo.sessionId}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-400">User Settings</span>
                        <span className={`text-xs font-medium flex items-center gap-1 ${debugInfo.hasUserSettings ? 'text-success' : 'text-error'}`}>
                          {debugInfo.hasUserSettings ? (
                            <>
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Có</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Không</span>
                            </>
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-400">Bot Settings</span>
                        <span className={`text-xs font-medium flex items-center gap-1 ${debugInfo.hasBotSettings ? 'text-success' : 'text-error'}`}>
                          {debugInfo.hasBotSettings ? (
                            <>
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Có</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Không</span>
                            </>
                          )}
                        </span>
                      </div>
                      
                      {(!debugInfo.hasUserSettings || !debugInfo.hasBotSettings) && (
                        <div className="pt-2 border-t border-warning/30 bg-warning/5 -mx-4 -mb-4 mt-2 px-4 py-3 rounded-b-xl">
                          <p className="text-xs text-warning flex items-start gap-2 mb-2">
                            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <span>
                              <strong>Thiếu cấu hình:</strong> Bạn thiếu settings trong database. Click nút bên dưới để tự động tạo.
                            </span>
                          </p>
                          <button
                            onClick={async () => {
                              try {
                                const response = await fetch('/api/debug/fix-settings', { method: 'POST' })
                                const data = await response.json()
                                if (data.success) {
                                  alert('✅ Settings đã được tạo! Vui lòng reload trang.')
                                  window.location.reload()
                                } else {
                                  alert('❌ Lỗi: ' + data.error)
                                }
                              } catch (error) {
                                alert('❌ Lỗi khi tạo settings')
                              }
                            }}
                            className="w-full bg-warning hover:bg-warning/80 text-black font-medium px-3 py-2 rounded-lg text-xs transition-colors flex items-center justify-center gap-2"
                          >
                            <Wrench className="w-4 h-4" />
                            <span>Tự động tạo Settings</span>
                          </button>
                        </div>
                      )}
                    </>
                  )}
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

            {/* Footer - Fixed at bottom */}
            <div className="px-6 py-4 bg-dark-200/50 border-t border-white/10 flex justify-end gap-3 flex-shrink-0">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-5 py-2.5 rounded-xl bg-dark-300 hover:bg-dark-200 text-white text-sm font-medium transition-all border border-white/10"
              >
                Đóng
              </button>
              <button
                onClick={saveSettings}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-secondary hover:brightness-110 text-white text-sm font-medium transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Toast Notification */}
      {showToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          duration={3000}
          onClose={() => setShowToast(false)}
        />
      )}
    </header>
  )
}
