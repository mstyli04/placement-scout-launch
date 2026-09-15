import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const facetsPath = path.resolve(__dirname, '../src/data/facets.json')

export function loadFacets() {
  return JSON.parse(fs.readFileSync(facetsPath, 'utf-8'))
}

// Single source of truth for where each facet page lives, shared by the
// HTML-shell generator, vite.config.ts's multi-page input map, and the
// prerender script.
export function facetRoutes(facets) {
  return facets.map((f) => ({
    name: `facet-${f.sectorKey}-${f.regionKey}`,
    dir: `explore/${f.sectorKey}/${f.regionKey}`,
    sectorKey: f.sectorKey,
    regionKey: f.regionKey,
    title: `${f.sectorLabel} firms in ${f.regionLabel} — Placement Scout`,
    description: `${f.count.toLocaleString()} boutique ${f.sectorLabel} firms in ${f.regionLabel}: `
      + `median company age, incorporation cohorts, and careers-page coverage from the UK `
      + `Companies House and FCA registers.`,
  }))
}
