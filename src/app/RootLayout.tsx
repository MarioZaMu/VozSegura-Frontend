import { NavLink, Outlet, useMatch } from 'react-router'
import { useWatchDisplayMode } from '../features/watch/useWatchDisplayMode'
import { useT } from '../i18n/useT'
import { isNativeApp } from '../lib/platform'
import { buildContactAlertPath, routes } from './routes'

const allNavItems = [
  { to: routes.watch, label: 'watch' },
  { to: routes.settings, label: 'settings' },
  { to: routes.appearance, label: 'appearance' },
  { to: buildContactAlertPath('demo'), label: 'contact' },
  { to: routes.designSystem, label: 'design' },
] as const
// The demo contact page and the style guide are for the PC presentation only.
const navItems = isNativeApp() ? allNavItems.slice(0, 3) : allNavItems

// Navigation between the views. Hidden on the full-screen watch: there, nothing but the
// watch face may be visible.
export function RootLayout() {
  const t = useT()
  const isWatchRoute = useMatch(routes.watch) !== null
  const isFullscreenWatch = useWatchDisplayMode() === 'fullscreen' && isWatchRoute
  // A contact opening a real alert link must see only the alert, not the app's views.
  const contactAlert = useMatch(routes.contactAlert)
  const isRealContactAlert = contactAlert !== null && contactAlert.params.alertId !== 'demo'

  // Only the watch is meant to reach under the camera cutout; every other page starts below it.
  if (isFullscreenWatch) return <Outlet />
  if (isRealContactAlert)
    return (
      <div className="pt-safe-top">
        <Outlet />
      </div>
    )

  return (
    <div className="flex h-full flex-col pt-safe-top">
      <nav className="flex shrink-0 justify-center gap-1 overflow-x-auto px-2 py-3 sm:gap-2 sm:p-4" aria-label={t.nav.label}>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end
            className={({ isActive }) =>
              `shrink-0 rounded-full px-3 py-2 text-body-sm sm:px-4 ${isActive ? 'bg-primary text-on-accent' : 'bg-surface text-text-secondary'}`
            }
          >
            {t.nav[item.label]}
          </NavLink>
        ))}
      </nav>
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  )
}
