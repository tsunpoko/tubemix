import './Mixer.css'

interface MixerProps {
  crossfaderValue: number
  eqValues: { low: number; mid: number; high: number }
  onCrossfaderChange: (value: number) => void
  onEqChange: (band: 'low' | 'mid' | 'high', value: number) => void
}

function Mixer({
  crossfaderValue,
  eqValues,
  onCrossfaderChange,
  onEqChange
}: MixerProps) {
  return (
    <div className="mixer glass-card">
      <div className="mixer-label">MIXER</div>

      <div className="eq-section">
        <div className="knob-container">
          <div
            className="knob"
            style={{ transform: `rotate(${(eqValues.high - 0.5) * 270}deg)` }}
            onWheel={(e) => {
              const delta = e.deltaY > 0 ? -0.05 : 0.05
              onEqChange('high', Math.max(0, Math.min(1, eqValues.high + delta)))
            }}
          />
          <span className="knob-label">HI</span>
        </div>

        <div className="knob-container">
          <div
            className="knob"
            style={{ transform: `rotate(${(eqValues.mid - 0.5) * 270}deg)` }}
            onWheel={(e) => {
              const delta = e.deltaY > 0 ? -0.05 : 0.05
              onEqChange('mid', Math.max(0, Math.min(1, eqValues.mid + delta)))
            }}
          />
          <span className="knob-label">MID</span>
        </div>

        <div className="knob-container">
          <div
            className="knob"
            style={{ transform: `rotate(${(eqValues.low - 0.5) * 270}deg)` }}
            onWheel={(e) => {
              const delta = e.deltaY > 0 ? -0.05 : 0.05
              onEqChange('low', Math.max(0, Math.min(1, eqValues.low + delta)))
            }}
          />
          <span className="knob-label">LOW</span>
        </div>
      </div>

      <div className="crossfader-section">
        <span className="crossfader-label">A</span>
        <div className="crossfader-track">
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={crossfaderValue}
            onChange={(e) => onCrossfaderChange(parseFloat(e.target.value))}
            className="crossfader-input"
          />
          <div
            className="crossfader-thumb"
            style={{ left: `${crossfaderValue * 100}%` }}
          />
        </div>
        <span className="crossfader-label">B</span>
      </div>

      <div className="cue-section">
        <button className="cue-button">
          CUE
        </button>
      </div>
    </div>
  )
}

export default Mixer
