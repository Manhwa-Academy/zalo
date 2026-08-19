import React from 'react'
import { AlertTriangle, Info, CheckCircle, X } from 'lucide-react'

interface ConfirmModalProps {
  isOpen: boolean
  title: string
  message: string
  type?: 'confirm' | 'success' | 'info' | 'warning'
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
  showCancel?: boolean
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  type = 'confirm',
  confirmText = 'OK',
  cancelText = 'Hủy',
  onConfirm,
  onCancel,
  showCancel = true
}: ConfirmModalProps) {
  if (!isOpen) return null

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-12 h-12 text-green-500" />
      case 'warning':
        return <AlertTriangle className="w-12 h-12 text-yellow-500" />
      case 'info':
        return <Info className="w-12 h-12 text-blue-500" />
      default:
        return <AlertTriangle className="w-12 h-12 text-primary" />
    }
  }

  const getColors = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'from-green-500/10 to-green-600/10',
          border: 'border-green-500/20',
          iconBg: 'bg-green-500/10'
        }
      case 'warning':
        return {
          bg: 'from-yellow-500/10 to-yellow-600/10',
          border: 'border-yellow-500/20',
          iconBg: 'bg-yellow-500/10'
        }
      case 'info':
        return {
          bg: 'from-blue-500/10 to-blue-600/10',
          border: 'border-blue-500/20',
          iconBg: 'bg-blue-500/10'
        }
      default:
        return {
          bg: 'from-primary/10 to-secondary/10',
          border: 'border-primary/20',
          iconBg: 'bg-primary/10'
        }
    }
  }

  const colors = getColors()

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
      onClick={onCancel}
    >
      <div 
        className={`bg-dark-200 border ${colors.border} rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1 hover:bg-white/10 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>

        {/* Icon */}
        <div className={`flex items-center justify-center w-16 h-16 ${colors.iconBg} rounded-full mx-auto mb-4`}>
          {getIcon()}
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-white text-center mb-2">
          {title}
        </h3>

        {/* Message */}
        <p className="text-gray-300 text-center mb-6 leading-relaxed">
          {message}
        </p>

        {/* Buttons */}
        <div className={`flex gap-3 ${showCancel ? 'justify-between' : 'justify-center'}`}>
          {showCancel && (
            <button
              onClick={onCancel}
              className="flex-1 px-5 py-3 rounded-xl bg-dark-300 hover:bg-dark-400 text-white font-medium transition-colors border border-white/10"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={onConfirm}
            className={`flex-1 px-5 py-3 rounded-xl font-medium transition-all shadow-lg ${
              type === 'success' 
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : type === 'warning'
                ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                : 'bg-gradient-to-r from-primary to-secondary hover:brightness-110 text-white'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
