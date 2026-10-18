import { Palette } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { SegmentedControl } from '../../components/ui/SegmentedControl'
import {
  updateSettings,
  useSettings,
  type LanguagePreference,
  type ThemePreference,
} from '../../features/settings/settingsStore'
import { useT } from '../../i18n/useT'

const themes: ThemePreference[] = ['dark', 'light', 'system']

// Theme and language. The watch face is always dark; the language also sets the one the
// contacts get their Telegram messages and AI summary in.
export function AppearanceSection() {
  const { theme, language } = useSettings()
  const t = useT().appearance

  // Language names stay in their own language, so they can always be found.
  const languageOptions: { value: LanguagePreference; label: string }[] = [
    { value: 'es', label: 'Español' },
    { value: 'en', label: 'English' },
    { value: 'system', label: t.system },
  ]

  return (
    <Card title={t.title} icon={<Palette size={20} />} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <span className="text-body-sm font-medium">{t.theme}</span>
        <SegmentedControl
          label={t.theme}
          options={themes.map((value) => ({ value, label: t.themes[value] }))}
          value={theme}
          onChange={(value) => updateSettings({ theme: value })}
        />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-body-sm font-medium">{t.language}</span>
        <SegmentedControl
          label={t.language}
          options={languageOptions}
          value={language}
          onChange={(value) => updateSettings({ language: value })}
        />
      </div>
      <p className="text-caption text-text-secondary">{t.watchNote}</p>
    </Card>
  )
}
