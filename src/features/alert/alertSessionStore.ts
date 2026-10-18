import { useSyncExternalStore } from 'react'
import { config, isBackendConfigured } from '../../lib/config'
import { getDeviceId } from '../../lib/deviceId'
import { isNativeApp } from '../../lib/platform'
import { getSettings } from '../settings/settingsStore'
import { defaultCaptureOptions, type AlertCapture, type CaptureEvent, type StopReason } from './alertCapture'
import { alertSessionReducer, initialAlertSession, type AlertAction, type AlertSession } from './alertSession'
import { recordAlert } from './alertHistory'
import { createDemoCapture } from './demoCapture'
import { createNativeCapture, isNativeCaptureRunning, stopNativeCapture } from './nativeCapture'
import { createWebCapture } from './webCapture'
import { withWebDelivery } from './webDelivery'

// Wires the pure reducer to the capture implementations. Module-level so the alert keeps
// running if the watch view re-renders or the route changes.

function createCapture(): AlertCapture {
  if (getSettings().demoMode) return createDemoCapture()
  return isNativeApp() ? createNativeCapture() : createWebCapture()
}

let session: AlertSession = initialAlertSession
let capture: AlertCapture | null = null
let maxDurationTimer: number | undefined
const listeners = new Set<() => void>()

function dispatch(action: AlertAction) {
  const next = alertSessionReducer(session, action)
  if (next === session) return
  session = next
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getAlertSession(): AlertSession {
  return session
}

/** Starts an alert. Ignored while another one is running (the reducer guards it too). */
export function activateAlert(): void {
  if (session.status === 'active') return
  const alertId = crypto.randomUUID()
  const startedAt = Date.now()
  const current = createCapture()
  capture = current
  // Demo mode never sends anything; real captures need the backend URL and token.
  const delivers = current.kind !== 'demo' && isBackendConfigured()
  dispatch({ type: 'activate', alertId, kind: current.kind, time: startedAt, delivers })
  recordAlert({ alertId, startedAt, kind: current.kind, delivered: delivers })

  // Events from a previous alert's capture must not leak into this one.
  const onEvent = (event: CaptureEvent) => {
    if (session.alertId !== alertId) return
    dispatch({ type: 'capture', event, time: Date.now() })
    if (event.type === 'stopped') window.clearTimeout(maxDurationTimer)
  }
  // The Android service sends everything itself (JS pauses with the screen off); the
  // browser capture is wrapped so JS sends it.
  const listener = delivers && current.kind === 'web' ? withWebDelivery(alertId, startedAt, onEvent) : onEvent
  const backend =
    delivers && current.kind === 'native'
      ? { apiBaseUrl: config.apiBaseUrl, apiToken: config.alertApiToken, deviceId: getDeviceId() }
      : {}
  void current.start({ alertId, startedAt, ...defaultCaptureOptions, ...backend }, listener)

  // The native service enforces the limit itself (this JS may be paused with the screen off).
  if (current.kind !== 'native') {
    maxDurationTimer = window.setTimeout(() => stopAlert('max-duration'), defaultCaptureOptions.maxDurationSeconds * 1000)
  }
}

export async function stopAlert(reason: StopReason = 'user'): Promise<void> {
  if (session.status !== 'active' || !capture) return
  window.clearTimeout(maxDurationTimer)
  const current = capture
  await current.stop()
  // The native service reports 'stopped' itself; demo and web stop synchronously.
  if (current.kind !== 'native') dispatch({ type: 'capture', event: { type: 'stopped', reason }, time: Date.now() })
}

/** The triple tap that stops an alert only counts once the alert is this old, so an
 *  accidental triple tap cannot activate and immediately stop it. */
export const MIN_ALERT_AGE_TO_STOP_MS = 3000

// The Android service may still be recording an alert started before the app was reopened
// (this JS session knows nothing about it). Checked once at startup.
let orphanNativeAlert = false
if (isNativeApp()) {
  isNativeCaptureRunning().then(
    (running) => (orphanNativeAlert = running),
    () => {},
  )
}

/** Triple tap on the watch. Returns true when it stopped an alert. */
export function stopAlertFromGesture(now = Date.now()): boolean {
  if (session.status === 'active' && session.startedAt !== null) {
    if (now - session.startedAt < MIN_ALERT_AGE_TO_STOP_MS) return false
    void stopAlert('user')
    return true
  }
  if (orphanNativeAlert) {
    orphanNativeAlert = false
    void stopNativeCapture().catch(() => {})
    return true
  }
  return false
}

export function useAlertSession(): AlertSession {
  return useSyncExternalStore(subscribe, getAlertSession)
}
