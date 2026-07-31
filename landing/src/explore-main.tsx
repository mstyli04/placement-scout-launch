import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import './index.css'
import { ExplorePage } from './pages/ExplorePage'

const container = document.getElementById('root')!
const app = (
  <StrictMode>
    <ExplorePage />
  </StrictMode>
)

if (container.hasChildNodes()) {
  hydrateRoot(container, app)
} else {
  createRoot(container).render(app)
}
