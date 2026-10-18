import { CloudSun, Footprints, Heart } from 'lucide-react'
import { ProgressRing } from '../../components/ui/ProgressRing'
import { formatWatchDate, formatWatchTime } from '../../lib/formatDate'
import { getWatchData } from './simulatedWatchData'

type WatchFaceProps = {
  now: Date
}

const stepsFormat = new Intl.NumberFormat('es-CO')

// Idle face: deliberately an ordinary watch (time, date, weather, steps, heart rate) in
// neutral colors. Nothing here hints at the panic button.
export function WatchFace({ now }: WatchFaceProps) {
  const data = getWatchData(now)
  const time = formatWatchTime(now)

  return (
    <div className="absolute inset-watch-inset flex flex-col items-center justify-center gap-watch-gap text-center">
      <p className="flex items-center gap-1 text-watch-label text-watch-muted">
        <CloudSun className="size-watch-icon" aria-hidden="true" />
        <span>{data.temperature}°</span>
      </p>

      <p className="text-watch-date text-watch-muted first-letter:uppercase">{formatWatchDate(now)}</p>

      <time
        dateTime={now.toISOString()}
        aria-label={`Hora ${time}`}
        className="text-watch-time font-semibold tracking-tight tabular-nums"
      >
        {time}
      </time>

      <div className="mt-1 flex items-center gap-watch-gap text-watch-label">
        <ProgressRing
          value={data.stepGoalProgress}
          tone="watch"
          thickness={12}
          className="size-watch-ring text-watch-activity"
          label="Meta de pasos"
        >
          <Footprints className="size-watch-icon" aria-hidden="true" />
        </ProgressRing>
        <div className="text-left">
          <p className="font-medium tabular-nums">{stepsFormat.format(data.steps)}</p>
          <p className="text-watch-muted">pasos</p>
        </div>
        <p className="flex items-center gap-1 tabular-nums">
          <Heart className="size-watch-icon text-watch-muted" aria-hidden="true" />
          {data.heartRate}
        </p>
      </div>
    </div>
  )
}
