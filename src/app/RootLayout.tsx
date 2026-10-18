import { NavLink, Outlet } from 'react-router'
import { buildContactAlertPath, routes } from './routes'

const navItems = [
  { to: routes.watch, label: 'Reloj' },
  { to: routes.settings, label: 'Configuración' },
  { to: buildContactAlertPath('demo'), label: 'Contacto' },
]

// Temporary navigation between the three views while they are being built.
export function RootLayout() {
  return (
    <div className="flex h-full flex-col">
      <nav className="flex justify-center gap-2 p-4" aria-label="Vistas">
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
