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

export interface FacetRoute {
  name: string
  dir: string
  sectorKey: string
  regionKey: string
  title: string
  description: string
}

export function loadFacets(): Facet[]
export function facetRoutes(facets: Facet[]): FacetRoute[]
