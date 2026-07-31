import { renderToString } from 'react-dom/server'
import { ExplorePage } from './pages/ExplorePage'

export function render() {
  return renderToString(<ExplorePage />)
}
