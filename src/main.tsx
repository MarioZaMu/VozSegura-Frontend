import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { router } from './app/router'
import { registerServiceWorker } from './lib/serviceWorker'
import { startTheme } from './lib/theme'
import './styles/index.css'

startTheme()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)

registerServiceWorker()
