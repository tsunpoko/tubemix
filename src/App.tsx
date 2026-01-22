import { useState, useCallback, useRef, useEffect } from 'react'
import Header from './components/Header'
import DeckA from './components/DeckA'
import DeckB from './components/DeckB'
import Mixer from './components/Mixer'
import { AudioEngine } from './audio/AudioEngine'
import { MidiController } from './midi/MidiController'
import './App.css'

function App() {
  // Audio Engine
  const audioEngineRef = useRef<AudioEngine | null>(null)
  const midiControllerRef = useRef<MidiController | null>(null)

  // State
  const [midiConnected, setMidiConnected] = useState(false)
  const [waveformVisible, setWaveformVisible] = useState(true)
  const [crossfaderValue, setCrossfaderValue] = useState(0.5)
  const [eqValues, setEqValues] = useState({ low: 0, mid: 0, high: 0 })
  const [deckBPitch, setDeckBPitch] = useState(0)
  const [deckBBpm, setDeckBBpm] = useState<number | null>(null)
  const [deckBPlaying, setDeckBPlaying] = useState(false)
  const [youtubeUrl, setYoutubeUrl] = useState('')

  // Initialize audio engine
  useEffect(() => {
    audioEngineRef.current = new AudioEngine()

    return () => {
      audioEngineRef.current?.dispose()
    }
  }, [])

  // Initialize MIDI controller
  useEffect(() => {
    const midi = new MidiController()
    midiControllerRef.current = midi

    midi.connect().then((connected) => {
      setMidiConnected(connected)
    })

    midi.onPitchFader((value) => {
      // Convert 0-1 to -8% to +8%
      const pitch = (value - 0.5) * 16
      setDeckBPitch(pitch)
      audioEngineRef.current?.setPlaybackRate(1 + pitch / 100)
    })

    midi.onCrossfader((value) => {
      setCrossfaderValue(value)
      audioEngineRef.current?.setCrossfader(value)
    })

    midi.onEQ('low', (value) => {
      setEqValues(prev => ({ ...prev, low: value }))
      audioEngineRef.current?.setEQ('low', value)
    })

    midi.onEQ('mid', (value) => {
      setEqValues(prev => ({ ...prev, mid: value }))
      audioEngineRef.current?.setEQ('mid', value)
    })

    midi.onEQ('high', (value) => {
      setEqValues(prev => ({ ...prev, high: value }))
      audioEngineRef.current?.setEQ('high', value)
    })

    midi.onPlay(() => {
      if (deckBPlaying) {
        audioEngineRef.current?.pause()
        setDeckBPlaying(false)
      } else {
        audioEngineRef.current?.play()
        setDeckBPlaying(true)
      }
    })

    midi.onDeviceChange((connected) => {
      setMidiConnected(connected)
    })

    return () => {
      midi.dispose()
    }
  }, [deckBPlaying])

  // Handlers
  const handleToggleWaveform = useCallback(() => {
    setWaveformVisible(prev => !prev)
  }, [])

  const handleFileLoad = useCallback(async (file: File) => {
    if (audioEngineRef.current) {
      const bpm = await audioEngineRef.current.loadFile(file)
      setDeckBBpm(bpm)
    }
  }, [])

  const handlePlayPause = useCallback(() => {
    if (audioEngineRef.current) {
      if (deckBPlaying) {
        audioEngineRef.current.pause()
        setDeckBPlaying(false)
      } else {
        audioEngineRef.current.play()
        setDeckBPlaying(true)
      }
    }
  }, [deckBPlaying])

  const handleCrossfaderChange = useCallback((value: number) => {
    setCrossfaderValue(value)
    audioEngineRef.current?.setCrossfader(value)
  }, [])

  const handleEqChange = useCallback((band: 'low' | 'mid' | 'high', value: number) => {
    setEqValues(prev => ({ ...prev, [band]: value }))
    audioEngineRef.current?.setEQ(band, value)
  }, [])

  return (
    <div className="app">
      <Header
        midiConnected={midiConnected}
        waveformVisible={waveformVisible}
        onToggleWaveform={handleToggleWaveform}
      />

      <main className="main">
        <DeckA
          youtubeUrl={youtubeUrl}
          onUrlChange={setYoutubeUrl}
          waveformVisible={waveformVisible}
        />

        <div className="info-grid">
          <DeckB
            bpm={deckBBpm}
            pitch={deckBPitch}
            playing={deckBPlaying}
            waveformVisible={waveformVisible}
            onFileLoad={handleFileLoad}
            onPlayPause={handlePlayPause}
            audioEngine={audioEngineRef.current}
          />

          <Mixer
            crossfaderValue={crossfaderValue}
            eqValues={eqValues}
            onCrossfaderChange={handleCrossfaderChange}
            onEqChange={handleEqChange}
          />
        </div>
      </main>

      <footer className="footer">
        TubeMix B2B | Powered by Web MIDI & Web Audio
      </footer>
    </div>
  )
}

export default App
