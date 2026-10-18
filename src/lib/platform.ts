import { Capacitor } from '@capacitor/core'

/** True inside the Capacitor Android app, false in any browser (PC or phone). */
export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform()
}
