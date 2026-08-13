import React, { useState, useEffect } from 'react'

export type ReplyScope = 'all' | 'user_only' | 'group_only' | 'whitelist'

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
  onToggleBot: () => void
  onMessageChange: (message: string) => void
  onScopeChange: (scope: ReplyScope) => void
  onWhitelistChange: (whitelist: string[]) => void
}

export default function ControlPanel({ 
  botEnabled, 
  autoReplyMessage, 
  replyScope,
  whitelist,
  onToggleBot, 
  onMessageChange,
  onScopeChange,
  onWhitelistChange,
}: ControlPanelProps) {
  const [groups, setGroups] = useState<GroupItem[]>([])
  const [loadingGroups, setLoadingGroups] = useState(false)
  const [manualIdInput, setManualIdInput] = useState('')

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

  useEffect(() => {
    if (replyScope === 'group_only' || replyScope === 'whitelist') {
      fetchGroups()
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

  return (
    <div className="card space-y-6">
      {/* Header & Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold">Điều khiển Bot</h3>
          <p className="text-sm text-gray-400">Bật/tắt và cấu hình tin nhắn tự động</p>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-sm font-medium">Trạng thái Bot:</span>
          <button
            onClick={onToggleBot}
            className={`relative inline-flex h-10 w-20 items-center rounded-full transition-colors ${
              botEnabled ? 'bg-success' : 'bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-8 w-8 transform rounded-full bg-white transition-transform ${
                botEnabled ? 'translate-x-11' : 'translate-x-1'
              }`}
            />
          </button>
          <span className={`badge ${botEnabled ? 'badge-success' : 'badge-danger'}`}>
            {botEnabled ? '🟢 Đang hoạt động' : '⚫ Đã tắt'}
          </span>
        </div>
      </div>
      
      {/* Message Input */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Nội dung tin nhắn tự động
            <span className="text-gray-400 ml-2">({autoReplyMessage.length} ký tự)</span>
          </label>
          <textarea
            value={autoReplyMessage}
            onChange={(e) => onMessageChange(e.target.value)}
            placeholder="Nhập tin nhắn tự động..."
            rows={3}
            className="input resize-none"
            maxLength={500}
          />
        </div>
        
        {/* Presets */}
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => onMessageChange('Xin chào! Tôi đang bận, sẽ phản hồi bạn sớm nhất có thể. 🙏')}
            className="btn bg-dark-300 hover:bg-primary/20 text-sm"
          >
            📝 Mẫu 1
          </button>
          <button
            onClick={() => onMessageChange('Cảm ơn bạn đã nhắn tin. Tôi sẽ trả lời trong vòng 1 giờ. ⏰')}
            className="btn bg-dark-300 hover:bg-primary/20 text-sm"
          >
            📝 Mẫu 2
          </button>
          <button
            onClick={() => onMessageChange('Tôi đang không online. Vui lòng để lại tin nhắn, tôi sẽ phản hồi sớm! 💬')}
            className="btn bg-dark-300 hover:bg-primary/20 text-sm"
          >
            📝 Mẫu 3
          </button>
        </div>
      </div>

      {/* Scope Filter Section */}
      <div className="pt-4 border-t border-dark-300">
        <label className="block text-sm font-medium mb-3">
          🎯 Phạm vi áp dụng Auto-Reply
        </label>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
          <button
            type="button"
            onClick={() => onScopeChange('all')}
            className={`p-3 rounded-lg text-xs font-semibold text-center border transition-all ${
              replyScope === 'all'
                ? 'border-primary bg-primary/20 text-white shadow-lg'
                : 'border-dark-200 bg-dark-300 text-gray-400 hover:text-white'
            }`}
          >
            🌐 Tất cả trò chuyện
          </button>

          <button
            type="button"
            onClick={() => onScopeChange('user_only')}
            className={`p-3 rounded-lg text-xs font-semibold text-center border transition-all ${
              replyScope === 'user_only'
                ? 'border-primary bg-primary/20 text-white shadow-lg'
                : 'border-dark-200 bg-dark-300 text-gray-400 hover:text-white'
            }`}
          >
            👤 Chỉ tin cá nhân
          </button>

          <button
            type="button"
            onClick={() => onScopeChange('group_only')}
            className={`p-3 rounded-lg text-xs font-semibold text-center border transition-all ${
              replyScope === 'group_only'
                ? 'border-primary bg-primary/20 text-white shadow-lg'
                : 'border-dark-200 bg-dark-300 text-gray-400 hover:text-white'
            }`}
          >
            👥 Chỉ tin nhóm
          </button>

          <button
            type="button"
            onClick={() => onScopeChange('whitelist')}
            className={`p-3 rounded-lg text-xs font-semibold text-center border transition-all ${
              replyScope === 'whitelist'
                ? 'border-primary bg-primary/20 text-white shadow-lg'
                : 'border-dark-200 bg-dark-300 text-gray-400 hover:text-white'
            }`}
          >
            🎯 Chọn nhóm chỉ định
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
                            👥
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
      </div>

      {/* Bot active notice */}
      {botEnabled && (
        <div className="p-4 bg-success/10 border border-success/30 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
            <p className="text-sm text-success font-medium">
              Bot đang hoạt động và áp dụng pham vi: {' '}
              {replyScope === 'all' && '🌐 Tất cả trò chuyện'}
              {replyScope === 'user_only' && '👤 Chỉ tin cá nhân'}
              {replyScope === 'group_only' && '👥 Chỉ tin nhóm'}
              {replyScope === 'whitelist' && `🎯 Nhóm chỉ định (${whitelist.length} nhóm)`}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
