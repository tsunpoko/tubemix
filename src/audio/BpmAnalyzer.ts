/**
 * Simple BPM analyzer using peak detection
 */
export async function analyzeBpm(audioBuffer: AudioBuffer): Promise<number | null> {
  const channelData = audioBuffer.getChannelData(0)
  const sampleRate = audioBuffer.sampleRate

  // Low-pass filter to focus on bass (kick drum)
  const filteredData = lowPassFilter(channelData, sampleRate, 150)

  // Detect peaks
  const peaks = detectPeaks(filteredData, sampleRate)

  if (peaks.length < 2) return null

  // Calculate intervals between peaks
  const intervals: number[] = []
  for (let i = 1; i < peaks.length; i++) {
    intervals.push(peaks[i] - peaks[i - 1])
  }

  // Find most common interval (mode)
  const intervalCounts = new Map<number, number>()
  for (const interval of intervals) {
    // Round to nearest 10ms for grouping
    const rounded = Math.round(interval / sampleRate * 100) * 10
    intervalCounts.set(rounded, (intervalCounts.get(rounded) || 0) + 1)
  }

  let maxCount = 0
  let mostCommonInterval = 0
  for (const [interval, count] of intervalCounts) {
    if (count > maxCount) {
      maxCount = count
      mostCommonInterval = interval
    }
  }

  if (mostCommonInterval === 0) return null

  // Convert interval (ms) to BPM
  const bpm = 60000 / mostCommonInterval

  // Normalize to common DJ range (60-180 BPM)
  let normalizedBpm = bpm
  while (normalizedBpm < 60) normalizedBpm *= 2
  while (normalizedBpm > 180) normalizedBpm /= 2

  return normalizedBpm
}

function lowPassFilter(data: Float32Array, sampleRate: number, cutoff: number): Float32Array {
  const filtered = new Float32Array(data.length)
  const rc = 1 / (2 * Math.PI * cutoff)
  const dt = 1 / sampleRate
  const alpha = dt / (rc + dt)

  filtered[0] = data[0]
  for (let i = 1; i < data.length; i++) {
    filtered[i] = filtered[i - 1] + alpha * (data[i] - filtered[i - 1])
  }

  return filtered
}

function detectPeaks(data: Float32Array, sampleRate: number): number[] {
  const peaks: number[] = []
  const windowSize = Math.floor(sampleRate * 0.1) // 100ms window
  const threshold = calculateThreshold(data)

  let lastPeak = -windowSize

  for (let i = windowSize; i < data.length - windowSize; i++) {
    // Check if current sample is a local maximum
    const current = Math.abs(data[i])

    if (current > threshold && i - lastPeak > windowSize) {
      let isMax = true
      for (let j = i - 10; j <= i + 10; j++) {
        if (Math.abs(data[j]) > current) {
          isMax = false
          break
        }
      }

      if (isMax) {
        peaks.push(i)
        lastPeak = i
      }
    }
  }

  return peaks
}

function calculateThreshold(data: Float32Array): number {
  let sum = 0
  for (let i = 0; i < data.length; i++) {
    sum += Math.abs(data[i])
  }
  return (sum / data.length) * 1.5
}

/**
 * Tap tempo calculator
 */
export class TapTempo {
  private taps: number[] = []
  private maxTaps = 8
  private maxInterval = 2000 // 2 seconds

  tap(): number | null {
    const now = Date.now()

    // Clear old taps
    if (this.taps.length > 0 && now - this.taps[this.taps.length - 1] > this.maxInterval) {
      this.taps = []
    }

    this.taps.push(now)

    // Keep only recent taps
    if (this.taps.length > this.maxTaps) {
      this.taps.shift()
    }

    if (this.taps.length < 2) return null

    // Calculate average interval
    let totalInterval = 0
    for (let i = 1; i < this.taps.length; i++) {
      totalInterval += this.taps[i] - this.taps[i - 1]
    }

    const avgInterval = totalInterval / (this.taps.length - 1)
    return 60000 / avgInterval
  }

  reset() {
    this.taps = []
  }
}
