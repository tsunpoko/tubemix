import { analyzeBpm } from './BpmAnalyzer'

export class AudioEngine {
  private audioContext: AudioContext | null = null
  private sourceNode: AudioBufferSourceNode | null = null
  private audioBuffer: AudioBuffer | null = null

  // Nodes
  private masterGain: GainNode | null = null
  private deckAGain: GainNode | null = null
  private deckBGain: GainNode | null = null
  private analyser: AnalyserNode | null = null

  // EQ
  private lowFilter: BiquadFilterNode | null = null
  private midFilter: BiquadFilterNode | null = null
  private highFilter: BiquadFilterNode | null = null

  // State
  private isPlaying = false
  private playbackRate = 1.0
  private startTime = 0
  private pauseTime = 0

  constructor() {
    this.initContext()
  }

  private initContext() {
    this.audioContext = new AudioContext()

    // Create gain nodes
    this.masterGain = this.audioContext.createGain()
    this.deckAGain = this.audioContext.createGain()
    this.deckBGain = this.audioContext.createGain()
    this.deckAGain.gain.value = 0.5
    this.deckBGain.gain.value = 0.5

    // Create analyser
    this.analyser = this.audioContext.createAnalyser()
    this.analyser.fftSize = 256

    // Create EQ filters
    this.lowFilter = this.audioContext.createBiquadFilter()
    this.lowFilter.type = 'lowshelf'
    this.lowFilter.frequency.value = 320
    this.lowFilter.gain.value = 0

    this.midFilter = this.audioContext.createBiquadFilter()
    this.midFilter.type = 'peaking'
    this.midFilter.frequency.value = 1000
    this.midFilter.Q.value = 0.5
    this.midFilter.gain.value = 0

    this.highFilter = this.audioContext.createBiquadFilter()
    this.highFilter.type = 'highshelf'
    this.highFilter.frequency.value = 3200
    this.highFilter.gain.value = 0

    // Connect: EQ -> Analyser -> DeckB Gain -> Master -> Destination
    this.lowFilter.connect(this.midFilter)
    this.midFilter.connect(this.highFilter)
    this.highFilter.connect(this.analyser)
    this.analyser.connect(this.deckBGain)

    this.deckAGain.connect(this.masterGain)
    this.deckBGain.connect(this.masterGain)
    this.masterGain.connect(this.audioContext.destination)
  }

  async loadFile(file: File): Promise<number | null> {
    if (!this.audioContext) return null

    // Resume context if suspended
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume()
    }

    // Decode audio
    const arrayBuffer = await file.arrayBuffer()
    this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer)

    // Analyze BPM
    const bpm = await analyzeBpm(this.audioBuffer)

    return bpm
  }

  play() {
    if (!this.audioContext || !this.audioBuffer || !this.lowFilter) return

    // Create new source node
    this.sourceNode = this.audioContext.createBufferSource()
    this.sourceNode.buffer = this.audioBuffer
    this.sourceNode.playbackRate.value = this.playbackRate
    this.sourceNode.connect(this.lowFilter)

    // Start from pause position
    const offset = this.pauseTime
    this.sourceNode.start(0, offset)
    this.startTime = this.audioContext.currentTime - offset
    this.isPlaying = true

    this.sourceNode.onended = () => {
      if (this.isPlaying) {
        this.pauseTime = 0
        this.isPlaying = false
      }
    }
  }

  pause() {
    if (!this.audioContext || !this.sourceNode || !this.isPlaying) return

    this.pauseTime = this.audioContext.currentTime - this.startTime
    this.sourceNode.stop()
    this.sourceNode.disconnect()
    this.sourceNode = null
    this.isPlaying = false
  }

  setPlaybackRate(rate: number) {
    this.playbackRate = Math.max(0.5, Math.min(2.0, rate))
    if (this.sourceNode) {
      this.sourceNode.playbackRate.value = this.playbackRate
    }
  }

  setCrossfader(value: number) {
    // value: 0 = full A, 0.5 = center, 1 = full B
    if (this.deckAGain && this.deckBGain) {
      // Cross-fade curve
      this.deckAGain.gain.value = Math.cos(value * Math.PI / 2)
      this.deckBGain.gain.value = Math.sin(value * Math.PI / 2)
    }
  }

  setEQ(band: 'low' | 'mid' | 'high', value: number) {
    // value: 0-1, convert to -12 to +12 dB
    const gain = (value - 0.5) * 24

    switch (band) {
      case 'low':
        if (this.lowFilter) this.lowFilter.gain.value = gain
        break
      case 'mid':
        if (this.midFilter) this.midFilter.gain.value = gain
        break
      case 'high':
        if (this.highFilter) this.highFilter.gain.value = gain
        break
    }
  }

  // Audio input from external device (e.g., DDJ-FLX4)
  private mediaStreamSource: MediaStreamAudioSourceNode | null = null
  private mediaStream: MediaStream | null = null

  async startAudioInput(deviceId: string): Promise<void> {
    if (!this.audioContext || !this.lowFilter) return

    // Resume context if suspended
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume()
    }

    // Stop existing input
    this.stopAudioInput()

    try {
      // Get audio stream from device
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: { exact: deviceId },
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        }
      })

      // Create source from stream
      this.mediaStreamSource = this.audioContext.createMediaStreamSource(this.mediaStream)

      // Connect to EQ chain
      this.mediaStreamSource.connect(this.lowFilter)
    } catch (error) {
      console.error('Failed to start audio input:', error)
    }
  }

  stopAudioInput(): void {
    if (this.mediaStreamSource) {
      this.mediaStreamSource.disconnect()
      this.mediaStreamSource = null
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop())
      this.mediaStream = null
    }
  }

  getAnalyser(): AnalyserNode | null {
    return this.analyser
  }

  dispose() {
    if (this.sourceNode) {
      this.sourceNode.stop()
      this.sourceNode.disconnect()
    }
    if (this.audioContext) {
      this.audioContext.close()
    }
  }
}
