import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { PlaybookPage } from './pages/PlaybookPage'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PlaybookPage />
  </StrictMode>,
)
