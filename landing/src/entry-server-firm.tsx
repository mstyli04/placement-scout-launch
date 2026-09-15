import { renderToString } from 'react-dom/server'
import { FirmPage } from './pages/FirmPage'

export function render(slug: string) {
  return renderToString(<FirmPage slug={slug} />)
}
