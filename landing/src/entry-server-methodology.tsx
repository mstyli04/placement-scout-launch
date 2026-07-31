import { renderToString } from 'react-dom/server'
import { MethodologyPage } from './pages/MethodologyPage'

export function render() {
  return renderToString(<MethodologyPage />)
}
