import { KeepAwake } from '@capacitor-community/keep-awake'
import { useEffect } from 'react'
import { isNativeApp } from './platform'

/**
 * Keeps the screen on while `enabled` — a watch that dims and locks would hide the face
 * and stop the gesture. Android app: native KeepAwake. Browser: Screen Wake Lock API
 * (re-requested on return, since the browser releases it when the tab is hidden).
 */
export function useKeepAwake(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return

    if (isNativeApp()) {
      void KeepAwake.keepAwake()
      return () => void KeepAwake.allowSleep()
    }

    if (!('wakeLock' in navigator)) return
    let sentinel: WakeLockSentinel | null = null
    let released = false

    const request = async () => {
      try {
        sentinel = await navigator.wakeLock.request('screen')
      } catch {
        // Denied (battery saver, hidden tab…): the watch still works, it may just dim.
      }
    }
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && !released) void request()
    }

    void request()
    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      released = true
      document.removeEventListener('visibilitychange', handleVisibility)
      void sentinel?.release()
    }
  }, [enabled])
}
