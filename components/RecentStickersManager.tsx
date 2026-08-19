'use client'

import React, { useState, useEffect } from 'react'
import { Clock, Trash2, X } from 'lucide-react'

interface Sticker {
  id: string
  catId: string
  url: string
  lastUsed: number
}

interface RecentStickersManagerProps {
  onSelectSticker: (sticker: { id: string; catId: string; url: string }) => void
  maxRecent?: number
}

export default function RecentStickersManager({ 
  onSelectSticker,
  maxRecent = 30 
}: RecentStickersManagerProps) {
  const [recentStickers, setRecentStickers] = useState<Sticker[]>([])
  const [showManager, setShowManager] = useState(false)

  // Load recent stickers from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('zalo_recent_stickers')
      if (stored) {
        const stickers: Sticker[] = JSON.parse(stored)
        setRecentStickers(stickers.slice(0, maxRecent))
      }
    } catch (e) {
      console.error('Failed to load recent stickers:', e)
    }
  }, [maxRecent])

  // Add sticker to recent list
  const addRecentSticker = (sticker: { id: string; catId: string; url: string }) => {
    setRecentStickers(prev => {
      // Remove duplicate if exists
      const filtered = prev.filter(s => s.id !== sticker.id)
      
      // Add to front with timestamp
      const updated = [
        { ...sticker, lastUsed: Date.now() },
        ...filtered
      ].slice(0, maxRecent)
      
      // Save to localStorage
      try {
        localStorage.setItem('zalo_recent_stickers', JSON.stringify(updated))
      } catch (e) {
        console.error('Failed to save recent stickers:', e)
      }
      
      return updated
    })
  }

  // Clear recent stickers
  const clearRecentStickers = () => {
    if (confirm('Bạn có chắc muốn xóa tất cả sticker gần đây?')) {
      setRecentStickers([])
      try {
        localStorage.removeItem('zalo_recent_stickers')
      } catch (e) {
        console.error('Failed to clear recent stickers:', e)
      }
    }
  }

  // Remove single sticker
  const removeSticker = (stickerId: string) => {
    setRecentStickers(prev => {
      const updated = prev.filter(s => s.id !== stickerId)
      try {
        localStorage.setItem('zalo_recent_stickers', JSON.stringify(updated))
      } catch (e) {
        console.error('Failed to save recent stickers:', e)
      }
      return updated
    })
  }

  // Handle sticker select
  const handleSelectSticker = (sticker: Sticker) => {
    onSelectSticker({
      id: sticker.id,
      catId: sticker.catId,
      url: sticker.url
    })
    addRecentSticker({
      id: sticker.id,
      catId: sticker.catId,
      url: sticker.url
    })
  }

  // Expose addRecentSticker to parent via window
  useEffect(() => {
    ;(window as any).__addRecentSticker = addRecentSticker
    return () => {
      delete (window as any).__addRecentSticker
    }
  }, [])

  if (recentStickers.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400 text-xs">
        <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>Chưa có sticker gần đây</p>
        <p className="text-[10px] mt-1">Gửi sticker để lưu vào đây</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-300">
          <Clock className="w-4 h-4" />
          <span>Gần đây ({recentStickers.length})</span>
        </div>
        <button
          onClick={clearRecentStickers}
          className="text-xs text-red-400 hover:text-red-300 transition-colors flex items-center gap-1"
          title="Xóa tất cả"
        >
          <Trash2 className="w-3 h-3" />
          Xóa tất cả
        </button>
      </div>

      {/* Sticker Grid */}
      <div className="grid grid-cols-5 gap-2">
        {recentStickers.map((sticker) => (
          <div
            key={sticker.id}
            className="relative group"
          >
            <button
              onClick={() => handleSelectSticker(sticker)}
              className="w-full aspect-square rounded-xl overflow-hidden bg-dark-300 hover:bg-dark-200 transition-all hover:scale-105 active:scale-95 border border-white/5 hover:border-sky-500/50"
            >
              <img
                src={sticker.url}
                alt={`Sticker ${sticker.id}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </button>
            
            {/* Delete button (on hover) */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                removeSticker(sticker.id)
              }}
              className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
              title="Xóa khỏi danh sách"
            >
              <X className="w-3 h-3 text-white" />
            </button>
          </div>
        ))}
      </div>

      {/* Manager Modal */}
      {showManager && (
        <div className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-gradient-to-br from-dark-200 via-dark-100 to-dark-200 border border-white/10 rounded-3xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 sticky top-0 bg-dark-200/95 backdrop-blur-sm pb-4 border-b border-white/10">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-sky-400" />
                Sticker gần đây
              </h3>
              <button
                onClick={() => setShowManager(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sticker Grid (Large View) */}
            <div className="grid grid-cols-6 gap-3">
              {recentStickers.map((sticker) => (
                <div
                  key={sticker.id}
                  className="relative group"
                >
                  <button
                    onClick={() => {
                      handleSelectSticker(sticker)
                      setShowManager(false)
                    }}
                    className="w-full aspect-square rounded-xl overflow-hidden bg-dark-300 hover:bg-dark-200 transition-all hover:scale-105 active:scale-95 border border-white/5 hover:border-sky-500/50"
                  >
                    <img
                      src={sticker.url}
                      alt={`Sticker ${sticker.id}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      removeSticker(sticker.id)
                    }}
                    className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
            </div>

            {/* Clear All */}
            <div className="mt-6 pt-4 border-t border-white/10">
              <button
                onClick={clearRecentStickers}
                className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 rounded-xl text-red-400 hover:text-red-300 font-medium text-sm transition-all flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Xóa tất cả sticker gần đây
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
