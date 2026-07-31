import { renderToString } from 'react-dom/server'
import { PrivacyPage } from './pages/PrivacyPage'

export function render() {
  return renderToString(<PrivacyPage />)
}
