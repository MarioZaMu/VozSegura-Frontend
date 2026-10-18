import { createContext, useContext } from 'react'
import { useSettings } from '../features/settings/settingsStore'
import { getMessages, resolveLanguage, type Language } from './language'
import type { Messages } from './messages'

/** Set by LanguageProvider: a subtree in another language (the contact view uses the alert's). */
export const LanguageOverride = createContext<Language | null>(null)

export function useLanguage(): Language {
  const override = useContext(LanguageOverride)
  const { language } = useSettings()
  return override ?? resolveLanguage(language)
}

/** Texts in the current language: `const t = useT()` then `t.settings.title`. */
export function useT(): Messages {
  return getMessages(useLanguage())
}
