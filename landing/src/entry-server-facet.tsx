import { renderToString } from 'react-dom/server'
import { FacetPage } from './pages/FacetPage'

export function render(sectorKey: string, regionKey: string) {
  return renderToString(<FacetPage sectorKey={sectorKey} regionKey={regionKey} />)
}
