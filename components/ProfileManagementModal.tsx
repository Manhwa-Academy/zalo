import React, { useState, useEffect, useRef } from 'react'
import { 
  X, User, Camera, Upload, Loader2, Check, AlertCircle, 
  Trash2, RotateCcw, Image as ImageIcon, UserCircle2, Hash,
  Phone, Calendar, Users2, Mail
} from 'lucide-react'

interface Avatar {
  id: string
  url: string
  thumbnail: string
  createdTime: number
  isUsing: boolean
}

interface ProfileManagementModalProps {
  isOpen: boolean
  onClose: () => void
  currentUserInfo: any
  onProfileUpdated?: () => void
}

export default function ProfileManagementModal({ 
  isOpen, 
  onClose, 
  currentUserInfo,
  onProfileUpdated 
}: ProfileManagementModalProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'avatar'>('info')
  const [avatarList, setAvatarList] = useState<Avatar[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  // Profile edit state
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  
  // 🆕 Full account info from API
  const [fullAccountInfo, setFullAccountInfo] = useState<any>(null)
  
  // Avatar upload
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  useEffect(() => {
    if (currentUserInfo) {
      setDisplayName(currentUserInfo.displayName || '')
      setBio(currentUserInfo.bio || currentUserInfo.status || '')
    }
  }, [currentUserInfo])

  // 🆕 Fetch full account info when modal opens
  useEffect(() => {
    if (isOpen && activeTab === 'info') {
      fetchAccountInfo()
    }
  }, [isOpen, activeTab])

  const fetchAccountInfo = async () => {
    try {
      const res = await fetch('/api/zalo/account-info')
      const data = await res.json()
      
      if (data.success && data.accountInfo) {
        setFullAccountInfo(data.accountInfo)
        console.log('📋 Full account info:', data.accountInfo)
      }
    } catch (error) {
      console.error('Failed to fetch account info:', error)
    }
  }

  useEffect(() => {
    if (isOpen && activeTab === 'avatar') {
      fetchAvatarList()
    }
  }, [isOpen, activeTab])

  const fetchAvatarList = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/zalo/avatar-list')
      const data = await res.json()
      
      if (data.success) {
        setAvatarList(data.avatars || [])
      } else {
        setMessage({ type: 'error', text: data.error || 'Không thể tải danh sách avatar' })
      }
    } catch (error) {
      console.error('Fetch avatar list error:', error)
      setMessage({ type: 'error', text: 'Lỗi khi tải danh sách avatar' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateProfile = async () => {
    setActionLoading('update-profile')
    try {
      const res = await fetch('/api/zalo/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName,
          bio
        })
      })
      
      const data = await res.json()
      
      if (data.success) {
        setMessage({ type: 'success', text: 'Đã cập nhật profile' })
        onProfileUpdated?.()
      } else {
        setMessage({ type: 'error', text: data.error || 'Không thể cập nhật profile' })
      }
    } catch (error) {
      console.error('Update profile error:', error)
      setMessage({ type: 'error', text: 'Lỗi khi cập nhật profile' })
    } finally {
      setActionLoading(null)
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Check file type
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Vui lòng chọn file ảnh' })
      return
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'File quá lớn (max 5MB)' })
      return
    }

    setUploadingAvatar(true)
    try {
      // Convert to base64
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64 = reader.result as string
        
        const res = await fetch('/api/zalo/change-avatar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ avatar: base64 })
        })
        
        const data = await res.json()
        
        if (data.success) {
          setMessage({ type: 'success', text: 'Đã đổi ảnh đại diện' })
          onProfileUpdated?.()
          // Reload avatar list
          await fetchAvatarList()
        } else {
          setMessage({ type: 'error', text: data.error || 'Không thể đổi avatar' })
        }
        
        setUploadingAvatar(false)
        setTimeout(() => setMessage(null), 3000)
      }
      
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Upload avatar error:', error)
      setMessage({ type: 'error', text: 'Lỗi khi upload avatar' })
      setUploadingAvatar(false)
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const handleReuseAvatar = async (avatarId: string) => {
    setActionLoading(avatarId)
    try {
      const res = await fetch('/api/zalo/avatar-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reuse', avatarId })
      })
      
      const data = await res.json()
      
      if (data.success) {
        setMessage({ type: 'success', text: 'Đã đổi sang avatar cũ' })
        onProfileUpdated?.()
        await fetchAvatarList()
      } else {
        setMessage({ type: 'error', text: data.error || 'Không thể đổi avatar' })
      }
    } catch (error) {
      console.error('Reuse avatar error:', error)
      setMessage({ type: 'error', text: 'Lỗi khi đổi avatar' })
    } finally {
      setActionLoading(null)
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const handleDeleteAvatar = async (avatarId: string) => {
    if (!confirm('Bạn có chắc muốn xóa avatar này?')) return
    
    setActionLoading(avatarId)
    try {
      const res = await fetch('/api/zalo/avatar-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', avatarId })
      })
      
      const data = await res.json()
      
      if (data.success) {
        setMessage({ type: 'success', text: 'Đã xóa avatar' })
        setAvatarList(prev => prev.filter(a => a.id !== avatarId))
      } else {
        setMessage({ type: 'error', text: data.error || 'Không thể xóa avatar' })
      }
    } catch (error) {
      console.error('Delete avatar error:', error)
      setMessage({ type: 'error', text: 'Lỗi khi xóa avatar' })
    } finally {
      setActionLoading(null)
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const formatTime = (timestamp: number) => {
    if (!timestamp) return ''
    const date = new Date(timestamp * 1000)
    return date.toLocaleDateString('vi-VN')
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-dark-200 border border-sky-500/30 rounded-3xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-sky-950/80 to-blue-950/80 border-b border-sky-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <User className="w-6 h-6 text-sky-400" />
            <h3 className="text-lg font-bold text-white">Quản lý Profile</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10 bg-dark-300/50">
          <button
            onClick={() => setActiveTab('info')}
            className={`flex-1 px-4 py-3 text-sm font-semibold transition-all ${
              activeTab === 'info'
                ? 'text-sky-400 border-b-2 border-sky-400 bg-sky-950/20'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <User className="w-4 h-4 inline mr-2" />
            Thông tin
          </button>
          <button
            onClick={() => setActiveTab('avatar')}
            className={`flex-1 px-4 py-3 text-sm font-semibold transition-all ${
              activeTab === 'avatar'
                ? 'text-sky-400 border-b-2 border-sky-400 bg-sky-950/20'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Camera className="w-4 h-4 inline mr-2" />
            Avatar
          </button>
        </div>

        {/* Message Banner */}
        {message && (
          <div className={`px-6 py-3 flex items-center gap-3 ${
            message.type === 'success' 
              ? 'bg-green-950/50 border-b border-green-500/30 text-green-400' 
              : 'bg-red-950/50 border-b border-red-500/30 text-red-400'
          }`}>
            {message.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span className="text-sm font-medium">{message.text}</span>
          </div>
        )}

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-180px)]">
          {activeTab === 'info' && (
            <div className="p-6 space-y-4">
              {/* Current Avatar */}
              <div className="flex items-center gap-4 p-4 bg-dark-300/50 rounded-2xl border border-white/10">
                {currentUserInfo?.avatar ? (
                  <img
                    src={currentUserInfo.avatar}
                    alt="Avatar"
                    className="w-16 h-16 rounded-full border-2 border-sky-500/30 object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white text-xl font-bold">
                    {currentUserInfo?.displayName?.charAt(0) || 'U'}
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">
                    {currentUserInfo?.displayName || 'User'}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {currentUserInfo?.zaloName || 'Zalo User'}
                  </p>
                </div>
              </div>

              {/* 🆕 Display full account info from API */}
              {fullAccountInfo && (
                <div className="p-4 bg-dark-300/30 border border-white/10 rounded-2xl space-y-2">
                  <p className="text-xs font-bold text-sky-400 mb-3 flex items-center gap-2">
                    <UserCircle2 className="w-4 h-4" />
                    Thông tin từ Zalo
                  </p>
                  
                  {fullAccountInfo.displayName && (
                    <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                      <span className="text-xs text-gray-400 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" />
                        Tên hiển thị:
                      </span>
                      <span className="text-xs text-white font-medium">{fullAccountInfo.displayName}</span>
                    </div>
                  )}
                  
                  {fullAccountInfo.zaloName && (
                    <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                      <span className="text-xs text-gray-400 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5" />
                        Zalo Name:
                      </span>
                      <span className="text-xs text-white font-medium">{fullAccountInfo.zaloName}</span>
                    </div>
                  )}
                  
                  {fullAccountInfo.status && (
                    <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                      <span className="text-xs text-gray-400 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Tiểu sử:
                      </span>
                      <span className="text-xs text-white font-medium truncate max-w-[200px]">{fullAccountInfo.status}</span>
                    </div>
                  )}
                  
                  {fullAccountInfo.gender !== undefined && fullAccountInfo.gender !== null && (
                    <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                      <span className="text-xs text-gray-400 flex items-center gap-1.5">
                        <Users2 className="w-3.5 h-3.5" />
                        Giới tính:
                      </span>
                      <span className="text-xs text-white font-medium flex items-center gap-1.5">
                        {fullAccountInfo.gender === 0 ? (
                          <>
                            <UserCircle2 className="w-3.5 h-3.5 text-gray-400" />
                            Không xác định
                          </>
                        ) : fullAccountInfo.gender === 1 ? (
                          <>
                            <User className="w-3.5 h-3.5 text-blue-400" />
                            Nam
                          </>
                        ) : (
                          <>
                            <User className="w-3.5 h-3.5 text-pink-400" />
                            Nữ
                          </>
                        )}
                      </span>
                    </div>
                  )}
                  
                  {(fullAccountInfo.sdob || fullAccountInfo.dob) && (
                    <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                      <span className="text-xs text-gray-400 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        Ngày sinh:
                      </span>
                      <span className="text-xs text-white font-medium">
                        {fullAccountInfo.sdob || new Date(fullAccountInfo.dob * 1000).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  )}
                  
                  {fullAccountInfo.phoneNumber && (
                    <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                      <span className="text-xs text-gray-400 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5" />
                        Số điện thoại:
                      </span>
                      <span className="text-xs text-white font-medium">{fullAccountInfo.phoneNumber}</span>
                    </div>
                  )}
                  
                  {fullAccountInfo.userId && (
                    <div className="flex justify-between items-center py-1.5">
                      <span className="text-xs text-gray-400 flex items-center gap-1.5">
                        <Hash className="w-3.5 h-3.5" />
                        User ID:
                      </span>
                      <span className="text-xs text-gray-500 font-mono">
                        {fullAccountInfo.userId.substring(0, 12)}...
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Edit Form */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-2">
                    Tên hiển thị
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Nhập tên hiển thị"
                    className="w-full bg-dark-300 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-sky-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-2">
                    Tiểu sử / Trạng thái
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Nhập tiểu sử hoặc trạng thái"
                    rows={3}
                    className="w-full bg-dark-300 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-sky-500/50 resize-none"
                  />
                </div>

                <button
                  onClick={handleUpdateProfile}
                  disabled={actionLoading === 'update-profile'}
                  className="w-full px-4 py-2.5 bg-sky-500/20 hover:bg-sky-500/30 text-sky-400 hover:text-sky-300 rounded-xl text-sm font-semibold transition-all border border-sky-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {actionLoading === 'update-profile' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Đang cập nhật...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Cập nhật Profile
                    </>
                  )}
                </button>
              </div>

              {/* Note */}
              <div className="p-3 bg-amber-950/30 border border-amber-500/30 rounded-xl">
                <p className="text-xs text-amber-400">
                  <AlertCircle className="w-3 h-3 inline mr-1" />
                  Một số thông tin cá nhân (ngày sinh, giới tính, SĐT) chỉ được Zalo hiển thị, không thể chỉnh sửa qua API vì lý do bảo mật
                </p>
              </div>
            </div>
          )}

          {activeTab === 'avatar' && (
            <div className="p-6">
              {/* Upload New Avatar */}
              <div className="mb-6">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="w-full px-4 py-3 bg-gradient-to-r from-sky-600 to-blue-600 hover:brightness-110 text-white rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploadingAvatar ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Đang upload...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      Upload Avatar Mới
                    </>
                  )}
                </button>
              </div>

              {/* Avatar List */}
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
                </div>
              ) : avatarList.length === 0 ? (
                <div className="text-center py-12">
                  <ImageIcon className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">Chưa có avatar nào</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {avatarList.map((avatar) => (
                    <div
                      key={avatar.id}
                      className="relative group"
                    >
                      <img
                        src={avatar.thumbnail || avatar.url}
                        alt="Avatar"
                        className={`w-full aspect-square object-cover rounded-xl border-2 ${
                          avatar.isUsing 
                            ? 'border-sky-400 ring-2 ring-sky-400/30' 
                            : 'border-white/10'
                        }`}
                      />
                      {avatar.isUsing && (
                        <div className="absolute top-1 right-1 bg-sky-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                          Đang dùng
                        </div>
                      )}
                      {/* Hover actions */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-2">
                        {!avatar.isUsing && (
                          <button
                            onClick={() => handleReuseAvatar(avatar.id)}
                            disabled={actionLoading === avatar.id}
                            className="p-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg transition-colors"
                            title="Dùng avatar này"
                          >
                            {actionLoading === avatar.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <RotateCcw className="w-4 h-4" />
                            )}
                          </button>
                        )}
                        {!avatar.isUsing && (
                          <button
                            onClick={() => handleDeleteAvatar(avatar.id)}
                            disabled={actionLoading === avatar.id}
                            className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                            title="Xóa avatar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      {/* Date */}
                      {avatar.createdTime > 0 && (
                        <p className="text-[10px] text-gray-500 text-center mt-1">
                          {formatTime(avatar.createdTime)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
