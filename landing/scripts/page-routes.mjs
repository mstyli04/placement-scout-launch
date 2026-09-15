import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.resolve(__dirname, '../src/data')

// Single source of truth for where every GENERATED page lives — the two page
// types built from pipeline data rather than written by hand. Each type
// exports a loader and a routes function, and the same three consumers read
// them: the HTML-shell generator, vite.config.ts's multi-page input map, and
// the prerender script. A page type registered here cannot end up in two of
// those three and 404 in the wild, which is how /removal/ spent two days
// behind a green run.

function readJson(name, fallback) {
  const file = path.join(dataDir, name)
  if (!fs.existsSync(file)) return fallback
  return JSON.parse(fs.readFileSync(file, 'utf-8'))
}

export function loadFacets() {
  return readJson('facets.json', [])
}

export function facetRoutes(facets) {
  return facets.map((f) => ({
    name: `facet-${f.sectorKey}-${f.regionKey}`,
    dir: `explore/${f.sectorKey}/${f.regionKey}`,
    bundle: 'facet',
    entry: '/src/facet-main.tsx',
    data: { 'data-sector-key': f.sectorKey, 'data-region-key': f.regionKey },
    render: [f.sectorKey, f.regionKey],
    title: `${f.sectorLabel} firms in ${f.regionLabel} — Placement Scout`,
    description: `${f.count.toLocaleString()} boutique ${f.sectorLabel} firms in ${f.regionLabel}: `
      + `median company age, incorporation cohorts, and careers-page coverage from the UK `
      + `Companies House and FCA registers.`,
  }))
}

// profiles.json is written by scripts/build_profiles.py. It is absent on a
// fresh clone until that has run once, and an absent file must degrade to
// "no firm pages this build" rather than breaking the whole site build.
export function loadProfiles() {
  return readJson('profiles.json', { profiles: [] }).profiles ?? []
}

export function firmRoutes(profiles) {
  return profiles.map((p) => {
    // What the page can honestly claim in a search result. A firm whose
    // fields all fall back to last_checked has nothing observed to boast
    // about, so the description says what IS known rather than implying a
    // freshness the page does not have.
    const observed = p.fields.filter((f) => f.observedAt).length
    const where = [p.city, p.region].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(', ')
    return {
      name: `firm-${p.slug}`,
      dir: `explore/firm/${p.slug}`,
      bundle: 'firm',
      entry: '/src/firm-main.tsx',
      data: { 'data-slug': p.slug },
      render: [p.slug],
      title: `${p.name} — company record and sources — Placement Scout`,
      description: `${p.name}${where ? `, ${where}` : ''}: company number ${p.companyNumber}, `
        + `${p.fields.length} register facts each with the source it came from`
        + `${observed ? ` and the date it was read` : ''}`
        + `${p.signals.length ? `, plus ${p.signals.length} dated hiring signal${p.signals.length === 1 ? '' : 's'}` : ''}.`,
    }
  })
}

// Every generated route, in the order the consumers want them.
export function generatedRoutes() {
  return [...facetRoutes(loadFacets()), ...firmRoutes(loadProfiles())]
}
