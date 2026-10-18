import { useEffect, useState } from 'react'
import { canVibrate, vibrate } from '../../lib/haptics'
import type { LoggedGestureEvent } from './GestureDiagnostics'
import { describeGestureEvent } from './gestureLabels'

type MobileDebugPanelProps = {
  events: LoggedGestureEvent[]
}

type TouchInfo = { pointerType: string; width: number; height: number }

function describeActivation(): string {
  const activation = navigator.userActivation
  if (!activation) return 'API no disponible'
  return `activa=${activation.isActive ? 'sí' : 'no'} · alguna vez=${activation.hasBeenActive ? 'sí' : 'no'}`
}

// Only with ?debug=1 on the full-screen watch: lets us see on the phone itself what the
// gesture detector and the Vibration API are doing. Sits above the watch circle so it
// never covers the touch area.
export function MobileDebugPanel({ events }: MobileDebugPanelProps) {
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
    setTestResult(`${accepted ? 'aceptada' : 'rechazada'} · ${describeActivation()}`)
  }

  return (
    <aside className="fixed inset-x-0 top-0 z-10 flex flex-col gap-1 bg-surface p-3 text-caption text-text-secondary">
      <div className="flex items-center justify-between gap-2">
        <span>
          vibrate: {canVibrate() ? 'existe' : 'no existe'} · toque:{' '}
          {lastTouch ? `${lastTouch.pointerType} ${Math.round(lastTouch.width)}×${Math.round(lastTouch.height)}px` : '—'}
        </span>
        <button
          type="button"
          onClick={testVibration}
          className="min-h-10 shrink-0 rounded-full bg-surface-raised px-3 text-text-primary"
        >
          Probar vibración
        </button>
      </div>
      <p>Prueba: {testResult}</p>
      <ol>
        {events.slice(0, 4).map((event) => (
          <li key={event.id}>
            {describeGestureEvent(event)}
            {event.vibrated !== undefined && ` · ${event.vibrated ? 'vibró' : 'sin vibración'}`}
          </li>
        ))}
      </ol>
    </aside>
  )
}
