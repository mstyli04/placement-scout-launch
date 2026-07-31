import { renderToString } from 'react-dom/server'
import { PlaybookPage } from './pages/PlaybookPage'

export function render() {
  return renderToString(<PlaybookPage />)
}
