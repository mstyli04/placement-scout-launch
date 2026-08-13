import { renderToString } from 'react-dom/server'
import { RemovalPage } from './pages/RemovalPage'

export function render() {
  return renderToString(<RemovalPage />)
}
