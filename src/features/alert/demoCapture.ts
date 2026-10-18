import type { AlertCapture, CaptureListener, CaptureOptions } from './alertCapture'

// Simulated capture for the classroom: no permissions, no network, no real audio.
// Location starts near the center of Medellín and drifts like someone walking.
const BASE_LATITUDE = 6.2442
const BASE_LONGITUDE = -75.5812
const LOCATION_INTERVAL_MS = 5000
const FIRST_FIX_DELAY_MS = 600
const SIMULATED_BYTES_PER_SECOND = 4000 // ~32 kbps, like the native AAC recording

export function createDemoCapture(): AlertCapture {
  const timers: number[] = []

  return {
    kind: 'demo',

    async start(options: CaptureOptions, listener: CaptureListener) {
      let step = 0
      const emitLocation = () => {
        step += 1
        listener({
          type: 'location',
          fix: {
            latitude: BASE_LATITUDE + step * 0.00004,
            longitude: BASE_LONGITUDE + step * 0.00003,
            accuracy: 8 + (step % 4) * 3,
            time: Date.now(),
          },
        })
      }

      let chunkIndex = 0
      const emitChunk = () => {
        listener({
          type: 'chunk',
          chunk: {
            index: chunkIndex++,
            sizeBytes: options.chunkSeconds * SIMULATED_BYTES_PER_SECOND,
            durationMs: options.chunkSeconds * 1000,
            mimeType: 'audio/mp4',
          },
        })
      }

      listener({ type: 'started', source: 'microphone' })
      listener({ type: 'started', source: 'location' })
      timers.push(window.setTimeout(emitLocation, FIRST_FIX_DELAY_MS))
      timers.push(window.setInterval(emitLocation, LOCATION_INTERVAL_MS))
      timers.push(window.setInterval(emitChunk, options.chunkSeconds * 1000))
    },

    async stop() {
      timers.forEach((id) => window.clearTimeout(id))
      timers.length = 0
    },
  }
}
