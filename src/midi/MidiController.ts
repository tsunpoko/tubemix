import { DDJ_FLX4_MAPPING, parseMidiMessage } from './ddj-flx4-mapping'

type MidiCallback = (value: number) => void

export class MidiController {
  private midiAccess: MIDIAccess | null = null
  private input: MIDIInput | null = null
  private callbacks: Map<string, MidiCallback[]> = new Map()
  private deviceChangeCallback: ((connected: boolean) => void) | null = null
  private debugMode = true // Enable debug logging

  private log(...args: unknown[]) {
    if (this.debugMode) {
      console.log('[MIDI]', ...args)
    }
  }

  async connect(): Promise<boolean> {
    try {
      if (!navigator.requestMIDIAccess) {
        console.warn('[MIDI] Web MIDI API not supported in this browser')
        return false
      }

      this.log('Requesting MIDI access...')

      // Request MIDI access with sysex option for better compatibility
      this.midiAccess = await navigator.requestMIDIAccess({ sysex: false })

      this.log('MIDI access granted')
      this.log('Available inputs:', Array.from(this.midiAccess.inputs.values()).map(i => ({
        id: i.id,
        name: i.name,
        manufacturer: i.manufacturer,
        state: i.state
      })))

      // Find DDJ-FLX4
      this.findDevice()

      // Listen for device changes
      this.midiAccess.onstatechange = (event) => {
        this.log('MIDI state change:', event)
        this.findDevice()
      }

      return this.input !== null
    } catch (error) {
      console.error('[MIDI] MIDI access error:', error)
      return false
    }
  }

  private findDevice() {
    if (!this.midiAccess) return

    const previouslyConnected = this.input !== null
    this.input = null

    for (const input of this.midiAccess.inputs.values()) {
      this.log('Checking device:', input.name, input.manufacturer)

      // Look for DDJ-FLX4 or any DJ controller
      if (
        input.name?.toLowerCase().includes('ddj') ||
        input.name?.toLowerCase().includes('flx4') ||
        input.manufacturer?.toLowerCase().includes('pioneer')
      ) {
        this.log('Found DDJ device:', input.name)
        this.input = input
        this.input.onmidimessage = this.handleMidiMessage.bind(this)
        break
      }
    }

    // Fallback: use first available input
    if (!this.input) {
      const inputs = Array.from(this.midiAccess.inputs.values())
      if (inputs.length > 0) {
        this.log('Using fallback device:', inputs[0].name)
        this.input = inputs[0]
        this.input.onmidimessage = this.handleMidiMessage.bind(this)
      }
    }

    const nowConnected = this.input !== null
    if (previouslyConnected !== nowConnected) {
      this.log('Connection status changed:', nowConnected)
      this.deviceChangeCallback?.(nowConnected)
    }
  }

  private handleMidiMessage(event: MIDIMessageEvent) {
    if (!event.data) return

    // Debug: log raw MIDI data
    this.log('MIDI message received:', Array.from(event.data))

    const message = parseMidiMessage(event.data)
    if (!message) return

    this.log('Parsed message:', message)

    // Determine callback key based on message
    let key: string | null = null
    let value = message.value

    // Deck A = MIDI channel 0, Deck B = MIDI channel 1
    const isDeckA = message.channel === 0
    const isDeckB = message.channel === 1

    const deck = isDeckA ? 'a' : isDeckB ? 'b' : null

    switch (message.type) {
      case 'cc':
        // Filter knob (channel 6, CC 23)
        if (message.channel === DDJ_FLX4_MAPPING.FILTER_CHANNEL && message.control === DDJ_FLX4_MAPPING.FILTER) {
          key = 'filter:a'
          value = message.value / 127
        }
        // Crossfader (shared)
        else if (message.control === DDJ_FLX4_MAPPING.CROSSFADER) {
          key = 'crossfader'
          value = message.value / 127
        }
        // Volume fader
        else if (message.control === DDJ_FLX4_MAPPING.VOLUME && deck) {
          key = `volume:${deck}`
          value = message.value / 127
        }
        // Ignore LSBs for 14-bit controls
        else if (message.control === 51 || message.control === 55) {
          // Silently ignore
        }
        // EQ
        else if (message.control === DDJ_FLX4_MAPPING.EQ_LOW && deck) {
          key = `eq:${deck}:low`
          value = message.value / 127
        } else if (message.control === DDJ_FLX4_MAPPING.EQ_MID && deck) {
          key = `eq:${deck}:mid`
          value = message.value / 127
        } else if (message.control === DDJ_FLX4_MAPPING.EQ_HIGH && deck) {
          key = `eq:${deck}:high`
          value = message.value / 127
        }
        // Pitch fader
        else if (message.control === DDJ_FLX4_MAPPING.PITCH_FADER && deck) {
          key = `pitchFader:${deck}`
          value = message.value / 127
        }
        // Jog wheel
        else if (message.control === DDJ_FLX4_MAPPING.JOG && deck) {
          key = `jogWheel:${deck}`
          value = message.value > 64 ? message.value - 128 : message.value
        }
        else {
          // Log unknown CC for debugging
          this.log(`Unknown CC ch${message.channel}: ${message.control} = ${message.value}`)
        }
        break

      case 'noteOn':
        if (message.note === DDJ_FLX4_MAPPING.PLAY && deck) {
          key = `play:${deck}`
          value = 1
        } else if (message.note === DDJ_FLX4_MAPPING.CUE && deck) {
          key = `cue:${deck}`
          value = 1
        }
        break
    }

    if (key) {
      const callbacks = this.callbacks.get(key)
      if (callbacks) {
        callbacks.forEach(cb => cb(value))
      }
    }
  }

  private on(key: string, callback: MidiCallback) {
    if (!this.callbacks.has(key)) {
      this.callbacks.set(key, [])
    }
    this.callbacks.get(key)!.push(callback)
  }

  onPitchFader(deck: 'a' | 'b', callback: MidiCallback) {
    this.on(`pitchFader:${deck}`, callback)
  }

  onCrossfader(callback: MidiCallback) {
    this.on('crossfader', callback)
  }

  onVolume(deck: 'a' | 'b', callback: MidiCallback) {
    this.on(`volume:${deck}`, callback)
  }

  onEQ(deck: 'a' | 'b', band: 'low' | 'mid' | 'high', callback: MidiCallback) {
    this.on(`eq:${deck}:${band}`, callback)
  }

  onJogWheel(deck: 'a' | 'b', callback: MidiCallback) {
    this.on(`jogWheel:${deck}`, callback)
  }

  onPlay(deck: 'a' | 'b', callback: () => void) {
    this.on(`play:${deck}`, callback)
  }

  onCue(deck: 'a' | 'b', callback: () => void) {
    this.on(`cue:${deck}`, callback)
  }

  onFilter(deck: 'a' | 'b', callback: MidiCallback) {
    this.on(`filter:${deck}`, callback)
  }

  onDeviceChange(callback: (connected: boolean) => void) {
    this.deviceChangeCallback = callback
  }

  dispose() {
    if (this.input) {
      this.input.onmidimessage = null
    }
    this.callbacks.clear()
  }
}
