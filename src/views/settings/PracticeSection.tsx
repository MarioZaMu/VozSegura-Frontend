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
  const [recognized, setRecognized] = useState(0)
  const onActivate = useCallback(() => setRecognized((count) => count + 1), [])
  const { handlers, events, blinkKey } = usePanicGesture({ onActivate, alwaysBlink: true })
  const last = events[0]

  return (
    <Card title="Practicar el gesto" icon={<Hand size={20} />} className="flex flex-col gap-4">
      <p className="text-body-sm text-text-secondary">
        Haz doble toque en el círculo, como en el reloj. Sentirás la misma vibración, pero aquí <b>no se envía ninguna alerta</b>.
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
          <span className={last.type === 'double-tap' ? 'text-success' : last.type === 'rejected' ? 'text-warning' : ''}>
            {describeGestureEvent(last)}
          </span>
        ) : (
          <span className="text-text-secondary">Aún no hay toques.</span>
        )}
        <span className="block text-caption text-text-secondary">
          {recognized} reconocido{recognized === 1 ? '' : 's'}
        </span>
      </p>
    </Card>
  )
}
