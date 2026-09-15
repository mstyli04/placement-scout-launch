export interface Facet {
  sectorKey: string
  sectorLabel: string
  regionKey: string
  regionLabel: string
  count: number
  medianAgeYears: number
  websiteCount: number
  careersCount: number
  careersSharePct: number | null
  cohorts: Record<string, number>
}

export interface ProfileField {
  field: string
  label: string
  value: string | null
  source: string | null
  sourceUrl: string | null
  observedAt: string | null
  note: string | null
}

export interface Profile {
  companyNumber: string
  slug: string
  name: string
  sectors: string[]
  city: string
  region: string
  careersUrl: string | null
  companiesHouseUrl: string
  fcaUrl: string | null
  facet: { sectorKey: string; sectorLabel: string; regionKey: string; regionLabel: string; count: number } | null
  fields: ProfileField[]
  signals: { type: string; observedAt: string; evidenceUrl: string | null; snippet: string | null }[]
}

/** A generated page: one HTML shell, one entry in vite's input map, one
 * prerender call. `render` is the argument list passed to the page type's
 * shared SSR bundle. */
export interface GeneratedRoute {
  name: string
  /** Which shared SSR bundle renders it — one per page type, not one per page. */
  bundle: string
  dir: string
  entry: string
  data: Record<string, string>
  render: string[]
  title: string
  description: string
}

export function loadFacets(): Facet[]
export function facetRoutes(facets: Facet[]): GeneratedRoute[]
export function loadProfiles(): Profile[]
export function firmRoutes(profiles: Profile[]): GeneratedRoute[]
export function generatedRoutes(): GeneratedRoute[]
