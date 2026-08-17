'use client'

import { useState } from 'react'

interface GeminiSettingsProps {
  geminiApiKey: string
  geminiModel: string
  onApiKeyChange: (key: string) => void
  onModelChange: (model: string) => void
}

export default function GeminiSettings({
  geminiApiKey,
  geminiModel,
  onApiKeyChange,
  onModelChange,
}: GeminiSettingsProps) {
  const [showApiKey, setShowApiKey] = useState(false)
  const [showInfo, setShowInfo] = useState(false)

  const geminiModels = [
    { 
      value: 'gemini-3.1-flash-lite', 
      label: 'Gemini 3.1 Flash Lite', 
      desc: '⚡ Nhanh nhất - 150 RPM, 250K TPM (Khuyên dùng)',
      quota: '150 requests/phút'
    },
    { 
      value: 'gemini-3.5-flash-lite', 
      label: 'Gemini 3.5 Flash Lite', 
      desc: '⚡ Rất nhanh - 150 RPM, 250K TPM',
      quota: '150 requests/phút'
    },
    { 
      value: 'gemini-2.5-flash-lite', 
      label: 'Gemini 2.5 Flash Lite', 
      desc: '⚡ Nhanh - 100 RPM, 250K TPM',
      quota: '100 requests/phút'
    },
    { 
      value: 'gemini-3.1-flash', 
      label: 'Gemini 3.1 Flash', 
      desc: '🚀 Cân bằng - 30 RPM, 10K TPM',
      quota: '30 requests/phút'
    },
    { 
      value: 'gemini-3-flash', 
      label: 'Gemini 3 Flash', 
      desc: '🚀 Cân bằng - 50 RPM, 250K TPM',
      quota: '50 requests/phút'
    },
    { 
      value: 'gemini-2.5-flash', 
      label: 'Gemini 2.5 Flash', 
      desc: '🚀 Cân bằng - 50 RPM, 250K TPM',
      quota: '50 requests/phút'
    },
    { 
      value: 'gemini-3.5-flash', 
      label: 'Gemini 3.5 Flash', 
      desc: '🚀 Tốt - 50 RPM, 250K TPM',
      quota: '50 requests/phút'
    },
    { 
      value: 'gemini-3.6-flash', 
      label: 'Gemini 3.6 Flash', 
      desc: '🚀 Tốt - 50 RPM, 250K TPM',
      quota: '50 requests/phút'
    },
    { 
      value: 'gemini-3.7-flash', 
      label: 'Gemini 3.7 Flash', 
      desc: '🚀 Mới nhất - 50 RPM, 250K TPM',
      quota: '50 requests/phút'
    },
  ]

  const maskApiKey = (key: string) => {
    if (!key || key.length < 10) return key
    return key.substring(0, 8) + '•'.repeat(Math.min(20, key.length - 8))
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <span>🔑</span>
            <span>Gemini API Settings</span>
          </h4>
          <p className="text-xs text-gray-400 mt-0.5">
            Dùng API key riêng để có quota riêng (không bị share chung)
          </p>
        </div>
        <button
          onClick={() => setShowInfo(!showInfo)}
          className="text-xs text-primary hover:underline"
        >
          {showInfo ? 'Ẩn' : 'Hướng dẫn'}
        </button>
      </div>

      {/* Info Box */}
      {showInfo && (
        <div className="p-3 bg-sky-500/10 border border-sky-500/30 rounded-xl text-xs text-sky-300 space-y-2 animate-slideIn">
          <p className="font-semibold">📖 Lấy API key miễn phí:</p>
          <ol className="list-decimal list-inside space-y-1 text-[11px]">
            <li>Vào <a href="https://aistudio.google.com/apikey" target="_blank" className="underline">AI Studio</a></li>
            <li>Đăng nhập Google → Click "Create API key"</li>
            <li>Copy key và paste vào ô bên dưới</li>
            <li>Chọn model phù hợp (Gemini 3.1 Flash Lite khuyên dùng)</li>
          </ol>
          <p className="text-amber-300 font-semibold mt-2">
            💡 Mỗi người có quota riêng → Không lo hết hạn mức!
          </p>
        </div>
      )}

      {/* API Key Input */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-white">
          API Key của bạn:
        </label>
        <div className="relative">
          <input
            type={showApiKey ? 'text' : 'password'}
            value={geminiApiKey}
            onChange={(e) => onApiKeyChange(e.target.value)}
            placeholder="AIzaSy... hoặc AQ... (để trống = dùng key hệ thống)"
            className="w-full px-3 py-2 pr-20 rounded-lg bg-dark-300 border border-white/10 text-sm text-white focus:border-primary/50 outline-none font-mono"
          />
          <button
            onClick={() => setShowApiKey(!showApiKey)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-white transition-colors px-2 py-1 rounded bg-dark-200"
          >
            {showApiKey ? '🙈 Ẩn' : '👁️ Hiện'}
          </button>
        </div>
        {geminiApiKey && (
          <p className="text-xs text-green-400">
            ✅ Đã set API key: {maskApiKey(geminiApiKey)}
          </p>
        )}
        {!geminiApiKey && (
          <p className="text-xs text-amber-400">
            ⚠️ Đang dùng API key hệ thống (chia sẻ quota với người khác)
          </p>
        )}
      </div>

      {/* Model Selection */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-white">
          Chọn Model Gemini:
        </label>
        <select
          value={geminiModel}
          onChange={(e) => onModelChange(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-dark-300 border border-white/10 text-sm text-white focus:border-primary/50 outline-none"
        >
          {geminiModels.map((model) => (
            <option key={model.value} value={model.value}>
              {model.label} - {model.desc}
            </option>
          ))}
        </select>
        <div className="text-xs text-gray-400 bg-dark-300/50 border border-white/5 rounded-lg p-2">
          <p className="font-semibold text-white mb-1">
            Quota của {geminiModels.find(m => m.value === geminiModel)?.label}:
          </p>
          <p>
            📊 {geminiModels.find(m => m.value === geminiModel)?.quota}
          </p>
        </div>
      </div>

      {/* Warning */}
      <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
        <p className="text-xs text-amber-300">
          <strong>🔒 Bảo mật:</strong> API key được mã hóa và lưu riêng cho từng user. 
          Không ai khác nhìn thấy key của bạn!
        </p>
      </div>
    </div>
  )
}
