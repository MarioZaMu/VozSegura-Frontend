// What the trusted contact sees: the public alert data from GET /api/alert?id=…, plus pure
// helpers to describe it. Framework-free so it is unit tested (alertView.test.ts).
import { config } from '../../lib/config'
import type { LocationFix } from '../alert/alertCapture'

export type SummaryStatus = 'waiting' | 'generating' | 'ready' | 'error'
export type TranscriptStatus = 'pending' | 'done' | 'error'

export type AlertViewChunk = {
  index: number
  durationMs: number
  transcript: string | null
  transcriptStatus: TranscriptStatus
  /** Absolute URL of the audio file; null in the demo (no real audio). */
  audioUrl: string | null
}

export type AlertView = {
  id: string
  status: 'active' | 'stopped'
  ownerName: string
  message: string
  startedAt: number
  stoppedAt: number | null
  stopReason: 'user' | 'max-duration' | 'error' | null
  lastLocation: LocationFix | null
  /** Oldest first, as stored by the backend. */
  locations: LocationFix[]
  summary: string | null
  summaryStatus: SummaryStatus
  summaryUpdatedAt: number | null
  chunks: AlertViewChunk[]
}

type AlertResponse = Omit<AlertView, 'chunks'> & {
  chunks: (Omit<AlertViewChunk, 'audioUrl'> & { audioPath: string })[]
}

export class AlertNotFoundError extends Error {}

const REQUEST_TIMEOUT_MS = 15_000

export async function fetchAlertView(id: string): Promise<AlertView> {
  const response = await fetch(`${config.apiBaseUrl}/api/alert?id=${encodeURIComponent(id)}`, {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    cache: 'no-store',
  })
  if (response.status === 404 || response.status === 400) throw new AlertNotFoundError(id)
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const data = (await response.json()) as AlertResponse
  return {
    ...data,
    ownerName: data.ownerName ?? '',
    message: data.message ?? '',
    chunks: [...data.chunks]
      .sort((a, b) => a.index - b.index)
      .map(({ audioPath, ...chunk }) => ({ ...chunk, audioUrl: `${config.apiBaseUrl}${audioPath}` })),
  }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isAlertId(value: string | undefined): value is string {
  return value !== undefined && UUID.test(value)
}

/** After this long without a summary, a stopped alert with no audio is considered closed. */
const NO_AUDIO_GRACE_MS = 2 * 60_000

/** Nothing more will change: polling can stop. */
export function isFinal(view: AlertView, now: number): boolean {
  if (view.status !== 'stopped') return false
  if (view.summaryStatus === 'ready' || view.summaryStatus === 'error') {
    return view.chunks.every((chunk) => chunk.transcriptStatus !== 'pending')
  }
  return view.chunks.length === 0 && view.stoppedAt !== null && now - view.stoppedAt > NO_AUDIO_GRACE_MS
}

/** "hace 5 s", "hace 3 min", "hace 2 h" */
export function formatAgo(time: number, now: number): string {
  const seconds = Math.max(0, Math.round((now - time) / 1000))
  if (seconds < 60) return `hace ${seconds} s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `hace ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `hace ${hours} h`
  const days = Math.floor(hours / 24)
  return `hace ${days} día${days === 1 ? '' : 's'}`
}

/** "3:07" (minutes:seconds) */
export function formatDuration(ms: number): string {
  const seconds = Math.max(0, Math.floor(ms / 1000))
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

/** Start and end of each chunk inside the recording, e.g. "0:20 – 0:40". */
export function chunkRange(chunks: AlertViewChunk[], index: number): string {
  let start = 0
  for (const chunk of chunks) {
    if (chunk.index === index) return `${formatDuration(start)} – ${formatDuration(start + chunk.durationMs)}`
    start += chunk.durationMs
  }
  return ''
}

export function totalAudioMs(chunks: AlertViewChunk[]): number {
  return chunks.reduce((total, chunk) => total + chunk.durationMs, 0)
}

export function directionsUrl(fix: LocationFix): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${fix.latitude},${fix.longitude}`
}

/** Who raised it, for headings: the saved name or a neutral fallback. */
export function ownerLabel(view: Pick<AlertView, 'ownerName'>): string {
  return view.ownerName.trim() || 'Tu contacto'
}
