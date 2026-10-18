import type { ReactNode } from 'react'
import { useT } from '../../i18n/useT'
import { cx } from '../../lib/cx'
import { WatchScreen } from './WatchScreen'
import { watchShapeRadius, type WatchShape } from './watchShape'

type WatchDeviceProps = {
  shape: WatchShape
  children?: ReactNode
}

const layerTransition = 'transition-[border-radius] duration-500 ease-in-out-soft'

// Smartwatch mockup shown on PC: strap, case, crown, bezel and the screen.
export function WatchDevice({ shape, children }: WatchDeviceProps) {
  const t = useT()
  const radius = watchShapeRadius[shape]

  return (
    <div className="flex flex-col items-center" aria-label={t.watch.device(shape)}>
      <div className="-mb-8 h-24 w-52 rounded-t-lg bg-device-strap" aria-hidden="true" />

      <div className={cx('relative z-10 bg-device-case p-1.5 shadow-device', radius, layerTransition)}>
        <span
          className="absolute top-1/2 -right-2.5 h-14 w-3 -translate-y-1/2 rounded-r-md bg-device-highlight"
          aria-hidden="true"
        />
        <div className={cx('bg-device-bezel p-3', radius, layerTransition)}>
          <WatchScreen shape={shape}>{children}</WatchScreen>
        </div>
      </div>

      <div className="-mt-8 h-24 w-52 rounded-b-lg bg-device-strap" aria-hidden="true" />
    </div>
  )
}
