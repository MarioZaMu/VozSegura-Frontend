import { useSyncExternalStore } from 'react'
import { isNativeApp } from '../../lib/platform'

/**
 * mockup     → PC: the watch is drawn as a device with controls around it.
 * fullscreen → phone (Android app, installed PWA or phone browser): the screen fills the
 *              viewport, black background, nothing else.
 */
export type WatchDisplayMode = 'mockup' | 'fullscreen'

// Installed PWA, or a phone-sized touch screen in the browser.
const FULLSCREEN_QUERY =
  '(display-mode: standalone), (display-mode: fullscreen), (pointer: coarse) and (max-width: 640px)'

const VIEW_PARAM = 'vista'

function getMode(): WatchDisplayMode {
  // The Android app is always the watch itself.
  if (isNativeApp()) return 'fullscreen'
  // Manual override for testing: ?vista=reloj or ?vista=mockup
  const forced = new URLSearchParams(window.location.search).get(VIEW_PARAM)
  if (forced === 'reloj') return 'fullscreen'
  if (forced === 'mockup') return 'mockup'
  return window.matchMedia(FULLSCREEN_QUERY).matches ? 'fullscreen' : 'mockup'
}

function subscribe(onChange: () => void) {
  const query = window.matchMedia(FULLSCREEN_QUERY)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

export function useWatchDisplayMode(): WatchDisplayMode {
  return useSyncExternalStore(subscribe, getMode)
}
