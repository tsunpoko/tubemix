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
  const [eqValuesA, setEqValuesA] = useState({ low: 0.5, mid: 0.5, high: 0.5 })
  const [eqValuesB, setEqValuesB] = useState({ low: 0.5, mid: 0.5, high: 0.5 })
  const [deckBPitch, setDeckBPitch] = useState(0)
  const [deckBBpm, setDeckBBpm] = useState<number | null>(null)
  const [deckBPlaying, setDeckBPlaying] = useState(false)
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [deckBAnalyser, setDeckBAnalyser] = useState<AnalyserNode | null>(null)
  const [volumeA, setVolumeA] = useState(1)
  const [volumeB, setVolumeB] = useState(1)
  const [filterA, setFilterA] = useState(0.5)

  // Initialize audio engine
  useEffect(() => {
    audioEngineRef.current = new AudioEngine()
    // Set analyser for level meter
    setDeckBAnalyser(audioEngineRef.current.getAnalyser())

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

    midi.onPitchFader('b', (value) => {
      // Convert 0-1 to -8% to +8%
      const pitch = (value - 0.5) * 16
      setDeckBPitch(pitch)
      audioEngineRef.current?.setPlaybackRate(1 + pitch / 100)
    })

    midi.onCrossfader((value) => {
      setCrossfaderValue(value)
      audioEngineRef.current?.setCrossfader(value)
    })

    midi.onEQ('a', 'low', (value) => {
      setEqValuesA(prev => ({ ...prev, low: value }))
    })
    midi.onEQ('a', 'mid', (value) => {
      setEqValuesA(prev => ({ ...prev, mid: value }))
    })
    midi.onEQ('a', 'high', (value) => {
      setEqValuesA(prev => ({ ...prev, high: value }))
    })

    midi.onEQ('b', 'low', (value) => {
      setEqValuesB(prev => ({ ...prev, low: value }))
      audioEngineRef.current?.setEQ('low', value)
    })
    midi.onEQ('b', 'mid', (value) => {
      setEqValuesB(prev => ({ ...prev, mid: value }))
      audioEngineRef.current?.setEQ('mid', value)
    })
    midi.onEQ('b', 'high', (value) => {
      setEqValuesB(prev => ({ ...prev, high: value }))
      audioEngineRef.current?.setEQ('high', value)
    })

    midi.onFilter('a', (value) => {
      setFilterA(value)
    })

    midi.onPlay('b', () => {
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

    midi.onVolume('a', (value) => {
      setVolumeA(value)
    })

    midi.onVolume('b', (value) => {
      setVolumeB(value)
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

  const handleAudioInputSelect = useCallback(async (deviceId: string) => {
    if (audioEngineRef.current) {
      await audioEngineRef.current.startAudioInput(deviceId)
    }
  }, [])

  const handleCrossfaderChange = useCallback((value: number) => {
    setCrossfaderValue(value)
    audioEngineRef.current?.setCrossfader(value)
  }, [])

  const handleEqChange = useCallback((deck: 'a' | 'b', band: 'low' | 'mid' | 'high', value: number) => {
    if (deck === 'a') {
      setEqValuesA(prev => ({ ...prev, [band]: value }))
    } else {
      setEqValuesB(prev => ({ ...prev, [band]: value }))
      audioEngineRef.current?.setEQ(band, value)
    }
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
          volume={volumeA}
          eqValues={eqValuesA}
          filter={filterA}
        />

        <div className="info-grid">
          <DeckB
            bpm={deckBBpm}
            pitch={deckBPitch}
            playing={deckBPlaying}
            waveformVisible={waveformVisible}
            onFileLoad={handleFileLoad}
            onPlayPause={handlePlayPause}
            onAudioInputSelect={handleAudioInputSelect}
            audioEngine={audioEngineRef.current}
          />

          <Mixer
            crossfaderValue={crossfaderValue}
            eqValuesA={eqValuesA}
            eqValuesB={eqValuesB}
            volumeA={volumeA}
            volumeB={volumeB}
            onCrossfaderChange={handleCrossfaderChange}
            onEqChange={handleEqChange}
            deckBAnalyser={deckBAnalyser}
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
