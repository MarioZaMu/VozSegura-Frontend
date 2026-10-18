import type { ReactNode } from 'react'
import type { Language } from './language'
import { LanguageOverride } from './useT'

export function LanguageProvider({ language, children }: { language: Language; children: ReactNode }) {
  return <LanguageOverride value={language}>{children}</LanguageOverride>
}
