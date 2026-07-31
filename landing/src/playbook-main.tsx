import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import './index.css'
import { PlaybookPage } from './pages/PlaybookPage'

const container = document.getElementById('root')!
const app = (
  <StrictMode>
    <PlaybookPage />
  </StrictMode>
)

if (container.hasChildNodes()) {
  hydrateRoot(container, app)
} else {
  createRoot(container).render(app)
}
