import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from 'react'
import {
  DoubleTapDetector,
  type DoubleTapOptions,
  type GestureEvent,
  type PointerSample,
} from './doubleTapDetector'

function toSample(event: ReactPointerEvent): PointerSample {
  return {
    pointerId: event.pointerId,
    x: event.clientX,
    y: event.clientY,
    time: event.timeStamp, // same clock as performance.now()
    width: event.width,
    height: event.height,
  }
}

/**
 * Wires the double-tap detector to an element. Spread the returned handlers on it and give
 * it `touch-manipulation` so the browser never zooms on double tap.
 */
export function useDoubleTap(onEvent: (event: GestureEvent) => void, options?: Partial<DoubleTapOptions>) {
  const onEventRef = useRef(onEvent)
  // Options are read once when the detector is created; runtime changes are not supported.
  const optionsRef = useRef(options)
  const detectorRef = useRef<DoubleTapDetector | null>(null)

  useEffect(() => {
    onEventRef.current = onEvent
  }, [onEvent])

  useEffect(() => {
    const detector = new DoubleTapDetector((event) => onEventRef.current(event), optionsRef.current)
    detectorRef.current = detector
    detector.arm(performance.now())

    // Re-arm every time the screen comes back (unlock, app switch, taking it out of a pocket).
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') detector.arm(performance.now())
      else detector.reset()
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  return {
    onPointerDown: (event: ReactPointerEvent) => detectorRef.current?.pointerDown(toSample(event)),
    onPointerMove: (event: ReactPointerEvent) => detectorRef.current?.pointerMove(toSample(event)),
    onPointerUp: (event: ReactPointerEvent) => detectorRef.current?.pointerUp(toSample(event)),
    onPointerCancel: (event: ReactPointerEvent) => detectorRef.current?.pointerCancel(event.pointerId),
    // No long-press menu or text selection on the watch.
    onContextMenu: (event: { preventDefault: () => void }) => event.preventDefault(),
  }
}
