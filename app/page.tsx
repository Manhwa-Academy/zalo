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
  const [isCheckingZaloLogin, setIsCheckingZaloLogin] = useState(true) // Start as true to prevent premature render
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
  const [aiEnabled, setAiEnabled] = useState(true) // Default to TRUE
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
  const [showResetStatsModal, setShowResetStatsModal] = useState(false)

  const notifiedMsgIdsRef = useRef<Set<string>>(new Set())
  const isInitialMountRef = useRef<boolean>(true)
  const loginPollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const isLoggedInRef = useRef<boolean>(false) // Track login state for interval

  // Suppress notifications during initial 4 seconds after page load / F5
  useEffect(() => {
    const timer = setTimeout(() => {
      isInitialMountRef.current = false
    }, 4000)
    
    // Cleanup on unmount or page unload
    const cleanup = () => {
      clearTimeout(timer)
      
      // Clear login polling interval
      if (loginPollIntervalRef.current) {
        console.log('🧹 Cleanup: clearing poll interval')
        clearInterval(loginPollIntervalRef.current)
        loginPollIntervalRef.current = null
      }
    }
    
    // Handle page navigation/close
    window.addEventListener('beforeunload', cleanup)
    
    return () => {
      cleanup()
      window.removeEventListener('beforeunload', cleanup)
    }
  }, [])

  // Session validation polling - Check if still authenticated every 30 seconds
  useEffect(() => {
    if (!isAuthenticated) return

    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/check')
        const data = await response.json()
        
        if (!data.authenticated) {
          console.log('🚫 [Session] Session expired or logged out, redirecting...')
          setIsAuthenticated(false)
          setUserInfo(null)
          showToast('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', 'error')
        }
      } catch (error) {
        console.error('❌ [Session] Check failed:', error)
      }
    }

    // Check immediately on mount
    checkSession()

    // Then check every 30 seconds
    const interval = setInterval(checkSession, 30000)

    return () => clearInterval(interval)
  }, [isAuthenticated])

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

  // Clear polling interval when user logs in successfully
  useEffect(() => {
    const wasLoggedIn = isLoggedInRef.current
    isLoggedInRef.current = isLoggedIn // Update ref
    
    if (isLoggedIn && !wasLoggedIn) {
      console.log('✅ [Effect] User state changed to LOGGED IN, forcing poll cleanup')
      if (loginPollIntervalRef.current) {
        clearInterval(loginPollIntervalRef.current)
        loginPollIntervalRef.current = null
        console.log('🛑 [Effect] Poll interval CLEARED')
      } else {
        console.log('ℹ️ [Effect] No poll interval to clear')
      }
    }
  }, [isLoggedIn])

  // Check login status and load bot settings on page mount (F5)
  useEffect(() => {
    if (!isAuthenticated) {
      // Not authenticated, don't check Zalo login
      setIsCheckingZaloLogin(false)
      return
    }

    const initPage = async () => {
      setIsCheckingZaloLogin(true)
      try {
        // 1. Fetch user settings from database (includes AI settings)
        try {
          const userSettingsRes = await fetch('/api/settings')
          if (userSettingsRes.ok) {
            const { settings } = await userSettingsRes.json()
            console.log('📋 Loaded user settings from database:', settings)
            
            // Apply AI settings from database
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
        } catch (e) {
          console.warn('⚠️ Could not load user settings from database:', e)
        }

        // 2. Fetch bot settings from file system (bot config)
        const settingsRes = await fetch('/api/zalo/settings')
        if (settingsRes.ok) {
          const settings = await settingsRes.json()
          console.log('📋 Loaded bot settings from file:', settings)
          
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
        }

        // Fetch stats from server
        try {
          const statsRes = await fetch('/api/zalo/stats')
          if (statsRes.ok) {
            const statsData = await statsRes.json()
            setStats(statsData)
          }
        } catch (e) {}

        // 2. Check Zalo login status from backend
        const loginRes = await fetch('/api/zalo/login')
        const loginData = await loginRes.json()
        
        console.log('🔍 [Init] Login status from backend:', {
          loggedIn: loginData.loggedIn,
          hasUserInfo: !!loginData.userInfo,
          qrStatus: loginData.qrState?.status
        })
        
        // If already logged in (has session from DB), restore it
        if (loginData.loggedIn && loginData.userInfo) {
          console.log('✅ [Init] Found existing Zalo session, auto-login')
          setIsLoggedIn(true)
          isLoggedInRef.current = true // Update ref
          setUserInfo(loginData.userInfo)
          setQrState(null) // Clear QR state
          
          // Start listener automatically
          setTimeout(() => startListener(), 500)
        } else {
          // Not logged in, ready for QR scan
          console.log('ℹ️ [Init] No session found, ready for QR login')
          setIsLoggedIn(false)
          isLoggedInRef.current = false // Update ref
          setUserInfo(null)
          
          if (loginData.qrState) {
            setQrState(loginData.qrState)
          }
        }
      } catch (error) {
        console.error('Failed to initialize page state:', error)
      } finally {
        setIsCheckingZaloLogin(false)
      }
    }

    initPage()
  }, [isAuthenticated])

  // Sync AI settings to database on first load if user is authenticated
  useEffect(() => {
    if (isAuthenticated && !isCheckingZaloLogin) {
      // Wait a bit for settings to load, then ensure they're saved to DB
      const timer = setTimeout(async () => {
        console.log('🔄 Ensuring AI settings are saved to database...')
        await syncAISettings({
          aiEnabled,
          aiPersonality,
          aiMaxLength,
          aiTriggerMode
        })
      }, 2000)
      
      return () => clearTimeout(timer)
    }
  }, [isAuthenticated, isCheckingZaloLogin])

  // Handle Login via Web QR API
  const handleLogin = async (force: boolean = false) => {
    // Prevent duplicate calls if already logged in or still checking
    if (isLoggedIn) {
      console.log('⚠️ Already logged in, skipping login')
      return
    }
    
    if (isCheckingZaloLogin) {
      console.log('⚠️ Still checking Zalo session, skipping login')
      return
    }
    
    setIsLoading(true)
    
    // Clear any existing poll interval
    if (loginPollIntervalRef.current) {
      console.log('🛑 Clearing existing poll interval')
      clearInterval(loginPollIntervalRef.current)
      loginPollIntervalRef.current = null
    }
    
    try {
      // Start QR generation and wait for response
      const loginResponse = await fetch('/api/zalo/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force }),
      })
      
      const loginData = await loginResponse.json()
      
      // Check if logged in successfully from POST response
      // Note: Backend may return success even on non-200 status if session exists
      if (loginData.success && loginData.userInfo) {
        console.log('✅ [Login] POST returned success, updating state immediately')
        setIsLoggedIn(true)
        isLoggedInRef.current = true // Update ref immediately
        setUserInfo(loginData.userInfo)
        setIsLoading(false)
        setQrState(null) // Clear QR state
        
        // Clear any polling that might still be running
        if (loginPollIntervalRef.current) {
          console.log('🛑 [Login] Clearing poll interval after POST success')
          clearInterval(loginPollIntervalRef.current)
          loginPollIntervalRef.current = null
        }
        
        // Start listener after successful login
        setTimeout(() => startListener(), 500)
        return // IMPORTANT: Return to stop further execution
      }

      // If user is already logged in (e.g. from import or another tab), skip error handling
      if (isLoggedInRef.current) {
        console.log('⚠️ [Login] POST failed but user is already logged in, ignoring')
        setIsLoading(false)
        return
      }

      // If POST failed, poll GET endpoint every 1 second to check QR state
      console.log('📡 [Login] POST did not return success, starting QR status polling...')
      let pollCount = 0
      const maxPolls = 180 // 3 minutes max
      
      loginPollIntervalRef.current = setInterval(async () => {
        pollCount++
        
        // Stop polling if user already logged in (use ref to get latest value)
        if (isLoggedInRef.current) {
          console.log('✅ [Poll] User logged in (ref check), stopping poll')
          if (loginPollIntervalRef.current) {
            clearInterval(loginPollIntervalRef.current)
            loginPollIntervalRef.current = null
          }
          return
        }
        
        // Stop after max polls
        if (pollCount >= maxPolls) {
          console.log('⏰ [Poll] Timeout reached, stopping poll')
          if (loginPollIntervalRef.current) {
            clearInterval(loginPollIntervalRef.current)
            loginPollIntervalRef.current = null
          }
          setIsLoading(false)
          return
        }
        
        try {
          const res = await fetch('/api/zalo/login')
          const data = await res.json()
          
          console.log(`📊 [Poll ${pollCount}] Response:`, {
            loggedIn: data.loggedIn,
            hasUserInfo: !!data.userInfo,
            qrStatus: data.qrState?.status
          })

          // Check if login succeeded on backend
          if (data.loggedIn && data.userInfo) {
            console.log('✅ [Poll] Backend reports logged in, updating state')
            setIsLoggedIn(true)
            isLoggedInRef.current = true // Update ref
            setUserInfo(data.userInfo)
            setIsLoading(false)
            setQrState(null)
            
            // Clear polling
            if (loginPollIntervalRef.current) {
              console.log('🛑 [Poll] Clearing interval after detection')
              clearInterval(loginPollIntervalRef.current)
              loginPollIntervalRef.current = null
            }
            
            // Start listener
            setTimeout(() => startListener(), 500)
            return
          }

          // Update QR state
          if (data.qrState) {
            setQrState(data.qrState)
          }
          
          // Stop polling if error/expired/declined
          if (data.qrState && ['error', 'expired', 'declined'].includes(data.qrState.status)) {
            console.log(`⚠️ [Poll] QR ${data.qrState.status}, stopping poll`)
            if (loginPollIntervalRef.current) {
              clearInterval(loginPollIntervalRef.current)
              loginPollIntervalRef.current = null
            }
            setIsLoading(false)
          }
        } catch (e) {
          console.error('[Poll] Error:', e)
        }
      }, 1000) as unknown as NodeJS.Timeout // Poll every 1 second
      
    } catch (error: any) {
      // If user is already logged in, this error is from a stale request - ignore it
      if (isLoggedInRef.current) {
        console.log('⚠️ [Login] Fetch error ignored - user is already logged in')
        setIsLoading(false)
        if (loginPollIntervalRef.current) {
          clearInterval(loginPollIntervalRef.current)
          loginPollIntervalRef.current = null
        }
        return
      }
      
      console.error('Login failed:', error)
      setIsLoading(false)
      
      // Clear polling on error
      if (loginPollIntervalRef.current) {
        clearInterval(loginPollIntervalRef.current)
        loginPollIntervalRef.current = null
      }
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

  // Sync settings helper (for bot config - saved to file)
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

  // Sync AI settings to database (shared across devices)
  const syncAISettings = async (updates: Partial<{
    aiEnabled: boolean
    aiPersonality: string
    aiMaxLength: number
    aiTriggerMode: string
  }>) => {
    try {
      // Fetch current settings from database first
      const response = await fetch('/api/settings')
      let currentSettings = {
        notificationSound: true,
        replyDelay: 2,
        learningMode: false,
        autoMarkRead: true,
        maxReplyLength: 500,
        darkMode: true,
        animations: true,
        fontSize: 'medium',
        saveHistory: true,
        autoDeleteDays: 'never',
        aiEnabled: true,
        aiPersonality: 'friendly',
        aiMaxLength: 200,
        aiTriggerMode: 'smart',
      }

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.settings) {
          // Merge with existing settings
          currentSettings = { ...currentSettings, ...data.settings }
        }
      }

      // Update with new AI values
      const updatedSettings = {
        ...currentSettings,
        aiEnabled: updates.aiEnabled ?? aiEnabled,
        aiPersonality: updates.aiPersonality ?? aiPersonality,
        aiMaxLength: updates.aiMaxLength ?? aiMaxLength,
        aiTriggerMode: updates.aiTriggerMode ?? aiTriggerMode,
      }

      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSettings),
      })
      
      console.log('✅ AI settings synced to database:', updates)
    } catch (error) {
      console.error('❌ Failed to sync AI settings:', error)
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
    await syncAISettings({ aiEnabled: enabled })
  }
  
  const handleAIPersonalityChange = async (personality: string) => {
    setAiPersonality(personality)
    await syncAISettings({ aiPersonality: personality })
  }
  
  const handleAIMaxLengthChange = async (length: number) => {
    setAiMaxLength(length)
    await syncAISettings({ aiMaxLength: length })
  }
  
  const handleAITriggerModeChange = async (mode: string) => {
    setAiTriggerMode(mode)
    await syncAISettings({ aiTriggerMode: mode })
  }
  
  // Quick actions
  const handleResetStats = async () => {
    setShowResetStatsModal(true)
  }

  const confirmResetStats = async () => {
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
    
    setShowResetStatsModal(false)
    
    // Show success toast
    setToast({
      message: '✅ Đã reset thống kê thành công',
      type: 'success',
    })
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
          isCheckingZaloLogin ? (
            // Show loading while checking Zalo session
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center p-8 bg-dark-200/80 rounded-2xl border border-dark-100 backdrop-blur shadow-2xl">
                <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-200 font-semibold text-base mb-2">Đang kiểm tra phiên Zalo...</p>
                <p className="text-gray-400 text-xs">Vui lòng chờ trong giây lát</p>
              </div>
            </div>
          ) : (
            <LoginSection 
              isLoading={isLoading}
              qrState={qrState}
              onLogin={handleLogin}
              onImportAccount={() => setShowImportModal(true)}
            />
          )
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

      {/* Reset Stats Confirmation Modal */}
      {showResetStatsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-fadeIn">
          <div className="bg-dark-200 rounded-2xl border border-red-500/30 p-6 max-w-md w-full mx-4 animate-scaleIn shadow-2xl">
            <div className="text-center space-y-4">
              {/* Warning Icon */}
              <div className="w-16 h-16 mx-auto bg-red-500/20 border-2 border-red-500/50 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              
              {/* Title */}
              <h3 className="text-xl font-bold text-white">
                Xác nhận reset thống kê
              </h3>
              
              {/* Message */}
              <p className="text-sm text-gray-300">
                Bạn có chắc chắn muốn reset tất cả thống kê?
              </p>
              
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-left">
                <p className="text-xs text-amber-300">
                  <strong>⚠️ Cảnh báo:</strong> Hành động này sẽ xóa:
                </p>
                <ul className="text-xs text-amber-200 mt-2 space-y-1 ml-4">
                  <li>• Tổng số tin nhắn nhận được</li>
                  <li>• Tổng số tin nhắn đã trả lời</li>
                  <li>• Số cuộc trò chuyện đang hoạt động</li>
                  <li>• <strong>Database zalo_stats</strong> (xóa vĩnh viễn)</li>
                </ul>
              </div>
              
              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowResetStatsModal(false)}
                  className="flex-1 px-4 py-2.5 bg-dark-300 hover:bg-dark-200 border border-white/10 text-white rounded-lg font-semibold transition-all"
                >
                  Hủy
                </button>
                <button
                  onClick={confirmResetStats}
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all shadow-lg"
                >
                  Reset thống kê
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
