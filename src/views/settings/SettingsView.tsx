import { FlaskConical, Watch } from 'lucide-react'
import { useNavigate } from 'react-router'
import { routes } from '../../app/routes'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Switch } from '../../components/ui/Switch'
import { updateSettings, useSettings } from '../../features/settings/settingsStore'
import { isBackendConfigured } from '../../lib/config'
import { isNativeApp } from '../../lib/platform'
import { ContactsSection } from './ContactsSection'
import { HistorySection } from './HistorySection'
import { PermissionsSection } from './PermissionsSection'
import { PracticeSection } from './PracticeSection'
import { ProfileSection } from './ProfileSection'

// Companion settings. In the Android app it opens on first launch (onboarding); after that
// it is reached only with a 2-second press on the watch, so nothing on the watch hints at it.
export function SettingsView() {
  const { demoMode, onboarded } = useSettings()
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
        <h1 className="text-headline font-semibold">{firstRun ? 'Te damos la bienvenida' : 'Configuración'}</h1>
        <p className="text-body-sm text-text-secondary">
          {firstRun
            ? 'Antes de empezar, agrega a tus contactos de confianza y concede los permisos. Luego el teléfono se verá como un reloj normal.'
            : 'Contactos, mensaje y permisos de tu alerta silenciosa.'}
        </p>
      </header>

      {backend ? (
        <>
          <ContactsSection />
          <ProfileSection />
        </>
      ) : (
        <Card>
          <p className="text-body-sm text-text-secondary">
            Falta configurar el backend (VITE_API_BASE_URL y VITE_ALERT_API_TOKEN): los contactos no están disponibles y solo
            funciona el modo demo.
          </p>
        </Card>
      )}

      <PermissionsSection />
      <PracticeSection />

      <Card title="Modo demo" icon={<FlaskConical size={20} />}>
        <Switch
          label="Simular la alerta"
          description={
            demoMode ? 'Micrófono, ubicación, IA y envío simulados: nadie recibe nada.' : 'La alerta es real: avisa a tus contactos.'
          }
          checked={demoMode}
          onChange={(checked) => updateSettings({ demoMode: checked })}
        />
      </Card>

      <HistorySection />

      <Card raised className="flex flex-col gap-4">
        <p className="text-body-sm text-text-secondary">
          En el reloj, haz <b className="text-text-primary">doble toque</b> para activar la alerta. Para volver aquí,{' '}
          <b className="text-text-primary">mantén presionado el reloj 2 segundos</b>.
        </p>
        <Button size="lg" icon={<Watch size={20} />} onClick={goToWatch} fullWidth>
          Ir al reloj
        </Button>
      </Card>
    </main>
  )
}
