import { createBrowserRouter } from 'react-router'
import { DesignSystemView } from '../views/design-system/DesignSystemView'
import { NotFoundView } from '../views/NotFoundView'
import { AppearanceView } from '../views/settings/AppearanceView'
import { SettingsView } from '../views/settings/SettingsView'
import { WatchView } from '../views/watch/WatchView'
import { RootLayout } from './RootLayout'
import { routes } from './routes'

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: routes.watch, element: <WatchView /> },
      { path: routes.settings, element: <SettingsView /> },
      { path: routes.appearance, element: <AppearanceView /> },
      // Loaded on demand: it carries Leaflet, which the watch never needs.
      {
        path: routes.contactAlert,
        lazy: async () => ({ Component: (await import('../views/contact/ContactAlertView')).ContactAlertView }),
      },
      { path: routes.designSystem, element: <DesignSystemView /> },
      { path: '*', element: <NotFoundView /> },
    ],
  },
])
