import React from 'react'

interface HeaderProps {
  userInfo: any
  onLogout: () => void
}

export default function Header({ userInfo, onLogout }: HeaderProps) {
  return (
    <header className="card mb-6 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
          <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Zalo Auto Reply Bot
          </h1>
          <p className="text-sm text-gray-400">Tự động trả lời tin nhắn thông minh</p>
        </div>
      </div>
      
      {userInfo && (
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="font-medium">{userInfo.displayName || 'User'}</p>
            <p className="text-sm text-gray-400">{userInfo.phoneNumber || 'N/A'}</p>
          </div>
          <button
            onClick={onLogout}
            className="btn btn-danger text-sm"
          >
            Đăng xuất
          </button>
        </div>
      )}
    </header>
  )
}
