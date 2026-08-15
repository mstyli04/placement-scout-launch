import { build } from 'vite'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { loadFacets, facetRoutes } from './facet-routes.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

const staticPages = [
  { name: 'main', entry: 'src/entry-server-main.tsx', html: 'dist/index.html' },
  { name: 'privacy', entry: 'src/entry-server-privacy.tsx', html: 'dist/privacy/index.html' },
  { name: 'playbook', entry: 'src/entry-server-playbook.tsx', html: 'dist/playbook/index.html' },
  { name: 'methodology', entry: 'src/entry-server-methodology.tsx', html: 'dist/methodology/index.html' },
  { name: 'explore', entry: 'src/entry-server-explore.tsx', html: 'dist/explore/index.html' },
  { name: 'removal', entry: 'src/entry-server-removal.tsx', html: 'dist/removal/index.html' },
  { name: 'signals', entry: 'src/entry-server-signals.tsx', html: 'dist/signals/index.html' },
]

const facets = loadFacets()
const routes = facetRoutes(facets)

const ssrOutDir = 'dist-ssr'

// One shared SSR bundle serves every facet page (entry-server-facet.tsx's
// render(sectorKey, regionKey) is called once per facet below) rather than
// building 48 near-identical bundles.
await build({
  root,
  logLevel: 'warn',
  build: {
    ssr: true,
    outDir: ssrOutDir,
    emptyOutDir: true,
    rollupOptions: {
      input: {
        ...Object.fromEntries(staticPages.map((p) => [p.name, path.resolve(root, p.entry)])),
        facet: path.resolve(root, 'src/entry-server-facet.tsx'),
      },
      output: { format: 'es', entryFileNames: '[name].mjs' },
    },
  },
})

function injectRoot(htmlPath, html) {
  const template = fs.readFileSync(htmlPath, 'utf-8')
  const rootDivPattern = /<div id="root"([^>]*)><\/div>/
  if (!rootDivPattern.test(template)) {
    throw new Error(`Could not find the empty root div placeholder in ${htmlPath}`)
  }
  fs.writeFileSync(htmlPath, template.replace(rootDivPattern, (_match, attrs) => `<div id="root"${attrs}>${html}</div>`))
}

for (const page of staticPages) {
  const modPath = path.resolve(root, ssrOutDir, `${page.name}.mjs`)
  const mod = await import(pathToFileURL(modPath).href)
  injectRoot(path.resolve(root, page.html), mod.render())
  console.log(`Prerendered ${page.name} -> ${page.html}`)
}

const facetMod = await import(pathToFileURL(path.resolve(root, ssrOutDir, 'facet.mjs')).href)
for (const route of routes) {
  const html = facetMod.render(route.sectorKey, route.regionKey)
  injectRoot(path.resolve(root, 'dist', route.dir, 'index.html'), html)
}
console.log(`Prerendered ${routes.length} facet pages`)

// W-8: sitemap.xml + robots.txt. Every URL here is real, indexable, unique
// server-rendered content (W-1/W-6) — no per-firm pages exist to exclude
// (W-7's premise doesn't apply yet; this list needs revisiting if that
// changes).
const SITE_URL = 'https://placementscout.vercel.app'
const indexablePaths = [
  '/', '/privacy/', '/playbook/', '/methodology/', '/explore/', '/removal/', '/signals/',
  ...routes.map((r) => `/${r.dir}/`),
]
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${indexablePaths.map((p) => `  <url><loc>${SITE_URL}${p}</loc></url>`).join('\n')}
</urlset>
`
fs.writeFileSync(path.resolve(root, 'dist/sitemap.xml'), sitemap)

const robots = `User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`
fs.writeFileSync(path.resolve(root, 'dist/robots.txt'), robots)
console.log(`Wrote sitemap.xml (${indexablePaths.length} URLs) and robots.txt`)
