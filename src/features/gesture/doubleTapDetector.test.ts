import { beforeEach, describe, expect, it } from 'vitest'
import { DoubleTapDetector, type GestureEvent, type PointerSample } from './doubleTapDetector'

let events: GestureEvent[]
let detector: DoubleTapDetector

const sample = (time: number, overrides: Partial<PointerSample> = {}): PointerSample => ({
  pointerId: 1,
  x: 100,
  y: 100,
  time,
  width: 10,
  height: 10,
  ...overrides,
})

/** Simulates a full tap: press at `start`, release `duration` ms later. */
function tap(start: number, overrides: Partial<PointerSample> = {}, duration = 80) {
  detector.pointerDown(sample(start, overrides))
  detector.pointerUp(sample(start + duration, overrides))
}

const types = () => events.map((event) => (event.type === 'rejected' ? `rejected:${event.reason}` : event.type))

beforeEach(() => {
  events = []
  detector = new DoubleTapDetector((event) => events.push(event))
  detector.arm(0) // armed from t = 800 ms
})

describe('DoubleTapDetector', () => {
  it('detects a normal double tap', () => {
    tap(1000)
    tap(1250)
    expect(types()).toEqual(['tap', 'double-tap'])
  })

  it('treats a slow second tap as a new first tap', () => {
    tap(1000)
    tap(1600) // gap 520 ms > 350 ms
    expect(types()).toEqual(['tap', 'tap'])
  })

  it('still detects the gesture when the slow tap is followed by a quick one', () => {
    tap(1000)
    tap(1600)
    tap(1850)
    expect(types()).toEqual(['tap', 'tap', 'double-tap'])
  })

  it('ignores taps right after the screen is shown (pocket wake-up)', () => {
    tap(100)
    tap(300)
    expect(types()).toEqual(['rejected:not-armed', 'rejected:not-armed'])
  })

  it('rejects taps that are too far apart', () => {
    tap(1000, { x: 50 })
    tap(1250, { x: 200 })
    expect(types()).toEqual(['tap', 'rejected:too-far'])
  })

  it('rejects a second tap that is impossibly fast (bounce)', () => {
    tap(1000)
    tap(1100, {}, 10) // gap 20 ms
    expect(types()).toContain('rejected:too-fast')
    expect(types()).not.toContain('double-tap')
  })

  it('rejects long presses', () => {
    tap(1000, {}, 600)
    tap(1700)
    expect(types()).toEqual(['rejected:long-press', 'tap'])
  })

  it('rejects drags and scrolls', () => {
    detector.pointerDown(sample(1000))
    detector.pointerMove(sample(1040, { y: 140 }))
    detector.pointerUp(sample(1080, { y: 140 }))
    tap(1250)
    expect(types()).toEqual(['rejected:moved', 'tap'])
  })

  it('rejects palm-sized contacts', () => {
    tap(1000, { width: 90, height: 120 })
    expect(types()).toEqual(['rejected:palm'])
  })

  it('rejects multi-finger touches and cancels the pending tap', () => {
    tap(1000)
    detector.pointerDown(sample(1200, { pointerId: 1 }))
    detector.pointerDown(sample(1210, { pointerId: 2, x: 140 }))
    detector.pointerUp(sample(1260, { pointerId: 1 }))
    detector.pointerUp(sample(1270, { pointerId: 2, x: 140 }))
    expect(types()).toEqual(['tap', 'rejected:multi-touch'])
  })

  it('does not count a touch the browser cancelled', () => {
    tap(1000)
    detector.pointerDown(sample(1200))
    detector.pointerCancel(1)
    tap(1300)
    expect(types()).toEqual(['tap', 'tap'])
  })

  it('cannot re-trigger with a triple tap (cooldown)', () => {
    tap(1000)
    tap(1250)
    tap(1500)
    tap(1750)
    expect(types()).toEqual(['tap', 'double-tap', 'rejected:cooldown', 'rejected:cooldown'])
  })

  it('works again after the cooldown', () => {
    tap(1000)
    tap(1250)
    tap(4000)
    tap(4250)
    expect(types().filter((type) => type === 'double-tap')).toHaveLength(2)
  })
})
