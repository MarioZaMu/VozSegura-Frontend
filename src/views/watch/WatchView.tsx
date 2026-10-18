import { useEffect } from 'react'
import { Card } from '../../components/ui/Card'
import { SegmentedControl } from '../../components/ui/SegmentedControl'
import { Switch } from '../../components/ui/Switch'
import { WatchDevice } from '../../components/watch/WatchDevice'
import { WatchScreen } from '../../components/watch/WatchScreen'
import { watchShapeLabels, type WatchShape } from '../../components/watch/watchShape'
import { updateSettings, useSettings } from '../../features/settings/settingsStore'
import { useWatchDisplayMode } from '../../features/watch/useWatchDisplayMode'
import { WatchFace } from '../../features/watch-face/WatchFace'
import { useNow } from '../../lib/useNow'

const shapeOptions = (Object.keys(watchShapeLabels) as WatchShape[]).map((value) => ({
  value,
  label: watchShapeLabels[value],
}))

const WATCH_THEME_COLOR = '#000000'

// Paints the phone's status bar black while the full-screen watch is shown.
function useThemeColor(color: string, enabled: boolean) {
  useEffect(() => {
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
    if (!enabled || !meta) return
    const previous = meta.content
    meta.content = color
    return () => {
      meta.content = previous
    }
  }, [color, enabled])
}

export function WatchView() {
  const { watchShape, demoMode } = useSettings()
  const displayMode = useWatchDisplayMode()
  const now = useNow()
  const isFullscreen = displayMode === 'fullscreen'

  useThemeColor(WATCH_THEME_COLOR, isFullscreen)

  if (isFullscreen) {
    return (
      <main className="fixed inset-0 grid place-items-center overflow-hidden bg-watch-face animate-fade-in">
        <WatchScreen shape={watchShape} className="size-watch-fullscreen ring-1 ring-watch-track">
          <WatchFace now={now} />
        </WatchScreen>
      </main>
    )
  }

  return (
    <main className="mx-auto flex max-w-content flex-col items-center gap-section px-gutter pb-section animate-screen-in">
      <WatchDevice shape={watchShape}>
        <WatchFace now={now} />
      </WatchDevice>

      <Card className="flex w-full flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <span className="text-body-sm font-medium">Forma</span>
          <SegmentedControl
            label="Forma del reloj"
            options={shapeOptions}
            value={watchShape}
            onChange={(shape) => updateSettings({ watchShape: shape })}
          />
        </div>
        <Switch
          label="Modo demo"
          description={
            demoMode
              ? 'Micrófono, ubicación, IA y envío simulados.'
              : 'Usa micrófono, ubicación y envío reales.'
          }
          checked={demoMode}
          onChange={(checked) => updateSettings({ demoMode: checked })}
        />
      </Card>
    </main>
  )
}
