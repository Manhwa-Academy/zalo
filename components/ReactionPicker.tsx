import React from 'react'
import { X, ChevronDown, ChevronUp, Ban } from 'lucide-react'

interface ReactionPickerProps {
  onSelect: (icon: string) => void
  onClose: () => void
  position?: { x: number; y: number }
}

// Zalo's official reactions (based on zca-js Reactions enum)
// Top row - Most common reactions
const QUICK_REACTIONS = [
  { icon: '❤️', code: '/-heart', label: 'Yêu thích' },
  { icon: '👍', code: '/-strong', label: 'Thích' },
  { icon: '😂', code: ':>', label: 'Haha' },
  { icon: '😮', code: ':o', label: 'Wow' },
  { icon: '😢', code: ':-((', label: 'Buồn' },
  { icon: '😠', code: ':-h', label: 'Giận dữ' },
]

// All Zalo reactions - EXCLUDING quick reactions (they're shown separately)
const ALL_REACTIONS = [
  // Row 1 - More expressions
  { icon: '🥰', code: ';xx', label: 'Yêu' },
  { icon: '👎', code: '/-weak', label: 'Không thích' },
  { icon: '🤣', code: ':))', label: 'Cười lớn' },
  { icon: '😲', code: ':-o', label: 'Ngạc nhiên' },
  { icon: '😭', code: ":')", label: 'Nước mắt vui' },
  { icon: '😞', code: ';-/', label: 'Thất vọng' },
  
  // Row 2 - Emotions
  { icon: '😔', code: '--b', label: 'Buồn bã' },
  { icon: '😡', code: '&-(', label: 'Tức giận' },
  { icon: '😘', code: ':-*', label: 'Hôn' },
  { icon: '🥺', code: ':wipe', label: 'Khóc' },
  { icon: '😍', code: '/-loveu', label: 'Yêu quý' },
  { icon: '😉', code: ';-)', label: 'Nháy mắt' },
  
  // Row 3 - Cool & Objects
  { icon: '😎', code: 'b-)', label: 'Kính râm' },
  { icon: '🌹', code: '/-rose', label: 'Hoa hồng' },
  { icon: '💔', code: '/-break', label: 'Tan vỡ' },
  { icon: '☀️', code: '/-li', label: 'Mặt trời' },
  { icon: '🎂', code: '/-bd', label: 'Sinh nhật' },
  { icon: '💣', code: '/-bome', label: 'Bom' },
  
  // Row 4 - Gestures
  { icon: '👌', code: '/-ok', label: 'OK' },
  { icon: '✌️', code: '/-v', label: 'Hòa bình' },
  { icon: '🙏', code: '/-thanks', label: 'Cảm ơn' },
  { icon: '👊', code: '/-punch', label: 'Đấm' },
  { icon: '🤝', code: '/-share', label: 'Bắt tay' },
  { icon: '🙇', code: '_()_', label: 'Cầu nguyện' },
  
  // Row 5 - Misc
  { icon: '🚫', code: '/-no', label: 'Không' },
  { icon: '💩', code: '/-shit', label: 'Tệ' },
  { icon: '💌', code: '/-fade', label: 'Thư tình' },
  { icon: '🍺', code: '/-beer', label: 'Bia' },
]

export default function ReactionPicker({
  onSelect,
  onClose,
  position,
}: ReactionPickerProps) {
  const [showAll, setShowAll] = React.useState(false)

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />

      {/* Picker popup */}
      <div
        className="fixed z-50 bg-dark-200 border-2 border-primary/30 rounded-2xl shadow-2xl p-3 animate-in fade-in zoom-in-95 duration-200"
        style={
          position
            ? {
                left: `${position.x}px`,
                top: `${position.y}px`,
                transform: 'translate(-50%, -100%) translateY(-8px)',
              }
            : {
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
              }
        }
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2 px-1">
          <h3 className="text-xs font-bold text-white">Biểu cảm</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1"
            title="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick reactions (always visible) */}
        <div className="grid grid-cols-6 gap-2 mb-2">
          {QUICK_REACTIONS.map((reaction, index) => (
            <button
              key={`quick-${reaction.code}-${index}`}
              onClick={() => {
                onSelect(reaction.code)
                onClose()
              }}
              className="w-10 h-10 flex items-center justify-center text-2xl rounded-lg bg-dark-300/50 hover:bg-primary/20 hover:scale-110 transition-all border border-white/10 hover:border-primary/50"
              title={reaction.label}
            >
              {reaction.icon}
            </button>
          ))}
        </div>

        {/* Expand button */}
        {!showAll && (
          <button
            onClick={() => setShowAll(true)}
            className="w-full py-1.5 text-xs text-primary hover:text-primary/80 font-semibold transition-colors flex items-center justify-center gap-1"
          >
            <span>Xem thêm</span>
            <ChevronDown className="w-3 h-3" />
          </button>
        )}

        {/* All reactions (expandable) */}
        {showAll && (
          <div className="border-t border-white/10 pt-2 mt-1">
            <div className="grid grid-cols-6 gap-2 max-h-64 overflow-y-auto custom-scrollbar">
              {ALL_REACTIONS.map((reaction, index) => (
                <button
                  key={`all-${reaction.code}-${index}`}
                  onClick={() => {
                    onSelect(reaction.code)
                    onClose()
                  }}
                  className="w-10 h-10 flex items-center justify-center text-2xl rounded-lg bg-dark-300/50 hover:bg-primary/20 hover:scale-110 transition-all border border-white/10 hover:border-primary/50"
                  title={reaction.label}
                >
                  {reaction.icon}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowAll(false)}
              className="w-full py-1.5 text-xs text-primary hover:text-primary/80 font-semibold transition-colors mt-2 flex items-center justify-center gap-1"
            >
              <span>Thu gọn</span>
              <ChevronUp className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Remove reaction button */}
        <div className="border-t border-white/10 pt-2 mt-2">
          <button
            onClick={() => {
              onSelect('')
              onClose()
            }}
            className="w-full py-2 px-3 text-xs font-semibold text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors border border-red-500/20 flex items-center justify-center gap-2"
          >
            <Ban className="w-4 h-4" />
            <span>Gỡ biểu cảm</span>
          </button>
        </div>
      </div>
    </>
  )
}
