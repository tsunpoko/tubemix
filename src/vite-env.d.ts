/// <reference types="vite/client" />

// YouTube IFrame API types
declare namespace YT {
  interface Player {
    playVideo(): void
    pauseVideo(): void
    stopVideo(): void
    seekTo(seconds: number, allowSeekAhead: boolean): void
    setVolume(volume: number): void
    getVolume(): number
    mute(): void
    unMute(): void
    isMuted(): boolean
    setPlaybackRate(suggestedRate: number): void
    getPlaybackRate(): number
    getAvailablePlaybackRates(): number[]
    getVideoLoadedFraction(): number
    getPlayerState(): number
    getCurrentTime(): number
    getDuration(): number
    getVideoUrl(): string
    getVideoEmbedCode(): string
    getPlaylist(): string[]
    getPlaylistIndex(): number
    destroy(): void
    getVideoData?(): { title?: string; author?: string; video_id?: string }
  }

  interface PlayerOptions {
    width?: string | number
    height?: string | number
    videoId?: string
    playerVars?: {
      autoplay?: 0 | 1
      controls?: 0 | 1
      disablekb?: 0 | 1
      modestbranding?: 0 | 1
      rel?: 0 | 1
      showinfo?: 0 | 1
      iv_load_policy?: 1 | 3
      origin?: string
    }
    events?: {
      onReady?: (event: PlayerEvent) => void
      onStateChange?: (event: OnStateChangeEvent) => void
      onPlaybackQualityChange?: (event: OnPlaybackQualityChangeEvent) => void
      onPlaybackRateChange?: (event: OnPlaybackRateChangeEvent) => void
      onError?: (event: OnErrorEvent) => void
      onApiChange?: (event: PlayerEvent) => void
    }
  }

  interface PlayerEvent {
    target: Player
  }

  interface OnStateChangeEvent {
    target: Player
    data: number
  }

  interface OnPlaybackQualityChangeEvent {
    target: Player
    data: string
  }

  interface OnPlaybackRateChangeEvent {
    target: Player
    data: number
  }

  interface OnErrorEvent {
    target: Player
    data: number
  }

  enum PlayerState {
    UNSTARTED = -1,
    ENDED = 0,
    PLAYING = 1,
    PAUSED = 2,
    BUFFERING = 3,
    CUED = 5,
  }

  class Player {
    constructor(elementId: string | HTMLElement, options: PlayerOptions)
  }
}

// Web MIDI API types (extend lib.dom.d.ts)
interface MIDIMessageEvent extends Event {
  data: Uint8Array
}
