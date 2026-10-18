import { useSyncExternalStore } from 'react'
import type { WatchShape } from '../../components/watch/watchShape'
import { isNativeApp } from '../../lib/platform'
import { readJson, writeJson } from '../../lib/storage'

export type ThemePreference = 'dark' | 'light' | 'system'
export type LanguagePreference = 'es' | 'en' | 'system'

export type AppSettings = {
  /** Simulates microphone, location, AI and sending so the demo never depends on the room. */
  demoMode: boolean
  watchShape: WatchShape
  /** The Android app opens Settings until the user finishes it once ("Ir al reloj"). */
  onboarded: boolean
  /** Settings and Contact only: the watch face is always dark. */
  theme: ThemePreference
  language: LanguagePreference
}

const STORAGE_KEY = 'voz-segura:settings:v1'

const defaultSettings: AppSettings = {
  // On by default in the browser (classroom demo); the Android app uses the real microphone
  // and location unless the switch in Settings turns demo mode on.
  demoMode: !isNativeApp(),
  watchShape: 'round',
  onboarded: false,
  theme: 'dark',
  language: 'system',
}

let settings: AppSettings = { ...defaultSettings, ...readJson<Partial<AppSettings>>(STORAGE_KEY, {}) }
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((listener) => listener())
}

/** Also used outside React (theme, language). */
export function subscribeSettings(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

// Keeps tabs in sync: changing demo mode in Settings updates an open watch tab.
window.addEventListener('storage', (event) => {
  if (event.key !== STORAGE_KEY) return
  settings = { ...defaultSettings, ...readJson<Partial<AppSettings>>(STORAGE_KEY, {}) }
  emit()
})

export function getSettings(): AppSettings {
  return settings
}

export function updateSettings(patch: Partial<AppSettings>): void {
  settings = { ...settings, ...patch }
  writeJson(STORAGE_KEY, settings)
  emit()
}

export function useSettings(): AppSettings {
  return useSyncExternalStore(subscribeSettings, getSettings)
}
