import { NavLink, Outlet, useMatch } from 'react-router'
import { useWatchDisplayMode } from '../features/watch/useWatchDisplayMode'
import { isNativeApp } from '../lib/platform'
import { buildContactAlertPath, routes } from './routes'

const allNavItems = [
  { to: routes.watch, label: 'Reloj' },
  { to: routes.settings, label: 'Configuración' },
  { to: buildContactAlertPath('demo'), label: 'Contacto' },
  { to: routes.designSystem, label: 'Diseño' },
]
// The demo contact page and the style guide are for the PC presentation only.
const navItems = isNativeApp() ? allNavItems.slice(0, 2) : allNavItems

// Navigation between the views. Hidden on the full-screen watch: there, nothing but the
// watch face may be visible.
export function RootLayout() {
  const isWatchRoute = useMatch(routes.watch) !== null
  const isFullscreenWatch = useWatchDisplayMode() === 'fullscreen' && isWatchRoute
  // A contact opening a real alert link must see only the alert, not the app's views.
  const contactAlert = useMatch(routes.contactAlert)
  const isRealContactAlert = contactAlert !== null && contactAlert.params.alertId !== 'demo'

  if (isFullscreenWatch || isRealContactAlert) return <Outlet />

  return (
    <div className="flex h-full flex-col">
      <nav className="flex justify-center gap-1 overflow-x-auto px-2 py-3 sm:gap-2 sm:p-4" aria-label="Vistas">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end
            className={({ isActive }) =>
              `shrink-0 rounded-full px-3 py-2 text-body-sm sm:px-4 ${isActive ? 'bg-primary text-text-primary' : 'bg-surface text-text-secondary'}`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  )
}
