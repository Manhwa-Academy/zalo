import React, { useState } from 'react'

interface AISettingsProps {
  aiEnabled: boolean
  aiPersonality: string
  aiMaxLength: number
  aiTriggerMode: string
  onAIEnabledChange: (enabled: boolean) => void
  onAIPersonalityChange: (personality: string) => void
  onAIMaxLengthChange: (length: number) => void
  onAITriggerModeChange: (mode: string) => void
}

export default function AISettings({
  aiEnabled,
  aiPersonality,
  aiMaxLength,
  aiTriggerMode,
  onAIEnabledChange,
  onAIPersonalityChange,
  onAIMaxLengthChange,
  onAITriggerModeChange,
}: AISettingsProps) {
  const [showInfo, setShowInfo] = useState(false)

  const personalities = [
    { value: 'friendly', label: '🌟 Thân thiện', desc: 'Nhiệt tình, hữu ích, lịch sự' },
    { value: 'professional', label: '💼 Chuyên nghiệp', desc: 'Ngắn gọn, chính xác' },
    { value: 'casual', label: '😊 Thoải mái', desc: 'Gần gũi, đời thường' },
    { value: 'funny', label: '😄 Hài hước', desc: 'Vui tươi, đùa giỡn' },
    { value: 'supportive', label: '💙 Hỗ trợ', desc: 'Đồng cảm, động viên' },
    { value: 'cute', label: '🥺 Dễ thương', desc: 'Nhút nhát, Monica style' },
  ]

  const triggerModes = [
    { value: 'smart', label: '🧠 Thông minh', desc: 'Tự động phát hiện câu hỏi & tin dài' },
    { value: 'questions', label: '❓ Chỉ câu hỏi', desc: 'Chỉ reply khi có dấu ?' },
    { value: 'always', label: '⚡ Luôn luôn', desc: 'Mọi tin nhắn đều dùng AI' },
    { value: 'manual', label: '✋ Thủ công', desc: 'Chỉ khi bật AI manually' },
  ]

  const hasGeminiKey = !!process.env.GEMINI_API_KEY || typeof window !== 'undefined'

  return (
    <div className="card space-y-5">
      {/* Header với toggle */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <span>🤖</span>
            <span>AI Smart Reply</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">Gemini 2.5 Flash Lite</span>
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            Trả lời thông minh bằng AI - Tự hiểu context & cá nhân hóa
          </p>
        </div>
        
        <button
          onClick={() => onAIEnabledChange(!aiEnabled)}
          className={`relative inline-flex h-9 w-16 items-center rounded-full transition-colors ${
            aiEnabled ? 'bg-primary' : 'bg-gray-600'
          }`}
          title={aiEnabled ? 'Tắt AI Reply' : 'Bật AI Reply'}
        >
          <span
            className={`inline-block h-7 w-7 transform rounded-full bg-white transition-transform ${
              aiEnabled ? 'translate-x-8' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* AI Status Banner */}
      {aiEnabled ? (
        <div className="p-3 bg-primary/10 border border-primary/30 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-primary-light">
            <span className="text-base">🤖</span>
            <span className="font-medium">
              AI đang <strong>BẬT</strong> - Bot sẽ trả lời thông minh dựa trên context
            </span>
          </div>
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="text-xs text-primary hover:underline font-bold"
          >
            {showInfo ? 'Ẩn' : 'Chi tiết'}
          </button>
        </div>
      ) : (
        <div className="p-3 bg-gray-800/50 border border-gray-700 rounded-xl">
          <p className="text-xs text-gray-400 text-center">
            ⚠️ AI Reply đang TẮT - Bot sẽ dùng tin nhắn mặc định/preset
          </p>
        </div>
      )}

      {/* Info Box */}
      {showInfo && aiEnabled && (
        <div className="p-4 bg-sky-500/10 border border-sky-500/30 rounded-xl space-y-2 text-xs text-sky-300 animate-slideIn">
          <p><strong>🎯 AI làm gì?</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Đọc hiểu câu hỏi và context trò chuyện</li>
            <li>Trả lời phù hợp với tính cách đã chọn</li>
            <li>Nhớ 5 tin nhắn gần nhất để hiểu ngữ cảnh</li>
            <li>Cá nhân hóa theo người nhắn tin</li>
          </ul>
          <p className="pt-2"><strong>💰 Chi phí:</strong> FREE (15 requests/phút với Gemini)</p>
        </div>
      )}

      {/* AI Settings (chỉ hiện khi bật) */}
      {aiEnabled && (
        <div className="space-y-4 pt-2 border-t border-dark-300">
          {/* Personality */}
          <div>
            <label className="block text-sm font-medium mb-2">
              🎭 Tính cách AI
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {personalities.map((p) => (
                <button
                  key={p.value}
                  onClick={() => onAIPersonalityChange(p.value)}
                  className={`p-3 rounded-xl text-left border transition-all ${
                    aiPersonality === p.value
                      ? 'border-primary bg-primary/20 text-white shadow-lg'
                      : 'border-dark-200 bg-dark-300 text-gray-400 hover:text-white hover:border-primary/40'
                  }`}
                  title={p.desc}
                >
                  <p className="text-xs font-semibold">{p.label}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{p.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Trigger Mode */}
          <div>
            <label className="block text-sm font-medium mb-2">
              ⚡ Khi nào dùng AI?
            </label>
            <div className="grid grid-cols-2 gap-2">
              {triggerModes.map((mode) => (
                <button
                  key={mode.value}
                  onClick={() => onAITriggerModeChange(mode.value)}
                  className={`p-3 rounded-xl text-left border transition-all ${
                    aiTriggerMode === mode.value
                      ? 'border-primary bg-primary/20 text-white shadow-lg'
                      : 'border-dark-200 bg-dark-300 text-gray-400 hover:text-white hover:border-primary/40'
                  }`}
                  title={mode.desc}
                >
                  <p className="text-xs font-semibold">{mode.label}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{mode.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Max Length */}
          <div>
            <label className="block text-sm font-medium mb-2">
              📏 Độ dài trả lời tối đa: <span className="text-primary">{aiMaxLength}</span> ký tự
            </label>
            <input
              type="range"
              min="50"
              max="500"
              step="50"
              value={aiMaxLength}
              onChange={(e) => onAIMaxLengthChange(Number(e.target.value))}
              className="w-full h-2 bg-dark-300 rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <div className="flex justify-between text-[10px] text-gray-500 mt-1">
              <span>50 (Ngắn gọn)</span>
              <span>500 (Chi tiết)</span>
            </div>
          </div>
        </div>
      )}

      {/* Setup Instructions (nếu chưa có API key) */}
      {aiEnabled && !hasGeminiKey && (
        <div className="p-4 bg-warning/10 border border-warning/30 rounded-xl">
          <p className="text-xs text-warning font-semibold mb-2">⚠️ Cần cấu hình API Key:</p>
          <ol className="text-xs text-warning space-y-1 list-decimal list-inside">
            <li>Lấy free API key tại: <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener" className="underline">Google AI Studio</a></li>
            <li>Thêm vào file <code className="bg-black/30 px-1 rounded">.env</code>: <code className="bg-black/30 px-1 rounded">GEMINI_API_KEY=your-key-here</code></li>
            <li>Restart server để áp dụng</li>
          </ol>
        </div>
      )}
    </div>
  )
}
