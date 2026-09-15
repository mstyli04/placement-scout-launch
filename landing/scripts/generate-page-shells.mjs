import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { generatedRoutes } from './page-routes.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

// These strings are hand-written into raw HTML here (not JSX, so none of
// React's automatic escaping applies) — sector labels like "M&A / advisory"
// and firm names like "Smith & Partners" need & escaped to stay valid HTML.
function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function shellHtml({ title, description, entry, data }) {
  const attrs = Object.entries(data)
    .map(([key, value]) => ` ${key}="${escapeHtml(value)}"`)
    .join('')
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
    <div id="root"${attrs}></div>
    <script type="module" src="${entry}"></script>
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

const routes = generatedRoutes()

fs.mkdirSync(path.join(root, 'explore'), { recursive: true })
fs.writeFileSync(path.join(root, 'explore', 'index.html'), exploreHtml)

// A firm that leaves the selection (suppressed, rescored, or dropped by the
// signals window) must stop having a shell, or `vite build` keeps emitting a
// page for it from a stale directory left on disk. Clearing the tree first is
// the only way a removal actually reaches the built site.
fs.rmSync(path.join(root, 'explore', 'firm'), { recursive: true, force: true })

for (const route of routes) {
  const dir = path.join(root, route.dir)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, 'index.html'), shellHtml(route))
}

const byType = routes.reduce((acc, r) => ({ ...acc, [r.bundle]: (acc[r.bundle] ?? 0) + 1 }), {})
console.log(`Generated explore/index.html + ${routes.length} page shells (${
  Object.entries(byType).map(([k, n]) => `${n} ${k}`).join(', ')})`)
