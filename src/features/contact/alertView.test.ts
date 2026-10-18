import { describe, expect, it } from 'vitest'
import { chunkRange, formatAgo, formatDuration, isAlertId, isFinal, ownerLabel, type AlertView, type AlertViewChunk } from './alertView'

const chunk = (index: number, overrides: Partial<AlertViewChunk> = {}): AlertViewChunk => ({
  index,
  durationMs: 20_000,
  transcript: 'hola',
  transcriptStatus: 'done',
  audioUrl: null,
  ...overrides,
})

const view = (overrides: Partial<AlertView> = {}): AlertView => ({
  id: 'id',
  status: 'stopped',
  ownerName: '',
  message: '',
  startedAt: 0,
  stoppedAt: 100_000,
  stopReason: 'user',
  lastLocation: null,
  locations: [],
  summary: 'Resumen',
  summaryStatus: 'ready',
  summaryUpdatedAt: 100_000,
  chunks: [chunk(0), chunk(1)],
  resolution: 'safe',
  resolvedAt: 150_000,
  language: 'es',
  ...overrides,
})

describe('isFinal', () => {
  it('keeps polling while the alert is active', () => {
    expect(isFinal(view({ status: 'active' }), 200_000)).toBe(false)
  })

  it('stops once the summary is final and every chunk is transcribed', () => {
    expect(isFinal(view(), 200_000)).toBe(true)
    expect(isFinal(view({ summaryStatus: 'error' }), 200_000)).toBe(true)
  })

  it('waits for pending transcripts and summaries in progress', () => {
    expect(isFinal(view({ chunks: [chunk(0, { transcriptStatus: 'pending' })] }), 200_000)).toBe(false)
    expect(isFinal(view({ summaryStatus: 'generating' }), 200_000)).toBe(false)
  })

  it('keeps checking for a while whether the owner says how it ended', () => {
    expect(isFinal(view({ resolution: null, resolvedAt: null }), 200_000)).toBe(false)
    expect(isFinal(view({ resolution: null, resolvedAt: null }), 100_000 + 16 * 60_000)).toBe(true)
  })

  it('gives up waiting when a stopped alert never got audio', () => {
    const noAudio = view({ chunks: [], summary: null, summaryStatus: 'waiting' })
    expect(isFinal(noAudio, 110_000)).toBe(false)
    expect(isFinal(noAudio, 300_000)).toBe(true)
  })
})

describe('formatting', () => {
  it('describes how long ago', () => {
    expect(formatAgo(0, 5_000)).toBe('hace 5 s')
    expect(formatAgo(0, 3 * 60_000)).toBe('hace 3 min')
    expect(formatAgo(0, 2 * 3_600_000)).toBe('hace 2 h')
    expect(formatAgo(0, 26 * 3_600_000)).toBe('hace 1 día')
    expect(formatAgo(10_000, 0)).toBe('hace 0 s')
  })

  it('formats the elapsed time in English', () => {
    expect(formatAgo(0, 5_000, 'en')).toBe('5 s ago')
    expect(formatAgo(0, 26 * 3_600_000, 'en')).toBe('1 day ago')
    expect(formatAgo(0, 50 * 3_600_000, 'en')).toBe('2 days ago')
  })

  it('formats durations and chunk ranges', () => {
    expect(formatDuration(187_000)).toBe('3:07')
    expect(chunkRange([chunk(0), chunk(1, { durationMs: 15_000 })], 1)).toBe('0:20 – 0:35')
  })

  it('validates ids and names the owner', () => {
    expect(isAlertId('c1dac7a5-7ae9-482c-b7fa-bb2b0c41a046')).toBe(true)
    expect(isAlertId('demo')).toBe(false)
    expect(ownerLabel({ ownerName: '  ' })).toBe('Tu contacto')
    expect(ownerLabel({ ownerName: 'Laura' })).toBe('Laura')
    expect(ownerLabel({ ownerName: '' }, 'en')).toBe('Your contact')
  })
})
