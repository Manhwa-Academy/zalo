'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import LoginSection from '@/components/LoginSection'
import ControlPanel from '@/components/ControlPanel'
import MessageLogs from '@/components/MessageLogs'
import StatsCards from '@/components/StatsCards'
import BotStatus from '@/components/BotStatus'
import QuickActions from '@/components/QuickActions'
import UserProfile from '@/components/UserProfile'

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
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
        }

        // 2. Fetch login status
        const loginRes = await fetch('/api/zalo/login')
        const loginData = await loginRes.json()
        
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



  // Handle Login via API
  const handleLogin = async () => {
    setIsLoading(true)
    try {
      alert('⚠️ Vui lòng kiểm tra Terminal/Console để quét mã QR!\n📁 Hoặc mở file qr.png trong thư mục dự án')
      
      const response = await fetch('/api/zalo/login', {
        method: 'POST',
      })
      
      const data = await response.json()
      
      if (data.success) {
        setIsLoggedIn(true)
        setUserInfo(data.userInfo)
        
        // Wait a bit for server to fully initialize
        console.log('⏳ Waiting for server initialization...')
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Start listener
        await startListener()
      } else {
        throw new Error(data.error || 'Login failed')
      }
    } catch (error: any) {
      console.error('Login failed:', error)
      alert('Đăng nhập thất bại! ' + error.message)
    } finally {
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

  // Handle new message
  const handleNewMessage = (message: any) => {
    setMessageLogs(prev => [message, ...prev].slice(0, 100))
    setStats(prev => ({
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
        }),
      })
    } catch (error) {
      console.error('Failed to sync bot settings:', error)
    }
  }

  // Toggle bot
  const toggleBot = async () => {
    if (!autoReplyMessage.trim()) {
      alert('Vui lòng nhập tin nhắn tự động!')
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
  
  const handleClearLogs = () => {
    if (confirm('Bạn có chắc muốn xóa tất cả logs?')) {
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
    <main className="min-h-screen bg-gradient-to-br from-dark-100 via-dark-200 to-dark-300">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <Header userInfo={userInfo} onLogout={handleLogout} />
        
        {!isLoggedIn ? (
          <LoginSection 
            isLoading={isLoading}
            qrCode={qrCode}
            onLogin={handleLogin}
          />
        ) : (
          <div className="space-y-6 animate-slideIn">
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
              onToggleBot={toggleBot}
              onMessageChange={handleMessageChange}
              onScopeChange={handleScopeChange}
              onWhitelistChange={handleWhitelistChange}
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
    </main>
  )
}
