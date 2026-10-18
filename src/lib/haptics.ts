import { registerPlugin } from '@capacitor/core'
import { isNativeApp } from './platform'

// Discreet haptic feedback.
// - Android app: local native plugin `DiscreetHaptics` (android/…/DiscreetHapticsPlugin.java)
//   that vibrates with the ALARM usage. @capacitor/haptics and the browser vibrate as
//   "touch feedback", which Android silently drops (IGNORED_FOR_SETTINGS) when touch
//   vibration is off in the phone settings — exactly what happened on a Xiaomi.
// - Browser: Vibration API. Exists on Android Chrome but not on iPhone (Safari), so callers
//   get `false` back and must use the visual fallback instead.

type DiscreetHapticsPlugin = {
  vibrate(options: { pattern: number[] }): Promise<{ vibrated: boolean }>
}

const DiscreetHaptics = registerPlugin<DiscreetHapticsPlugin>('DiscreetHaptics')

/**
 * Patterns in ms (vibrate, pause, vibrate…). Short and soft: felt, not heard. Pulses are at
 * least ~50 ms because cheap vibration motors need that long just to spin up.
 */
export const hapticPatterns = {
  /** Gesture recognized, alert activated. */
  confirm: [80],
  /** Triple tap: alert stopped. Two pulses, clearly different from the single confirm. */
  stopped: [70, 120, 70],
  /** Alert sent to contacts. */
  sent: [50, 100, 50],
  /** Alert cancelled (false alarm). */
  cancelled: [120],
  /** Something failed: longer so it is not mistaken for a confirmation. */
  error: [150, 100, 150],
} as const

export function canVibrate(): boolean {
  if (isNativeApp()) return true
  return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function'
}

/** Returns true if the device accepted the vibration (optimistic in the app: async call). */
export function vibrate(pattern: readonly number[]): boolean {
  if (isNativeApp()) {
    DiscreetHaptics.vibrate({ pattern: [...pattern] }).catch(() => {
      // A failed confirmation must never break the alert flow.
    })
    return true
  }
  if (!canVibrate()) return false
  try {
    return navigator.vibrate([...pattern])
  } catch {
    return false
  }
}
