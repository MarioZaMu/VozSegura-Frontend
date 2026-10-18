import type { ReactNode } from 'react'
import { cx } from '../../lib/cx'
import { watchShapeRadius, type WatchShape } from './watchShape'

type WatchScreenProps = {
  shape: WatchShape
  /** Size classes; defaults to the PC mockup screen. */
  className?: string
  children?: ReactNode
}

// The watch display. It is a size container, so watch text tokens (cqi units) scale with
// it: the same face works inside the PC mockup and full screen on a phone.
export function WatchScreen({ shape, className = 'size-watch-screen', children }: WatchScreenProps) {
  return (
    <div
      className={cx(
        '@container relative overflow-hidden bg-watch-face text-watch-text select-none',
        'transition-[border-radius] duration-500 ease-in-out-soft',
        watchShapeRadius[shape],
        className,
      )}
    >
      {children}
    </div>
  )
}
