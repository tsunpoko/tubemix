import LevelMeter from './LevelMeter'
import './Mixer.css'

interface MixerProps {
  crossfaderValue: number
  eqValuesA: { low: number; mid: number; high: number }
  eqValuesB: { low: number; mid: number; high: number }
  volumeA: number
  volumeB: number
  onCrossfaderChange: (value: number) => void
  onEqChange: (deck: 'a' | 'b', band: 'low' | 'mid' | 'high', value: number) => void
  deckAAnalyser?: AnalyserNode | null
  deckBAnalyser?: AnalyserNode | null
}

function Mixer({
  crossfaderValue,
  eqValuesA,
  eqValuesB,
  volumeA,
  volumeB,
  onCrossfaderChange,
  onEqChange,
  deckAAnalyser,
  deckBAnalyser
}: MixerProps) {
  return (
    <div className="mixer glass-card">
      <div className="mixer-header">
        <span className="mixer-title">MIXER</span>
      </div>

      <div className="mixer-channels">
        {/* Deck A Channel */}
        <div className="channel">
          <div className="channel-label">A</div>

          <div className="eq-strip">
            <div className="eq-knob-row">
              <span className="eq-label">HI</span>
              <div
                className="eq-knob"
                style={{ transform: `rotate(${(eqValuesA.high - 0.5) * 270}deg)` }}
                onWheel={(e) => {
                  const delta = e.deltaY > 0 ? -0.05 : 0.05
                  onEqChange('a', 'high', Math.max(0, Math.min(1, eqValuesA.high + delta)))
                }}
              />
            </div>
            <div className="eq-knob-row">
              <span className="eq-label">MID</span>
              <div
                className="eq-knob"
                style={{ transform: `rotate(${(eqValuesA.mid - 0.5) * 270}deg)` }}
                onWheel={(e) => {
                  const delta = e.deltaY > 0 ? -0.05 : 0.05
                  onEqChange('a', 'mid', Math.max(0, Math.min(1, eqValuesA.mid + delta)))
                }}
              />
            </div>
            <div className="eq-knob-row">
              <span className="eq-label">LOW</span>
              <div
                className="eq-knob"
                style={{ transform: `rotate(${(eqValuesA.low - 0.5) * 270}deg)` }}
                onWheel={(e) => {
                  const delta = e.deltaY > 0 ? -0.05 : 0.05
                  onEqChange('a', 'low', Math.max(0, Math.min(1, eqValuesA.low + delta)))
                }}
              />
            </div>
          </div>

          <div className="fader-section">
            <LevelMeter analyser={deckAAnalyser ?? null} color="var(--accent-pink)" />
            <div className="vertical-fader">
              <div
                className="fader-track-vertical"
                style={{ '--fader-value': volumeA } as React.CSSProperties}
              >
                <div className="fader-groove" />
                <div className="fader-thumb-vertical" />
              </div>
            </div>
          </div>
        </div>

        {/* Deck B Channel */}
        <div className="channel">
          <div className="channel-label">B</div>

          <div className="eq-strip">
            <div className="eq-knob-row">
              <span className="eq-label">HI</span>
              <div
                className="eq-knob"
                style={{ transform: `rotate(${(eqValuesB.high - 0.5) * 270}deg)` }}
                onWheel={(e) => {
                  const delta = e.deltaY > 0 ? -0.05 : 0.05
                  onEqChange('b', 'high', Math.max(0, Math.min(1, eqValuesB.high + delta)))
                }}
              />
            </div>
            <div className="eq-knob-row">
              <span className="eq-label">MID</span>
              <div
                className="eq-knob"
                style={{ transform: `rotate(${(eqValuesB.mid - 0.5) * 270}deg)` }}
                onWheel={(e) => {
                  const delta = e.deltaY > 0 ? -0.05 : 0.05
                  onEqChange('b', 'mid', Math.max(0, Math.min(1, eqValuesB.mid + delta)))
                }}
              />
            </div>
            <div className="eq-knob-row">
              <span className="eq-label">LOW</span>
              <div
                className="eq-knob"
                style={{ transform: `rotate(${(eqValuesB.low - 0.5) * 270}deg)` }}
                onWheel={(e) => {
                  const delta = e.deltaY > 0 ? -0.05 : 0.05
                  onEqChange('b', 'low', Math.max(0, Math.min(1, eqValuesB.low + delta)))
                }}
              />
            </div>
          </div>

          <div className="fader-section">
            <LevelMeter analyser={deckBAnalyser ?? null} color="var(--accent-blue)" />
            <div className="vertical-fader">
              <div
                className="fader-track-vertical"
                style={{ '--fader-value': volumeB } as React.CSSProperties}
              >
                <div className="fader-groove" />
                <div className="fader-thumb-vertical" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Crossfader */}
      <div className="crossfader-container">
        <div className="crossfader-labels">
          <span>A</span>
          <span>CROSSFADER</span>
          <span>B</span>
        </div>
        <div className="crossfader-track-horizontal">
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
            className="crossfader-thumb-horizontal"
            style={{ left: `${crossfaderValue * 100}%` }}
          />
        </div>
      </div>
    </div>
  )
}

export default Mixer
