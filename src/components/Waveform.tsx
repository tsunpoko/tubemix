import { useEffect, useRef, useState } from 'react'
import './Waveform.css'

interface WaveformProps {
  type: 'simulated' | 'audio'
  color: string
  analyser?: AnalyserNode | null
}

function Waveform({ type, color, analyser }: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)
  const [bars] = useState(() =>
    Array.from({ length: type === 'simulated' ? 200 : 100 }, () => Math.random())
  )

  // Simulated waveform animation
  useEffect(() => {
    if (type !== 'simulated') return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const animate = () => {
      const { width, height } = canvas
      ctx.clearRect(0, 0, width, height)

      const barWidth = width / bars.length
      bars.forEach((bar, i) => {
        // Animate bars with sine wave
        const animatedHeight = bar * 0.5 + Math.sin(Date.now() / 500 + i * 0.1) * 0.3 + 0.2
        const barHeight = animatedHeight * height

        ctx.fillStyle = color
        ctx.fillRect(
          i * barWidth,
          (height - barHeight) / 2,
          barWidth - 1,
          barHeight
        )
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      cancelAnimationFrame(animationRef.current)
    }
  }, [type, color, bars])

  // Real audio waveform
  useEffect(() => {
    if (type !== 'audio') return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const draw = () => {
      const { width, height } = canvas
      ctx.clearRect(0, 0, width, height)

      if (analyser) {
        // Real audio visualization
        const bufferLength = analyser.frequencyBinCount
        const dataArray = new Uint8Array(bufferLength)
        analyser.getByteFrequencyData(dataArray)

        const barWidth = (width / bufferLength) * 2.5
        let x = 0

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * height

          // Gradient color based on intensity
          const intensity = dataArray[i] / 255
          ctx.fillStyle = intensity > 0.1 ? color : 'rgba(0, 210, 255, 0.2)'
          ctx.fillRect(x, height - barHeight, barWidth, barHeight)

          x += barWidth + 1
        }
      } else {
        // Waiting state - show subtle animation
        const barCount = 50
        const barWidth = width / barCount
        for (let i = 0; i < barCount; i++) {
          const barHeight = (Math.sin(Date.now() / 1000 + i * 0.2) * 0.1 + 0.15) * height
          ctx.fillStyle = 'rgba(0, 210, 255, 0.2)'
          ctx.fillRect(i * barWidth, (height - barHeight) / 2, barWidth - 1, barHeight)
        }
      }

      animationRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(animationRef.current)
    }
  }, [type, color, analyser])

  // Resize canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        canvas.width = width * window.devicePixelRatio
        canvas.height = height * window.devicePixelRatio
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
        }
      }
    })

    resizeObserver.observe(canvas)

    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="waveform-canvas"
    />
  )
}

export default Waveform
