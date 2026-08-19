import React, { useState, useRef, useEffect } from 'react'
import { Mic, Square, Play, Pause, Trash2, Send, X } from 'lucide-react'

interface VoiceRecorderProps {
  onSend: (audioBlob: Blob) => Promise<void>
  onCancel: () => void
}

export default function VoiceRecorder({ onSend, onCancel }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [recordingTime, setRecordingTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isSending, setIsSending] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Start recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      })
      
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        setAudioBlob(blob)
        setAudioUrl(URL.createObjectURL(blob))
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      setIsPaused(false)

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)

    } catch (error) {
      console.error('Error accessing microphone:', error)
      alert('Không thể truy cập microphone. Vui lòng cho phép quyền truy cập.')
    }
  }

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setIsPaused(false)
      
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }

  // Pause recording
  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume()
        setIsPaused(false)
        
        // Resume timer
        timerRef.current = setInterval(() => {
          setRecordingTime(prev => prev + 1)
        }, 1000)
      } else {
        mediaRecorderRef.current.pause()
        setIsPaused(true)
        
        // Pause timer
        if (timerRef.current) {
          clearInterval(timerRef.current)
          timerRef.current = null
        }
      }
    }
  }

  // Delete recording
  const deleteRecording = () => {
    setAudioBlob(null)
    setAudioUrl(null)
    setRecordingTime(0)
    audioChunksRef.current = []
    
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    setIsPlaying(false)
  }

  // Play/Pause audio
  const togglePlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
        setIsPlaying(false)
      } else {
        audioRef.current.play()
        setIsPlaying(true)
      }
    }
  }

  // Send audio
  const handleSend = async () => {
    if (!audioBlob) return
    
    setIsSending(true)
    try {
      await onSend(audioBlob)
    } catch (error) {
      console.error('Error sending voice:', error)
      alert('Không thể gửi tin nhắn thoại')
    } finally {
      setIsSending(false)
    }
  }

  // Format time (seconds to MM:SS)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
      }
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop()
      }
    }
  }, [])

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[10000] p-4 animate-fadeIn" onClick={onCancel}>
      <div className="bg-gradient-to-br from-dark-100 to-dark-200 border border-white/20 rounded-2xl shadow-2xl w-full max-w-md animate-scaleIn" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Mic className="w-5 h-5 text-red-400" />
            Ghi âm tin nhắn thoại
          </h3>
          <button
            onClick={onCancel}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Timer */}
          <div className="text-center mb-6">
            <div className="text-4xl font-bold text-white mb-2 font-mono">
              {formatTime(recordingTime)}
            </div>
            <div className="text-sm text-gray-400">
              {isRecording && !isPaused && (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                  Đang ghi âm...
                </span>
              )}
              {isRecording && isPaused && (
                <span>Đã tạm dừng</span>
              )}
              {!isRecording && audioBlob && (
                <span className="text-success">✓ Đã ghi âm xong</span>
              )}
              {!isRecording && !audioBlob && (
                <span>Nhấn nút microphone để bắt đầu</span>
              )}
            </div>
          </div>

          {/* Waveform Visualization (Simple) */}
          {isRecording && !isPaused && (
            <div className="flex items-center justify-center gap-1 mb-6 h-16">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-primary rounded-full animate-pulse"
                  style={{
                    height: `${Math.random() * 60 + 20}%`,
                    animationDelay: `${i * 0.05}s`,
                    animationDuration: `${0.5 + Math.random() * 0.5}s`
                  }}
                />
              ))}
            </div>
          )}

          {/* Playback Controls (when audio exists) */}
          {audioBlob && audioUrl && (
            <div className="mb-6">
              <audio
                ref={audioRef}
                src={audioUrl}
                onEnded={() => setIsPlaying(false)}
                className="hidden"
              />
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={togglePlayback}
                  className="w-12 h-12 rounded-full bg-primary hover:bg-primary/80 flex items-center justify-center transition-all"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
                </button>
                <span className="text-sm text-gray-400">
                  {isPlaying ? 'Đang phát...' : 'Nghe thử'}
                </span>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center justify-center gap-3">
            {!isRecording && !audioBlob && (
              <button
                onClick={startRecording}
                className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 flex items-center justify-center transition-all shadow-lg hover:shadow-xl"
              >
                <Mic className="w-7 h-7 text-white" />
              </button>
            )}

            {isRecording && (
              <>
                <button
                  onClick={pauseRecording}
                  className="w-14 h-14 rounded-full bg-amber-500 hover:bg-amber-600 flex items-center justify-center transition-all"
                  title={isPaused ? 'Tiếp tục' : 'Tạm dừng'}
                >
                  {isPaused ? <Play className="w-5 h-5 ml-1" /> : <Pause className="w-5 h-5" />}
                </button>
                <button
                  onClick={stopRecording}
                  className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-all shadow-lg"
                  title="Dừng ghi âm"
                >
                  <Square className="w-6 h-6 fill-current" />
                </button>
              </>
            )}

            {audioBlob && (
              <>
                <button
                  onClick={deleteRecording}
                  className="w-14 h-14 rounded-full bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 flex items-center justify-center transition-all"
                  title="Xóa và ghi lại"
                >
                  <Trash2 className="w-5 h-5 text-red-400" />
                </button>
                <button
                  onClick={startRecording}
                  className="w-14 h-14 rounded-full bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 flex items-center justify-center transition-all"
                  title="Ghi lại"
                >
                  <Mic className="w-5 h-5 text-amber-400" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-dark-200/50 border-t border-white/10 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl bg-dark-300 hover:bg-dark-200 text-white text-sm font-medium transition-all"
          >
            Hủy
          </button>
          {audioBlob && (
            <button
              onClick={handleSend}
              disabled={isSending}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-secondary hover:brightness-110 text-white text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSending ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Gửi</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
