import React, { useState } from 'react'

interface UserProfileProps {
  userInfo: any
  onUpdateName: (name: string) => void
}

export default function UserProfile({ userInfo, onUpdateName }: UserProfileProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [newName, setNewName] = useState(userInfo?.displayName || '')

  const handleSave = () => {
    if (newName.trim()) {
      onUpdateName(newName.trim())
      setIsEditing(false)
    }
  }

  return (
    <div className="card">
      <h3 className="text-lg font-bold mb-4">Thông tin tài khoản</h3>
      
      <div className="flex items-center space-x-4">
        {userInfo?.avatar ? (
          <img
            src={userInfo.avatar}
            alt={userInfo?.displayName || 'User'}
            className="w-16 h-16 rounded-full object-cover border-2 border-primary/50 shadow-md"
            onError={(e) => {
              ;(e.target as HTMLElement).style.display = 'none'
            }}
          />
        ) : (
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-2xl font-bold">
            {(userInfo?.displayName || 'U').charAt(0).toUpperCase()}
          </div>
        )}
        
        <div className="flex-1">
          {isEditing ? (
            <div className="space-y-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="input text-lg font-bold"
                placeholder="Nhập tên của bạn"
                maxLength={50}
              />
              <div className="flex space-x-2">
                <button onClick={handleSave} className="btn btn-success text-sm">
                  💾 Lưu
                </button>
                <button 
                  onClick={() => {
                    setIsEditing(false)
                    setNewName(userInfo?.displayName || '')
                  }}
                  className="btn bg-dark-300 text-sm"
                >
                  ❌ Hủy
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center space-x-2">
                <p className="text-xl font-bold">{userInfo?.displayName || 'User'}</p>
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-gray-400 hover:text-primary transition-colors"
                  title="Sửa tên"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                  </svg>
                </button>
              </div>
              <p className="text-sm text-gray-400">
                {userInfo?.phoneNumber || 'Chưa có SĐT'}
              </p>
            </>
          )}
        </div>
      </div>
      
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="p-3 bg-dark-300 rounded-lg">
          <p className="text-xs text-gray-400">Số điện thoại</p>
          <p className="font-medium">{userInfo?.phoneNumber || 'N/A'}</p>
        </div>
        <div className="p-3 bg-dark-300 rounded-lg">
          <p className="text-xs text-gray-400">User ID</p>
          <p className="font-mono text-xs truncate">{userInfo?.userId || 'Unknown'}</p>
        </div>
      </div>
      
      <div className="mt-4 p-3 bg-warning/10 rounded-lg border border-warning/30">
        <p className="text-xs text-warning">
          ⚠️ <strong>Lưu ý:</strong> Nếu tên hiển thị không đúng, bạn có thể sửa bằng cách click biểu tượng bút chì bên cạnh tên.
        </p>
      </div>
    </div>
  )
}
