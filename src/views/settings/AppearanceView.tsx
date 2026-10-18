import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router'
import { routes } from '../../app/routes'
import { useT } from '../../i18n/useT'
import { AppearanceSection } from './AppearanceSection'

// Theme and language on their own page, so Settings stays focused on the alert.
export function AppearanceView() {
  const t = useT().appearance
  return (
    <main className="mx-auto flex max-w-content flex-col gap-4 px-gutter pb-section animate-screen-in">
      <Link to={routes.settings} className="inline-flex min-h-touch items-center gap-2 self-start text-body-sm text-text-secondary">
        <ArrowLeft size={18} /> {t.back}
      </Link>
      <AppearanceSection />
    </main>
  )
}
