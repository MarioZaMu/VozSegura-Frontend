import { useId } from 'react'
import { cx } from '../../lib/cx'

type LogoProps = {
  /** Mark only (shield), or mark + "Voz Segura". */
  variant?: 'mark' | 'full'
  className?: string
}

// Brand mark: gradient shield with a voice wave (same drawing as public/favicon.svg and the
// Android icon). Only in Settings and the contact view — never on the watch, which must not
// give the app away.
export function Logo({ variant = 'full', className }: LogoProps) {
  const gradientId = useId()
  const mark = (
    <svg viewBox="120 92 272 332" className="h-8 w-auto shrink-0" aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--color-gradient-from)" />
          <stop offset="1" stopColor="var(--color-gradient-to)" />
        </linearGradient>
      </defs>
      <path
        d="M256 96 L384 142 C388 236 382 300 352 344 C326 382 292 404 256 420 C220 404 186 382 160 344 C130 300 124 236 128 142 Z"
        fill={`url(#${gradientId})`}
        stroke="var(--color-white)"
        strokeOpacity="0.18"
        strokeWidth="6"
      />
      <g fill="var(--color-white)">
        <rect x="182" y="232" width="22" height="44" rx="11" />
        <rect x="218" y="200" width="22" height="108" rx="11" />
        <rect x="248" y="168" width="22" height="172" rx="11" />
        <rect x="278" y="200" width="22" height="108" rx="11" />
        <rect x="308" y="232" width="22" height="44" rx="11" />
      </g>
    </svg>
  )

  if (variant === 'mark') return <span className={cx('inline-flex', className)} role="img" aria-label="Voz Segura">{mark}</span>

  return (
    <span className={cx('inline-flex items-center gap-2 text-title font-bold', className)}>
      {mark}
      <span>
        Voz <span className="text-brand-gradient">Segura</span>
      </span>
    </span>
  )
}
