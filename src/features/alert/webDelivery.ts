import type { CaptureEvent, CaptureListener, DeliveryItem } from './alertCapture'
import { postAlert, postAudioChunk, postLocation, postStop } from './alertApi'

// Sends a browser capture to the backend: the alert right away, a position every ~10 s, each
// audio chunk as it is recorded and finally the stop. Wraps the capture listener, so the
// session still sees every capture event plus 'delivery' events with the result of each send.
// (The Android app does the same from its foreground service, because JS pauses there.)

const LOCATION_INTERVAL_MS = 10_000

export function withWebDelivery(alertId: string, startedAt: number, listener: CaptureListener): CaptureListener {
  const report = (item: DeliveryItem, ok: boolean, index?: number) => listener({ type: 'delivery', item, ok, index })

  // Everything after the alert waits for it: the backend rejects data for unknown alerts.
  const alertSent = postAlert(alertId, startedAt, 'web').then(
    () => (report('alert', true), true),
    () => (report('alert', false), false),
  )

  // Chunks upload one at a time, in order, so 'stop' (last in the queue) knows the total.
  let queue: Promise<unknown> = alertSent
  let chunkCount = 0
  let lastLocationSentAt = 0

  return (event: CaptureEvent) => {
    listener(event)
    switch (event.type) {
      case 'location': {
        const now = Date.now()
        if (now - lastLocationSentAt < LOCATION_INTERVAL_MS) return
        lastLocationSentAt = now
        void alertSent.then(async (ok) => {
          if (!ok) return
          await postLocation(alertId, event.fix).then(
            () => report('location', true),
            () => report('location', false),
          )
        })
        return
      }
      case 'chunk': {
        const { blob, index, durationMs } = event.chunk
        chunkCount++
        if (!blob) return
        queue = queue.then(() =>
          postAudioChunk(alertId, index, durationMs, blob).then(
            () => report('chunk', true, index),
            () => report('chunk', false, index),
          ),
        )
        return
      }
      case 'stopped': {
        // The recorder flushes its last chunk right after 'stopped'; give it a moment to land.
        queue = queue
          .then(() => new Promise((resolve) => setTimeout(resolve, 1500)))
          .then(() =>
            postStop(alertId, event.reason, chunkCount).then(
              () => report('stop', true),
              () => report('stop', false),
            ),
          )
        return
      }
    }
  }
}
