import { useEffect, useState } from 'react'
import type { Messages } from '../../i18n/messages'
import { useT } from '../../i18n/useT'
import { canVibrate, vibrate } from '../../lib/haptics'
import type { LoggedGestureEvent } from './GestureDiagnostics'
import { describeGestureEvent } from './gestureLabels'

type MobileDebugPanelProps = {
  events: LoggedGestureEvent[]
}

type TouchInfo = { pointerType: string; width: number; height: number }

function describeActivation(t: Messages): string {
  const activation = navigator.userActivation
  if (!activation) return t.debug.noApi
  return t.debug.activation(activation.isActive, activation.hasBeenActive)
}

// Only with ?debug=1 on the full-screen watch: lets us see on the phone itself what the
// gesture detector and the Vibration API are doing. Sits above the watch circle so it
// never covers the touch area.
export function MobileDebugPanel({ events }: MobileDebugPanelProps) {
  const t = useT()
  const [lastTouch, setLastTouch] = useState<TouchInfo | null>(null)
  const [testResult, setTestResult] = useState<string>('—')

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) =>
      setLastTouch({ pointerType: event.pointerType, width: event.width, height: event.height })
    window.addEventListener('pointerdown', handlePointerDown, { capture: true })
    return () => window.removeEventListener('pointerdown', handlePointerDown, { capture: true })
  }, [])

  const testVibration = () => {
    const accepted = vibrate([200])
    setTestResult(`${accepted ? t.debug.accepted : t.debug.refused} · ${describeActivation(t)}`)
  }

  return (
    <aside className="fixed inset-x-0 top-0 z-10 flex flex-col gap-1 bg-surface p-3 text-caption text-text-secondary">
      <div className="flex items-center justify-between gap-2">
        <span>
          {t.debug.vibrateExists(canVibrate())} · {t.debug.touch}:{' '}
          {lastTouch ? `${lastTouch.pointerType} ${Math.round(lastTouch.width)}×${Math.round(lastTouch.height)}px` : '—'}
        </span>
        <button
          type="button"
          onClick={testVibration}
          className="min-h-10 shrink-0 rounded-full bg-surface-raised px-3 text-text-primary"
        >
          {t.debug.testVibration}
        </button>
      </div>
      <p>
        {t.debug.test}: {testResult}
      </p>
      <ol>
        {events.slice(0, 4).map((event) => (
          <li key={event.id}>
            {describeGestureEvent(event, t)}
            {event.vibrated !== undefined && ` · ${event.vibrated ? t.gesture.vibrated : t.gesture.notVibrated}`}
          </li>
        ))}
      </ol>
    </aside>
  )
}
