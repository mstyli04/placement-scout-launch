import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadFacets, facetRoutes } from './facet-routes.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

// These strings are hand-written into raw HTML here (not JSX, so none of
// React's automatic escaping applies) — sector labels like "M&A / advisory"
// need & escaped to stay valid HTML.
function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function facetHtml({ title, description, sectorKey, regionKey }) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
  </head>
  <body>
    <div id="root" data-sector-key="${sectorKey}" data-region-key="${regionKey}"></div>
    <script type="module" src="/src/facet-main.tsx"></script>
  </body>
</html>
`
}

const exploreHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Explore the database — Placement Scout</title>
    <meta
      name="description"
      content="Firm counts, company age, and careers-page coverage by sector and UK region, from the Placement Scout database."
    />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/explore-main.tsx"></script>
  </body>
</html>
`

const facets = loadFacets()
const routes = facetRoutes(facets)

fs.mkdirSync(path.join(root, 'explore'), { recursive: true })
fs.writeFileSync(path.join(root, 'explore', 'index.html'), exploreHtml)

for (const route of routes) {
  const dir = path.join(root, route.dir)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, 'index.html'), facetHtml(route))
}

console.log(`Generated explore/index.html + ${routes.length} facet page shells`)
