// Contract shared by the three capture implementations (demo, web, native Android).
// Microphone and location are independent: one failing never stops the other, and
// nothing here may block or delay the alert itself.

export type LocationFix = {
  latitude: number
  longitude: number
  /** Meters (68% confidence radius). */
  accuracy: number
  /** Epoch ms when the fix was taken. */
  time: number
}

export type AudioChunk = {
  index: number
  sizeBytes: number
  durationMs: number
  mimeType: string
  /** Web/demo only: the recorded audio. Native chunks stay on disk until uploaded. */
  blob?: Blob
  /** Native app only: file in the app's private storage (deleted once uploaded). */
  path?: string
}

export type CaptureSource = 'microphone' | 'location'

export type StopReason = 'user' | 'max-duration' | 'error'

/** What was sent to the backend (alert first, then positions, audio and the stop). */
export type DeliveryItem = 'alert' | 'location' | 'chunk' | 'stop'

export type CaptureEvent =
  | { type: 'started'; source: CaptureSource }
  | { type: 'location'; fix: LocationFix }
  | { type: 'chunk'; chunk: AudioChunk }
  | { type: 'error'; source: CaptureSource; message: string }
  | { type: 'stopped'; reason: StopReason }
  | { type: 'delivery'; item: DeliveryItem; ok: boolean; index?: number }

export type CaptureOptions = {
  alertId: string
  /** Length of each audio file; short so every upload fits Vercel's 4.5 MB body limit. */
  chunkSeconds: number
  /** Safety net until the cancel flow exists (phase 10). */
  maxDurationSeconds: number
  /** Backend to send the alert to (native app only; the web capture is wrapped in JS). */
  apiBaseUrl?: string
  apiToken?: string
  /** Picks the contacts the backend notifies (see lib/deviceId.ts). */
  deviceId?: string
  startedAt?: number
}

export type CaptureListener = (event: CaptureEvent) => void

export interface AlertCapture {
  readonly kind: 'demo' | 'web' | 'native'
  start(options: CaptureOptions, listener: CaptureListener): Promise<void>
  stop(): Promise<void>
}

export const defaultCaptureOptions: Omit<CaptureOptions, 'alertId'> = {
  chunkSeconds: 20,
  maxDurationSeconds: 5 * 60,
}
