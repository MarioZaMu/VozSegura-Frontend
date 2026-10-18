import { Link } from 'react-router'
import { routes } from '../app/routes'
import { useT } from '../i18n/useT'

export function NotFoundView() {
  const t = useT()
  return (
    <section className="grid h-full place-items-center text-center">
      <div>
        <h1 className="text-headline font-semibold">{t.notFound.title}</h1>
        <Link to={routes.watch} className="text-primary underline">
          {t.notFound.back}
        </Link>
      </div>
    </section>
  )
}
