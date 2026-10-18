import { getSettings, subscribeSettings } from '../features/settings/settingsStore'
import { resolveLanguage, type Language } from './language'

/** The language of this device's UI (also sent with each alert, for the contacts' messages). */
export function getLanguage(): Language {
  return resolveLanguage(getSettings().language)
}

/** Keeps <html lang> in sync with the setting (screen readers, hyphenation). */
export function startLanguage(): void {
  const apply = () => (document.documentElement.lang = getLanguage())
  apply()
  subscribeSettings(apply)
}
