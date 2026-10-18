import { createBrowserRouter } from 'react-router'
import { ContactAlertView } from '../views/contact/ContactAlertView'
import { NotFoundView } from '../views/NotFoundView'
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
      { path: routes.contactAlert, element: <ContactAlertView /> },
      { path: '*', element: <NotFoundView /> },
    ],
  },
])
