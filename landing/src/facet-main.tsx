import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import './index.css'
import { FacetPage } from './pages/FacetPage'

const container = document.getElementById('root')!
const sectorKey = container.dataset.sectorKey!
const regionKey = container.dataset.regionKey!
const app = (
  <StrictMode>
    <FacetPage sectorKey={sectorKey} regionKey={regionKey} />
  </StrictMode>
)

if (container.hasChildNodes()) {
  hydrateRoot(container, app)
} else {
  createRoot(container).render(app)
}
