import { Haptics } from '@capacitor/haptics'
import { isNativeApp } from './platform'

// Discreet haptic feedback.
// - Android app: native vibrator through @capacitor/haptics (does not depend on Chrome).
// - Browser: Vibration API. Exists on Android Chrome but not on iPhone (Safari), so callers
//   get `false` back and must use the visual fallback instead.

/**
 * Patterns in ms (vibrate, pause, vibrate…). Short and soft: felt, not heard. Pulses are at
 * least ~50 ms because cheap vibration motors need that long just to spin up (35 ms was
 * accepted by the browser but not felt on a real phone).
 */
export const hapticPatterns = {
  /** Gesture recognized, alert activated. */
  confirm: [80],
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

/** Plays a vibrate/pause pattern with the native plugin, which only takes one duration. */
function vibrateNative(pattern: readonly number[]): void {
  let delay = 0
  pattern.forEach((duration, index) => {
    if (index % 2 === 0) window.setTimeout(() => void Haptics.vibrate({ duration }), delay)
    delay += duration
  })
}

/** Returns true if the device accepted the vibration. */
export function vibrate(pattern: readonly number[]): boolean {
  if (isNativeApp()) {
    vibrateNative(pattern)
    return true
  }
  if (!canVibrate()) return false
  try {
    return navigator.vibrate([...pattern])
  } catch {
    return false
  }
}
