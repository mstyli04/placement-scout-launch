import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import './index.css'
import { SignalsPage } from './pages/SignalsPage'

const container = document.getElementById('root')!
const app = (
  <StrictMode>
    <SignalsPage />
  </StrictMode>
)

if (container.hasChildNodes()) {
  hydrateRoot(container, app)
} else {
  createRoot(container).render(app)
}
