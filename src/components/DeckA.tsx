import { useState, useCallback, useRef, useEffect } from 'react'
import Waveform from './Waveform'
import './DeckA.css'

interface HistoryEntry {
  videoId: string
  title: string
  url: string
  playedAt: number
}

const HISTORY_KEY = 'tubemix-youtube-history'

function loadHistory(): HistoryEntry[] {
  try {
    const data = localStorage.getItem(HISTORY_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

function saveHistory(entries: HistoryEntry[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, 20)))
}

interface DeckAProps {
  youtubeUrl: string
  onUrlChange: (url: string) => void
  waveformVisible: boolean
  volume: number
  eqValues: { low: number; mid: number; high: number }
  filter: number
}

declare global {
  interface Window {
    YT: typeof YT
    onYouTubeIframeAPIReady: () => void
  }
}

function DeckA({ youtubeUrl, onUrlChange, waveformVisible, volume, eqValues, filter }: DeckAProps) {
  const [videoId, setVideoId] = useState<string | null>(null)
  const [videoTitle, setVideoTitle] = useState<string>('')
  const [history, setHistory] = useState<HistoryEntry[]>(loadHistory)
  const playerRef = useRef<YT.Player | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Extract video ID from URL
  const extractVideoId = useCallback((url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=)([^&]+)/,
      /(?:youtu\.be\/)([^?]+)/,
      /(?:youtube\.com\/embed\/)([^?]+)/,
    ]

    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) return match[1]
    }
    return null
  }, [])

  // Load YouTube IFrame API
  useEffect(() => {
    if (window.YT) return

    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    const firstScriptTag = document.getElementsByTagName('script')[0]
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)
  }, [])

  // Initialize player when video ID changes
  useEffect(() => {
    if (!videoId || !containerRef.current) return

    const initPlayer = () => {
      if (playerRef.current) {
        playerRef.current.destroy()
      }

      playerRef.current = new window.YT.Player('youtube-player', {
        videoId,
        playerVars: {
          autoplay: 1,
          controls: 1,
          modestbranding: 1,
          rel: 0,
        },
        events: {
          onReady: (event) => {
            const title = (event.target as YT.Player).getVideoData?.()?.title
            if (title) {
              setVideoTitle(title)
              setHistory(prev => {
                const filtered = prev.filter(e => e.videoId !== videoId)
                const updated = [{ videoId: videoId!, title, url: youtubeUrl, playedAt: Date.now() }, ...filtered]
                saveHistory(updated)
                return updated
              })
            }
          },
          onStateChange: () => {
            // State change handler (playing state tracked by YouTube player)
          },
        },
      })
    }

    if (window.YT && window.YT.Player) {
      initPlayer()
    } else {
      window.onYouTubeIframeAPIReady = initPlayer
    }

    return () => {
      playerRef.current?.destroy()
    }
  }, [videoId])

  // Apply volume + EQ + filter to YouTube player
  // EQ/filter are approximated as volume control since iframe audio can't be processed via Web Audio
  useEffect(() => {
    if (playerRef.current && typeof playerRef.current.setVolume === 'function') {
      // EQ: each band at 0.5 = unity, 0 = kill, 1 = boost
      const eqGain = (eqValues.low * 0.4 + eqValues.mid * 0.35 + eqValues.high * 0.25) * 2
      // Filter: center (0.5) = no effect, extremes = volume drops
      const filterGain = 1 - Math.pow(Math.abs(filter - 0.5) * 2, 1.5) * 0.9
      const effectiveVolume = Math.min(1, volume * eqGain * filterGain)
      playerRef.current.setVolume(effectiveVolume * 100)
    }
  }, [volume, eqValues, filter])

  // Handle URL submit
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    const id = extractVideoId(youtubeUrl)
    if (id) {
      setVideoId(id)
    }
  }, [youtubeUrl, extractVideoId])

  return (
    <div className="deck-a glass-card">
      <div className="deck-label">DECK A (MASTER)</div>

      {!videoId ? (
        <div className="youtube-placeholder">
          <form onSubmit={handleSubmit} className="url-form">
            <input
              type="text"
              value={youtubeUrl}
              onChange={(e) => onUrlChange(e.target.value)}
              placeholder="YouTube URLを入力..."
              className="url-input"
            />
            <button type="submit" className="load-button">
              LOAD
            </button>
          </form>
          {history.length > 0 ? (
            <div className="history-list">
              <div className="history-label">HISTORY</div>
              {history.map((entry) => (
                <button
                  key={entry.videoId}
                  className="history-item"
                  onClick={() => {
                    onUrlChange(entry.url)
                    setVideoId(entry.videoId)
                  }}
                >
                  <span className="history-title">{entry.title}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="placeholder-text">
              YouTube DJ Mix URLを入力して<br />B2Bセッションを開始
            </div>
          )}
        </div>
      ) : (
        <div className="youtube-container" ref={containerRef}>
          <div id="youtube-player" className="youtube-player" />
          {videoTitle && (
            <div className="video-info">
              <span className="now-playing">NOW PLAYING</span>
              <span className="video-title">{videoTitle}</span>
            </div>
          )}
          <div className={`waveform-overlay ${!waveformVisible ? 'hidden' : ''}`}>
            <div className="waveform-label mono">SIMULATED WAVEFORM</div>
            <Waveform type="simulated" color="var(--accent-pink)" />
          </div>
        </div>
      )}
    </div>
  )
}

export default DeckA
