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

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'chat' | 'dashboard'>('chat')
  const [botEnabled, setBotEnabled] = useState(false)
  const [autoReplyMessage, setAutoReplyMessage] = useState('Xin chào! Tôi đang bận, sẽ phản hồi bạn sớm nhất có thể. 🙏')
  const [replyScope, setReplyScope] = useState<'all' | 'user_only' | 'group_only' | 'whitelist'>('all')
  const [whitelist, setWhitelist] = useState<string[]>([])
  const [messageLogs, setMessageLogs] = useState<any[]>([])
  const [stats, setStats] = useState({
    totalMessages: 0,
    repliedMessages: 0,
    activeChats: 0,
  })
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [userInfo, setUserInfo] = useState<any>(null)
  const [isListening, setIsListening] = useState(false)
  const [lastActivity, setLastActivity] = useState<string>('')
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [useRandomPreset, setUseRandomPreset] = useState(false)
  const [presetMessages, setPresetMessages] = useState<string[]>([
    'E-Eto... tôi là Monica Everett... xin hãy chiếu cố cho tôi từ bây giờ nhé... 🌸✨🥺🤍',
    'U-Um... nếu tôi trốn sau cánh cửa thì xin đừng kéo tôi ra nhé... 🚪🥺💦',
    'Fuee... c-chuyện này khó quá đi mất... (⁠՚⁠﹏⁠՚⁠)💦',
    'A-Anou... đừng nói cho mọi người biết nhé... tôi tin bạn đó... 🥺🌸🤍✨',
    'S-Sono... nếu có thể giúp được mọi người thì tôi rất vui... 🍀🤍✨',
  ])
  const [qrState, setQrState] = useState<any>(null)
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

  // Check login status and load bot settings on page mount (F5)
  useEffect(() => {
    const initPage = async () => {
      try {
        // 1. Fetch bot settings from server
        const settingsRes = await fetch('/api/zalo/settings')
        if (settingsRes.ok) {
          const settings = await settingsRes.json()
          setBotEnabled(settings.enabled ?? false)
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

        if (loginData.loggedIn) {
          console.log('✅ Found active login session on mount')
          setIsLoggedIn(true)
          if (loginData.userInfo) setUserInfo(loginData.userInfo)
          startListener()
        }
      } catch (error) {
        console.error('Failed to initialize page state:', error)
      } finally {
        setIsCheckingAuth(false)
      }
    }

    initPage()
  }, [])

  // Handle Login via Web QR API with Polling
  const handleLogin = async (force: boolean = false) => {
    setIsLoading(true)
    try {
      // 1. Start QR generation on backend
      fetch('/api/zalo/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.userInfo) {
            setIsLoggedIn(true)
            setUserInfo(data.userInfo)
            setIsLoading(false)
            startListener()
          }
        })
        .catch((err) => {
          console.error('Login POST error:', err)
        })

      // 2. Poll for QR status every second
      const pollInterval = setInterval(async () => {
        try {
          const res = await fetch('/api/zalo/login')
          const data = await res.json()

          if (data.qrState) {
            setQrState(data.qrState)

            if (data.qrState.status === 'success' || data.loggedIn) {
              clearInterval(pollInterval)
              setIsLoggedIn(true)
              if (data.userInfo) setUserInfo(data.userInfo)
              setIsLoading(false)
              startListener()
            } else if (
              data.qrState.status === 'expired' ||
              data.qrState.status === 'declined' ||
              data.qrState.status === 'error'
            ) {
              clearInterval(pollInterval)
              setIsLoading(false)
            }
          }
        } catch (e) {
          console.error('Polling error:', e)
        }
      }, 1000)

      // Auto clear polling after 3 minutes
      setTimeout(() => clearInterval(pollInterval), 180000)
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
          
          // Connect to SSE for real-time messages
          const eventSource = new EventSource('/api/zalo/listener')
          
          eventSource.onmessage = (event) => {
            try {
              const message = JSON.parse(event.data)
              if (message.type === 'connected') {
                console.log('Connected to message stream')
                return
              }
              
              handleNewMessage(message)
            } catch (e) {
              console.error('Failed to parse message:', e)
            }
          }
          
          eventSource.onerror = () => {
            console.error('SSE connection error')
            setIsListening(false)
            eventSource.close()
          }
          
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
      await fetch('/api/zalo/logout', { method: 'POST' })
      
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
  
  const handleClearLogs = async (type: 'chat_only' | 'logs_only' | 'both') => {
    if (type === 'chat_only' || type === 'both') {
      window.dispatchEvent(new CustomEvent('zalo_clear_chat_history'))
    }

    if (type === 'logs_only' || type === 'both') {
      try {
        await fetch('/api/zalo/listener', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'clearLogs' }),
        })
      } catch (e) {
        console.error('Failed to clear logs on server:', e)
      }
      setMessageLogs([])
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
      <main className="min-h-screen bg-gradient-to-br from-dark-100 via-dark-200 to-dark-300 flex items-center justify-center">
        <div className="text-center p-8 bg-dark-200/50 rounded-2xl border border-dark-100 backdrop-blur">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300 font-medium text-sm">Đang kiểm tra phiên đăng nhập...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="h-screen max-h-screen bg-gradient-to-br from-dark-100 via-dark-200 to-dark-300 overflow-hidden flex flex-col">
      <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-2 max-w-7xl flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="flex-shrink-0">
          <Header userInfo={userInfo} onLogout={handleLogout} />
        </div>
        
        {!isLoggedIn ? (
          <LoginSection 
            isLoading={isLoading}
            qrState={qrState}
            onLogin={handleLogin}
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
                
                <QuickActions
                  onResetStats={handleResetStats}
                  onExportLogs={handleExportLogs}
                  onClearLogs={handleClearLogs}
                />
                
                <MessageLogs logs={messageLogs} />
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
