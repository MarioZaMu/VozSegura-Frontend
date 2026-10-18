import { Palette } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { SegmentedControl } from '../../components/ui/SegmentedControl'
import {
  updateSettings,
  useSettings,
  type LanguagePreference,
  type ThemePreference,
} from '../../features/settings/settingsStore'

// Theme and language. The watch face is always dark and has no text to translate besides
// the date, so this only changes Settings and the contact view.
export function AppearanceSection() {
  const { theme, language } = useSettings()

  const themeOptions: { value: ThemePreference; label: string }[] = [
    { value: 'dark', label: 'Oscuro' },
    { value: 'light', label: 'Claro' },
    { value: 'system', label: 'Sistema' },
  ]
  const languageOptions: { value: LanguagePreference; label: string }[] = [
    { value: 'es', label: 'Español' },
    { value: 'en', label: 'English' },
    { value: 'system', label: 'Sistema' },
  ]

  return (
    <Card title="Apariencia" icon={<Palette size={20} />} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <span className="text-body-sm font-medium">Tema</span>
        <SegmentedControl label="Tema" options={themeOptions} value={theme} onChange={(value) => updateSettings({ theme: value })} />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-body-sm font-medium">Idioma</span>
        <SegmentedControl
          label="Idioma"
          options={languageOptions}
          value={language}
          onChange={(value) => updateSettings({ language: value })}
        />
      </div>
      <p className="text-caption text-text-secondary">El reloj siempre se ve oscuro, como un reloj normal.</p>
    </Card>
  )
}
