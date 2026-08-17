import React, { useEffect } from 'react'
import { QrState } from '@/lib/qr-state'

interface LoginSectionProps {
  isLoading: boolean
  qrState?: QrState | null
  onLogin: (force?: boolean) => void
  onImportAccount?: () => void
}

export default function LoginSection({ isLoading, qrState, onLogin, onImportAccount }: LoginSectionProps) {
  const status = qrState?.status || 'idle'
  const qrImage = qrState?.qrImage
  const scannedUser = qrState?.scannedUser

  // Auto-start QR generation when component mounts if status is idle
  // ONLY if not already logged in (check from parent component)
  useEffect(() => {
    if (status === 'idle' && !isLoading) {
      console.log('🚀 [LoginSection] Auto-starting QR generation...')
      onLogin(false)
    }
  }, []) // Only run once on mount

  return (
    <div className="card max-w-lg mx-auto text-center animate-slideIn space-y-4 overflow-y-auto max-h-[85vh]">
      {/* Header Avatar / Icon */}
      <img 
        src="/aris.png" 
        alt="Logo Aris" 
        className="w-16 h-16 mx-auto rounded-3xl object-cover shadow-lg border border-white/10"
      />
      
      <div>
        <h2 className="text-xl font-bold tracking-tight">Đăng nhập Zalo Bot</h2>
        <p className="text-xs text-gray-400 mt-1">
          Quét mã QR trực tiếp bằng ứng dụng Zalo trên điện thoại
        </p>
      </div>

      {/* Main Display Area - Compact */}
      <div className="min-h-[240px] flex flex-col items-center justify-center p-4 bg-dark-300/60 rounded-2xl border border-dark-200">
        {/* State 1: QR Ready to Scan - Compact */}
        {qrImage && (status === 'qr_ready' || status === 'generating') && (
          <div className="space-y-3 animate-slideIn">
            <div className="relative inline-block p-2 bg-white rounded-xl shadow-xl border-2 border-sky-500/30">
              <img
                src={qrImage}
                alt="Mã QR Đăng nhập Zalo"
                className="w-48 h-48 object-contain rounded-lg"
              />
              {status === 'generating' && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-lg flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-sky-400 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <p className="text-xs font-semibold text-sky-400 flex items-center justify-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping"></span>
                📱 Mở Zalo ➔ Quét mã QR
              </p>
              <p className="text-[10px] text-gray-400">
                Mã QR hiển thị trực tiếp trên web
              </p>
            </div>
          </div>
        )}

        {/* State 2: Scanned on phone, waiting for confirmation */}
        {status === 'scanned' && (
          <div className="space-y-4 animate-slideIn py-4">
            <div className="w-20 h-20 rounded-full bg-success/20 border-2 border-success flex items-center justify-center mx-auto shadow-lg relative">
              {scannedUser?.avatar ? (
                <img src={scannedUser.avatar} alt={scannedUser.name} className="w-full h-full rounded-full object-cover" />
              ) : (
                <span className="text-3xl">👤</span>
              )}
              <span className="absolute bottom-0 right-0 w-6 h-6 bg-success rounded-full flex items-center justify-center text-white text-xs font-bold">
                ✓
              </span>
            </div>

            <div>
              <h4 className="text-base font-bold text-success">
                Đã quét thành công!
              </h4>
              <p className="text-sm font-semibold text-white mt-1">
                {scannedUser?.name || 'Tài khoản Zalo'}
              </p>
              <p className="text-xs text-yellow-400 mt-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-2.5">
                👉 Vui lòng mở điện thoại và bấm <strong>[XÁC NHẬN ĐĂNG NHẬP]</strong>
              </p>
            </div>
          </div>
        )}

        {/* State 3: Generating initial QR */}
        {status === 'generating' && !qrImage && (
          <div className="space-y-3 py-8">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-sm text-gray-300 font-medium">Đang khởi tạo mã QR đăng nhập...</p>
            <p className="text-xs text-gray-500">Vui lòng chờ vài giây</p>
          </div>
        )}

        {/* State 4: Expired or Error - Show clearly */}
        {(status === 'expired' || status === 'declined' || status === 'error') && (
          <div className="space-y-3 py-4 max-w-xs">
            <div className="w-12 h-12 bg-danger/20 border border-danger/40 text-danger rounded-full flex items-center justify-center mx-auto text-xl">
              ⚠️
            </div>
            <div>
              <h4 className="text-sm font-bold text-danger">
                {status === 'expired' && '⏰ Mã QR đã hết hạn!'}
                {status === 'declined' && '❌ Đã bị từ chối đăng nhập!'}
                {status === 'error' && '❌ Đăng nhập không thành công'}
              </h4>
              <p className="text-xs text-gray-400 mt-1">
                {qrState?.error || 'Vui lòng bấm nút bên dưới để tạo mã QR mới.'}
              </p>
            </div>
            <button
              onClick={() => onLogin(true)}
              className="btn btn-primary text-sm py-2 px-6 w-full shadow-lg"
            >
              🔄 Tạo mã QR mới
            </button>
          </div>
        )}

        {/* State 5: Idle */}
        {status === 'idle' && !isLoading && (
          <div className="space-y-4 py-6">
            <p className="text-xs text-gray-400">
              Nhấn nút bên dưới để tạo mã QR và đăng nhập vào Bot.
            </p>
            <button
              onClick={() => onLogin(true)}
              className="btn btn-primary text-sm py-3 px-8 flex items-center justify-center gap-2 mx-auto shadow-xl hover:scale-105 transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              <span>Hiển thị Mã QR Đăng Nhập</span>
            </button>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-dark-300 space-y-3">
        {/* Import Account Button - More Prominent */}
        {onImportAccount && (
          <div className="space-y-2">
            <button
              onClick={onImportAccount}
              className="w-full btn bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-sm py-3 px-4 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all"
            >
              <span className="text-lg">📥</span>
              <span className="font-semibold">Nhập tài khoản Zalo đã xuất</span>
            </button>
            <p className="text-xs text-center text-gray-400">
              Bỏ qua bước quét QR nếu đã có file backup
            </p>
          </div>
        )}
        
        <p className="text-[11px] text-gray-500 text-center">
          🔒 Mã QR được tạo trực tiếp từ Zalo API và hiển thị an toàn trên giao diện Web.
        </p>
      </div>
    </div>
  )
}
