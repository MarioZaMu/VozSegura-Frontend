import { useCallback, useRef, useState } from 'react'
import { hapticPatterns, vibrate } from '../../lib/haptics'
import type { GestureEvent } from './doubleTapDetector'
import type { LoggedGestureEvent } from './GestureDiagnostics'
import { useDoubleTap } from './useDoubleTap'

const MAX_LOGGED_EVENTS = 6

type PanicGestureOptions = {
  onActivate: () => void
  /** Triple tap. Returns true when it stopped something, which is then confirmed with a vibration. */
  onTripleTap?: () => boolean
  /** Also blink when vibration works (PC mockup, where nobody feels the vibration). */
  alwaysBlink?: boolean
}

/**
 * The panic gesture: double tap → discreet confirmation (vibration, or a barely visible
 * blink when the device cannot vibrate) → onActivate. Triple tap → onTripleTap (stop), with
 * a two-pulse vibration when it stopped an alert.
 */
export function usePanicGesture({ onActivate, onTripleTap, alwaysBlink = false }: PanicGestureOptions) {
  const [events, setEvents] = useState<LoggedGestureEvent[]>([])
  const [blinkKey, setBlinkKey] = useState(0)
  const nextId = useRef(0)

  const handleEvent = useCallback(
    (event: GestureEvent) => {
      // Vibrate first, synchronously inside the touch handler: browsers only allow it
      // while the user's tap is still the active input.
      let vibrated: boolean | undefined
      if (event.type === 'double-tap') vibrated = vibrate(hapticPatterns.confirm)
      if (event.type === 'triple-tap' && onTripleTap?.()) vibrated = vibrate(hapticPatterns.stopped)
      const logged: LoggedGestureEvent = { ...event, id: nextId.current++, at: new Date(), vibrated }
      setEvents((previous) => [logged, ...previous].slice(0, MAX_LOGGED_EVENTS))

      if (event.type === 'triple-tap' && vibrated !== undefined && (!vibrated || alwaysBlink)) {
        setBlinkKey((key) => key + 1)
      }
      if (event.type !== 'double-tap') return
      if (!vibrated || alwaysBlink) setBlinkKey((key) => key + 1)
      onActivate()
    },
    [onActivate, onTripleTap, alwaysBlink],
  )

  const handlers = useDoubleTap(handleEvent)
  return { handlers, events, blinkKey }
}
