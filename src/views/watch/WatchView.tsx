import { useCallback, useEffect, type ReactNode } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { routes } from '../../app/routes'
import { Card } from '../../components/ui/Card'
import { SegmentedControl } from '../../components/ui/SegmentedControl'
import { Switch } from '../../components/ui/Switch'
import { WatchDevice } from '../../components/watch/WatchDevice'
import { WatchScreen } from '../../components/watch/WatchScreen'
import { watchShapeLabels, type WatchShape } from '../../components/watch/watchShape'
import { AlertDiagnostics } from '../../features/alert/AlertDiagnostics'
import { activateAlert, stopAlertFromGesture, useAlertSession } from '../../features/alert/alertSessionStore'
import { GestureDiagnostics } from '../../features/gesture/GestureDiagnostics'
import { MobileDebugPanel } from '../../features/gesture/MobileDebugPanel'
import { useLongPress } from '../../features/gesture/useLongPress'
import { usePanicGesture } from '../../features/gesture/usePanicGesture'
import { updateSettings, useSettings } from '../../features/settings/settingsStore'
import { useWatchDisplayMode } from '../../features/watch/useWatchDisplayMode'
import { WatchFace } from '../../features/watch-face/WatchFace'
import { isDebugEnabled } from '../../lib/debug'
import { canVibrate } from '../../lib/haptics'
import { isNativeApp } from '../../lib/platform'
import { useKeepAwake } from '../../lib/useKeepAwake'
import { useNow } from '../../lib/useNow'
import { DemoTelegramPreview } from './DemoTelegramPreview'

const shapeOptions = (Object.keys(watchShapeLabels) as WatchShape[]).map((value) => ({
  value,
  label: watchShapeLabels[value],
}))

const WATCH_THEME_COLOR = '#000000'

/** Hidden way back to Settings: a press this long is never a tap, so it cannot trigger an alert. */
const SETTINGS_PRESS_MS = 2000

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

type SurfaceHandlers = ReturnType<typeof usePanicGesture>['handlers']

/** Double tap (alert) and long press (settings) on the same touch layer. */
function useWatchGestures(panic: SurfaceHandlers, onLongPress: () => void): SurfaceHandlers {
  const longPress = useLongPress(onLongPress, SETTINGS_PRESS_MS)
  return {
    ...panic,
    onPointerDown: (event) => (panic.onPointerDown(event), longPress.onPointerDown(event)),
    onPointerMove: (event) => (panic.onPointerMove(event), longPress.onPointerMove(event)),
    onPointerUp: (event) => (panic.onPointerUp(event), longPress.onPointerUp()),
    onPointerCancel: (event) => (panic.onPointerCancel(event), longPress.onPointerCancel()),
  }
}

type TouchSurfaceProps = {
  handlers: SurfaceHandlers
  blinkKey: number
  children: ReactNode
}

// Full-screen touch layer over the watch display. Remounting the content with a new key
// replays the subtle blink used as visual confirmation.
function TouchSurface({ handlers, blinkKey, children }: TouchSurfaceProps) {
  return (
    <div className="absolute inset-0 touch-manipulation" {...handlers}>
      <div key={blinkKey} className={blinkKey > 0 ? 'size-full animate-subtle-blink' : 'size-full'}>
        {children}
      </div>
    </div>
  )
}

export function WatchView() {
  const { watchShape, demoMode, onboarded } = useSettings()
  const navigate = useNavigate()
  const displayMode = useWatchDisplayMode()
  const now = useNow()
  const isFullscreen = displayMode === 'fullscreen'

  useThemeColor(WATCH_THEME_COLOR, isFullscreen)
  useKeepAwake(isFullscreen)

  const alertSession = useAlertSession()

  // The face never changes when the alert starts: only the discreet confirmation is felt.
  const { handlers: panicHandlers, events, blinkKey } = usePanicGesture({
    onActivate: activateAlert,
    onTripleTap: stopAlertFromGesture,
    alwaysBlink: !isFullscreen,
  })
  const openSettings = useCallback(() => navigate(routes.settings), [navigate])
  const handlers = useWatchGestures(panicHandlers, openSettings)

  // First launch of the app: contacts and permissions come before the watch.
  if (isNativeApp() && !onboarded) return <Navigate to={routes.settings} replace />

  if (isFullscreen) {
    return (
      <main className="fixed inset-0 grid place-items-center overflow-hidden bg-watch-face animate-fade-in">
        <WatchScreen shape={watchShape} className="size-watch-fullscreen ring-1 ring-watch-track">
          <TouchSurface handlers={handlers} blinkKey={blinkKey}>
            <WatchFace now={now} />
          </TouchSurface>
        </WatchScreen>
        {isDebugEnabled() && <MobileDebugPanel events={events} />}
      </main>
    )
  }

  return (
    <main className="mx-auto flex max-w-content flex-col items-center gap-section px-gutter pb-section animate-screen-in">
      <WatchDevice shape={watchShape}>
        <TouchSurface handlers={handlers} blinkKey={blinkKey}>
          <WatchFace now={now} />
        </TouchSurface>
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

      <GestureDiagnostics events={events} hapticsAvailable={canVibrate()} />
      <AlertDiagnostics session={alertSession} now={now} />
      <DemoTelegramPreview session={alertSession} now={now.getTime()} />
    </main>
  )
}
