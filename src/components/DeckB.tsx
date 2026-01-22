import { useCallback, useState, useEffect, DragEvent } from 'react'
import Waveform from './Waveform'
import type { AudioEngine } from '../audio/AudioEngine'
import './DeckB.css'

interface DeckBProps {
  bpm: number | null
  pitch: number
  playing: boolean
  waveformVisible: boolean
  onFileLoad: (file: File) => void
  onPlayPause: () => void
  onAudioInputSelect: (deviceId: string) => void
  audioEngine: AudioEngine | null
}

interface AudioInputDevice {
  deviceId: string
  label: string
}

function DeckB({
  bpm,
  pitch,
  playing,
  waveformVisible,
  onFileLoad,
  onPlayPause,
  onAudioInputSelect,
  audioEngine
}: DeckBProps) {
  const [inputMode, setInputMode] = useState<'file' | 'input'>('input')
  const [audioInputs, setAudioInputs] = useState<AudioInputDevice[]>([])
  const [selectedInput, setSelectedInput] = useState<string>('')
  const [isListening, setIsListening] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  // Get available audio input devices
  useEffect(() => {
    const getDevices = async () => {
      try {
        // Request permission first
        await navigator.mediaDevices.getUserMedia({ audio: true })

        const devices = await navigator.mediaDevices.enumerateDevices()
        const inputs = devices
          .filter(d => d.kind === 'audioinput')
          .map(d => ({
            deviceId: d.deviceId,
            label: d.label || `オーディオ入力 ${d.deviceId.slice(0, 8)}...`
          }))

        setAudioInputs(inputs)

        // Auto-select DDJ-FLX4 if available
        const ddjDevice = inputs.find(
          d => d.label.toLowerCase().includes('ddj') ||
            d.label.toLowerCase().includes('flx4') ||
            d.label.toLowerCase().includes('pioneer')
        )
        if (ddjDevice) {
          setSelectedInput(ddjDevice.deviceId)
        } else if (inputs.length > 0) {
          setSelectedInput(inputs[0].deviceId)
        }
      } catch (error) {
        console.error('Failed to get audio devices:', error)
      }
    }

    getDevices()

    // Listen for device changes
    navigator.mediaDevices.addEventListener('devicechange', getDevices)
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', getDevices)
    }
  }, [])

  const handleInputSelect = useCallback((deviceId: string) => {
    setSelectedInput(deviceId)
    onAudioInputSelect(deviceId)
  }, [onAudioInputSelect])

  const handleStartListening = useCallback(() => {
    if (selectedInput) {
      onAudioInputSelect(selectedInput)
      setIsListening(true)
    }
  }, [selectedInput, onAudioInputSelect])

  const handleStopListening = useCallback(() => {
    setIsListening(false)
    // Stop audio input in engine
  }, [])

  // File upload handlers (fallback mode)
  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('audio/')) {
      setFileName(file.name)
      onFileLoad(file)
    }
  }, [onFileLoad])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFileName(file.name)
      onFileLoad(file)
    }
  }, [onFileLoad])

  return (
    <div className="deck-b glass-card">
      <div className="deck-b-header">
        <span className="deck-b-label">DECK B (LOCAL / TARGET)</span>
        <div className="mode-toggle">
          <button
            className={`mode-btn ${inputMode === 'input' ? 'active' : ''}`}
            onClick={() => setInputMode('input')}
          >
            オーディオ入力
          </button>
          <button
            className={`mode-btn ${inputMode === 'file' ? 'active' : ''}`}
            onClick={() => setInputMode('file')}
          >
            ファイル
          </button>
        </div>
      </div>

      {inputMode === 'input' ? (
        <div className="audio-input-section">
          <label className="input-label">オーディオ入力デバイス</label>
          <select
            value={selectedInput}
            onChange={(e) => handleInputSelect(e.target.value)}
            className="device-select"
          >
            {audioInputs.length === 0 ? (
              <option value="">デバイスが見つかりません</option>
            ) : (
              audioInputs.map(device => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label}
                </option>
              ))
            )}
          </select>

          <button
            className={`listen-button ${isListening ? 'listening' : ''}`}
            onClick={isListening ? handleStopListening : handleStartListening}
            disabled={!selectedInput}
          >
            {isListening ? '⏹ 停止' : '🎧 入力を開始'}
          </button>

          {isListening && (
            <div className="listening-indicator">
              <span className="pulse-dot" />
              <span>DDJ-FLX4 からの入力を受信中...</span>
            </div>
          )}

          <div className="bpm-pitch-display">
            <div className="bpm-display">
              <span className="big-number mono">{bpm?.toFixed(2) ?? '--'}</span>
              <span className="unit">BPM</span>
            </div>

            <div className="pitch-display">
              <span className="big-number mono" style={{ color: 'var(--accent-pink)' }}>
                {pitch >= 0 ? '+' : ''}{pitch.toFixed(2)}
              </span>
              <span className="unit">%</span>
            </div>
          </div>

          <div className="sync-status mono">
            SYNC: DISABLED (EAR ONLY)
          </div>

          <div className={`waveform-section ${!waveformVisible ? 'hidden' : ''}`}>
            <Waveform
              type="audio"
              color="var(--accent-blue)"
              analyser={audioEngine?.getAnalyser() ?? null}
            />
          </div>
        </div>
      ) : (
        // File upload mode (fallback)
        <>
          {!fileName ? (
            <div
              className={`drop-zone ${isDragging ? 'dragging' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="drop-icon">🎵</div>
              <div className="drop-text">
                音楽ファイルをドラッグ＆ドロップ
              </div>
              <label className="file-input-label">
                または選択
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleFileInput}
                  className="file-input"
                />
              </label>
            </div>
          ) : (
            <div className="deck-b-content">
              <div className="file-info">{fileName}</div>

              <div className="bpm-display">
                <span className="big-number mono">{bpm?.toFixed(2) ?? '--'}</span>
                <span className="unit">BPM</span>
              </div>

              <div className="pitch-display">
                <span className="big-number mono" style={{ color: 'var(--accent-pink)' }}>
                  {pitch >= 0 ? '+' : ''}{pitch.toFixed(2)}
                </span>
                <span className="unit">%</span>
              </div>

              <button
                className={`play-button ${playing ? 'playing' : ''}`}
                onClick={onPlayPause}
              >
                {playing ? '⏸' : '▶'}
              </button>

              <div className="sync-status mono">
                SYNC: DISABLED (EAR ONLY)
              </div>

              <div className={`waveform-section ${!waveformVisible ? 'hidden' : ''}`}>
                <Waveform
                  type="audio"
                  color="var(--accent-blue)"
                  analyser={audioEngine?.getAnalyser() ?? null}
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default DeckB
