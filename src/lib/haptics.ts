// Discreet haptic feedback. The Vibration API exists on Android Chrome but not on iPhone
// (Safari), so callers get `false` back and must use the visual fallback instead.

/** Patterns in ms (vibrate, pause, vibrate…). Short and soft: felt on the wrist, not heard. */
export const hapticPatterns = {
  /** Gesture recognized, alert activated. */
  confirm: [35],
  /** Alert sent to contacts. */
  sent: [20, 80, 20],
  /** Alert cancelled (false alarm). */
  cancelled: [60],
  /** Something failed: longer so it is not mistaken for a confirmation. */
  error: [120, 100, 120],
} as const

export function canVibrate(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function'
}

/** Returns true if the device accepted the vibration. */
export function vibrate(pattern: readonly number[]): boolean {
  if (!canVibrate()) return false
  try {
    return navigator.vibrate([...pattern])
  } catch {
    return false
  }
}
