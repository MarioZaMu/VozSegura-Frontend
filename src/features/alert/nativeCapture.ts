import { registerPlugin, type PluginListenerHandle } from '@capacitor/core'
import type { AlertCapture, CaptureEvent, CaptureListener, CaptureOptions } from './alertCapture'

// Android app capture: AlertCapturePlugin starts AlertCaptureService (foreground service),
// which keeps recording and tracking location with the screen locked. The service enforces
// maxDurationSeconds itself because this JS may be paused while the screen is off.

type PermissionState = 'granted' | 'denied' | 'prompt' | 'prompt-with-rationale'
type CapturePermissions = { microphone: PermissionState; location: PermissionState }

type AlertCapturePlugin = {
  start(options: CaptureOptions): Promise<void>
  stop(): Promise<void>
  getStatus(): Promise<{ running: boolean; alertId: string | null; chunkCount: number }>
  checkPermissions(): Promise<CapturePermissions>
  requestPermissions(options?: { permissions: (keyof CapturePermissions)[] }): Promise<CapturePermissions>
  addListener(eventName: 'captureEvent', listener: (event: CaptureEvent) => void): Promise<PluginListenerHandle>
}

const NativeAlertCapture = registerPlugin<AlertCapturePlugin>('AlertCapture')

export function checkNativeCapturePermissions(): Promise<CapturePermissions> {
  return NativeAlertCapture.checkPermissions()
}

/** Asks for microphone and location (from Settings, never at the moment of the alert). */
export async function ensureNativeCapturePermissions(): Promise<CapturePermissions> {
  const current = await NativeAlertCapture.checkPermissions()
  if (current.microphone === 'granted' && current.location === 'granted') return current
  return NativeAlertCapture.requestPermissions({ permissions: ['microphone', 'location'] })
}

export function createNativeCapture(): AlertCapture {
  let handle: PluginListenerHandle | null = null

  return {
    kind: 'native',

    async start(options: CaptureOptions, listener: CaptureListener) {
      handle = await NativeAlertCapture.addListener('captureEvent', (event) => {
        listener(event)
        if (event.type === 'stopped') {
          void handle?.remove()
          handle = null
        }
      })
      try {
        await NativeAlertCapture.start(options)
      } catch {
        listener({ type: 'error', source: 'microphone', message: 'Android no permitió iniciar la captura' })
        listener({ type: 'error', source: 'location', message: 'Android no permitió iniciar la captura' })
        listener({ type: 'stopped', reason: 'error' })
      }
    },

    async stop() {
      // The service answers with the last chunk and a 'stopped' event.
      await NativeAlertCapture.stop()
    },
  }
}
