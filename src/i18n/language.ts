// Framework- and store-free, so pure modules (and their tests) can use it.
import type { LanguagePreference } from '../features/settings/settingsStore'
import { messages, type Messages } from './messages'

export type Language = 'es' | 'en'

const LOCALES: Record<Language, string> = { es: 'es-CO', en: 'en-US' }

export function isLanguage(value: unknown): value is Language {
  return value === 'es' || value === 'en'
}

/** "system" follows the device: English if it is in English, Spanish otherwise. */
export function resolveLanguage(preference: LanguagePreference): Language {
  if (preference !== 'system') return preference
  return navigator.language.toLowerCase().startsWith('en') ? 'en' : 'es'
}

export function getMessages(language: Language): Messages {
  return messages[language]
}

/** Locale for Intl formatting (dates, numbers). */
export function localeOf(language: Language): string {
  return LOCALES[language]
}
