import { useState, useCallback, useRef, useEffect } from 'react'
import Waveform from './Waveform'
import './DeckA.css'

interface DeckAProps {
  youtubeUrl: string
  onUrlChange: (url: string) => void
  waveformVisible: boolean
}

declare global {
  interface Window {
    YT: typeof YT
    onYouTubeIframeAPIReady: () => void
  }
}

function DeckA({ youtubeUrl, onUrlChange, waveformVisible }: DeckAProps) {
  const [videoId, setVideoId] = useState<string | null>(null)
  const [videoTitle, setVideoTitle] = useState<string>('')
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
            if (title) setVideoTitle(title)
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
          <div className="placeholder-text">
            YouTube DJ Mix URLを入力して<br />B2Bセッションを開始
          </div>
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
