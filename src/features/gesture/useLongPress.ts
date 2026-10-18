import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from 'react'

const MOVE_TOLERANCE_PX = 12

/**
 * Fires onLongPress when one finger stays still for `durationMs`. Used as the hidden way
 * from the watch to Settings; the double-tap detector already rejects long presses, so both
 * gestures can share the same element.
 */
export function useLongPress(onLongPress: () => void, durationMs: number) {
  const onLongPressRef = useRef(onLongPress)
  const timer = useRef<number | undefined>(undefined)
  const start = useRef<{ pointerId: number; x: number; y: number } | null>(null)

  useEffect(() => {
    onLongPressRef.current = onLongPress
  }, [onLongPress])

  const cancel = () => {
    window.clearTimeout(timer.current)
    start.current = null
  }

  useEffect(() => cancel, [])

  return {
    onPointerDown: (event: ReactPointerEvent) => {
      // A second finger means it is not a long press.
      if (start.current) return cancel()
      start.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY }
      timer.current = window.setTimeout(() => {
        start.current = null
        onLongPressRef.current()
      }, durationMs)
    },
    onPointerMove: (event: ReactPointerEvent) => {
      const origin = start.current
      if (!origin || origin.pointerId !== event.pointerId) return
      if (Math.hypot(event.clientX - origin.x, event.clientY - origin.y) > MOVE_TOLERANCE_PX) cancel()
    },
    onPointerUp: cancel,
    onPointerCancel: cancel,
  }
}
