import React, { useState, useEffect } from 'react'
import ConfirmModal from './ConfirmModal'

interface AIPersonalSettingsProps {
  onClose?: () => void
}

export default function AIPersonalSettings({ onClose }: AIPersonalSettingsProps) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Modal states
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  
  // Profile state
  const [displayName, setDisplayName] = useState('')
  const [nicknames, setNicknames] = useState<string[]>([])
  const [newNickname, setNewNickname] = useState('')
  const [aiReplyMode, setAiReplyMode] = useState<'mention_only' | 'name_detect' | 'smart_auto'>('mention_only')
  const [contextLength, setContextLength] = useState(20)
  const [rememberContext, setRememberContext] = useState(true)

  // Load profile on mount
  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/user/ai-profile')
      const data = await response.json()
      
      if (data.success && data.profile) {
        const profile = data.profile
        setDisplayName(profile.zalo_display_name || '')
        setNicknames(profile.nicknames || [])
        setAiReplyMode(profile.ai_reply_mode || 'mention_only')
        setContextLength(profile.context_length || 20)
        setRememberContext(profile.remember_context !== false)
      }
    } catch (error) {
      console.error('Failed to load AI profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const response = await fetch('/api/user/ai-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zaloDisplayName: displayName,
          nicknames: nicknames,
          aiReplyMode: aiReplyMode,
          contextLength: contextLength,
          rememberContext: rememberContext,
        }),
      })

      const data = await response.json()
      
      if (data.success) {
        setShowSuccessModal(true)
      } else {
        setErrorMessage(data.error || 'Không thể lưu')
        setShowErrorModal(true)
      }
    } catch (error) {
      console.error('Failed to save AI profile:', error)
      setErrorMessage('Lỗi khi lưu cài đặt')
      setShowErrorModal(true)
    } finally {
      setSaving(false)
    }
  }

  const handleAddNickname = () => {
    if (newNickname.trim() && !nicknames.includes(newNickname.trim())) {
      setNicknames([...nicknames, newNickname.trim()])
      setNewNickname('')
    }
  }

  const handleRemoveNickname = (index: number) => {
    setNicknames(nicknames.filter((_, i) => i !== index))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white">Đang tải...</div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-dark-200 rounded-2xl p-6 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            🤖 Cài đặt AI Cá nhân
          </h2>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          )}
        </div>

        <div className="space-y-6">
          {/* Display Name */}
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              📛 Tên của bạn
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Hoàng Kiều Phong"
              className="w-full px-4 py-2 bg-dark-300 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary"
            />
            <p className="text-xs text-gray-400 mt-1">
              Tên này được lấy từ tài khoản Zalo của bạn
            </p>
          </div>

          {/* Nicknames */}
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              🏷️ Biệt danh / Tên khác
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newNickname}
                onChange={(e) => setNewNickname(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddNickname()}
                placeholder="Phong, HKP, Kiều Phong..."
                className="flex-1 px-4 py-2 bg-dark-300 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary"
              />
              <button
                onClick={handleAddNickname}
                className="px-4 py-2 bg-primary hover:bg-primary/80 text-white rounded-lg transition-colors font-semibold"
              >
                + Thêm
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {nicknames.map((nickname, index) => (
                <div
                  key={index}
                  className="px-3 py-1 bg-dark-300 border border-white/20 rounded-full text-white text-sm flex items-center gap-2"
                >
                  {nickname}
                  <button
                    onClick={() => handleRemoveNickname(index)}
                    className="text-red-400 hover:text-red-300 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              AI sẽ trả lời khi ai đó gọi các tên này trong nhóm chat
            </p>
          </div>

          {/* AI Reply Mode */}
          <div>
            <label className="block text-sm font-semibold text-white mb-3">
              🎯 Chế độ AI tự động
            </label>
            <div className="space-y-2">
              <label className="flex items-start gap-3 p-3 bg-dark-300 border border-white/20 rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                <input
                  type="radio"
                  name="aiReplyMode"
                  value="mention_only"
                  checked={aiReplyMode === 'mention_only'}
                  onChange={(e) => setAiReplyMode(e.target.value as any)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="font-semibold text-white">📍 Chỉ khi @mention hoặc reply</div>
                  <div className="text-xs text-gray-400 mt-1">
                    AI chỉ trả lời khi có người @mention tên bạn hoặc reply tin nhắn của bạn
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 bg-dark-300 border border-white/20 rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                <input
                  type="radio"
                  name="aiReplyMode"
                  value="name_detect"
                  checked={aiReplyMode === 'name_detect'}
                  onChange={(e) => setAiReplyMode(e.target.value as any)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="font-semibold text-white">🔍 Khi thấy tên trong tin nhắn</div>
                  <div className="text-xs text-gray-400 mt-1">
                    AI trả lời khi thấy tên hoặc biệt danh của bạn trong tin nhắn (không cần @)
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 bg-dark-300 border border-white/20 rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                <input
                  type="radio"
                  name="aiReplyMode"
                  value="smart_auto"
                  checked={aiReplyMode === 'smart_auto'}
                  onChange={(e) => setAiReplyMode(e.target.value as any)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="font-semibold text-white">🧠 Thông minh (tự động)</div>
                  <div className="text-xs text-gray-400 mt-1">
                    AI luôn đọc nhóm, tự động trả lời khi thấy câu hỏi hoặc cần thiết
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Context Length */}
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              📚 Số tin nhắn đọc trước (Context)
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="5"
                max="50"
                step="5"
                value={contextLength}
                onChange={(e) => setContextLength(parseInt(e.target.value))}
                className="flex-1"
              />
              <span className="text-white font-bold w-16 text-center">{contextLength}</span>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Số lượng tin nhắn trước đó mà AI sẽ đọc để hiểu ngữ cảnh
            </p>
          </div>

          {/* Remember Context */}
          <div>
            <label className="flex items-start gap-3 p-3 bg-dark-300 border border-white/20 rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
              <input
                type="checkbox"
                checked={rememberContext}
                onChange={(e) => setRememberContext(e.target.checked)}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="font-semibold text-white">🧠 Nhớ thông tin trong hội thoại</div>
                <div className="text-xs text-gray-400 mt-1">
                  AI sẽ nhớ thông tin đã nói trong cuộc trò chuyện (VD: "Hôm qua Phong nói sẽ đi chơi")
                </div>
              </div>
            </label>
          </div>

          {/* Save Button */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 px-6 py-3 bg-primary hover:bg-primary/80 disabled:bg-gray-600 text-white rounded-lg transition-colors font-bold"
            >
              {saving ? 'Đang lưu...' : '💾 Lưu cài đặt'}
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="px-6 py-3 bg-dark-300 hover:bg-dark-400 text-white rounded-lg transition-colors font-semibold"
              >
                Hủy
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <ConfirmModal
        isOpen={showSuccessModal}
        title="Thành công!"
        message="Đã lưu cài đặt AI cá nhân của bạn."
        type="success"
        confirmText="OK"
        showCancel={false}
        onConfirm={() => {
          setShowSuccessModal(false)
          if (onClose) onClose()
        }}
        onCancel={() => {
          setShowSuccessModal(false)
          if (onClose) onClose()
        }}
      />

      {/* Error Modal */}
      <ConfirmModal
        isOpen={showErrorModal}
        title="Lỗi"
        message={errorMessage}
        type="warning"
        confirmText="OK"
        showCancel={false}
        onConfirm={() => setShowErrorModal(false)}
        onCancel={() => setShowErrorModal(false)}
      />
    </>
  )
}
