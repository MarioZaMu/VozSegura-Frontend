import { describe, expect, it } from 'vitest'
import type { LocationFix } from './alertCapture'
import { alertSessionReducer, initialAlertSession, MAX_LOCATIONS, type AlertSession } from './alertSession'

const fix = (time: number): LocationFix => ({ latitude: 6.2, longitude: -75.5, accuracy: 10, time })

const active = (): AlertSession =>
  alertSessionReducer(initialAlertSession, { type: 'activate', alertId: 'a1', kind: 'demo', time: 1000 })

describe('alertSessionReducer', () => {
  it('activates a new alert', () => {
    const state = active()
    expect(state).toMatchObject({ status: 'active', alertId: 'a1', captureKind: 'demo', startedAt: 1000 })
  })

  it('ignores a second activation while an alert is running', () => {
    const state = alertSessionReducer(active(), { type: 'activate', alertId: 'a2', kind: 'web', time: 2000 })
    expect(state.alertId).toBe('a1')
  })

  it('keeps location going when the microphone fails', () => {
    let state = active()
    state = alertSessionReducer(state, {
      type: 'capture',
      event: { type: 'error', source: 'microphone', message: 'Permiso denegado' },
      time: 1100,
    })
    state = alertSessionReducer(state, { type: 'capture', event: { type: 'location', fix: fix(1200) }, time: 1200 })
    expect(state.status).toBe('active')
    expect(state.sources).toEqual({ microphone: 'error', location: 'on' })
    expect(state.errors).toHaveLength(1)
    expect(state.locations).toHaveLength(1)
  })

  it('keeps the newest locations first and caps the list', () => {
    let state = active()
    for (let i = 0; i < MAX_LOCATIONS + 5; i++) {
      state = alertSessionReducer(state, { type: 'capture', event: { type: 'location', fix: fix(i) }, time: i })
    }
    expect(state.locations).toHaveLength(MAX_LOCATIONS)
    expect(state.locations[0].time).toBe(MAX_LOCATIONS + 4)
  })

  it('records audio chunks in order', () => {
    let state = active()
    for (const index of [0, 1, 2]) {
      state = alertSessionReducer(state, {
        type: 'capture',
        event: { type: 'chunk', chunk: { index, sizeBytes: 80_000, durationMs: 20_000, mimeType: 'audio/mp4' } },
        time: 1000 + index,
      })
    }
    expect(state.chunks.map((chunk) => chunk.index)).toEqual([0, 1, 2])
    expect(state.sources.microphone).toBe('on')
  })

  it('stops and ignores late events', () => {
    let state = alertSessionReducer(active(), {
      type: 'capture',
      event: { type: 'stopped', reason: 'max-duration' },
      time: 5000,
    })
    state = alertSessionReducer(state, { type: 'capture', event: { type: 'location', fix: fix(6000) }, time: 6000 })
    expect(state).toMatchObject({ status: 'stopped', stopReason: 'max-duration', stoppedAt: 5000 })
    expect(state.locations).toHaveLength(0)
  })

  it('keeps the last audio chunk flushed after stopping', () => {
    let state = alertSessionReducer(active(), { type: 'capture', event: { type: 'stopped', reason: 'user' }, time: 2000 })
    state = alertSessionReducer(state, {
      type: 'capture',
      event: { type: 'chunk', chunk: { index: 0, sizeBytes: 9000, durationMs: 2000, mimeType: 'audio/mp4' } },
      time: 2010,
    })
    expect(state.status).toBe('stopped')
    expect(state.chunks).toHaveLength(1)
  })

  it('can start a new alert after the previous one stopped', () => {
    const stopped = alertSessionReducer(active(), { type: 'capture', event: { type: 'stopped', reason: 'user' }, time: 2000 })
    const next = alertSessionReducer(stopped, { type: 'activate', alertId: 'a2', kind: 'native', time: 3000 })
    expect(next).toMatchObject({ status: 'active', alertId: 'a2', chunks: [], locations: [] })
  })
})
