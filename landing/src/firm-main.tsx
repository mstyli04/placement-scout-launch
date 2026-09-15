import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import './index.css'
import { FirmPage } from './pages/FirmPage'

const container = document.getElementById('root')!
const slug = container.dataset.slug!
const app = (
  <StrictMode>
    <FirmPage slug={slug} />
  </StrictMode>
)

if (container.hasChildNodes()) {
  hydrateRoot(container, app)
} else {
  createRoot(container).render(app)
}
