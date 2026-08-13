import React from 'react'

interface LoginSectionProps {
  isLoading: boolean
  qrCode: string | null
  onLogin: () => void
}

export default function LoginSection({ isLoading, qrCode, onLogin }: LoginSectionProps) {
  return (
    <div className="card max-w-md mx-auto text-center animate-slideIn">
      <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
      </div>
      
      <h2 className="text-2xl font-bold mb-2">Chào mừng đến với Zalo Bot</h2>
      <p className="text-gray-400 mb-6">
        Đăng nhập bằng mã QR để bắt đầu sử dụng
      </p>
      
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
        <p className="text-sm text-yellow-400">
          ⚠️ <strong>Lưu ý:</strong> Mã QR sẽ hiển thị trong <strong>Terminal/Console</strong>
        </p>
        <p className="text-xs text-gray-400 mt-2">
          Kiểm tra cửa sổ terminal để quét mã QR bằng Zalo trên điện thoại
        </p>
      </div>
      
      {isLoading ? (
        <div className="space-y-4">
          <div className="flex items-center justify-center space-x-2">
            <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <p className="text-sm text-gray-400">
            Đang chờ quét mã QR trong terminal...
          </p>
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
          </div>
        </div>
      ) : (
        <button
          onClick={onLogin}
          className="btn btn-primary w-full flex items-center justify-center space-x-2"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm15 0h3v3h-3v-3zm0 5h3v3h-3v-3zm-5-5h3v3h-3v-3z"/>
          </svg>
          <span>Đăng nhập bằng QR Code</span>
        </button>
      )}
      
      <div className="mt-6 pt-6 border-t border-dark-300">
        <p className="text-xs text-gray-500">
          ⚠️ Đây là API không chính thức. Sử dụng có thể vi phạm điều khoản Zalo.
        </p>
      </div>
    </div>
  )
}
