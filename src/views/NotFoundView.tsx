import { Link } from 'react-router'
import { routes } from '../app/routes'

export function NotFoundView() {
  return (
    <section className="grid h-full place-items-center text-center">
      <div>
        <h1 className="text-headline font-semibold">Página no encontrada</h1>
        <Link to={routes.watch} className="text-primary underline">
          Volver al reloj
        </Link>
      </div>
    </section>
  )
}
