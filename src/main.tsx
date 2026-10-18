import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <main className="grid h-full place-items-center">Voz Segura</main>
  </StrictMode>,
)
