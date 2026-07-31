import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import './index.css'
import { MethodologyPage } from './pages/MethodologyPage'

const container = document.getElementById('root')!
const app = (
  <StrictMode>
    <MethodologyPage />
  </StrictMode>
)

if (container.hasChildNodes()) {
  hydrateRoot(container, app)
} else {
  createRoot(container).render(app)
}
