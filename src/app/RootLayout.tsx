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

  if (isFullscreenWatch) return <Outlet />

  return (
    <div className="flex h-full flex-col">
      <nav className="flex flex-wrap justify-center gap-2 p-4" aria-label="Vistas">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end
            className={({ isActive }) =>
              `rounded-full px-4 py-2 text-body-sm ${isActive ? 'bg-primary text-text-primary' : 'bg-surface text-text-secondary'}`
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
