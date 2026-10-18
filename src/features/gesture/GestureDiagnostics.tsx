import { Check, Hand, X } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { cx } from '../../lib/cx'
import type { GestureEvent } from './doubleTapDetector'
import { describeGestureEvent } from './gestureLabels'

export type LoggedGestureEvent = GestureEvent & { id: number; at: Date }

type GestureDiagnosticsProps = {
  events: LoggedGestureEvent[]
  hapticsAvailable: boolean
}

const clockFormat = new Intl.DateTimeFormat('es-CO', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
})

// PC-only panel: shows how each touch on the watch was interpreted. Useful for the demo
// and for usability tests; it never appears on the phone.
export function GestureDiagnostics({ events, hapticsAvailable }: GestureDiagnosticsProps) {
  const doubleTaps = events.filter((event) => event.type === 'double-tap').length

  return (
    <Card title="Gesto" icon={<Hand size={20} />} className="w-full">
      <p className="mb-3 text-body-sm text-text-secondary">
        Haz doble toque en la carátula. {doubleTaps} reconocido{doubleTaps === 1 ? '' : 's'} ·
        vibración {hapticsAvailable ? 'disponible' : 'no disponible (se usa parpadeo)'}.
      </p>
      {events.length === 0 ? (
        <p className="text-body-sm text-text-secondary">Aún no hay toques.</p>
      ) : (
        <ol className="flex flex-col gap-2" aria-live="polite">
          {events.map((event) => (
            <li key={event.id} className="flex items-center gap-3 text-body-sm animate-fade-in">
              <span
                className={cx(
                  'grid size-6 shrink-0 place-items-center rounded-full',
                  event.type === 'double-tap' && 'bg-brand-gradient',
                  event.type === 'rejected' && 'bg-surface-raised text-danger',
                  event.type === 'tap' && 'bg-surface-raised text-text-secondary',
                )}
              >
                {event.type === 'rejected' ? <X size={14} /> : <Check size={14} />}
              </span>
              <span className="flex-1">{describeGestureEvent(event)}</span>
              <time className="text-caption text-text-secondary tabular-nums">{clockFormat.format(event.at)}</time>
            </li>
          ))}
        </ol>
      )}
    </Card>
  )
}
