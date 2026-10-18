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
}

export type CaptureSource = 'microphone' | 'location'

export type StopReason = 'user' | 'max-duration' | 'error'

export type CaptureEvent =
  | { type: 'started'; source: CaptureSource }
  | { type: 'location'; fix: LocationFix }
  | { type: 'chunk'; chunk: AudioChunk }
  | { type: 'error'; source: CaptureSource; message: string }
  | { type: 'stopped'; reason: StopReason }

export type CaptureOptions = {
  alertId: string
  /** Length of each audio file; short so every upload fits Vercel's 4.5 MB body limit. */
  chunkSeconds: number
  /** Safety net until the cancel flow exists (phase 10). */
  maxDurationSeconds: number
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
