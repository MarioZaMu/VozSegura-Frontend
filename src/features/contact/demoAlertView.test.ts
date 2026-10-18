import { describe, expect, it } from 'vitest'
import { demoAlertView, scriptedTimeline, type DemoTimeline } from './demoAlertView'

const live = (overrides: Partial<DemoTimeline> = {}): DemoTimeline => ({
  startedAt: 0,
  stoppedAt: null,
  stopReason: null,
  resolution: null,
  resolvedAt: null,
  ...overrides,
})

describe('demoAlertView', () => {
  it('plays the scripted alert: active at first, stopped at second 100, safe at 135', () => {
    const timeline = scriptedTimeline(40_000) // started at 0
    expect(demoAlertView(timeline, 50_000).status).toBe('active')
    expect(demoAlertView(timeline, 101_000).status).toBe('stopped')
    expect(demoAlertView(timeline, 120_000).resolution).toBeNull()
    expect(demoAlertView(timeline, 136_000).resolution).toBe('safe')
  })

  it('keeps a live demo alert running until the watch stops it', () => {
    const view = demoAlertView(live(), 250_000)
    expect(view.status).toBe('active')
    expect(view.chunks).toHaveLength(12)
  })

  it('stops a live alert when it was stopped, with only the audio recorded until then', () => {
    const view = demoAlertView(live({ stoppedAt: 45_000, stopReason: 'user' }), 90_000)
    expect(view.status).toBe('stopped')
    expect(view.stoppedAt).toBe(45_000)
    expect(view.chunks.map((chunk) => chunk.durationMs)).toEqual([20_000, 20_000, 5_000])
    expect(view.summaryStatus).toBe('ready')
  })

  it('shows the resolution once it was marked', () => {
    const timeline = live({ stoppedAt: 30_000, stopReason: 'user', resolution: 'false-alarm', resolvedAt: 60_000 })
    expect(demoAlertView(timeline, 59_000).resolution).toBeNull()
    expect(demoAlertView(timeline, 61_000).resolution).toBe('false-alarm')
  })
})
