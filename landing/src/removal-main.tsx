import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import './index.css'
import { RemovalPage } from './pages/RemovalPage'

const container = document.getElementById('root')!
const app = (
  <StrictMode>
    <RemovalPage />
  </StrictMode>
)

if (container.hasChildNodes()) {
  hydrateRoot(container, app)
} else {
  createRoot(container).render(app)
}
