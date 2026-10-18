// Pure state of the current alert on the watch. Kept framework-free so it is unit tested;
// the React store in alertSessionStore.ts only wires it to capture implementations.
import type { AlertCapture, AudioChunk, CaptureEvent, CaptureSource, DeliveryItem, LocationFix, StopReason } from './alertCapture'

export type AlertStatus = 'idle' | 'active' | 'stopped'
export type SourceStatus = 'pending' | 'on' | 'error'

export type AlertError = { source: CaptureSource; message: string; time: number }

/** 'off' = nothing is sent (demo mode or backend not configured). */
export type DeliveryState = {
  alert: 'off' | 'sending' | 'sent' | 'failed'
  chunksUploaded: number
  chunksFailed: number
  locationsSent: number
  stop: 'pending' | 'sent' | 'failed'
}

export type AlertSession = {
  status: AlertStatus
  alertId: string | null
  captureKind: AlertCapture['kind'] | null
  startedAt: number | null
  stoppedAt: number | null
  stopReason: StopReason | null
  sources: Record<CaptureSource, SourceStatus>
  /** Most recent first, capped at MAX_LOCATIONS. */
  locations: LocationFix[]
  chunks: AudioChunk[]
  errors: AlertError[]
  delivery: DeliveryState
}

export type AlertAction =
  | { type: 'activate'; alertId: string; kind: AlertCapture['kind']; time: number; delivers: boolean }
  | { type: 'capture'; event: CaptureEvent; time: number }
  | { type: 'reset' }

export const MAX_LOCATIONS = 20

export const initialAlertSession: AlertSession = {
  status: 'idle',
  alertId: null,
  captureKind: null,
  startedAt: null,
  stoppedAt: null,
  stopReason: null,
  sources: { microphone: 'pending', location: 'pending' },
  locations: [],
  chunks: [],
  errors: [],
  delivery: { alert: 'off', chunksUploaded: 0, chunksFailed: 0, locationsSent: 0, stop: 'pending' },
}

function applyDelivery(delivery: DeliveryState, item: DeliveryItem, ok: boolean): DeliveryState {
  switch (item) {
    case 'alert':
      return { ...delivery, alert: ok ? 'sent' : 'failed' }
    case 'location':
      return ok ? { ...delivery, locationsSent: delivery.locationsSent + 1 } : delivery
    case 'chunk':
      return ok
        ? { ...delivery, chunksUploaded: delivery.chunksUploaded + 1 }
        : { ...delivery, chunksFailed: delivery.chunksFailed + 1 }
    case 'stop':
      return { ...delivery, stop: ok ? 'sent' : 'failed' }
  }
}

function applyCaptureEvent(state: AlertSession, event: CaptureEvent, time: number): AlertSession {
  switch (event.type) {
    case 'started':
      return { ...state, sources: { ...state.sources, [event.source]: 'on' } }
    case 'location':
      return {
        ...state,
        sources: { ...state.sources, location: 'on' },
        locations: [event.fix, ...state.locations].slice(0, MAX_LOCATIONS),
      }
    case 'chunk':
      return { ...state, sources: { ...state.sources, microphone: 'on' }, chunks: [...state.chunks, event.chunk] }
    case 'error':
      // One source failing never stops the other one.
      return {
        ...state,
        sources: { ...state.sources, [event.source]: 'error' },
        errors: [...state.errors, { source: event.source, message: event.message, time }],
      }
    case 'stopped':
      return { ...state, status: 'stopped', stoppedAt: time, stopReason: event.reason }
    case 'delivery':
      return { ...state, delivery: applyDelivery(state.delivery, event.item, event.ok) }
  }
}

export function alertSessionReducer(state: AlertSession, action: AlertAction): AlertSession {
  switch (action.type) {
    case 'activate':
      // A second gesture while an alert is running must not start another one.
      if (state.status === 'active') return state
      return {
        ...initialAlertSession,
        status: 'active',
        alertId: action.alertId,
        captureKind: action.kind,
        startedAt: action.time,
        delivery: { ...initialAlertSession.delivery, alert: action.delivers ? 'sending' : 'off' },
      }
    case 'capture':
      if (state.status === 'active') return applyCaptureEvent(state, action.event, action.time)
      // Stopping flushes the last partial audio chunk, and uploads finish after 'stopped'.
      // Any other late event is ignored.
      if (state.status === 'stopped' && action.event.type === 'chunk') {
        return { ...state, chunks: [...state.chunks, action.event.chunk] }
      }
      if (state.status === 'stopped' && action.event.type === 'delivery') {
        return { ...state, delivery: applyDelivery(state.delivery, action.event.item, action.event.ok) }
      }
      return state
    case 'reset':
      return initialAlertSession
  }
}
