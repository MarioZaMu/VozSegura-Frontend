// Runtime configuration read from Vite env variables (see .env.example).
// Only public values belong here: anything prefixed with VITE_ ends up in the bundle.
export const config = {
  apiBaseUrl: (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, ''),
  /**
   * Shared token for the backend write endpoints. It ships inside the app, so it only keeps
   * out casual abuse (documented limitation; per-device keys are a later improvement).
   */
  alertApiToken: import.meta.env.VITE_ALERT_API_TOKEN ?? '',
} as const

/** Real alerts need both values; without them only demo mode works. */
export function isBackendConfigured(): boolean {
  return config.apiBaseUrl !== '' && config.alertApiToken !== ''
}
