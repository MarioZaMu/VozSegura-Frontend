import { isNativeApp } from './platform'

/**
 * Makes the web app installable and lets the watch open offline (public/sw.js). Production
 * web only: in dev it would serve stale modules, and the Android app already ships its files.
 */
export function registerServiceWorker(): void {
  if (!import.meta.env.PROD || isNativeApp() || !('serviceWorker' in navigator)) return
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}
