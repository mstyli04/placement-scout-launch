// The same projection the region map already uses, reused rather than
// re-derived: real Natural Earth coastline (public domain) and approximate
// real city coordinates, equirectangular-projected with longitude scaled by
// cos(54.08°) so the UK isn't horizontally stretched. Sharing one projection
// is the point — the particles land exactly where the SVG map puts them.

export const UK_OUTLINE_PATHS = [
  "M 44.83,163.22 L 32.25,190.70 L 14.51,182.45 L 0.00,183.00 L 4.84,161.57 L 0.00,140.14 L 19.67,138.49 L 44.83,163.22 Z",
  "M 107.18,0.00 L 82.10,43.28 L 106.01,37.80 L 131.72,38.01 L 125.61,70.60 L 104.51,106.45 L 128.77,109.00 L 130.64,113.20 L 151.54,160.40 L 167.60,166.82 L 182.05,212.40 L 188.73,228.20 L 217.17,235.82 L 214.32,261.40 L 202.36,273.13 L 211.73,293.82 L 190.62,314.77 L 159.22,314.40 L 119.27,325.40 L 108.33,317.52 L 92.81,336.27 L 71.10,331.73 L 54.61,347.00 L 42.14,339.01 L 76.56,297.00 L 97.56,288.36 L 97.38,288.33 L 60.73,281.66 L 54.09,265.74 L 78.61,253.35 L 65.76,231.80 L 70.22,205.60 L 105.10,209.22 L 105.14,209.22 L 108.59,186.00 L 92.87,161.36 L 92.52,160.80 L 64.02,153.76 L 58.43,142.94 L 66.96,125.06 L 59.24,114.04 L 46.60,132.95 L 45.23,94.40 L 33.38,74.00 L 41.90,32.65 L 60.13,0.20 L 78.87,3.37 L 107.18,0.00 Z",
]

export const REGION_CENTROIDS: Record<string, [number, number]> = {
  London: [174.65, 285.0],
  "South East": [165.97, 303.4],
  "East of England": [189.44, 257.4],
  "South West": [95.57, 309.4],
  "West Midlands": [133.12, 246.2],
  "East Midlands": [150.72, 229.4],
  Yorkshire: [141.33, 193.4],
  "North West": [116.69, 201.4],
  "North East": [140.16, 149.4],
  Wales: [90.87, 253.4],
  Scotland: [79.14, 73.4],
  "Northern Ireland": [20.47, 161.4],
}

// Map units -> world units. The projected map is ~230 wide and ~360 tall;
// this puts it at roughly 14 x 22 world units, centred on the origin.
const SCALE = 0.062
const CX = 115
const CY = 180

export function toWorld(x: number, y: number): [number, number] {
  return [(x - CX) * SCALE, -(y - CY) * SCALE]
}

/** Coastline as line-segment pairs in world space. */
export function coastlineSegments(): number[] {
  const out: number[] = []
  for (const path of UK_OUTLINE_PATHS) {
    const pts = path
      .replace(/[MZ]/g, "")
      .split("L")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => s.split(",").map(Number) as [number, number])
    for (let i = 0; i < pts.length; i++) {
      const a = toWorld(...pts[i])
      const b = toWorld(...pts[(i + 1) % pts.length])
      out.push(a[0], a[1], 0, b[0], b[1], 0)
    }
  }
  return out
}

/**
 * Deterministic PRNG. The whole journey has to be a pure function of scroll
 * progress to stay exactly scrubbable in both directions, and that starts
 * with the particle field being identical on every load — a Math.random()
 * field would make the piece unreproducible and untestable.
 */
export function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
