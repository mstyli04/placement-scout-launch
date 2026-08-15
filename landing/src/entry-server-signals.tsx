import { renderToString } from 'react-dom/server'
import { SignalsPage } from './pages/SignalsPage'

export function render() {
  return renderToString(<SignalsPage />)
}
