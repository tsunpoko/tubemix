import { DDJ_FLX4_MAPPING, parseMidiMessage } from './ddj-flx4-mapping'

type MidiCallback = (value: number) => void

export class MidiController {
  private midiAccess: MIDIAccess | null = null
  private input: MIDIInput | null = null
  private callbacks: Map<string, MidiCallback[]> = new Map()
  private deviceChangeCallback: ((connected: boolean) => void) | null = null

  async connect(): Promise<boolean> {
    try {
      if (!navigator.requestMIDIAccess) {
        console.warn('Web MIDI API not supported')
        return false
      }

      this.midiAccess = await navigator.requestMIDIAccess()

      // Find DDJ-FLX4
      this.findDevice()

      // Listen for device changes
      this.midiAccess.onstatechange = () => {
        this.findDevice()
      }

      return this.input !== null
    } catch (error) {
      console.error('MIDI access error:', error)
      return false
    }
  }

  private findDevice() {
    if (!this.midiAccess) return

    const previouslyConnected = this.input !== null
    this.input = null

    for (const input of this.midiAccess.inputs.values()) {
      // Look for DDJ-FLX4 or any DJ controller
      if (
        input.name?.toLowerCase().includes('ddj') ||
        input.name?.toLowerCase().includes('flx4') ||
        input.manufacturer?.toLowerCase().includes('pioneer')
      ) {
        this.input = input
        this.input.onmidimessage = this.handleMidiMessage.bind(this)
        break
      }
    }

    // Fallback: use first available input
    if (!this.input) {
      const inputs = Array.from(this.midiAccess.inputs.values())
      if (inputs.length > 0) {
        this.input = inputs[0]
        this.input.onmidimessage = this.handleMidiMessage.bind(this)
      }
    }

    const nowConnected = this.input !== null
    if (previouslyConnected !== nowConnected) {
      this.deviceChangeCallback?.(nowConnected)
    }
  }

  private handleMidiMessage(event: MIDIMessageEvent) {
    if (!event.data) return
    const message = parseMidiMessage(event.data)
    if (!message) return

    // Determine callback key based on message
    let key: string | null = null
    let value = message.value

    switch (message.type) {
      case 'cc':
        // Map CC number to control
        if (message.control === DDJ_FLX4_MAPPING.PITCH_FADER_B) {
          key = 'pitchFader'
          value = message.value / 127
        } else if (message.control === DDJ_FLX4_MAPPING.CROSSFADER) {
          key = 'crossfader'
          value = message.value / 127
        } else if (message.control === DDJ_FLX4_MAPPING.EQ_LOW_B) {
          key = 'eq:low'
          value = message.value / 127
        } else if (message.control === DDJ_FLX4_MAPPING.EQ_MID_B) {
          key = 'eq:mid'
          value = message.value / 127
        } else if (message.control === DDJ_FLX4_MAPPING.EQ_HIGH_B) {
          key = 'eq:high'
          value = message.value / 127
        } else if (message.control === DDJ_FLX4_MAPPING.JOG_B) {
          key = 'jogWheel'
          // Jog wheel sends relative values
          value = message.value > 64 ? message.value - 128 : message.value
        }
        break

      case 'noteOn':
        if (message.note === DDJ_FLX4_MAPPING.PLAY_B) {
          key = 'play'
          value = 1
        } else if (message.note === DDJ_FLX4_MAPPING.CUE_B) {
          key = 'cue'
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

  onPitchFader(callback: MidiCallback) {
    this.on('pitchFader', callback)
  }

  onCrossfader(callback: MidiCallback) {
    this.on('crossfader', callback)
  }

  onEQ(band: 'low' | 'mid' | 'high', callback: MidiCallback) {
    this.on(`eq:${band}`, callback)
  }

  onJogWheel(callback: MidiCallback) {
    this.on('jogWheel', callback)
  }

  onPlay(callback: () => void) {
    this.on('play', callback)
  }

  onCue(callback: () => void) {
    this.on('cue', callback)
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
