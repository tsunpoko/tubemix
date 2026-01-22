import { useEffect, useRef, useState } from 'react'
import './LevelMeter.css'

interface LevelMeterProps {
  analyser: AnalyserNode | null
  label?: string
  color?: string
}

function LevelMeter({ analyser, label, color = 'var(--accent-blue)' }: LevelMeterProps) {
  const [level, setLevel] = useState(0)
  const [peak, setPeak] = useState(0)
  const animationRef = useRef<number>(0)
  const peakHoldRef = useRef<number>(0)
  const peakDecayRef = useRef<number>(Date.now())

  useEffect(() => {
    if (!analyser) {
      // No analyser - show idle state
      setLevel(0)
      setPeak(0)
      return
    }

    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    const updateLevel = () => {
      analyser.getByteFrequencyData(dataArray)

      // Calculate RMS (root mean square) for accurate level
      let sum = 0
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i] * dataArray[i]
      }
      const rms = Math.sqrt(sum / bufferLength)
      const normalizedLevel = rms / 255

      // Smooth the level for visual appeal
      setLevel(prev => prev * 0.7 + normalizedLevel * 0.3)

      // Peak hold logic
      if (normalizedLevel > peakHoldRef.current) {
        peakHoldRef.current = normalizedLevel
        peakDecayRef.current = Date.now()
        setPeak(normalizedLevel)
      } else if (Date.now() - peakDecayRef.current > 1000) {
        // Decay peak after 1 second
        peakHoldRef.current = Math.max(0, peakHoldRef.current - 0.02)
        setPeak(peakHoldRef.current)
      }

      animationRef.current = requestAnimationFrame(updateLevel)
    }

    updateLevel()

    return () => {
      cancelAnimationFrame(animationRef.current)
    }
  }, [analyser])

  // Generate meter segments
  const segments = 16
  const segmentArray = Array.from({ length: segments }, (_, i) => {
    const threshold = (segments - i) / segments
    const isActive = level >= threshold
    const isPeak = peak >= threshold && peak < threshold + (1 / segments)

    // Color coding: green -> yellow -> red
    let segmentColor = color
    if (threshold > 0.85) {
      segmentColor = '#ff3333' // Red (clipping)
    } else if (threshold > 0.7) {
      segmentColor = '#ffcc00' // Yellow (hot)
    }

    return { isActive, isPeak, color: segmentColor, threshold }
  })

  return (
    <div className="level-meter">
      {label && <div className="meter-label">{label}</div>}
      <div className="meter-bar">
        {segmentArray.map((seg, i) => (
          <div
            key={i}
            className={`meter-segment ${seg.isActive ? 'active' : ''} ${seg.isPeak ? 'peak' : ''}`}
            style={{
              backgroundColor: seg.isActive || seg.isPeak ? seg.color : 'rgba(255,255,255,0.1)',
              boxShadow: seg.isActive ? `0 0 5px ${seg.color}` : 'none'
            }}
          />
        ))}
      </div>
    </div>
  )
}

export default LevelMeter
