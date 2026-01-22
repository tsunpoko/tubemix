/**
 * DDJ-FLX4 MIDI Mapping
 * 
 * These are typical CC/Note values for Pioneer DDJ controllers.
 * May need adjustment based on actual DDJ-FLX4 MIDI implementation.
 */
export const DDJ_FLX4_MAPPING = {
  // Channel (Deck B is typically on channel 1 or 2)
  CHANNEL_B: 1,

  // MIDI Channels
  CHANNEL_A: 0,       // Deck A on channel 0
  // CHANNEL_B: 1,    // Deck B on channel 1 (defined above)

  // CC Controls (shared between decks, differentiated by channel)
  PITCH_FADER: 17,    // Pitch/tempo slider
  CROSSFADER: 31,     // Crossfader (shared)
  EQ_LOW: 15,         // EQ Low knob
  EQ_MID: 11,         // EQ Mid knob
  EQ_HIGH: 7,         // EQ High knob
  JOG: 33,            // Jog wheel rotation
  VOLUME: 19,         // Channel volume fader

  // Filter (on dedicated MIDI channel 6)
  FILTER: 23,         // Filter knob (CC 23, channel 6)
  FILTER_CHANNEL: 6,  // Filter uses channel 6

  // Note On/Off (shared between decks, differentiated by channel)
  PLAY: 0x0B,         // Play/Pause button
  CUE: 0x0C,          // Cue button
  SYNC: 0x58,         // Sync button
  HOT_CUE_1: 0x00,    // Hot Cue 1
  HOT_CUE_2: 0x01,    // Hot Cue 2
  HOT_CUE_3: 0x02,    // Hot Cue 3
  HOT_CUE_4: 0x03,    // Hot Cue 4
} as const

export type MidiMessageType = 'noteOn' | 'noteOff' | 'cc'

export interface ParsedMidiMessage {
  type: MidiMessageType
  channel: number
  note?: number
  control?: number
  value: number
}

export function parseMidiMessage(data: Uint8Array): ParsedMidiMessage | null {
  if (data.length < 3) return null

  const status = data[0]
  const channel = status & 0x0F
  const messageType = status & 0xF0

  switch (messageType) {
    case 0x90: // Note On
      return {
        type: data[2] > 0 ? 'noteOn' : 'noteOff',
        channel,
        note: data[1],
        value: data[2],
      }
    case 0x80: // Note Off
      return {
        type: 'noteOff',
        channel,
        note: data[1],
        value: data[2],
      }
    case 0xB0: // Control Change
      return {
        type: 'cc',
        channel,
        control: data[1],
        value: data[2],
      }
    default:
      return null
  }
}
