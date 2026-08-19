'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Mic, StopCircle, Send, X, Trash2 } from 'lucide-react'

interface VoiceRecorderProps {
  onSend: (audioBlob: Blob) => void
  onCancel: () => void
}

export default function VoiceRecorder({ onSend, onCancel }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioURL, setAudioURL] = useState<string | null>(null)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      // Cleanup
      if (timerRef.current) clearInterval(timerRef.current)
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop()
      }
    }
  }, [])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })
      
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const url = URL.createObjectURL(blob)
        setAudioURL(url)
        setAudioBlob(blob)
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)

    } catch (error) {
      console.error('Error accessing microphone:', error)
      alert('❌ Không thể truy cập microphone. Vui lòng cho phép quyền truy cập.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }

  const handleSend = () => {
    if (audioBlob) {
      onSend(audioBlob)
    }
  }

  const handleDiscard = () => {
    if (audioURL) URL.revokeObjectURL(audioURL)
    setAudioURL(null)
    setAudioBlob(null)
    setRecordingTime(0)
    onCancel()
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-gradient-to-br from-dark-200 via-dark-100 to-dark-200 border border-white/10 rounded-3xl p-6 max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Mic className="w-5 h-5 text-red-400" />
            Ghi âm tin nhắn thoại
          </h3>
          <button
            onClick={handleDiscard}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Recording UI */}
        <div className="space-y-6">
          {/* Timer & Status */}
          <div className="text-center">
            <div className="text-5xl font-mono font-bold text-white mb-2">
              {formatTime(recordingTime)}
            </div>
            <div className="text-sm text-gray-400">
              {isRecording ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                  Đang ghi âm...
                </span>
              ) : audioURL ? (
                'Đã ghi âm xong'
              ) : (
                'Nhấn nút Mic để bắt đầu'
              )}
            </div>
          </div>

          {/* Audio Player (after recording) */}
          {audioURL && !isRecording && (
            <div className="bg-dark-300 rounded-xl p-4 border border-white/10">
              <audio 
                src={audioURL} 
                controls 
                className="w-full"
                style={{
                  height: '40px',
                  filter: 'invert(1) hue-rotate(180deg)'
                }}
              />
            </div>
          )}

          {/* Waveform Animation (while recording) */}
          {isRecording && (
            <div className="flex items-center justify-center gap-1 h-16">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-gradient-to-t from-red-500 to-pink-500 rounded-full animate-pulse"
                  style={{
                    height: `${Math.random() * 100 + 20}%`,
                    animationDelay: `${i * 0.05}s`,
                    animationDuration: `${0.5 + Math.random() * 0.5}s`
                  }}
                />
              ))}
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center justify-center gap-4">
            {!isRecording && !audioURL && (
              <button
                onClick={startRecording}
                className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 transition-all flex items-center justify-center shadow-xl shadow-red-500/50 hover:scale-110 active:scale-95"
              >
                <Mic className="w-8 h-8 text-white" />
              </button>
            )}

            {isRecording && (
              <button
                onClick={stopRecording}
                className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 transition-all flex items-center justify-center shadow-xl hover:scale-110 active:scale-95"
              >
                <StopCircle className="w-8 h-8 text-white" />
              </button>
            )}

            {audioURL && !isRecording && (
              <>
                <button
                  onClick={handleDiscard}
                  className="w-16 h-16 rounded-full bg-gradient-to-br from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 transition-all flex items-center justify-center shadow-lg hover:scale-110 active:scale-95"
                  title="Xóa và ghi lại"
                >
                  <Trash2 className="w-6 h-6 text-white" />
                </button>
                
                <button
                  onClick={handleSend}
                  className="w-20 h-20 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 transition-all flex items-center justify-center shadow-xl shadow-sky-500/50 hover:scale-110 active:scale-95"
                  title="Gửi tin nhắn thoại"
                >
                  <Send className="w-8 h-8 text-white" />
                </button>
              </>
            )}
          </div>

          {/* Instructions */}
          <div className="text-center text-xs text-gray-500">
            {!isRecording && !audioURL && (
              <p>Nhấn nút Mic để bắt đầu ghi âm</p>
            )}
            {isRecording && (
              <p>Nhấn nút Stop để dừng ghi âm</p>
            )}
            {audioURL && !isRecording && (
              <p>Nghe lại hoặc gửi tin nhắn thoại</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
