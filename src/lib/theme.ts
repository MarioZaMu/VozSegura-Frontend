import { getSettings, subscribeSettings, type ThemePreference } from '../features/settings/settingsStore'

const DARK_BACKGROUND = '#0b0613'
const LIGHT_BACKGROUND = '#f6f3fa'
const prefersLight = window.matchMedia('(prefers-color-scheme: light)')

export function resolveTheme(preference: ThemePreference): 'dark' | 'light' {
  if (preference === 'system') return prefersLight.matches ? 'light' : 'dark'
  return preference
}

function apply() {
  const theme = resolveTheme(getSettings().theme)
  document.documentElement.dataset.theme = theme
  document.querySelector('meta[name="color-scheme"]')?.setAttribute('content', theme)
  // The full-screen watch paints its own black status bar (WatchView), then restores this.
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'light' ? LIGHT_BACKGROUND : DARK_BACKGROUND)
}

/** Keeps <html data-theme> in sync with the setting and, for "system", with the OS. */
export function startTheme(): void {
  apply()
  subscribeSettings(apply)
  prefersLight.addEventListener('change', apply)
}
