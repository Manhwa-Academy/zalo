import React, { useEffect } from 'react'
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react'

export interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'info' | 'warning'
  duration?: number
  onClose: () => void
}

export default function Toast({ message, type = 'success', duration = 3000, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const icons = {
    success: <CheckCircle className="w-6 h-6" />,
    error: <XCircle className="w-6 h-6" />,
    info: <Info className="w-6 h-6" />,
    warning: <AlertTriangle className="w-6 h-6" />,
  }

  const colors = {
    success: 'from-green-500/20 to-emerald-500/20 border-green-500/40',
    error: 'from-red-500/20 to-rose-500/20 border-red-500/40',
    info: 'from-blue-500/20 to-sky-500/20 border-blue-500/40',
    warning: 'from-yellow-500/20 to-orange-500/20 border-yellow-500/40',
  }

  const textColors = {
    success: 'text-green-300',
    error: 'text-red-300',
    info: 'text-blue-300',
    warning: 'text-yellow-300',
  }

  return (
    <div className="fixed top-6 right-6 z-[9999] animate-slideInRight">
      <div
        className={`
          bg-gradient-to-r ${colors[type]}
          backdrop-blur-xl border rounded-2xl shadow-2xl
          px-5 py-3 flex items-center space-x-3
          min-w-[300px] max-w-md
          transition-all duration-300 ease-out
        `}
      >
        <span className={`flex-shrink-0 ${textColors[type]}`}>{icons[type]}</span>
        <p className={`text-sm font-semibold ${textColors[type]} flex-1`}>
          {message}
        </p>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
