import { FlaskConical, Watch } from 'lucide-react'
import { useNavigate } from 'react-router'
import { routes } from '../../app/routes'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Logo } from '../../components/ui/Logo'
import { Switch } from '../../components/ui/Switch'
import { updateSettings, useSettings } from '../../features/settings/settingsStore'
import { useT } from '../../i18n/useT'
import { isBackendConfigured } from '../../lib/config'
import { isNativeApp } from '../../lib/platform'
import { AlertControlSection } from './AlertControlSection'
import { ContactsSection } from './ContactsSection'
import { HistorySection } from './HistorySection'
import { PermissionsSection } from './PermissionsSection'
import { PracticeSection } from './PracticeSection'
import { ProfileSection } from './ProfileSection'

// Companion settings. In the Android app it opens on first launch (onboarding); after that
// it is reached only with a 2-second press on the watch, so nothing on the watch hints at it.
export function SettingsView() {
  const { demoMode, onboarded } = useSettings()
  const t = useT().settings
  const navigate = useNavigate()
  const firstRun = isNativeApp() && !onboarded
  const backend = isBackendConfigured()

  const goToWatch = () => {
    updateSettings({ onboarded: true })
    navigate(routes.watch)
  }

  return (
    <main className="mx-auto flex max-w-content flex-col gap-4 px-gutter pb-section animate-screen-in">
      <header className="flex flex-col gap-2 pt-2">
        <Logo className="mb-2" />
        <h1 className="text-headline font-semibold">{firstRun ? t.welcomeTitle : t.title}</h1>
        <p className="text-body-sm text-text-secondary">
          {firstRun ? t.welcomeIntro : t.intro}
        </p>
      </header>

      <AlertControlSection />

      {backend ? (
        <>
          <ContactsSection />
          <ProfileSection />
        </>
      ) : (
        <Card>
          <p className="text-body-sm text-text-secondary">{t.noBackend}</p>
        </Card>
      )}

      <PermissionsSection />
      <PracticeSection />

      <Card title={t.demoTitle} icon={<FlaskConical size={20} />}>
        <Switch
          label={t.demoSwitch}
          description={demoMode ? t.demoOn : t.demoOff}
          checked={demoMode}
          onChange={(checked) => updateSettings({ demoMode: checked })}
        />
      </Card>


      <HistorySection />

      <Card raised className="flex flex-col gap-4">
        <p className="text-body-sm text-text-secondary">
          {t.howTo[0]}
          <b className="text-text-primary">{t.howTo[1]}</b>
          {t.howTo[2]}
          <b className="text-text-primary">{t.howTo[3]}</b>
          {t.howTo[4]}
          <b className="text-text-primary">{t.howTo[5]}</b>
          {t.howTo[6]}
        </p>
        <Button size="lg" icon={<Watch size={20} />} onClick={goToWatch} fullWidth>
          {t.goToWatch}
        </Button>
      </Card>
    </main>
  )
}
