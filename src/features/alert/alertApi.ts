import { config } from '../../lib/config'
import { getDeviceId } from '../../lib/deviceId'
import type { LocationFix, StopReason } from './alertCapture'
import type { Resolution } from './alertHistory'

// Client for the backend write endpoints (same contract the Android service uses in Java).

const REQUEST_TIMEOUT_MS = 15_000
const RETRY_DELAYS_MS = [1000, 3000, 7000, 15_000, 30_000]

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function send(path: string, init: RequestInit): Promise<void> {
  const response = await fetch(`${config.apiBaseUrl}${path}`, {
    ...init,
    headers: { ...init.headers, Authorization: `Bearer ${config.alertApiToken}` },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })
  // 4xx (except 408/429) will not succeed on a retry.
  if (response.status >= 400 && response.status < 500 && response.status !== 408 && response.status !== 429) {
    throw new PermanentError(response.status)
  }
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
}

/** A 4xx answer: retrying will not help. */
export class PermanentError extends Error {
  readonly status: number

  constructor(status: number) {
    super(`HTTP ${status}`)
    this.status = status
  }
}

/** Retries network errors and 5xx with backoff (~1 min in total). */
async function sendWithRetry(path: string, init: RequestInit): Promise<void> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await send(path, init)
    } catch (error) {
      if (error instanceof PermanentError || attempt >= RETRY_DELAYS_MS.length) throw error
      await wait(RETRY_DELAYS_MS[attempt])
    }
  }
}

const jsonInit = (body: unknown): RequestInit => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})

export function postAlert(alertId: string, startedAt: number, captureKind: string): Promise<void> {
  return sendWithRetry('/api/alerts', jsonInit({ alertId, deviceId: getDeviceId(), startedAt, captureKind }))
}

/** Positions are not retried: the next one (seconds later) replaces a lost one. */
export function postLocation(alertId: string, location: LocationFix): Promise<void> {
  return send('/api/location', jsonInit({ alertId, location }))
}

export function postAudioChunk(alertId: string, index: number, durationMs: number, audio: Blob): Promise<void> {
  const params = new URLSearchParams({ alertId, index: String(index), durationMs: String(durationMs) })
  return sendWithRetry(`/api/audio?${params}`, {
    method: 'POST',
    // The backend stores by base type (audio/webm, audio/mp4); codecs are dropped.
    headers: { 'Content-Type': audio.type.split(';')[0] || 'audio/webm' },
    body: audio,
  })
}

export function postStop(alertId: string, reason: StopReason, totalChunks: number): Promise<void> {
  return sendWithRetry('/api/stop', jsonInit({ alertId, reason, totalChunks }))
}

/** "Estoy bien" / false alarm. The backend only accepts it from the device that raised the alert. */
export function postResolve(alertId: string, resolution: Resolution): Promise<void> {
  return sendWithRetry('/api/resolve', jsonInit({ alertId, deviceId: getDeviceId(), resolution }))
}
