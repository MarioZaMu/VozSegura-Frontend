import { Check, Hand, X } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { useLanguage, useT } from '../../i18n/useT'
import { cx } from '../../lib/cx'
import { formatClock } from '../../lib/formatDate'
import type { GestureEvent } from './doubleTapDetector'
import { describeGestureEvent } from './gestureLabels'

export type LoggedGestureEvent = GestureEvent & {
  id: number
  at: Date
  /** Result of navigator.vibrate for double taps (false = the browser refused). */
  vibrated?: boolean
}

type GestureDiagnosticsProps = {
  events: LoggedGestureEvent[]
  hapticsAvailable: boolean
}

// PC-only panel: shows how each touch on the watch was interpreted. Useful for the demo
// and for usability tests; it never appears on the phone.
export function GestureDiagnostics({ events, hapticsAvailable }: GestureDiagnosticsProps) {
  const t = useT()
  const language = useLanguage()
  const doubleTaps = events.filter((event) => event.type === 'double-tap').length

  return (
    <Card title={t.gesture.diagnosticsTitle} icon={<Hand size={20} />} className="w-full">
      <p className="mb-3 text-body-sm text-text-secondary">
        {t.gesture.diagnosticsIntro(doubleTaps, hapticsAvailable)}
      </p>
      {events.length === 0 ? (
        <p className="text-body-sm text-text-secondary">{t.gesture.noTaps}</p>
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
              <span className="flex-1">
                {describeGestureEvent(event, t)}
                {event.vibrated !== undefined && (
                  <span className="text-text-secondary"> · {event.vibrated ? t.gesture.vibrated : t.gesture.notVibrated}</span>
                )}
              </span>
              <time className="text-caption text-text-secondary tabular-nums">{formatClock(event.at, language)}</time>
            </li>
          ))}
        </ol>
      )}
    </Card>
  )
}
