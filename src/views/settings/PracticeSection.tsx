import { Hand } from 'lucide-react'
import { useCallback, useState } from 'react'
import { Card } from '../../components/ui/Card'
import { WatchScreen } from '../../components/watch/WatchScreen'
import { describeGestureEvent } from '../../features/gesture/gestureLabels'
import { usePanicGesture } from '../../features/gesture/usePanicGesture'
import { useSettings } from '../../features/settings/settingsStore'
import { useT } from '../../i18n/useT'
import { cx } from '../../lib/cx'

// Practice pad: the exact same detector and vibration as the watch, but recognizing the
// gesture only counts it. It never starts an alert.
export function PracticeSection() {
  const t = useT()
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
    <Card title={t.practice.title} icon={<Hand size={20} />} className="flex flex-col gap-4">
      <p className="text-body-sm text-text-secondary">
        <b>{t.practice.intro[0]}</b>
        {t.practice.intro[1]}
        <b>{t.practice.intro[2]}</b>
        {t.practice.intro[3]}
        <b>{t.practice.intro[4]}</b>
        {t.practice.intro[5]}
      </p>
      <WatchScreen shape={watchShape} className="size-48 self-center ring-1 ring-watch-track">
        <div className="absolute inset-0 touch-manipulation" {...handlers}>
          <div key={blinkKey} className={cx('grid size-full place-items-center', blinkKey > 0 && 'animate-subtle-blink')}>
            <span className="text-body-sm text-watch-muted">{t.practice.pad}</span>
          </div>
        </div>
      </WatchScreen>
      <p className="text-center text-body-sm" aria-live="polite">
        {last ? (
          <span className={last.type === 'double-tap' || last.type === 'triple-tap' ? 'text-success' : last.type === 'rejected' ? 'text-warning' : ''}>
            {describeGestureEvent(last, t)}
          </span>
        ) : (
          <span className="text-text-secondary">{t.gesture.noTaps}</span>
        )}
        <span className="block text-caption text-text-secondary">
          {t.practice.counts(recognized.double, recognized.triple)}
        </span>
      </p>
    </Card>
  )
}
