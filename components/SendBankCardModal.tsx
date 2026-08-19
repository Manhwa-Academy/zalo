import React, { useState } from 'react'
import { X, CreditCard, Building2, User, Hash, QrCode, Download, Send, Smartphone } from 'lucide-react'

interface SendBankCardModalProps {
  isOpen: boolean
  onClose: () => void
  threadId: string
  threadType: 'User' | 'Group'
  threadName: string
  onMessageSent?: () => void // Callback when message is sent successfully
}

// Danh sách các ngân hàng phổ biến tại Việt Nam
const BANKS = [
  { code: 'Techcombank', name: 'Techcombank - Ngân hàng TMCP Kỹ thương Việt Nam', bin: '970407' },
  { code: 'Vietcombank', name: 'Vietcombank - Ngân hàng Ngoại thương Việt Nam', bin: '970436' },
  { code: 'VietinBank', name: 'VietinBank - Ngân hàng Công thương Việt Nam', bin: '970415' },
  { code: 'BIDV', name: 'BIDV - Ngân hàng Đầu tư và Phát triển Việt Nam', bin: '970418' },
  { code: 'ACB', name: 'ACB - Ngân hàng Á Châu', bin: '970416' },
  { code: 'MBBank', name: 'MBBank - Ngân hàng Quân đội', bin: '970422' },
  { code: 'VPBank', name: 'VPBank - Ngân hàng Việt Nam Thịnh Vượng', bin: '970432' },
  { code: 'Agribank', name: 'Agribank - Ngân hàng Nông nghiệp và Phát triển Nông thôn', bin: '970405' },
  { code: 'Sacombank', name: 'Sacombank - Ngân hàng TMCP Sài Gòn Thương Tín', bin: '970403' },
  { code: 'TPBank', name: 'TPBank - Ngân hàng Tiên Phong', bin: '970423' },
  { code: 'VIB', name: 'VIB - Ngân hàng Quốc tế', bin: '970441' },
  { code: 'SHB', name: 'SHB - Ngân hàng Sài Gòn - Hà Nội', bin: '970443' },
  { code: 'HDBank', name: 'HDBank - Ngân hàng Phát triển Nhà TPHCM', bin: '970437' },
  { code: 'OCB', name: 'OCB - Ngân hàng Phương Đông', bin: '970448' },
  { code: 'MSB', name: 'MSB - Ngân hàng Hàng Hải', bin: '970426' },
  { code: 'SeABank', name: 'SeABank - Ngân hàng Đông Nam Á', bin: '970440' },
  { code: 'VietCapitalBank', name: 'VietCapitalBank - Ngân hàng Bản Việt', bin: '970454' },
  { code: 'SCB', name: 'SCB - Ngân hàng TMCP Sài Gòn', bin: '970429' },
  { code: 'LPBank', name: 'LPBank - Ngân hàng Bưu điện Liên Việt', bin: '970449' },
  { code: 'Eximbank', name: 'Eximbank - Ngân hàng Xuất Nhập khẩu Việt Nam', bin: '970431' },
]

export default function SendBankCardModal({ 
  isOpen, 
  onClose, 
  threadId, 
  threadType,
  threadName,
  onMessageSent
}: SendBankCardModalProps) {
  const [selectedBank, setSelectedBank] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [accountName, setAccountName] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showQRCode, setShowQRCode] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [isSendingQR, setIsSendingQR] = useState(false)

  const filteredBanks = BANKS.filter(bank => 
    bank.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bank.code.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Tạo QR Code VietQR
  const generateQRCode = () => {
    if (!selectedBank || !accountNumber.trim()) {
      return // Nút sẽ disabled nếu chưa đủ thông tin
    }

    const bank = BANKS.find(b => b.code === selectedBank)
    if (!bank) return

    // Tạo URL QR Code qua api.vietqr.io
    // Format: https://img.vietqr.io/image/{BANK_BIN}-{ACCOUNT_NUMBER}-{TEMPLATE}.jpg?amount={AMOUNT}&addInfo={MESSAGE}&accountName={NAME}
    const template = 'compact2' // hoặc 'compact', 'qr_only', 'print'
    const amount = 0 // Để 0 nếu không có số tiền cố định
    const addInfo = encodeURIComponent('Chuyen khoan') // Nội dung chuyển khoản
    const accName = accountName.trim() ? encodeURIComponent(accountName.trim()) : ''
    
    let url = `https://img.vietqr.io/image/${bank.bin}-${accountNumber.trim()}-${template}.jpg`
    
    // Thêm params nếu có
    const params = []
    if (amount > 0) params.push(`amount=${amount}`)
    if (addInfo) params.push(`addInfo=${addInfo}`)
    if (accName) params.push(`accountName=${accName}`)
    
    if (params.length > 0) {
      url += '?' + params.join('&')
    }

    setQrCodeUrl(url)
    setShowQRCode(true)
  }

  // Gửi QR Code qua Zalo
  const sendQRCode = async () => {
    if (!qrCodeUrl) {
      return // Nút sẽ disabled nếu không có QR
    }

    setIsSendingQR(true)
    try {
      // Tải QR code về dạng blob
      const response = await fetch(qrCodeUrl)
      const blob = await response.blob()
      
      // Tạo caption cho tin nhắn
      let caption = `Ma QR thanh toan\nNgan hang: ${selectedBank}\nSo tai khoan: ${accountNumber}`
      if (accountName && accountName.trim()) {
        caption += `\nChu tai khoan: ${accountName.trim()}`
      }
      
      // Tạo FormData để gửi tin nhắn với file đính kèm
      const formData = new FormData()
      formData.append('file', blob, `QR_${selectedBank}_${accountNumber}.jpg`)
      formData.append('threadId', threadId)
      formData.append('threadType', threadType === 'Group' ? '1' : '0')
      formData.append('message', caption)

      console.log('📤 Sending QR with caption:', caption)

      // Gửi tin nhắn với QR code attachment
      const sendRes = await fetch('/api/zalo/messages', {
        method: 'POST',
        body: formData
      })

      const sendData = await sendRes.json()
      
      if (sendData.success) {
        // Trigger callback to parent to reload messages
        if (onMessageSent) {
          onMessageSent()
        }
        // Đóng modal khi gửi thành công
        setShowQRCode(false)
        onClose()
      }
    } catch (error) {
      console.error('Send QR error:', error)
    } finally {
      setIsSendingQR(false)
    }
  }

  const handleSend = async () => {
    if (!selectedBank || !accountNumber.trim()) {
      return // Nút sẽ disabled nếu chưa đủ thông tin
    }

    setIsSending(true)
    try {
      const res = await fetch('/api/zalo/send-bank-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threadId,
          threadType,
          binBank: selectedBank,
          numAccBank: accountNumber.trim(),
          nameAccBank: accountName.trim() || undefined
        })
      })

      const data = await res.json()
      
      if (data.success) {
        // Trigger callback to parent to reload messages
        if (onMessageSent) {
          onMessageSent()
        }
        // Đóng modal và reset form khi thành công
        setSelectedBank('')
        setAccountNumber('')
        setAccountName('')
        onClose()
      }
    } catch (error) {
      console.error('Send bank card error:', error)
    } finally {
      setIsSending(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-dark-200 rounded-2xl w-full max-w-lg border border-white/10 shadow-2xl flex flex-col" style={{ maxHeight: '75vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Gửi Thẻ Ngân Hàng</h2>
              <p className="text-[10px] text-gray-400">Tới: {threadName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5" style={{ minHeight: 0 }}>
          {/* Bank Selection */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-300 mb-1.5">
              <Building2 className="w-3.5 h-3.5" />
              Ngân hàng <span className="text-red-400">*</span>
            </label>
            
            {!selectedBank ? (
              <>
                <input
                  type="text"
                  placeholder="Tìm ngân hàng..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 bg-dark-300/50 border border-white/10 rounded-xl text-white placeholder-gray-500 text-xs focus:outline-none focus:border-primary/50 mb-1.5"
                />
                <div className="space-y-0.5 overflow-y-auto bg-dark-300/30 rounded-xl border border-white/5 p-1.5" style={{ maxHeight: '140px' }}>
                  {filteredBanks.map((bank) => (
                    <button
                      key={bank.code}
                      onClick={() => {
                        setSelectedBank(bank.code)
                        setSearchQuery('')
                      }}
                      className="w-full px-2.5 py-2 text-left text-xs rounded-lg transition-all text-gray-300 hover:bg-white/5"
                    >
                      <div className="font-medium">{bank.code}</div>
                      <div className="text-[10px] opacity-75 truncate">{bank.name}</div>
                    </button>
                  ))}
                  {filteredBanks.length === 0 && (
                    <div className="text-center py-3 text-gray-500 text-xs">
                      Không tìm thấy ngân hàng
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="px-3 py-2.5 bg-primary/10 border border-primary/30 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-primary">{selectedBank}</div>
                  <div className="text-[10px] text-gray-400 truncate">
                    {BANKS.find(b => b.code === selectedBank)?.name}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedBank('')
                    setSearchQuery('')
                  }}
                  className="text-gray-400 hover:text-white transition-colors ml-2"
                  title="Đổi ngân hàng"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Account Number */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-300 mb-1.5">
              <Hash className="w-3.5 h-3.5" />
              Số tài khoản <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              placeholder="Nhập số tài khoản ngân hàng"
              value={accountNumber}
              onChange={(e) => {
                setAccountNumber(e.target.value.replace(/[^0-9]/g, ''))
              }}
              className="w-full px-3 py-2 bg-dark-300/50 border border-white/10 rounded-xl text-white placeholder-gray-500 text-xs focus:outline-none focus:border-primary/50"
              maxLength={20}
            />
          </div>

          {/* Account Name */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-300 mb-1.5">
              <User className="w-3.5 h-3.5" />
              Tên chủ tài khoản
              <span className="text-gray-500 text-[10px] font-normal">(Tùy chọn - Nhập thủ công)</span>
            </label>
            <input
              type="text"
              placeholder="VD: NGUYEN VAN A"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value.toUpperCase())}
              className="w-full px-3 py-2 bg-dark-300/50 border border-white/10 rounded-xl text-white placeholder-gray-500 text-xs focus:outline-none focus:border-primary/50"
              maxLength={50}
            />
            <div className="mt-1.5 text-[10px] text-blue-400 bg-blue-500/10 border border-blue-400/20 rounded-lg px-2 py-1">
              ℹ️ Tính năng tra cứu tự động tạm thời không khả dụng. Vui lòng nhập tên thủ công.
            </div>
          </div>

          {/* Info */}
          <div className="bg-blue-500/10 border border-blue-400/20 rounded-xl p-2 text-[10px] text-blue-300">
            <span className="font-bold">💡 Lưu ý:</span> Thông tin thẻ ngân hàng sẽ được gửi dưới dạng tin nhắn đặc biệt trong Zalo.
          </div>
        </div>

        {/* Footer - Fixed */}
        <div className="flex items-center gap-2 p-3 border-t border-white/10 flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 px-3 py-2 bg-dark-300 hover:bg-dark-300/70 text-white rounded-xl font-medium transition-all text-xs"
            disabled={isSending}
          >
            Hủy
          </button>
          <button
            onClick={generateQRCode}
            disabled={!selectedBank || !accountNumber.trim()}
            className="flex-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs flex items-center justify-center gap-1.5"
          >
            <QrCode className="w-3.5 h-3.5" />
            Xem QR
          </button>
          <button
            onClick={handleSend}
            disabled={!selectedBank || !accountNumber.trim() || isSending}
            className="flex-1 px-3 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs flex items-center justify-center gap-1.5"
          >
            {isSending ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Đang gửi...
              </>
            ) : (
              <>
                <CreditCard className="w-3.5 h-3.5" />
                Gửi Thẻ
              </>
            )}
          </button>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQRCode && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-lg flex items-center justify-center z-[60] p-4">
          <div className="bg-dark-200 rounded-2xl w-full max-w-md border border-white/10 shadow-2xl flex flex-col" style={{ maxHeight: '80vh' }}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <QrCode className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">QR Code Thanh Toán</h3>
                  <p className="text-[10px] text-gray-400">Quét để chuyển khoản</p>
                </div>
              </div>
              <button
                onClick={() => setShowQRCode(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6" style={{ minHeight: 0 }}>
              {/* QR Code Image */}
              <div className="flex flex-col items-center">
                <div className="bg-white p-4 rounded-2xl shadow-lg mb-4">
                  <img
                    src={qrCodeUrl}
                    alt="VietQR Code"
                    className="w-64 h-64 object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM2YjcyODAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5LaMO0bmcgdOG6oW8gUVI8L3RleHQ+PC9zdmc+'
                    }}
                  />
                </div>

                {/* Bank Info */}
                <div className="w-full space-y-2 mb-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Ngân hàng:</span>
                    <span className="text-white font-bold">{selectedBank}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Số tài khoản:</span>
                    <span className="text-white font-mono font-bold">{accountNumber}</span>
                  </div>
                  {accountName && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">Chủ tài khoản:</span>
                      <span className="text-white font-bold">{accountName}</span>
                    </div>
                  )}
                </div>

                {/* Instructions */}
                <div className="w-full bg-blue-500/10 border border-blue-400/20 rounded-xl p-3 text-xs text-blue-300">
                  <p className="font-bold mb-2 flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4" />
                    Cách quét:
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-[10px]">
                    <li>Mở app ngân hàng của bạn</li>
                    <li>Chọn "Quét QR" hoặc "Chuyển khoản QR"</li>
                    <li>Quét mã QR này</li>
                    <li>Nhập số tiền và xác nhận</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/10 flex gap-2 flex-shrink-0">
              <button
                onClick={() => {
                  // Download QR code
                  const link = document.createElement('a')
                  link.href = qrCodeUrl
                  link.download = `QR_${selectedBank}_${accountNumber}.jpg`
                  link.click()
                }}
                className="flex-1 px-4 py-2 bg-dark-300 hover:bg-dark-300/70 text-white rounded-xl font-medium transition-all text-xs flex items-center justify-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                Tải về
              </button>
              <button
                onClick={sendQRCode}
                disabled={isSendingQR}
                className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold transition-all text-xs flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSendingQR ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Đang gửi...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Gửi QR
                  </>
                )}
              </button>
              <button
                onClick={() => setShowQRCode(false)}
                className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold transition-all text-xs"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
