import { Languages } from 'lucide-react'
import { updateSettings } from '../features/settings/settingsStore'
import { useLanguage, useT } from '../i18n/useT'

// One tap switches between Spanish and English (the Appearance page keeps "system" too).
// The button shows the language it switches to, so it reads as "EN" on a Spanish screen.
export function LanguageToggle() {
  const language = useLanguage()
  const t = useT().nav
  const next = language === 'es' ? 'en' : 'es'

  return (
    <button
      type="button"
      onClick={() => updateSettings({ language: next })}
      aria-label={t.switchLanguage}
      title={t.switchLanguage}
      className="flex shrink-0 items-center gap-1 rounded-full bg-surface px-3 py-2 text-body-sm font-medium text-text-secondary sm:px-4"
    >
      <Languages size={16} aria-hidden />
      {next.toUpperCase()}
    </button>
  )
}
