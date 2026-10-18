import { isNativeApp } from '../../lib/platform'
import { checkNativeCapturePermissions, ensureNativeCapturePermissions } from '../alert/nativeCapture'

// Microphone and location permissions, asked in Settings and never at the moment of the
// alert (a dialog then would give the gesture away). The alert is sent even without them.

export type PermissionStatus = 'granted' | 'denied' | 'prompt' | 'unknown'
export type CapturePermissionStatus = { microphone: PermissionStatus; location: PermissionStatus }

const normalize = (state: string | undefined): PermissionStatus =>
  state === 'granted' || state === 'denied' ? state : state?.startsWith('prompt') ? 'prompt' : 'unknown'

async function queryWebPermission(name: 'microphone' | 'geolocation'): Promise<PermissionStatus> {
  try {
    // 'microphone' is missing from the TS PermissionName union and from Firefox.
    const status = await navigator.permissions.query({ name: name as PermissionName })
    return normalize(status.state)
  } catch {
    return 'unknown'
  }
}

export async function checkCapturePermissions(): Promise<CapturePermissionStatus> {
  if (isNativeApp()) {
    const status = await checkNativeCapturePermissions()
    return { microphone: normalize(status.microphone), location: normalize(status.location) }
  }
  const [microphone, location] = await Promise.all([queryWebPermission('microphone'), queryWebPermission('geolocation')])
  return { microphone, location }
}

/** Shows the permission dialogs; resolves with the new state (never throws). */
export async function requestCapturePermissions(): Promise<CapturePermissionStatus> {
  if (isNativeApp()) {
    await ensureNativeCapturePermissions().catch(() => {})
    return checkCapturePermissions()
  }
  // Browsers only prompt when the API is used: open the mic for a moment and ask for one fix.
  await navigator.mediaDevices
    ?.getUserMedia({ audio: true })
    .then((stream) => stream.getTracks().forEach((track) => track.stop()))
    .catch(() => {})
  await new Promise<void>((resolve) =>
    navigator.geolocation.getCurrentPosition(
      () => resolve(),
      () => resolve(),
      { timeout: 15_000 },
    ),
  )
  return checkCapturePermissions()
}
