import React, { useState, useEffect } from 'react'
import { Bot, MessageSquare, Users, User, Target, Globe, Check, Shuffle, FileText, X } from 'lucide-react'

export type ReplyScope = 'all' | 'user_only' | 'group_only' | 'whitelist' | 'user_whitelist'

interface GroupItem {
  id: string
  name: string
  totalMember: number
  avatar?: string
}

interface ControlPanelProps {
  botEnabled: boolean
  autoReplyMessage: string
  replyScope: ReplyScope
  whitelist: string[]
  useRandomPreset?: boolean
  presetMessages?: string[]
  onToggleBot: () => void
  onMessageChange: (message: string) => void
  onScopeChange: (scope: ReplyScope) => void
  onWhitelistChange: (whitelist: string[]) => void
  onToggleRandomPreset?: (enabled: boolean) => void
  onPresetMessagesChange?: (presets: string[]) => void
}

const DEFAULT_PRESETS_FALLBACK = [
  'E-Eto... tôi là Monica Everett... xin hãy chiếu cố cho tôi từ bây giờ nhé... 🌸✨🥺🤍',
  'U-Um... nếu tôi trốn sau cánh cửa thì xin đừng kéo tôi ra nhé... 🚪🥺💦',
  'Fuee... c-chuyện này khó quá đi mất... (⁠՚⁠﹏⁠՚⁠)💦',
  'A-Anou... đừng nói cho mọi người biết nhé... tôi tin bạn đó... 🥺🌸🤍✨',
  'S-Sono... nếu có thể giúp được mọi người thì tôi rất vui... 🍀🤍✨',
]

export default function ControlPanel({ 
  botEnabled, 
  autoReplyMessage, 
  replyScope,
  whitelist,
  useRandomPreset = false,
  presetMessages = DEFAULT_PRESETS_FALLBACK,
  onToggleBot, 
  onMessageChange,
  onScopeChange,
  onWhitelistChange,
  onToggleRandomPreset,
  onPresetMessagesChange,
}: ControlPanelProps) {
  const [groups, setGroups] = useState<GroupItem[]>([])
  const [loadingGroups, setLoadingGroups] = useState(false)
  const [friends, setFriends] = useState<GroupItem[]>([]) // 🆕 Friends list for user whitelist
  const [loadingFriends, setLoadingFriends] = useState(false) // 🆕 Loading state for friends
  const [manualIdInput, setManualIdInput] = useState('')

  // Preset Modal & Edit State
  const [showPresetModal, setShowPresetModal] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editingText, setEditingText] = useState('')

  // Standardize 5 presets
  const currentPresets = Array.from({ length: 5 }, (_, i) => presetMessages[i] ?? '')

  const fetchGroups = async () => {
    setLoadingGroups(true)
    try {
      const res = await fetch('/api/zalo/groups')
      const data = await res.json()
      if (data.success && Array.isArray(data.groups)) {
        setGroups(data.groups)
      }
    } catch (e) {
      console.error('Failed to fetch groups:', e)
    } finally {
      setLoadingGroups(false)
    }
  }

  // 🆕 Fetch friends list for user whitelist
  const fetchFriends = async () => {
    setLoadingFriends(true)
    try {
      const res = await fetch('/api/zalo/friends')
      const data = await res.json()
      if (data.success && Array.isArray(data.friends)) {
        // Convert friends to GroupItem format
        const friendsAsItems: GroupItem[] = data.friends.map((f: any) => ({
          id: String(f.id),
          name: f.name || `User ${String(f.id).slice(-4)}`,
          avatar: f.avatar || '',
          totalMember: 0, // Not applicable for users
        }))
        setFriends(friendsAsItems)
      }
    } catch (e) {
      console.error('Failed to fetch friends:', e)
    } finally {
      setLoadingFriends(false)
    }
  }

  useEffect(() => {
    if (replyScope === 'group_only' || replyScope === 'whitelist') {
      fetchGroups()
    }
    // 🆕 Fetch friends when user_whitelist mode is selected
    if (replyScope === 'user_whitelist') {
      fetchFriends()
    }
  }, [replyScope])

  const toggleGroupInWhitelist = (groupId: string) => {
    if (whitelist.includes(groupId)) {
      onWhitelistChange(whitelist.filter(id => id !== groupId))
    } else {
      onWhitelistChange([...whitelist, groupId])
    }
  }

  const handleAddManualId = () => {
    const trimmed = manualIdInput.trim()
    if (trimmed && !whitelist.includes(trimmed)) {
      onWhitelistChange([...whitelist, trimmed])
      setManualIdInput('')
    }
  }

  // Handle Preset editing
  const startEditingPreset = (index: number) => {
    setEditingIndex(index)
    setEditingText(currentPresets[index] || '')
  }

  const saveEditingPreset = (index: number) => {
    const updated = [...currentPresets]
    updated[index] = editingText
    onPresetMessagesChange?.(updated)
    setEditingIndex(null)
    setEditingText('')
  }

  const cancelEditingPreset = () => {
    setEditingIndex(null)
    setEditingText('')
  }

  return (
    <div className="card space-y-6 relative">
      {/* Header & Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg sm:text-xl font-bold flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary" />
            Điều khiển Bot
          </h3>
          <p className="text-xs sm:text-sm text-gray-400">Bật/tắt và cấu hình tin nhắn tự động</p>
        </div>
        <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-white/10">
          <span className="text-xs sm:text-sm font-medium">Trạng thái Bot:</span>
          <button
            onClick={onToggleBot}
            className={`relative inline-flex h-9 w-16 sm:h-10 sm:w-20 items-center rounded-full transition-colors ${
              botEnabled ? 'bg-success' : 'bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-7 w-7 sm:h-8 sm:w-8 transform rounded-full bg-white transition-transform ${
                botEnabled ? 'translate-x-8 sm:translate-x-11' : 'translate-x-1'
              }`}
            />
          </button>
          <span className={`badge ${botEnabled ? 'badge-success' : 'badge-danger'} text-xs flex items-center gap-1`}>
            {botEnabled ? (
              <>
                <Check className="w-3 h-3" />
                Đang BẬT
              </>
            ) : (
              '⚫ Đã TẮT'
            )}
          </span>
        </div>
      </div>
      
      {/* Message Input & Random Mode Toggle */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium">
            Nội dung tin nhắn tự động
            <span className="text-gray-400 ml-2">({autoReplyMessage.length} ký tự)</span>
          </label>

          {/* Preset Modal Trigger Button */}
          <button
            type="button"
            onClick={() => setShowPresetModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/20 hover:bg-primary/30 border border-primary/40 text-primary-light text-xs font-semibold transition-all shadow-sm"
          >
            <MessageSquare className="w-4 h-4" />
            5 tin nhắn soạn trước
            <span className={`px-2 py-0.5 rounded-full text-[10px] flex items-center gap-1 ${useRandomPreset ? 'bg-success text-white' : 'bg-gray-700 text-gray-300'}`}>
              {useRandomPreset ? (
                <>
                  <Shuffle className="w-3 h-3" />
                  Random BẬT
                </>
              ) : 'TẮT'}
            </span>
          </button>
        </div>

        <textarea
          value={autoReplyMessage}
          onChange={(e) => onMessageChange(e.target.value)}
          placeholder="Nhập tin nhắn tự động mặc định..."
          rows={3}
          className="input resize-none"
          maxLength={500}
        />

        {/* Random Preset Indicator Banner if active */}
        {useRandomPreset && (
          <div className="p-3 bg-primary/10 border border-primary/30 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-primary-light font-medium">
              <Shuffle className="w-4 h-4" />
              <span>
                Chế độ Trả lời Ngẫu nhiên đang <strong>BẬT</strong>. Bot sẽ chọn ngẫu nhiên 1 trong 5 tin nhắn soạn trước (khác rỗng).
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowPresetModal(true)}
              className="text-xs text-primary hover:underline font-bold shrink-0 ml-2"
            >
              Xem / Sửa tin nhắn
            </button>
          </div>
        )}
        
        {/* Quick Presets Buttons (1-5) */}
        <div>
          <p className="text-[11px] text-gray-400 mb-2">Bấm chọn nhanh mẫu tin nhắn soạn sẵn làm mặc định:</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {currentPresets.map((preset, index) => (
              <button
                key={index}
                type="button"
                onClick={() => {
                  if (preset) onMessageChange(preset)
                }}
                title={preset || 'Trống'}
                className="btn bg-dark-300 hover:bg-primary/20 text-xs truncate text-left border border-dark-200 hover:border-primary/40 flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                <span className="truncate">Mẫu {index + 1}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Scope Filter Section */}
      <div className="pt-4 border-t border-dark-300">
        <label className="block text-sm font-medium mb-3 flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          Phạm vi áp dụng Auto-Reply
        </label>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
          <button
            type="button"
            onClick={() => onScopeChange('all')}
            className={`p-3 rounded-lg text-xs font-semibold text-center border transition-all flex items-center justify-center gap-2 ${
              replyScope === 'all'
                ? 'border-primary bg-primary/20 text-white shadow-lg'
                : 'border-dark-200 bg-dark-300 text-gray-400 hover:text-white'
            }`}
          >
            <Globe className="w-4 h-4" />
            Tất cả trò chuyện
          </button>

          <button
            type="button"
            onClick={() => onScopeChange('user_only')}
            className={`p-3 rounded-lg text-xs font-semibold text-center border transition-all flex items-center justify-center gap-2 ${
              replyScope === 'user_only'
                ? 'border-primary bg-primary/20 text-white shadow-lg'
                : 'border-dark-200 bg-dark-300 text-gray-400 hover:text-white'
            }`}
          >
            <User className="w-4 h-4" />
            Chỉ tin cá nhân
          </button>

          <button
            type="button"
            onClick={() => onScopeChange('user_whitelist')}
            className={`p-3 rounded-lg text-xs font-semibold text-center border transition-all flex items-center justify-center gap-2 ${
              replyScope === 'user_whitelist'
                ? 'border-primary bg-primary/20 text-white shadow-lg'
                : 'border-dark-200 bg-dark-300 text-gray-400 hover:text-white'
            }`}
          >
            <div className="relative">
              <Target className="w-4 h-4" />
              <User className="w-2.5 h-2.5 absolute -bottom-0.5 -right-0.5 bg-dark-300 rounded-full" />
            </div>
            Chọn người chỉ định
          </button>

          <button
            type="button"
            onClick={() => onScopeChange('group_only')}
            className={`p-3 rounded-lg text-xs font-semibold text-center border transition-all flex items-center justify-center gap-2 ${
              replyScope === 'group_only'
                ? 'border-primary bg-primary/20 text-white shadow-lg'
                : 'border-dark-200 bg-dark-300 text-gray-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            Chỉ tin nhóm
          </button>

          <button
            type="button"
            onClick={() => onScopeChange('whitelist')}
            className={`p-3 rounded-lg text-xs font-semibold text-center border transition-all flex items-center justify-center gap-2 ${
              replyScope === 'whitelist'
                ? 'border-primary bg-primary/20 text-white shadow-lg'
                : 'border-dark-200 bg-dark-300 text-gray-400 hover:text-white'
            }`}
          >
            <Target className="w-4 h-4" />
            Chọn nhóm chỉ định
          </button>
        </div>

        {/* Whitelist group selection view */}
        {(replyScope === 'group_only' || replyScope === 'whitelist') && (
          <div className="p-4 bg-dark-300/60 rounded-xl border border-dark-200 space-y-4 animate-slideIn">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-gray-200">
                  Danh sách nhóm chọn lọc
                </h4>
                <p className="text-[11px] text-gray-400">
                  {whitelist.length > 0
                    ? `🎯 CHỈ trả lời ${whitelist.length} nhóm được tích chọn (khung xanh). Các nhóm khác sẽ bị BỎ QUA.`
                    : replyScope === 'whitelist'
                    ? '⚠️ Hãy TÍCH CHỌN ít nhất 1 nhóm bên dưới để Bot biết nhóm nào cần trả lời!'
                    : '💡 Hiện chưa tích chọn nhóm cụ thể: Bot đang mặc định trả lời TẤT CẢ các nhóm. Hãy TÍCH CHỌN nhóm bạn muốn để giới hạn!'
                  }
                </p>
              </div>
              <button
                type="button"
                onClick={fetchGroups}
                disabled={loadingGroups}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                {loadingGroups ? '⏳ Đang tải...' : '🔄 Làm mới danh sách nhóm'}
              </button>
            </div>

            {/* Manual ID Add Input */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nhập ID Nhóm / ID Người dùng thủ công..."
                value={manualIdInput}
                onChange={(e) => setManualIdInput(e.target.value)}
                className="input text-xs py-2 flex-1"
              />
              <button
                type="button"
                onClick={handleAddManualId}
                className="btn btn-primary text-xs py-2 px-4"
              >
                + Thêm ID
              </button>
            </div>

            {/* Fetched Zalo Groups List */}
            {groups.length > 0 ? (
              <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                {groups.map((group) => {
                  const isChecked = whitelist.includes(group.id)
                  return (
                    <div
                      key={group.id}
                      onClick={() => toggleGroupInWhitelist(group.id)}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                        isChecked
                          ? 'border-success/50 bg-success/10 text-white'
                          : 'border-dark-200 bg-dark-200/50 text-gray-400 hover:bg-dark-200'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="w-4 h-4 accent-success cursor-pointer"
                        />
                        {group.avatar ? (
                          <img
                            src={group.avatar}
                            alt={group.name}
                            className="w-9 h-9 rounded-full object-cover border border-dark-100 shadow-sm shrink-0"
                            onError={(e) => {
                              ;(e.target as HTMLElement).style.display = 'none'
                            }}
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                            <Users className="w-5 h-5" />
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-semibold text-gray-200">{group.name}</p>
                          <p className="text-[10px] text-gray-400">ID: {group.id} • {group.totalMember} thành viên</p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-medium px-2 py-1 rounded transition-colors ${isChecked ? 'bg-success text-white' : 'bg-gray-800 text-gray-400 border border-gray-700'}`}>
                        {isChecked ? '✅ Đã chọn (Cho phép)' : '🚫 Chưa chọn (Bỏ qua)'}
                      </span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-xs text-gray-400 text-center py-3">
                {loadingGroups ? 'Đang tải danh sách nhóm...' : 'Nếu không tìm thấy nhóm tự động, bạn có thể tự dán ID Nhóm vào ô trên để thêm!'}
              </p>
            )}

            {/* Whitelist Selected Badges */}
            {whitelist.length > 0 && (
              <div className="pt-2 border-t border-dark-200">
                <p className="text-[11px] text-gray-400 mb-2">Các ID đã thêm vào danh sách:</p>
                <div className="flex flex-wrap gap-2">
                  {whitelist.map((id) => (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 bg-primary/20 border border-primary/40 text-primary-light rounded-full"
                    >
                      ID: {id}
                      <button
                        type="button"
                        onClick={() => toggleGroupInWhitelist(id)}
                        className="hover:text-red-400 font-bold ml-1"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 🆕 Whitelist USER selection view */}
        {replyScope === 'user_whitelist' && (
          <div className="p-4 bg-dark-300/60 rounded-xl border border-dark-200 space-y-4 animate-slideIn">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-gray-200">
                  Danh sách người dùng chọn lọc
                </h4>
                <p className="text-[11px] text-gray-400">
                  {whitelist.length > 0
                    ? `🎯 CHỈ trả lời ${whitelist.length} người được tích chọn (khung xanh). Người khác sẽ bị BỎ QUA.`
                    : '⚠️ Hãy TÍCH CHỌN ít nhất 1 người bên dưới để Bot biết người nào cần trả lời!'
                  }
                </p>
              </div>
              <button
                type="button"
                onClick={fetchFriends}
                disabled={loadingFriends}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                {loadingFriends ? '⏳ Đang tải...' : '🔄 Làm mới danh sách bạn bè'}
              </button>
            </div>

            {/* Manual ID Add Input */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nhập ID Người dùng thủ công..."
                value={manualIdInput}
                onChange={(e) => setManualIdInput(e.target.value)}
                className="input text-xs py-2 flex-1"
              />
              <button
                type="button"
                onClick={handleAddManualId}
                className="btn btn-primary text-xs py-2 px-4"
              >
                + Thêm ID
              </button>
            </div>

            {/* Fetched Zalo Friends List */}
            {friends.length > 0 ? (
              <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                {friends.map((friend) => {
                  const isChecked = whitelist.includes(friend.id)
                  return (
                    <div
                      key={friend.id}
                      onClick={() => toggleGroupInWhitelist(friend.id)}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                        isChecked
                          ? 'border-success/50 bg-success/10 text-white'
                          : 'border-dark-200 bg-dark-200/50 text-gray-400 hover:bg-dark-200'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="w-4 h-4 accent-success cursor-pointer"
                        />
                        {friend.avatar ? (
                          <img
                            src={friend.avatar}
                            alt={friend.name}
                            className="w-9 h-9 rounded-full object-cover border border-dark-100 shadow-sm shrink-0"
                            onError={(e) => {
                              ;(e.target as HTMLElement).style.display = 'none'
                            }}
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400 font-bold text-xs shrink-0">
                            <User className="w-5 h-5" />
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-semibold text-gray-200">{friend.name}</p>
                          <p className="text-[10px] text-gray-400">ID: {friend.id}</p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-medium px-2 py-1 rounded transition-colors ${isChecked ? 'bg-success text-white' : 'bg-gray-800 text-gray-400 border border-gray-700'}`}>
                        {isChecked ? '✅ Đã chọn (Cho phép)' : '🚫 Chưa chọn (Bỏ qua)'}
                      </span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-xs text-gray-400 text-center py-3">
                {loadingFriends ? 'Đang tải danh sách bạn bè...' : 'Nếu không tìm thấy người dùng tự động, bạn có thể tự dán ID vào ô trên để thêm!'}
              </p>
            )}

            {/* Whitelist Selected Badges */}
            {whitelist.length > 0 && (
              <div className="pt-2 border-t border-dark-200">
                <p className="text-[11px] text-gray-400 mb-2">Các ID đã thêm vào danh sách:</p>
                <div className="flex flex-wrap gap-2">
                  {whitelist.map((id) => (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 bg-primary/20 border border-primary/40 text-primary-light rounded-full"
                    >
                      ID: {id}
                      <button
                        type="button"
                        onClick={() => toggleGroupInWhitelist(id)}
                        className="hover:text-red-400 font-bold ml-1"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bot active notice */}
      {botEnabled && (
        <div className="p-4 bg-success/10 border border-success/30 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
            <p className="text-sm text-success font-medium flex items-center gap-1 flex-wrap">
              Bot đang hoạt động và áp dụng phạm vi: {' '}
              {replyScope === 'all' && (
                <>
                  <Globe className="w-4 h-4 inline" /> Tất cả trò chuyện
                </>
              )}
              {replyScope === 'user_only' && (
                <>
                  <User className="w-4 h-4 inline" /> Chỉ tin cá nhân
                </>
              )}
              {replyScope === 'user_whitelist' && (
                <>
                  <Target className="w-4 h-4 inline" /> <User className="w-3 h-3 inline" /> Người dùng chỉ định ({whitelist.length} người)
                </>
              )}
              {replyScope === 'group_only' && (
                <>
                  <Users className="w-4 h-4 inline" /> Chỉ tin nhóm
                </>
              )}
              {replyScope === 'whitelist' && (
                <>
                  <Target className="w-4 h-4 inline" /> Nhóm chỉ định ({whitelist.length} nhóm)
                </>
              )}
              {useRandomPreset && (
                <>
                  {' • '}
                  <Shuffle className="w-4 h-4 inline" /> Trả lời ngẫu nhiên 1 trong 5 mẫu tin
                </>
              )}
            </p>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5 TIN NHẮN SOẠN TRƯỚC MODAL (Designed matching image 2) */}
      {/* ========================================================= */}
      {showPresetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-slideIn">
          <div className="bg-[#121927] border border-dark-200 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col" style={{ maxHeight: '80vh' }}>
            
            {/* Modal Header */}
            <div className="p-5 border-b border-dark-300 text-center relative bg-[#172033] flex-shrink-0">
              <h3 className="text-xl font-bold text-sky-400">
                5 tin nhắn soạn trước
              </h3>
              <p className="text-xs text-gray-300 mt-1">
                Chạm để sửa từng tin. Auto Rep sẽ chọn ngẫu nhiên từ các tin không trống.
              </p>
              
              <button
                type="button"
                onClick={() => {
                  setShowPresetModal(false)
                  setEditingIndex(null)
                }}
                className="absolute top-4 right-4 text-gray-400 hover:text-white w-8 h-8 rounded-full bg-dark-300 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Random Reply Switch Toggle inside Modal */}
            <div className="p-4 bg-[#1a2337] border-b border-dark-300 flex items-center justify-between px-6 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Shuffle className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-xs font-semibold text-white">Chế độ Trả lời Ngẫu nhiên</p>
                  <p className="text-[10px] text-gray-400">Tự động chọn 1 trong 5 mẫu tin khi nhận tin nhắn</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onToggleRandomPreset?.(!useRandomPreset)}
                className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${
                  useRandomPreset ? 'bg-sky-500' : 'bg-gray-700'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                    useRandomPreset ? 'translate-x-8' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* 5 Preset Cards List - Scrollable */}
            <div className="p-4 space-y-3 overflow-y-auto flex-1" style={{ minHeight: 0 }}>
              {currentPresets.map((preset, index) => {
                const isEditing = editingIndex === index

                return (
                  <div
                    key={index}
                    className={`rounded-2xl border transition-all overflow-hidden ${
                      isEditing
                        ? 'border-sky-500 bg-[#1e293b] p-4 shadow-lg'
                        : 'border-dark-300/80 bg-[#162032] hover:bg-[#1a263d] hover:border-sky-500/50 p-4 cursor-pointer'
                    }`}
                    onClick={() => {
                      if (!isEditing) startEditingPreset(index)
                    }}
                  >
                    {isEditing ? (
                      <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-sky-400">
                            Chỉnh sửa Tin nhắn #{index + 1}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {editingText.length}/500 ký tự
                          </span>
                        </div>
                        <textarea
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          rows={3}
                          className="input text-xs bg-dark-300 text-white resize-none"
                          placeholder={`Nhập tin nhắn mẫu ${index + 1}...`}
                          autoFocus
                          maxLength={500}
                        />
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={cancelEditingPreset}
                            className="px-3 py-1.5 rounded-lg text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 font-medium"
                          >
                            Hủy
                          </button>
                          <button
                            type="button"
                            onClick={() => saveEditingPreset(index)}
                            className="px-4 py-1.5 rounded-lg text-xs bg-sky-500 hover:bg-sky-600 text-white font-bold shadow-md"
                          >
                            Lưu tin nhắn
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-xs text-gray-100 font-medium leading-relaxed">
                          <span className="font-bold text-sky-400 mr-1.5">{index + 1}.</span>
                          {preset.trim() ? (
                            preset
                          ) : (
                            <span className="text-gray-500 italic">(Chưa có nội dung - Nhấn để thêm)</span>
                          )}
                        </p>
                        <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1">
                          <span className="hover:text-sky-300 transition-colors flex items-center gap-1 font-medium">
                            Chạm để sửa
                          </span>
                          <span className="text-sky-400 font-bold">›</span>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-dark-300 bg-[#172033] flex items-center justify-between flex-shrink-0">
              <span className="text-[11px] text-gray-400">
                {currentPresets.filter(p => p.trim()).length}/5 tin nhắn có sẵn
              </span>
              <button
                type="button"
                onClick={() => {
                  setShowPresetModal(false)
                  setEditingIndex(null)
                }}
                className="btn btn-primary text-xs py-2 px-6"
              >
                Xong
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
