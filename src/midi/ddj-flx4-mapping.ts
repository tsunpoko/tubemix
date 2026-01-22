/**
 * DDJ-FLX4 MIDI Mapping
 * 
 * These are typical CC/Note values for Pioneer DDJ controllers.
 * May need adjustment based on actual DDJ-FLX4 MIDI implementation.
 */
export const DDJ_FLX4_MAPPING = {
  // Channel (Deck B is typically on channel 1 or 2)
  CHANNEL_B: 1,

  // CC Controls (Deck B)
  PITCH_FADER_B: 17,  // Pitch/tempo slider
  CROSSFADER: 31,     // Crossfader (shared)
  EQ_LOW_B: 7,        // EQ Low knob
  EQ_MID_B: 11,       // EQ Mid knob
  EQ_HIGH_B: 15,      // EQ High knob
  JOG_B: 33,          // Jog wheel rotation
  FILTER_B: 19,       // Filter knob
  VOLUME_B: 23,       // Channel volume

  // Note On/Off (Deck B)
  PLAY_B: 0x0B,       // Play/Pause button
  CUE_B: 0x0C,        // Cue button
  SYNC_B: 0x58,       // Sync button
  HOT_CUE_1_B: 0x00,  // Hot Cue 1
  HOT_CUE_2_B: 0x01,  // Hot Cue 2
  HOT_CUE_3_B: 0x02,  // Hot Cue 3
  HOT_CUE_4_B: 0x03,  // Hot Cue 4

  // CC Controls (Deck A)
  PITCH_FADER_A: 16,
  EQ_LOW_A: 6,
  EQ_MID_A: 10,
  EQ_HIGH_A: 14,
  JOG_A: 32,
  FILTER_A: 18,
  VOLUME_A: 22,

  // Note On/Off (Deck A)
  PLAY_A: 0x0B,
  CUE_A: 0x0C,
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
