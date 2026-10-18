import { useId, type ReactNode } from 'react'
import { cx } from '../../lib/cx'

type ProgressRingTone = 'brand' | 'watch' | 'danger'

type ProgressRingProps = {
  /** Progress between 0 and 1. */
  value: number
  tone?: ProgressRingTone
  /** Stroke width in viewBox units (the ring is drawn in a 100×100 box). */
  thickness?: number
  /** Size comes from the parent through classes, e.g. "size-32". */
  className?: string
  label?: string
  children?: ReactNode
}

const VIEWBOX = 100

const trackClasses: Record<ProgressRingTone, string> = {
  brand: 'stroke-surface-raised',
  watch: 'stroke-watch-track',
  danger: 'stroke-surface-raised',
}

const indicatorClasses: Record<Exclude<ProgressRingTone, 'brand'>, string> = {
  watch: 'stroke-watch-activity',
  danger: 'stroke-danger',
}

export function ProgressRing({
  value,
  tone = 'brand',
  thickness = 10,
  className,
  label,
  children,
}: ProgressRingProps) {
  const gradientId = useId()
  const clamped = Math.min(Math.max(value, 0), 1)
  const radius = (VIEWBOX - thickness) / 2
  const circumference = 2 * Math.PI * radius

  return (
    <div
      className={cx('relative inline-grid place-items-center', className)}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped * 100)}
    >
      <svg viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`} className="absolute inset-0 size-full -rotate-90">
        {tone === 'brand' && (
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--color-gradient-from)" />
              <stop offset="100%" stopColor="var(--color-gradient-to)" />
            </linearGradient>
          </defs>
        )}
        <circle
          cx={VIEWBOX / 2}
          cy={VIEWBOX / 2}
          r={radius}
          fill="none"
          strokeWidth={thickness}
          className={trackClasses[tone]}
        />
        <circle
          cx={VIEWBOX / 2}
          cy={VIEWBOX / 2}
          r={radius}
          fill="none"
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - clamped)}
          stroke={tone === 'brand' ? `url(#${gradientId})` : undefined}
          className={cx(
            'transition-[stroke-dashoffset] duration-700 ease-out-soft',
            tone !== 'brand' && indicatorClasses[tone],
          )}
        />
      </svg>
      {children && <div className="relative text-center">{children}</div>}
    </div>
  )
}
