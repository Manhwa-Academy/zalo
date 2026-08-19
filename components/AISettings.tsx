import React, { useState } from 'react'
import { Bot, Sparkles, Brain, HelpCircle, MessageSquare, Zap, Ruler, Save, AlertCircle, Info, Hand } from 'lucide-react'

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
  const [showPersonalityDemo, setShowPersonalityDemo] = useState<string | null>(null)
  const [showTriggerDemo, setShowTriggerDemo] = useState<string | null>(null)

  const personalities = [
    { 
      value: 'friendly', 
      label: '🌟 Thân thiện', 
      desc: 'Nhiệt tình, hữu ích, lịch sự',
      demo: {
        user: 'Bạn có thể giúp mình không?',
        ai: 'Chào bạn! Mình có thể giúp gì cho bạn không? 😊'
      }
    },
    { 
      value: 'professional', 
      label: '💼 Chuyên nghiệp', 
      desc: 'Ngắn gọn, chính xác',
      demo: {
        user: 'Bạn có thể giúp mình không?',
        ai: 'Xin chào. Tôi có thể hỗ trợ gì cho bạn?'
      }
    },
    { 
      value: 'casual', 
      label: '😊 Thoải mái', 
      desc: 'Gần gũi, đời thường',
      demo: {
        user: 'Bạn có thể giúp mình không?',
        ai: 'Ê! Có chuyện gì thế? 😄 Cần gì cứ nói nha!'
      }
    },
    { 
      value: 'funny', 
      label: '😄 Hài hước', 
      desc: 'Vui tươi, đùa giỡn',
      demo: {
        user: 'Bạn có thể giúp mình không?',
        ai: 'Haha được rồi! Để anh em mình làm phép màu nhé ✨😄'
      }
    },
    { 
      value: 'supportive', 
      label: '💙 Hỗ trợ', 
      desc: 'Đồng cảm, động viên',
      demo: {
        user: 'Bạn có thể giúp mình không?',
        ai: 'Mình hiểu mà. Đừng lo, mình sẽ giúp bạn qua chuyện này 💙'
      }
    },
    { 
      value: 'cute', 
      label: '🥺 Dễ thương', 
      desc: 'Nhút nhát, Monica style',
      demo: {
        user: 'Bạn có thể giúp mình không?',
        ai: 'E-Eto... m-mình có thể giúp bạn được không ạ? 🥺👉👈'
      }
    },
  ]

  const triggerModes = [
    { 
      value: 'smart', 
      label: 'Thông minh',
      icon: Brain,
      desc: 'Tự động phát hiện câu hỏi & tin >= 3 từ',
      detail: 'AI tự động nhận diện:\n• Câu hỏi (có từ: sao, gì, nào, ai...)\n• Tin nhắn dài (>= 3 từ)\n• Yêu cầu giúp đỡ',
      demo: [
        { user: 'Bạn có rảnh không?', ai: '✅ AI trả lời', reason: '(câu hỏi)' },
        { user: 'Giúp mình với', ai: '✅ AI trả lời', reason: '(>= 3 từ)' },
        { user: 'Ok', ai: '⏩ Dùng preset', reason: '(< 3 từ)' },
      ]
    },
    { 
      value: 'questions', 
      label: 'Chỉ câu hỏi',
      icon: HelpCircle,
      desc: 'Chỉ reply khi có dấu ?',
      detail: 'AI chỉ trả lời khi tin nhắn có dấu chấm hỏi (?)',
      demo: [
        { user: 'Bạn có rảnh không?', ai: '✅ AI trả lời', reason: '(có ?)' },
        { user: 'Giúp mình với', ai: '⏩ Dùng preset', reason: '(không có ?)' },
        { user: 'Ok', ai: '⏩ Dùng preset', reason: '(không có ?)' },
      ]
    },
    { 
      value: 'always', 
      label: 'Luôn luôn',
      icon: Zap,
      desc: 'Mọi tin nhắn đều dùng AI',
      detail: 'AI trả lời TẤT CẢ tin nhắn, kể cả tin ngắn như "Ok", "Ừ"',
      demo: [
        { user: 'Bạn có rảnh không?', ai: '✅ AI trả lời', reason: '' },
        { user: 'Giúp mình với', ai: '✅ AI trả lời', reason: '' },
        { user: 'Ok', ai: '✅ AI trả lời', reason: '' },
      ]
    },
    { 
      value: 'manual', 
      label: 'Thủ công',
      icon: Hand,
      desc: 'Chỉ khi bật AI manually',
      detail: 'AI TẮT - Luôn dùng tin nhắn mặc định/preset',
      demo: [
        { user: 'Bạn có rảnh không?', ai: '⏩ Dùng preset', reason: '' },
        { user: 'Giúp mình với', ai: '⏩ Dùng preset', reason: '' },
        { user: 'Ok', ai: '⏩ Dùng preset', reason: '' },
      ]
    },
  ]

  const hasGeminiKey = !!process.env.GEMINI_API_KEY || typeof window !== 'undefined'

  return (
    <div className="card space-y-5">
      {/* Header với toggle */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary" />
            <span>AI Trả Lời Thông Minh</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Gemini 3.1 Flash Lite
            </span>
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            Powered by Google Gemini - Hiểu context & cá nhân hóa theo từng user
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
            <Bot className="w-5 h-5" />
            <span className="font-medium">
              AI đang <strong>BẬT</strong> - Bot sẽ trả lời thông minh dựa trên context
            </span>
          </div>
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="text-xs text-primary hover:underline font-bold flex items-center gap-1"
          >
            <Info className="w-3.5 h-3.5" />
            {showInfo ? 'Ẩn' : 'Chi tiết'}
          </button>
        </div>
      ) : (
        <div className="p-3 bg-gray-800/50 border border-gray-700 rounded-xl flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4 text-gray-400" />
          <p className="text-xs text-gray-400 text-center">
            AI Reply đang TẮT - Bot sẽ dùng tin nhắn mặc định/preset
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
          <p className="pt-2"><strong>💰 Chi phí:</strong> FREE (150 requests/phút với Gemini 3.1 Flash Lite)</p>
        </div>
      )}

      {/* AI Settings (chỉ hiện khi bật) */}
      {aiEnabled && (
        <div className="space-y-4 pt-2 border-t border-dark-300">
          {/* Personality */}
          <div>
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Tính cách AI
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {personalities.map((p) => (
                <div key={p.value} className="relative">
                  <button
                    onClick={() => onAIPersonalityChange(p.value)}
                    className={`w-full p-3 rounded-xl text-left border transition-all ${
                      aiPersonality === p.value
                        ? 'border-primary bg-primary/20 text-white shadow-lg'
                        : 'border-dark-200 bg-dark-300 text-gray-400 hover:text-white hover:border-primary/40'
                    }`}
                  >
                    <p className="text-xs font-semibold">{p.label}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{p.desc}</p>
                  </button>
                  <button
                    onClick={() => setShowPersonalityDemo(showPersonalityDemo === p.value ? null : p.value)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-dark-100 text-primary text-xs font-bold flex items-center justify-center hover:bg-primary hover:text-white transition-colors"
                    title="Xem demo"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                  </button>
                  {showPersonalityDemo === p.value && (
                    <div className="absolute z-10 top-full left-0 right-0 mt-2 p-3 bg-dark-100 border border-primary rounded-xl shadow-2xl animate-slideIn">
                      <p className="text-[10px] text-gray-400 mb-2 flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        Demo chat:
                      </p>
                      <div className="space-y-2">
                        <div className="bg-dark-300 p-2 rounded-lg">
                          <p className="text-[10px] text-gray-300">👤 User: {p.demo.user}</p>
                        </div>
                        <div className="bg-primary/20 p-2 rounded-lg">
                          <p className="text-[10px] text-white flex items-start gap-1">
                            <Bot className="w-3 h-3 mt-0.5" /> AI: {p.demo.ai}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Trigger Mode */}
          <div>
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              Khi nào dùng AI?
            </label>
            <div className="grid grid-cols-2 gap-2">
              {triggerModes.map((mode) => {
                const IconComponent = mode.icon
                return (
                  <div key={mode.value} className="relative">
                    <button
                      onClick={() => onAITriggerModeChange(mode.value)}
                      className={`w-full p-3 rounded-xl text-left border transition-all ${
                        aiTriggerMode === mode.value
                          ? 'border-primary bg-primary/20 text-white shadow-lg'
                          : 'border-dark-200 bg-dark-300 text-gray-400 hover:text-white hover:border-primary/40'
                      }`}
                    >
                      <p className="text-xs font-semibold flex items-center gap-2">
                        <IconComponent className="w-4 h-4" />
                        {mode.label}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{mode.desc}</p>
                    </button>
                  <button
                    onClick={() => setShowTriggerDemo(showTriggerDemo === mode.value ? null : mode.value)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-dark-100 text-primary text-xs font-bold flex items-center justify-center hover:bg-primary hover:text-white transition-colors"
                    title="Xem demo"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                  </button>
                  {showTriggerDemo === mode.value && (
                    <div className="absolute z-10 top-full left-0 right-0 mt-2 p-3 bg-dark-100 border border-primary rounded-xl shadow-2xl animate-slideIn max-w-xs">
                      <p className="text-[10px] text-gray-400 mb-2 whitespace-pre-line">{mode.detail}</p>
                      <div className="space-y-1 mt-2">
                        {mode.demo.map((d, i) => (
                          <div key={i} className="text-[10px] bg-dark-300 p-2 rounded">
                            <p className="text-gray-300">👤 {d.user}</p>
                            <p className={`mt-1 ${d.ai.includes('✅') ? 'text-success' : 'text-gray-400'}`}>
                              {d.ai} {d.reason && <span className="text-gray-500">{d.reason}</span>}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
            </div>
          </div>

          {/* Max Length */}
          <div>
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              <Ruler className="w-4 h-4 text-primary" />
              Độ dài trả lời tối đa: <span className="text-primary">{aiMaxLength}</span> ký tự
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
          <p className="text-xs text-warning font-semibold mb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Cần cấu hình API Key:
          </p>
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
