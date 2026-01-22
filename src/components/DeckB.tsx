import { useCallback, useState, DragEvent } from 'react'
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
  audioEngine: AudioEngine | null
}

function DeckB({
  bpm,
  pitch,
  playing,
  waveformVisible,
  onFileLoad,
  onPlayPause,
  audioEngine
}: DeckBProps) {
  const [fileName, setFileName] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

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
        {fileName && (
          <span className="file-name">{fileName}</span>
        )}
      </div>

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
    </div>
  )
}

export default DeckB
