import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { router } from './app/router'
import { startLanguage } from './i18n/currentLanguage'
import { registerServiceWorker } from './lib/serviceWorker'
import { startTheme } from './lib/theme'
import './styles/index.css'

startTheme()
startLanguage()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)

registerServiceWorker()
