import { getLanguage } from '../../i18n/currentLanguage'
import { getMessages } from '../../i18n/language'
import type { AlertCapture, CaptureListener, CaptureOptions } from './alertCapture'

// Browser capture: MediaRecorder + Geolocation API. Works while the page is visible; if
// the phone locks, the browser may pause it (the Android app does not have this limit).

const PREFERRED_MIME_TYPES = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm']

function pickMimeType(): string {
  return PREFERRED_MIME_TYPES.find((type) => MediaRecorder.isTypeSupported(type)) ?? ''
}

const texts = () => getMessages(getLanguage()).capture

function describeGeolocationError(error: GeolocationPositionError): string {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return texts().locationDenied
    case error.POSITION_UNAVAILABLE:
      return texts().locationUnavailable
    default:
      return texts().locationTimeout
  }
}

export function createWebCapture(): AlertCapture {
  let stream: MediaStream | null = null
  let recorder: MediaRecorder | null = null
  let rotateTimer: number | undefined
  let watchId: number | undefined
  let stopped = false

  return {
    kind: 'web',

    async start(options: CaptureOptions, listener: CaptureListener) {
      stopped = false

      // Location first and independently: it is the part of the alert that matters most.
      if ('geolocation' in navigator) {
        listener({ type: 'started', source: 'location' })
        watchId = navigator.geolocation.watchPosition(
          (position) =>
            listener({
              type: 'location',
              fix: {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                time: position.timestamp,
              },
            }),
          (error) => listener({ type: 'error', source: 'location', message: describeGeolocationError(error) }),
          { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
        )
      } else {
        listener({ type: 'error', source: 'location', message: texts().noGeolocation })
      }

      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      } catch {
        listener({ type: 'error', source: 'microphone', message: texts().microphoneDenied })
        return
      }
      if (stopped) {
        stream.getTracks().forEach((track) => track.stop())
        return
      }
      listener({ type: 'started', source: 'microphone' })

      // One MediaRecorder per chunk: every file is complete and playable on its own (the
      // pieces of a single recorder with `timeslice` only have a header in the first one).
      const mimeType = pickMimeType()
      let chunkIndex = 0
      const recordChunk = () => {
        if (!stream || stopped) return
        const startedAt = performance.now()
        const parts: Blob[] = []
        const current = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
        current.ondataavailable = (event) => event.data.size > 0 && parts.push(event.data)
        current.onstop = () => {
          if (parts.length === 0) return
          const blob = new Blob(parts, { type: current.mimeType })
          listener({
            type: 'chunk',
            chunk: {
              index: chunkIndex++,
              sizeBytes: blob.size,
              durationMs: Math.round(performance.now() - startedAt),
              mimeType: blob.type,
              blob,
            },
          })
        }
        current.start()
        recorder = current
        rotateTimer = window.setTimeout(() => {
          current.stop()
          recordChunk()
        }, options.chunkSeconds * 1000)
      }
      recordChunk()
    },

    async stop() {
      stopped = true
      window.clearTimeout(rotateTimer)
      if (watchId !== undefined) navigator.geolocation.clearWatch(watchId)
      if (recorder?.state === 'recording') recorder.stop() // flushes the last partial chunk
      stream?.getTracks().forEach((track) => track.stop())
      recorder = null
      stream = null
    },
  }
}
