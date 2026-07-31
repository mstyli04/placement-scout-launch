import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import './index.css'
import { PrivacyPage } from './pages/PrivacyPage'

const container = document.getElementById('root')!
const app = (
  <StrictMode>
    <PrivacyPage />
  </StrictMode>
)

if (container.hasChildNodes()) {
  hydrateRoot(container, app)
} else {
  createRoot(container).render(app)
}
