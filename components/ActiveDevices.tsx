import React, { useState, useEffect } from 'react'
import ConfirmModal from './ConfirmModal'
import { Smartphone, Monitor, Tablet, Watch, LogOut, RefreshCw } from 'lucide-react'

interface Device {
  id: string
  deviceInfo: {
    type: string
    browser: string
    os: string
  }
  ipAddress?: string
  createdAt: string
  lastActive: string
  expiresAt: string
  isCurrent: boolean
}

interface ActiveDevicesProps {
  onLogoutDevice?: (deviceId: string) => void
  onLogoutAllDevices?: () => void
}

export default function ActiveDevices({ onLogoutDevice, onLogoutAllDevices }: ActiveDevicesProps) {
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Modal states
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [deviceToLogout, setDeviceToLogout] = useState<string | null>(null)

  const loadDevices = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/auth/sessions')
      
      if (response.status === 401) {
        // Not using database auth or session invalid
        setError('Tính năng này yêu cầu database authentication. Hiện tại đang dùng simple auth.')
        setLoading(false)
        return
      }
      
      const data = await response.json()
      
      if (response.ok) {
        setDevices(data.sessions || [])
      } else {
        setError(data.error || 'Failed to load devices')
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDevices()
  }, [])

  const handleLogoutDevice = async (deviceId: string) => {
    setDeviceToLogout(deviceId)
    setShowLogoutModal(true)
  }

  const confirmLogoutDevice = async () => {
    if (!deviceToLogout) return
    
    setShowLogoutModal(false)

    try {
      const response = await fetch(`/api/auth/sessions?id=${deviceToLogout}`, {
        method: 'DELETE',
      })
      
      const data = await response.json()
      
      if (response.ok) {
        // Reload devices list
        await loadDevices()
        
        if (onLogoutDevice) {
          onLogoutDevice(deviceToLogout)
        }
      } else {
        alert(data.error || 'Failed to logout device')
      }
    } catch (err) {
      alert('Network error')
    } finally {
      setDeviceToLogout(null)
    }
  }

  const getDeviceIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'mobile': return <Smartphone className="w-5 h-5" />
      case 'tablet': return <Tablet className="w-5 h-5" />
      case 'desktop': return <Monitor className="w-5 h-5" />
      default: return <Watch className="w-5 h-5" />
    }
  }

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      return date.toLocaleString('vi-VN')
    } catch {
      return dateStr
    }
  }

  const getTimeAgo = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
      
      if (seconds < 60) return 'Vừa xong'
      if (seconds < 3600) return `${Math.floor(seconds / 60)} phút trước`
      if (seconds < 86400) return `${Math.floor(seconds / 3600)} giờ trước`
      return `${Math.floor(seconds / 86400)} ngày trước`
    } catch {
      return dateStr
    }
  }

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-3 text-gray-400">Đang tải danh sách thiết bị...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <p className="text-amber-400 mb-4">⚠️ {error}</p>
          {error.includes('simple auth') ? (
            <div className="text-sm text-gray-400 mb-4">
              <p className="mb-2">Để sử dụng tính năng quản lý thiết bị:</p>
              <ol className="text-left max-w-md mx-auto space-y-1">
                <li>1. Đảm bảo DATABASE_URL được set trong .env</li>
                <li>2. Chạy: npm run migrate:auth</li>
                <li>3. Chạy: npm run reset-admin</li>
                <li>4. Restart server: npm run dev</li>
                <li>5. Login lại</li>
              </ol>
            </div>
          ) : (
            <button onClick={loadDevices} className="btn btn-primary">
              Thử lại
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-primary" />
          <span>Thiết bị đang đăng nhập</span>
          <span className="text-sm font-normal text-gray-400">({devices.length})</span>
        </h3>
        
        {devices.length > 1 && (
          <button
            onClick={onLogoutAllDevices}
            className="btn btn-danger text-xs px-3 py-1.5 flex items-center gap-1"
          >
            <LogOut className="w-3.5 h-3.5" />
            Đăng xuất tất cả
          </button>
        )}
      </div>

      {devices.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <p>Không có thiết bị nào đang đăng nhập</p>
        </div>
      ) : (
        <div className="space-y-3">
          {devices.map((device) => (
            <div
              key={device.id}
              className={`p-4 rounded-xl border transition-all ${
                device.isCurrent
                  ? 'bg-primary/10 border-primary/40'
                  : 'bg-dark-100/50 border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{getDeviceIcon(device.deviceInfo?.type)}</span>
                    <div>
                      <p className="font-semibold text-white">
                        {device.deviceInfo?.type || 'Unknown'} - {device.deviceInfo?.browser || 'Browser'}
                        {device.isCurrent && (
                          <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                            Thiết bị này
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-400">
                        {device.deviceInfo?.os || 'Unknown OS'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-400 ml-10">
                    <div>
                      <span className="text-gray-500">IP:</span> {device.ipAddress || 'N/A'}
                    </div>
                    <div>
                      <span className="text-gray-500">Hoạt động:</span> {getTimeAgo(device.lastActive)}
                    </div>
                    <div>
                      <span className="text-gray-500">Đăng nhập:</span> {formatDate(device.createdAt)}
                    </div>
                    <div>
                      <span className="text-gray-500">Hết hạn:</span> {formatDate(device.expiresAt)}
                    </div>
                  </div>
                </div>

                {!device.isCurrent && (
                  <button
                    onClick={() => handleLogoutDevice(device.id)}
                    className="btn btn-danger text-xs px-3 py-1.5 whitespace-nowrap"
                    title="Đăng xuất thiết bị này"
                  >
                    Đăng xuất
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-white/10">
        <button
          onClick={loadDevices}
          className="btn btn-secondary text-xs w-full flex items-center justify-center gap-1"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Làm mới
        </button>
      </div>

      {/* Logout Device Confirmation Modal */}
      <ConfirmModal
        isOpen={showLogoutModal}
        title="Đăng xuất thiết bị này?"
        message="Thiết bị này sẽ bị đăng xuất và cần phải đăng nhập lại."
        type="warning"
        confirmText="Đăng xuất"
        cancelText="Hủy"
        showCancel={true}
        onConfirm={confirmLogoutDevice}
        onCancel={() => {
          setShowLogoutModal(false)
          setDeviceToLogout(null)
        }}
      />
    </div>
  )
}
