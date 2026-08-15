'use client'

import { useState, useEffect, useRef } from 'react'
import Header from '@/components/Header'
import LoginSection from '@/components/LoginSection'
import ControlPanel from '@/components/ControlPanel'
import MessageLogs from '@/components/MessageLogs'
import StatsCards from '@/components/StatsCards'
import BotStatus from '@/components/BotStatus'
import QuickActions from '@/components/QuickActions'
import UserProfile from '@/components/UserProfile'
import ZaloChatView from '@/components/ZaloChatView'
import AuthModal from '@/components/AuthModal'
import Toast, { ToastProps } from '@/components/Toast'
import BackupRestore from '@/components/BackupRestore'
import AISettings from '@/components/AISettings'
import ActiveDevices from '@/components/ActiveDevices'
import ZaloAccountManager from '@/components/ZaloAccountManager'
import ZaloImportModal from '@/components/ZaloImportModal'

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [isCheckingZaloLogin, setIsCheckingZaloLogin] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'chat' | 'dashboard'>('chat')
  const [botEnabled, setBotEnabled] = useState(false)
  const [autoReplyMessage, setAutoReplyMessage] = useState('Xin chào! Tôi đang bận, sẽ phản hồi bạn sớm nhất có thể. 🙏')
  const [replyScope, setReplyScope] = useState<'all' | 'user_only' | 'group_only' | 'whitelist'>('all')
  const [whitelist, setWhitelist] = useState<string[]>([])
  const [messageLogs, setMessageLogs] = useState<any[]>([])
  const [toast, setToast] = useState<Omit<ToastProps, 'onClose'> | null>(null)
  const [stats, setStats] = useState({
    totalMessages: 0,
    repliedMessages: 0,
    activeChats: 0,
  })
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [userInfo, setUserInfo] = useState<any>(null)
  const [isListening, setIsListening] = useState(false)
  const [lastActivity, setLastActivity] = useState<string>('')
  const [useRandomPreset, setUseRandomPreset] = useState(false)
  const [presetMessages, setPresetMessages] = useState<string[]>([
    'E-Eto... tôi là Monica Everett... xin hãy chiếu cố cho tôi từ bây giờ nhé... 🌸✨🥺🤍',
    'U-Um... nếu tôi trốn sau cánh cửa thì xin đừng kéo tôi ra nhé... 🚪🥺💦',
    'Fuee... c-chuyện này khó quá đi mất... (⁠՚⁠﹏⁠՚⁠)💦',
    'A-Anou... đừng nói cho mọi người biết nhé... tôi tin bạn đó... 🥺🌸🤍✨',
    'S-Sono... nếu có thể giúp được mọi người thì tôi rất vui... 🍀🤍✨',
  ])
  const [aiEnabled, setAiEnabled] = useState(false)
  const [aiPersonality, setAiPersonality] = useState('friendly')
  const [aiMaxLength, setAiMaxLength] = useState(200)
  const [aiTriggerMode, setAiTriggerMode] = useState('smart')
  const [qrState, setQrState] = useState<any>(null)
  const [showImportModal, setShowImportModal] = useState(false)
  const [mutedThreadIds, setMutedThreadIds] = useState<Set<string>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('zalo_muted_thread_ids')
        if (saved) return new Set(JSON.parse(saved))
      } catch (e) {}
    }
    return new Set()
  })
  const [activeThreadIdFromNotif, setActiveThreadIdFromNotif] = useState<string | null>(null)

  const notifiedMsgIdsRef = useRef<Set<string>>(new Set())
  const isInitialMountRef = useRef<boolean>(true)

  // Suppress notifications during initial 4 seconds after page load / F5
  useEffect(() => {
    const timer = setTimeout(() => {
      isInitialMountRef.current = false
    }, 4000)
    return () => clearTimeout(timer)
  }, [])

  // Check authentication status first
  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('🔍 [Frontend] Checking authentication...');
        const res = await fetch('/api/auth/check', {
          credentials: 'include', // Ensure cookies are sent
        });
        const data = await res.json();
        console.log('🔍 [Frontend] Auth check result:', data);
        setIsAuthenticated(data.authenticated);
      } catch (error) {
        console.error('❌ [Frontend] Auth check failed:', error);
        setIsAuthenticated(false);
      } finally {
        setIsCheckingAuth(false);
      }
    }
    checkAuth()
  }, [])

  // Check login status and load bot settings on page mount (F5)
  useEffect(() => {
    if (!isAuthenticated) return // Don't load Zalo session if not authenticated

    const initPage = async () => {
      setIsCheckingZaloLogin(true)
      try {
        // 1. Fetch bot settings from server
        const settingsRes = await fetch('/api/zalo/settings')
        if (settingsRes.ok) {
          const settings = await settingsRes.json()
          console.log('📋 Loaded bot settings from server:', settings)
          
          setBotEnabled(settings.enabled ?? false)
          console.log('🔧 Bot enabled state set to:', settings.enabled ?? false)
          
          if (settings.autoReplyMessage) {
            setAutoReplyMessage(settings.autoReplyMessage)
          }
          if (settings.replyScope) {
            setReplyScope(settings.replyScope)
          }
          if (Array.isArray(settings.whitelist)) {
            setWhitelist(settings.whitelist)
          }
          if (typeof settings.useRandomPreset === 'boolean') {
            setUseRandomPreset(settings.useRandomPreset)
          }
          if (Array.isArray(settings.presetMessages) && settings.presetMessages.length > 0) {
            setPresetMessages(settings.presetMessages)
          }
          if (typeof settings.aiEnabled === 'boolean') {
            setAiEnabled(settings.aiEnabled)
          }
          if (settings.aiPersonality) {
            setAiPersonality(settings.aiPersonality)
          }
          if (typeof settings.aiMaxLength === 'number') {
            setAiMaxLength(settings.aiMaxLength)
          }
          if (settings.aiTriggerMode) {
            setAiTriggerMode(settings.aiTriggerMode)
          }
        }

        // Fetch stats from server
        try {
          const statsRes = await fetch('/api/zalo/stats')
          if (statsRes.ok) {
            const statsData = await statsRes.json()
            setStats(statsData)
          }
        } catch (e) {}

        // 2. Fetch login status
        const loginRes = await fetch('/api/zalo/login')
        const loginData = await loginRes.json()
        
        if (loginData.qrState) {
          setQrState(loginData.qrState)
        }

        // Check if already logged in from saved session
        if (loginData.loggedIn && loginData.userInfo) {
          console.log('✅ Already logged in with saved session:', loginData.userInfo.displayName)
          setIsLoggedIn(true)
          setUserInfo(loginData.userInfo)
          
          // Start listener for logged in user
          setTimeout(() => startListener(), 500)
        } else {
          // Not logged in - will show LoginSection which will auto-start QR
          console.log('ℹ️ Not logged in, showing login page...')
          setIsLoggedIn(false)
        }
      } catch (error) {
        console.error('Failed to initialize page state:', error)
      } finally {
        setIsCheckingZaloLogin(false)
      }
    }

    initPage()
  }, [isAuthenticated])

  // Handle Login via Web QR API with Polling
  const handleLogin = async (force: boolean = false) => {
    setIsLoading(true)
    
    try {
      // Start QR generation on backend (fire and forget)
      fetch('/api/zalo/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force }),
      }).catch(err => console.error('Login POST error:', err))

      // Poll GET endpoint every 1 second to check status
      const pollInterval = setInterval(async () => {
        try {
          const res = await fetch('/api/zalo/login')
          const data = await res.json()

          // Update QR state
          if (data.qrState) {
            setQrState(data.qrState)
          }

          // Check if logged in successfully
          if (data.loggedIn) {
            console.log('✅ Login successful! Redirecting to app...')
            clearInterval(pollInterval)
            setIsLoggedIn(true)
            if (data.userInfo) setUserInfo(data.userInfo)
            setIsLoading(false)
            setQrState(null) // Clear QR state
            
            // Start listener after successful login
            setTimeout(() => startListener(), 500)
          }
          
          // Stop polling if error/expired/declined
          if (data.qrState && ['error', 'expired', 'declined'].includes(data.qrState.status)) {
            console.log(`⚠️ QR ${data.qrState.status}, stopping poll`)
            clearInterval(pollInterval)
            setIsLoading(false)
          }
        } catch (e) {
          console.error('Polling error:', e)
        }
      }, 1000) // Poll every 1 second

      // Auto-clear polling after 3 minutes
      setTimeout(() => {
        clearInterval(pollInterval)
        setIsLoading(false)
      }, 180000)
      
    } catch (error: any) {
      console.error('Login failed:', error)
      setIsLoading(false)
    }
  }

  // Start message listener
  const startListener = async () => {
    try {
      console.log('🎧 Starting listener...')
      
      // Retry logic if not ready
      let retries = 0
      const maxRetries = 3
      
      while (retries < maxRetries) {
        const response = await fetch('/api/zalo/listener', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'start' }),
        })
        
        if (response.ok) {
          setIsListening(true)
          console.log('✅ Listener started successfully')
          
          // Connect to SSE for real-time messages with auto-reconnect
          const connectSSE = () => {
            const eventSource = new EventSource('/api/zalo/listener')
            
            eventSource.onmessage = (event) => {
              try {
                const message = JSON.parse(event.data)
                if (message.type === 'connected') {
                  console.log('✅ Connected to message stream')
                  setIsListening(true)
                  return
                }
                
                handleNewMessage(message)
              } catch (e) {
                console.error('Failed to parse message:', e)
              }
            }
            
            eventSource.onerror = (error) => {
              console.error('❌ SSE connection error, reconnecting in 3s...', error)
              setIsListening(false)
              eventSource.close()
              
              // Auto-reconnect after 3 seconds
              setTimeout(() => {
                console.log('🔄 Reconnecting SSE...')
                connectSSE()
              }, 3000)
            }
            
            // Store reference for cleanup
            return eventSource
          }
          
          connectSSE()
          break // Success, exit retry loop
        }
        
        // If 401, wait and retry
        if (response.status === 401) {
          retries++
          console.log(`⏳ Retry ${retries}/${maxRetries}...`)
          await new Promise(resolve => setTimeout(resolve, 1000))
          continue
        }
        
        throw new Error(`Failed to start listener: ${response.status}`)
      }
      
      if (retries >= maxRetries) {
        throw new Error('Failed to start listener after retries')
      }
    } catch (error) {
      console.error('Failed to start listener:', error)
      alert('Không thể kết nối listener. Vui lòng thử lại!')
    }
  }

  // Handle Logout
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      
      // Also logout from Zalo
      await fetch('/api/zalo/logout', { method: 'POST' })
      
      setIsAuthenticated(false)
      setIsLoggedIn(false)
      setBotEnabled(false)
      setIsListening(false)
      setMessageLogs([])
      setUserInfo(null)
      setStats({
        totalMessages: 0,
        repliedMessages: 0,
        activeChats: 0,
      })
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  // Handle Logout All Devices
  const handleLogoutAllDevices = async () => {
    if (!confirm('Bạn có chắc muốn đăng xuất tất cả thiết bị? Bạn sẽ cần đăng nhập lại.')) {
      return
    }

    try {
      const response = await fetch('/api/auth/logout-all', { method: 'POST' })
      const data = await response.json()
      
      if (response.ok) {
        // Show success message
        showToast(data.message || 'Đã đăng xuất tất cả thiết bị', 'success')
        
        // Also logout from Zalo
        await fetch('/api/zalo/logout', { method: 'POST' })
        
        // Clear local state
        setIsAuthenticated(false)
        setIsLoggedIn(false)
        setBotEnabled(false)
        setIsListening(false)
        setMessageLogs([])
        setUserInfo(null)
        setStats({
          totalMessages: 0,
          repliedMessages: 0,
          activeChats: 0,
        })
      } else {
        showToast(data.error || 'Lỗi khi đăng xuất', 'error')
      }
    } catch (error) {
      console.error('Logout all devices failed:', error)
      showToast('Lỗi khi đăng xuất tất cả thiết bị', 'error')
    }
  }

  // Play pleasant notification chime sound using Web Audio API
  const playNotificationSound = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioContext) return
      const ctx = new AudioContext()

      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(587.33, ctx.currentTime) // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1) // A5

      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start()
      osc.stop(ctx.currentTime + 0.35)
    } catch (e) {}
  }

  // Trigger sound + browser desktop notification
  const triggerMessageNotification = (senderName: string, content: string, avatar?: string, threadId?: string) => {
    playNotificationSound()

    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        try {
          const notif = new Notification(`💬 ${senderName || 'Tin nhắn mới từ Zalo'}`, {
            body: content || 'Đã gửi một tin nhắn cho bạn',
            icon: avatar || '/aris.png',
            tag: `zalo-msg-${threadId || Date.now()}`,
          })
          // Auto-dismiss after 3 seconds
          setTimeout(() => {
            try { notif.close() } catch (e) {}
          }, 3000)
          // Click notification → navigate to that chat thread
          notif.onclick = () => {
            window.focus()
            notif.close()
            if (threadId) {
              setActiveTab('chat')
              setActiveThreadIdFromNotif(threadId)
            }
          }
        } catch (e) {}
      }
    }

    if (typeof document !== 'undefined') {
      const originalTitle = document.title
      document.title = `💬 (1) Tin nhắn mới từ ${senderName || 'Zalo'}!`
      setTimeout(() => {
        document.title = originalTitle
      }, 4000)
    }
  }

  // Handle new message
  const handleNewMessage = (message: any) => {
    if (!message) return

    const msgIdKey = String(message.id || message.msgId || message.cliMsgId || `${message.threadId}_${message.content}_${message.timestamp}`)
    const msgTime = message.timestamp ? new Date(message.timestamp).getTime() : Date.now()
    const isRecent = Math.abs(Date.now() - msgTime) < 20000

    let isDuplicate = false

    setMessageLogs((prev) => {
      const exists = prev.some(
        (m) =>
          (m.id && message.id && String(m.id) === String(message.id)) ||
          (m.msgId && message.msgId && String(m.msgId) === String(message.msgId)) ||
          (m.cliMsgId && message.cliMsgId && String(m.cliMsgId) === String(message.cliMsgId)) ||
          (m.content === message.content && String(m.threadId) === String(message.threadId) && Math.abs(new Date(m.timestamp).getTime() - new Date(message.timestamp).getTime()) < 5000)
      )
      if (exists) {
        isDuplicate = true
        return prev
      }
      return [message, ...prev].slice(0, 100)
    })

    // Trigger notification ONLY for REAL-TIME LIVE incoming messages:
    // 1. Not during initial page load / F5 reload phase
    // 2. Message is recent (< 20s old)
    // 3. Message is NOT a duplicate
    // 4. Message is NOT from self
    // 5. Message hasn't already been notified
    const threadIdStr = String(message.threadId || '')
    const isMuted = mutedThreadIds.has(threadIdStr)

    if (
      !isInitialMountRef.current &&
      isRecent &&
      !isDuplicate &&
      !message.isSelf &&
      !message.isSelfMessage &&
      !notifiedMsgIdsRef.current.has(msgIdKey) &&
      !isMuted
    ) {
      notifiedMsgIdsRef.current.add(msgIdKey)
      triggerMessageNotification(
        message.fromName || message.senderName || 'Người dùng Zalo',
        message.content || 'Đã gửi một tin nhắn cho bạn',
        message.avatar,
        threadIdStr
      )
    }

    setStats((prev) => ({
      totalMessages: prev.totalMessages + 1,
      repliedMessages: message.replied ? prev.repliedMessages + 1 : prev.repliedMessages,
      activeChats: prev.activeChats + 1,
    }))

    setLastActivity(new Date().toLocaleTimeString('vi-VN'))
  }

  // Sync settings helper
  const syncSettings = async (updates: Partial<{
    enabled: boolean
    autoReplyMessage: string
    replyScope: string
    whitelist: string[]
    useRandomPreset: boolean
    presetMessages: string[]
    aiEnabled: boolean
    aiPersonality: string
    aiMaxLength: number
    aiTriggerMode: string
  }>) => {
    try {
      await fetch('/api/zalo/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: updates.enabled ?? botEnabled,
          autoReplyMessage: updates.autoReplyMessage ?? autoReplyMessage,
          replyScope: updates.replyScope ?? replyScope,
          whitelist: updates.whitelist ?? whitelist,
          useRandomPreset: updates.useRandomPreset ?? useRandomPreset,
          presetMessages: updates.presetMessages ?? presetMessages,
          aiEnabled: updates.aiEnabled ?? aiEnabled,
          aiPersonality: updates.aiPersonality ?? aiPersonality,
          aiMaxLength: updates.aiMaxLength ?? aiMaxLength,
          aiTriggerMode: updates.aiTriggerMode ?? aiTriggerMode,
        }),
      })
    } catch (error) {
      console.error('Failed to sync bot settings:', error)
    }
  }

  // Toggle bot
  const toggleBot = async () => {
    const hasPreset = useRandomPreset && presetMessages.some(m => m && m.trim().length > 0)
    if (!hasPreset && !autoReplyMessage.trim()) {
      alert('Vui lòng nhập tin nhắn tự động hoặc chọn tin nhắn soạn trước!')
      return
    }
    const newEnabled = !botEnabled
    setBotEnabled(newEnabled)
    await syncSettings({ enabled: newEnabled })
  }

  // Change auto reply message
  const handleMessageChange = async (msg: string) => {
    setAutoReplyMessage(msg)
    await syncSettings({ autoReplyMessage: msg })
  }

  // Change reply scope
  const handleScopeChange = async (scope: 'all' | 'user_only' | 'group_only' | 'whitelist') => {
    setReplyScope(scope)
    await syncSettings({ replyScope: scope })
  }

  // Change whitelist
  const handleWhitelistChange = async (list: string[]) => {
    setWhitelist(list)
    await syncSettings({ whitelist: list })
  }

  // Toggle Random Preset
  const handleToggleRandomPreset = async (val: boolean) => {
    setUseRandomPreset(val)
    await syncSettings({ useRandomPreset: val })
  }

  // Update Preset Messages
  const handlePresetMessagesChange = async (list: string[]) => {
    setPresetMessages(list)
    await syncSettings({ presetMessages: list })
  }
  
  // AI Settings Handlers
  const handleAIEnabledChange = async (enabled: boolean) => {
    setAiEnabled(enabled)
    await syncSettings({ aiEnabled: enabled })
  }
  
  const handleAIPersonalityChange = async (personality: string) => {
    setAiPersonality(personality)
    await syncSettings({ aiPersonality: personality })
  }
  
  const handleAIMaxLengthChange = async (length: number) => {
    setAiMaxLength(length)
    await syncSettings({ aiMaxLength: length })
  }
  
  const handleAITriggerModeChange = async (mode: string) => {
    setAiTriggerMode(mode)
    await syncSettings({ aiTriggerMode: mode })
  }
  
  // Quick actions
  const handleResetStats = async () => {
    if (confirm('Bạn có chắc muốn reset thống kê?')) {
      await fetch('/api/zalo/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' }),
      })
      
      setStats({
        totalMessages: 0,
        repliedMessages: 0,
        activeChats: 0,
      })
    }
  }
  
  const handleExportLogs = () => {
    const dataStr = JSON.stringify(messageLogs, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `zalo-logs-${new Date().toISOString()}.json`
    link.click()
  }
  
  // Toast helper function
  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    setToast({ message, type })
  }
  
  const handleClearLogs = async (type: 'chat_only' | 'logs_only' | 'both') => {
    let successMessage = ''
    
    if (type === 'chat_only' || type === 'both') {
      window.dispatchEvent(new CustomEvent('zalo_clear_chat_history'))
      successMessage = type === 'chat_only' ? 'Đã xóa lịch sử tin nhắn trong Chat!' : ''
    }

    if (type === 'logs_only' || type === 'both') {
      try {
        await fetch('/api/zalo/listener', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'clearLogs' }),
        })
        successMessage = type === 'logs_only' ? 'Đã xóa mọi phần log thành công!' : 'Đã xóa cả tin nhắn và log thành công!'
      } catch (e) {
        console.error('Failed to clear logs on server:', e)
        showToast('Lỗi khi xóa log trên server', 'error')
        return
      }
      setMessageLogs([])
    }
    
    // Show success toast
    if (successMessage) {
      showToast(successMessage, 'success')
    }
  }
  
  const handleUpdateName = (name: string) => {
    setUserInfo((prev: any) => ({
      ...prev,
      displayName: name,
    }))
  }

  if (isCheckingAuth) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-dark-100 via-dark-200 to-dark-300 flex items-center justify-center relative z-50">
        <div className="absolute inset-0 bg-dark-100/95 backdrop-blur-xl"></div>
        <div className="relative z-10 text-center p-8 bg-dark-200/80 rounded-2xl border border-dark-100 backdrop-blur shadow-2xl">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-200 font-semibold text-base mb-2">Đang kiểm tra phiên đăng nhập...</p>
          <p className="text-gray-400 text-xs">Vui lòng chờ trong giây lát</p>
        </div>
      </main>
    )
  }

  // Show loading screen while checking Zalo login status
  if (isAuthenticated && isCheckingZaloLogin) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-dark-100 via-dark-200 to-dark-300 flex items-center justify-center relative z-50">
        <div className="absolute inset-0 bg-dark-100/95 backdrop-blur-xl"></div>
        <div className="relative z-10 text-center p-8 bg-dark-200/80 rounded-2xl border border-dark-100 backdrop-blur shadow-2xl">
          <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-200 font-semibold text-base mb-2">Đang tải phiên Zalo Bot...</p>
          <p className="text-gray-400 text-xs">Đang kiểm tra kết nối với Zalo</p>
        </div>
      </main>
    )
  }

  // Show auth modal if not authenticated
  if (!isAuthenticated) {
    return (
      <>
        <main className="min-h-screen bg-gradient-to-br from-dark-100 via-dark-200 to-dark-300"></main>
        <AuthModal onSuccess={() => setIsAuthenticated(true)} />
      </>
    )
  }

  return (
    <main className="h-screen max-h-screen bg-gradient-to-br from-dark-100 via-dark-200 to-dark-300 overflow-hidden flex flex-col">
      <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-2 max-w-7xl flex-1 flex flex-col min-h-0">
        <div className="flex-shrink-0 relative z-[100]">
          <Header 
            userInfo={userInfo} 
            onLogout={handleLogout}
            onLogoutAllDevices={handleLogoutAllDevices}
          />
        </div>
        
        {!isLoggedIn ? (
          <LoginSection 
            isLoading={isLoading}
            qrState={qrState}
            onLogin={handleLogin}
            onImportAccount={() => setShowImportModal(true)}
          />
        ) : (
          <div className="flex-1 flex flex-col min-h-0 space-y-2 animate-slideIn">
            {/* Top View Mode Switcher */}
            <div className="flex-shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-between bg-dark-200/80 p-2 rounded-2xl border border-white/10 backdrop-blur gap-2">
              <div className="grid grid-cols-2 sm:flex items-center gap-1.5 sm:gap-2">
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === 'chat'
                      ? 'bg-gradient-to-r from-primary to-blue-600 text-white shadow-lg'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span className="truncate">Chat Zalo</span>
                </button>

                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === 'dashboard'
                      ? 'bg-gradient-to-r from-primary to-blue-600 text-white shadow-lg'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                  </svg>
                  <span className="truncate">Quản lý Bot</span>
                </button>
              </div>

              <div className="hidden sm:flex items-center gap-2 pr-2">
                <span className="w-2.5 h-2.5 rounded-full bg-success animate-pulse"></span>
                <span className="text-xs text-gray-300 font-medium">Phiên Zalo Bot đang hoạt động</span>
              </div>
            </div>

            {/* Tab 1: Full Zalo Web Chat Interface */}
            {activeTab === 'chat' && (
              <ZaloChatView
                logs={messageLogs}
                userInfo={userInfo}
                botEnabled={botEnabled}
                whitelist={whitelist}
                onWhitelistChange={handleWhitelistChange}
                onSwitchToDashboard={() => setActiveTab('dashboard')}
                mutedThreadIds={mutedThreadIds}
                onMutedThreadIdsChange={(newSet: Set<string>) => {
                  setMutedThreadIds(newSet)
                  if (typeof window !== 'undefined') {
                    localStorage.setItem('zalo_muted_thread_ids', JSON.stringify(Array.from(newSet)))
                  }
                }}
                navigateToThreadId={activeThreadIdFromNotif}
                onNavigateToThreadHandled={() => setActiveThreadIdFromNotif(null)}
              />
            )}

            {/* Tab 2: Bot Settings & Control Panel Dashboard */}
            {activeTab === 'dashboard' && (
              <div className="flex-1 min-h-0 overflow-y-auto space-y-6 animate-slideIn pr-1">
                <BotStatus 
                  isConnected={isLoggedIn}
                  isListening={isListening}
                  lastActivity={lastActivity}
                />
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <UserProfile 
                    userInfo={userInfo}
                    onUpdateName={handleUpdateName}
                  />
                  <StatsCards stats={stats} />
                </div>
                
                <ControlPanel
                  botEnabled={botEnabled}
                  autoReplyMessage={autoReplyMessage}
                  replyScope={replyScope}
                  whitelist={whitelist}
                  useRandomPreset={useRandomPreset}
                  presetMessages={presetMessages}
                  onToggleBot={toggleBot}
                  onMessageChange={handleMessageChange}
                  onScopeChange={handleScopeChange}
                  onWhitelistChange={handleWhitelistChange}
                  onToggleRandomPreset={handleToggleRandomPreset}
                  onPresetMessagesChange={handlePresetMessagesChange}
                />
                
                <AISettings
                  aiEnabled={aiEnabled}
                  aiPersonality={aiPersonality}
                  aiMaxLength={aiMaxLength}
                  aiTriggerMode={aiTriggerMode}
                  onAIEnabledChange={handleAIEnabledChange}
                  onAIPersonalityChange={handleAIPersonalityChange}
                  onAIMaxLengthChange={handleAIMaxLengthChange}
                  onAITriggerModeChange={handleAITriggerModeChange}
                />
                
                {/* Zalo Account Import/Export */}
                <ZaloAccountManager
                  onImportSuccess={() => {
                    showToast('Đã nhập tài khoản Zalo thành công!', 'success')
                    // Reload to update UI with new session
                    setTimeout(() => window.location.reload(), 2000)
                  }}
                />
                
                {/* Active Devices Management */}
                <ActiveDevices
                  onLogoutDevice={(deviceId) => {
                    console.log('Device logged out:', deviceId)
                    showToast('Thiết bị đã được đăng xuất', 'success')
                  }}
                  onLogoutAllDevices={handleLogoutAllDevices}
                />
                
                <QuickActions
                  onResetStats={handleResetStats}
                  onExportLogs={handleExportLogs}
                  onClearLogs={handleClearLogs}
                />
                
                <BackupRestore
                  onBackupComplete={() => showToast('Đã xuất backup thành công!', 'success')}
                  onRestoreComplete={() => showToast('Đã khôi phục backup thành công!', 'success')}
                />
                
                <MessageLogs logs={messageLogs} />
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => setToast(null)}
        />
      )}

      {/* Zalo Import Modal */}
      {showImportModal && (
        <ZaloImportModal
          onClose={() => setShowImportModal(false)}
          onSuccess={() => {
            setShowImportModal(false)
            window.location.reload()
          }}
        />
      )}
    </main>
  )
}
