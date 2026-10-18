import { Hand } from 'lucide-react'
import { useCallback, useState } from 'react'
import { Card } from '../../components/ui/Card'
import { WatchScreen } from '../../components/watch/WatchScreen'
import { describeGestureEvent } from '../../features/gesture/gestureLabels'
import { usePanicGesture } from '../../features/gesture/usePanicGesture'
import { useSettings } from '../../features/settings/settingsStore'
import { cx } from '../../lib/cx'

// Practice pad: the exact same detector and vibration as the watch, but recognizing the
// gesture only counts it. It never starts an alert.
export function PracticeSection() {
  const { watchShape } = useSettings()
  const [recognized, setRecognized] = useState({ double: 0, triple: 0 })
  const onActivate = useCallback(() => setRecognized((count) => ({ ...count, double: count.double + 1 })), [])
  const onTripleTap = useCallback(() => {
    setRecognized((count) => ({ ...count, triple: count.triple + 1 }))
    return true // vibrate exactly like a real stop
  }, [])
  const { handlers, events, blinkKey } = usePanicGesture({ onActivate, onTripleTap, alwaysBlink: true })
  const last = events[0]

  return (
    <Card title="Practicar el gesto" icon={<Hand size={20} />} className="flex flex-col gap-4">
      <p className="text-body-sm text-text-secondary">
        <b>Doble toque</b> activa la alerta (una vibración). <b>Triple toque</b>, con la alerta activa, la detiene (dos
        vibraciones). Pruébalos aquí: sentirás lo mismo que en el reloj, pero <b>no se envía ninguna alerta</b>.
      </p>
      <WatchScreen shape={watchShape} className="size-48 self-center ring-1 ring-watch-track">
        <div className="absolute inset-0 touch-manipulation" {...handlers}>
          <div key={blinkKey} className={cx('grid size-full place-items-center', blinkKey > 0 && 'animate-subtle-blink')}>
            <span className="text-body-sm text-watch-muted">Toca dos veces</span>
          </div>
        </div>
      </WatchScreen>
      <p className="text-center text-body-sm" aria-live="polite">
        {last ? (
          <span className={last.type === 'double-tap' || last.type === 'triple-tap' ? 'text-success' : last.type === 'rejected' ? 'text-warning' : ''}>
            {describeGestureEvent(last)}
          </span>
        ) : (
          <span className="text-text-secondary">Aún no hay toques.</span>
        )}
        <span className="block text-caption text-text-secondary">
          Dobles: {recognized.double} · Triples: {recognized.triple}
        </span>
      </p>
    </Card>
  )
}
