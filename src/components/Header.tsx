import './Header.css'

interface HeaderProps {
  midiConnected: boolean
  waveformVisible: boolean
  onToggleWaveform: () => void
}

function Header({ midiConnected, waveformVisible, onToggleWaveform }: HeaderProps) {
  return (
    <header className="header">
      <div className="logo gradient-text">TubeMix B2B</div>

      <div className="header-controls">
        <button
          className="waveform-toggle"
          onClick={onToggleWaveform}
          style={{ opacity: waveformVisible ? 1 : 0.5 }}
        >
          WAVEFORMS: {waveformVisible ? 'ON' : 'OFF'}
        </button>

        <div className={`midi-status ${midiConnected ? 'connected' : ''}`}>
          <span className="status-dot" />
          {midiConnected ? 'DDJ-FLX4 CONNECTED' : 'NO MIDI DEVICE'}
        </div>
      </div>
    </header>
  )
}

export default Header
