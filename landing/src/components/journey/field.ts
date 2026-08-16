import * as THREE from "three"

import regionCounts from "@/data/region-density.json"

import { REGION_CENTROIDS, mulberry32, toWorld } from "./geography"
import { TOTALS } from "./totals"

export { TOTALS }

/**
 * The particle field is the funnel, at true proportions.
 *
 * Every firm in the database gets one point. Which points survive each stage
 * is decided by a per-particle rank compared against the REAL ratios, so the
 * thinning you watch is the actual shape of the data — 73,685 companies, of
 * which 8,177 have a website, of which 2,750 have a careers page under watch,
 * of which 49 moved. Nothing here is a designed-looking number.
 */

// A region covers area. Scattering into a tight disc around each centroid
// renders as twelve separate clumps instead of a populated country.
const REGION_SPREAD = 2.1

export const GROUP = { NO_SITE: 1, NO_CAREERS: 2, WATCHED: 3, MOVED: 0 }

export function buildField(count: number) {
  const rand = mulberry32(20260817)

  // Particles are handed out per region in proportion to real firm density,
  // so the map that forms is the true distribution, not a pretty scatter.
  const regions = Object.entries(regionCounts) as [string, number][]
  const total = regions.reduce((a, [, n]) => a + n, 0)

  const position = new Float32Array(count * 3)
  const target = new Float32Array(count * 3)
  const seed = new Float32Array(count)
  const group = new Float32Array(count)

  const siteRatio = TOTALS.websites / TOTALS.firms
  const watchRatio = TOTALS.watched / TOTALS.firms
  const movedRatio = TOTALS.moved / TOTALS.firms

  let i = 0
  for (const [name, n] of regions) {
    const centroid = REGION_CENTROIDS[name]
    if (!centroid) continue
    const share = Math.round((n / total) * count)
    const [cx, cy] = toWorld(centroid[0], centroid[1])

    for (let k = 0; k < share && i < count; k++, i++) {
      // Scattered inside a soft disc around the region's true centre.
      // sqrt() keeps the density even rather than clumping at the middle.
      const a = rand() * Math.PI * 2
      const r = Math.sqrt(rand()) * REGION_SPREAD
      target[i * 3] = cx + Math.cos(a) * r
      target[i * 3 + 1] = cy + Math.sin(a) * r * 1.15
      target[i * 3 + 2] = (rand() - 0.5) * 0.5

      // The census cloud it arrives from: a wide shell, no structure at all.
      const t = rand() * Math.PI * 2
      const u = rand() * 2 - 1
      const rr = 12 + rand() * 9
      position[i * 3] = Math.cos(t) * Math.sqrt(1 - u * u) * rr
      position[i * 3 + 1] = u * rr * 0.75
      position[i * 3 + 2] = Math.sin(t) * Math.sqrt(1 - u * u) * rr - 4

      seed[i] = rand()

      const rank = rand()
      group[i] =
        rank < movedRatio ? GROUP.MOVED
        : rank < watchRatio ? GROUP.WATCHED
        : rank < siteRatio ? GROUP.NO_CAREERS
        : GROUP.NO_SITE
    }
  }

  // Any remainder from rounding: fill from the densest region so the count
  // stays exact rather than leaving dead vertices at the origin.
  for (; i < count; i++) {
    const [cx, cy] = toWorld(...REGION_CENTROIDS.London)
    const a = rand() * Math.PI * 2
    const r = Math.sqrt(rand()) * REGION_SPREAD
    target[i * 3] = cx + Math.cos(a) * r
    target[i * 3 + 1] = cy + Math.sin(a) * r * 1.15
    target[i * 3 + 2] = (rand() - 0.5) * 0.5
    position[i * 3] = (rand() - 0.5) * 30
    position[i * 3 + 1] = (rand() - 0.5) * 20
    position[i * 3 + 2] = (rand() - 0.5) * 30 - 4
    seed[i] = rand()
    group[i] = GROUP.NO_SITE
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute("position", new THREE.BufferAttribute(position, 3))
  geometry.setAttribute("aTarget", new THREE.BufferAttribute(target, 3))
  geometry.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1))
  geometry.setAttribute("aGroup", new THREE.BufferAttribute(group, 1))
  geometry.computeBoundingSphere()
  return geometry
}
