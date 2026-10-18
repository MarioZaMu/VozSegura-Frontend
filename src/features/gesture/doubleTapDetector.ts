// Double-tap detector for the panic gesture. Framework-free so it can be unit tested.
// A third quick tap right after a double tap is reported as 'triple-tap' (stops the alert);
// the double tap is always reported first, so activation never waits for a possible third.
//
// The gesture must be invisible but infallible: easy to do on purpose, very hard to do by
// accident (pocket, bag, palm, scrolling). Every rejected touch reports its reason, which
// feeds the PC diagnostics panel and the gesture practice view.

export type DoubleTapOptions = {
  /** Max time between the first tap's release and the second tap's press. */
  maxGapMs: number
  /** Min gap; anything faster is a bounce or a duplicated event, not a human. */
  minGapMs: number
  /** Max press duration for a touch to count as a tap (longer = long press). */
  maxTapDurationMs: number
  /** Max distance between the two taps. */
  maxDistancePx: number
  /** Max finger movement while pressed (more = drag or scroll). */
  moveTolerancePx: number
  /** Contact width/height above this is a palm or a cheek, not a fingertip. */
  maxContactSizePx: number
  /** Taps are ignored for this long after the screen is shown (pocket wake-ups). */
  armDelayMs: number
  /**
   * After a double tap, ignore taps for this long so a triple tap cannot re-trigger. Only
   * one quick third tap (same gap/distance rules) gets through, as 'triple-tap'.
   */
  cooldownMs: number
}

export const defaultDoubleTapOptions: DoubleTapOptions = {
  maxGapMs: 350,
  minGapMs: 40,
  maxTapDurationMs: 300,
  maxDistancePx: 40,
  moveTolerancePx: 12,
  maxContactSizePx: 60,
  armDelayMs: 800,
  cooldownMs: 2000,
}

export type TapRejection =
  | 'not-armed'
  | 'cooldown'
  | 'multi-touch'
  | 'palm'
  | 'moved'
  | 'long-press'
  | 'too-fast'
  | 'too-far'

export type GestureEvent =
  | { type: 'tap'; time: number }
  | { type: 'double-tap'; time: number }
  | { type: 'triple-tap'; time: number }
  | { type: 'rejected'; reason: TapRejection; time: number }

export type PointerSample = {
  pointerId: number
  x: number
  y: number
  /** Milliseconds, e.g. PointerEvent.timeStamp. */
  time: number
  width?: number
  height?: number
}

type ActivePointer = { down: PointerSample; moved: boolean; ignored: boolean; third?: boolean }
type CompletedTap = { x: number; y: number; upTime: number }

function distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

export class DoubleTapDetector {
  private readonly options: DoubleTapOptions
  private readonly onEvent: (event: GestureEvent) => void
  private readonly active = new Map<number, ActivePointer>()
  private pendingTap: CompletedTap | null = null
  /** Second tap of the last double tap, while a third one may still follow. */
  private lastDoubleTap: CompletedTap | null = null
  private armedAt = Number.NEGATIVE_INFINITY
  private cooldownUntil = Number.NEGATIVE_INFINITY

  constructor(onEvent: (event: GestureEvent) => void, options: Partial<DoubleTapOptions> = {}) {
    this.onEvent = onEvent
    this.options = { ...defaultDoubleTapOptions, ...options }
  }

  /** Call when the screen becomes visible: taps before `now + armDelayMs` are ignored. */
  arm(now: number): void {
    this.armedAt = now + this.options.armDelayMs
    this.reset()
  }

  reset(): void {
    this.active.clear()
    this.pendingTap = null
    this.lastDoubleTap = null
  }

  pointerDown(sample: PointerSample): void {
    const reject = (reason: TapRejection) => {
      this.active.set(sample.pointerId, { down: sample, moved: false, ignored: true })
      this.onEvent({ type: 'rejected', reason, time: sample.time })
    }

    if (sample.time < this.armedAt) return reject('not-armed')
    if (sample.time < this.cooldownUntil) {
      const second = this.lastDoubleTap
      this.lastDoubleTap = null
      const gap = second ? sample.time - second.upTime : Number.POSITIVE_INFINITY
      const isThird =
        second !== null &&
        this.active.size === 0 &&
        gap >= this.options.minGapMs &&
        gap <= this.options.maxGapMs &&
        distance(second, sample) <= this.options.maxDistancePx &&
        Math.max(sample.width ?? 0, sample.height ?? 0) <= this.options.maxContactSizePx
      if (!isThird) return reject('cooldown')
      this.active.set(sample.pointerId, { down: sample, moved: false, ignored: false, third: true })
      return
    }

    if (this.active.size > 0) {
      // A second finger invalidates everything in progress.
      this.active.forEach((pointer) => (pointer.ignored = true))
      this.pendingTap = null
      return reject('multi-touch')
    }

    const contactSize = Math.max(sample.width ?? 0, sample.height ?? 0)
    if (contactSize > this.options.maxContactSizePx) {
      this.pendingTap = null
      return reject('palm')
    }

    this.active.set(sample.pointerId, { down: sample, moved: false, ignored: false })
  }

  pointerMove(sample: PointerSample): void {
    const pointer = this.active.get(sample.pointerId)
    if (!pointer || pointer.ignored) return
    if (distance(pointer.down, sample) > this.options.moveTolerancePx) pointer.moved = true
  }

  pointerUp(sample: PointerSample): void {
    const pointer = this.active.get(sample.pointerId)
    this.active.delete(sample.pointerId)
    if (!pointer || pointer.ignored) return

    const reject = (reason: TapRejection) => {
      this.pendingTap = null
      this.onEvent({ type: 'rejected', reason, time: sample.time })
    }

    if (pointer.moved) return reject('moved')
    if (sample.time - pointer.down.time > this.options.maxTapDurationMs) return reject('long-press')

    if (pointer.third) {
      this.cooldownUntil = sample.time + this.options.cooldownMs
      this.onEvent({ type: 'triple-tap', time: sample.time })
      return
    }

    const tap: CompletedTap = { x: pointer.down.x, y: pointer.down.y, upTime: sample.time }
    const first = this.pendingTap

    if (first) {
      const gap = pointer.down.time - first.upTime
      if (gap < this.options.minGapMs) return reject('too-fast')

      if (gap <= this.options.maxGapMs) {
        if (distance(first, tap) > this.options.maxDistancePx) {
          // Too far apart: not a double tap, but this tap may start a new one.
          this.onEvent({ type: 'rejected', reason: 'too-far', time: sample.time })
          this.pendingTap = tap
          return
        }
        this.pendingTap = null
        this.lastDoubleTap = tap
        this.cooldownUntil = sample.time + this.options.cooldownMs
        this.onEvent({ type: 'double-tap', time: sample.time })
        return
      }
    }

    // First tap of a possible double tap (or the previous one expired).
    this.pendingTap = tap
    this.onEvent({ type: 'tap', time: sample.time })
  }

  pointerCancel(pointerId: number): void {
    // The browser took over the touch (scroll, system gesture): never count it.
    if (this.active.delete(pointerId)) this.pendingTap = null
  }
}
