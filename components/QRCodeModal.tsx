import React, { useState, useEffect } from 'react'
import { X, Download, Share2, Loader2, QrCode, User, CheckCircle } from 'lucide-react'

interface QRCodeModalProps {
  onClose: () => void
  userId?: string
  userName?: string
}

export default function QRCodeModal({ onClose, userId, userName }: QRCodeModalProps) {
  const [loading, setLoading] = useState(true)
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [downloading, setDownloading] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    loadQRCode()
  }, [userId])

  const loadQRCode = async () => {
    setLoading(true)
    setError('')
    
    try {
      const url = userId 
        ? `/api/zalo/qr-code?userId=${encodeURIComponent(userId)}`
        : '/api/zalo/qr-code'
      
      const res = await fetch(url)
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Không thể lấy mã QR')
      }

      // Extract QR code URL from response
      // Response format: { userId: "qr_code_url" }
      const qrUrls = data.data
      const qrUrl = Object.values(qrUrls)[0] as string

      if (!qrUrl) {
        throw new Error('Không tìm thấy mã QR')
      }

      setQrCodeUrl(qrUrl)
    } catch (err: any) {
      console.error('Load QR error:', err)
      setError(err.message || 'Không thể tải mã QR')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    if (!qrCodeUrl) return

    setDownloading(true)
    try {
      // Fetch the image
      const response = await fetch(qrCodeUrl)
      const blob = await response.blob()
      
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `zalo-qr-${userName || userId || 'code'}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Download error:', err)
      alert('Không thể tải xuống mã QR')
    } finally {
      setDownloading(false)
    }
  }

  const handleCopyLink = () => {
    if (!qrCodeUrl) return

    navigator.clipboard.writeText(qrCodeUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShare = async () => {
    if (!qrCodeUrl) return

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Mã QR Zalo - ${userName || 'User'}`,
          text: 'Quét mã QR này để kết bạn với tôi trên Zalo',
          url: qrCodeUrl,
        })
      } catch (err) {
        console.error('Share error:', err)
      }
    } else {
      // Fallback to copy link
      handleCopyLink()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-fadeIn">
      <div className="bg-dark-200 border border-sky-500/30 rounded-2xl shadow-2xl max-w-sm w-full max-h-[90vh] overflow-y-auto animate-slideUp">
        {/* Header - Compact */}
        <div className="px-4 py-3 bg-gradient-to-r from-sky-950/80 to-blue-950/80 border-b border-sky-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-sky-400" />
            <div>
              <h3 className="text-sm font-bold text-white">Mã QR Zalo</h3>
              {userName && (
                <p className="text-[10px] text-gray-400 truncate max-w-[150px]">
                  {userName}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg flex-shrink-0"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content - Compact */}
        <div className="p-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="w-10 h-10 text-primary animate-spin mb-3" />
              <p className="text-xs text-gray-400">Đang tải mã QR...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-12 h-12 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center mb-3">
                <X className="w-6 h-6 text-red-400" />
              </div>
              <p className="text-xs text-red-400 text-center mb-3">{error}</p>
              <button
                onClick={loadQRCode}
                className="px-3 py-1.5 bg-primary hover:bg-primary/80 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                Thử lại
              </button>
            </div>
          ) : qrCodeUrl ? (
            <div className="space-y-3">
              {/* QR Code Display - Smaller */}
              <div className="bg-white p-3 rounded-xl shadow-lg mx-auto w-fit">
                <img
                  src={qrCodeUrl}
                  alt="Zalo QR Code"
                  className="w-48 h-48"
                  style={{ imageRendering: 'crisp-edges' }}
                />
              </div>

              {/* Info Box - Compact */}
              <div className="bg-sky-500/10 border border-sky-500/30 rounded-lg p-2">
                <div className="flex items-start gap-1.5">
                  <User className="w-3 h-3 text-sky-400 flex-shrink-0 mt-0.5" />
                  <p className="text-[10px] text-sky-200 leading-snug">
                    Người khác có thể quét mã QR này để kết bạn hoặc xem thông tin Zalo.
                  </p>
                </div>
              </div>

              {/* Action Buttons - Compact */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="py-2 px-3 rounded-lg text-xs font-bold bg-gradient-to-r from-primary to-blue-600 hover:brightness-110 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                >
                  {downloading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang tải...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <span>Tải xuống</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleShare}
                  className="py-2 px-3 rounded-lg text-xs font-bold border border-white/10 bg-dark-300 text-gray-300 hover:text-white hover:border-sky-500 transition-all flex items-center justify-center gap-1.5"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Chia sẻ</span>
                </button>
              </div>

              {/* Copy Link Button - Compact */}
              <button
                onClick={handleCopyLink}
                className={`w-full py-1.5 px-2.5 rounded-lg text-[10px] font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  copied
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-dark-300 text-gray-400 hover:text-white border border-white/10'
                }`}
              >
                {copied ? (
                  <>
                    <CheckCircle className="w-3 h-3" />
                    <span>Đã sao chép!</span>
                  </>
                ) : (
                  <span>Sao chép link ảnh QR</span>
                )}
              </button>
            </div>
          ) : null}
        </div>

        {/* Footer - Compact */}
        <div className="px-4 py-2 bg-dark-300/50 border-t border-white/5 flex justify-center">
          <button
            onClick={onClose}
            className="text-[10px] text-gray-400 hover:text-white transition-colors py-1"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}
