import { useCallback, useRef, useState } from 'react'
import { hapticPatterns, vibrate } from '../../lib/haptics'
import type { GestureEvent } from './doubleTapDetector'
import type { LoggedGestureEvent } from './GestureDiagnostics'
import { useDoubleTap } from './useDoubleTap'

const MAX_LOGGED_EVENTS = 6

type PanicGestureOptions = {
  onActivate: () => void
  /** Also blink when vibration works (PC mockup, where nobody feels the vibration). */
  alwaysBlink?: boolean
}

/**
 * The panic gesture: double tap → discreet confirmation (vibration, or a barely visible
 * blink when the device cannot vibrate) → onActivate.
 */
export function usePanicGesture({ onActivate, alwaysBlink = false }: PanicGestureOptions) {
  const [events, setEvents] = useState<LoggedGestureEvent[]>([])
  const [blinkKey, setBlinkKey] = useState(0)
  const nextId = useRef(0)

  const handleEvent = useCallback(
    (event: GestureEvent) => {
      // Vibrate first, synchronously inside the touch handler: browsers only allow it
      // while the user's tap is still the active input.
      const vibrated = event.type === 'double-tap' ? vibrate(hapticPatterns.confirm) : undefined
      const logged: LoggedGestureEvent = { ...event, id: nextId.current++, at: new Date(), vibrated }
      setEvents((previous) => [logged, ...previous].slice(0, MAX_LOGGED_EVENTS))

      if (event.type !== 'double-tap') return
      if (!vibrated || alwaysBlink) setBlinkKey((key) => key + 1)
      onActivate()
    },
    [onActivate, alwaysBlink],
  )

  const handlers = useDoubleTap(handleEvent)
  return { handlers, events, blinkKey }
}
