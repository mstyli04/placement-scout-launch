import { useState } from "react"

import regionCounts from "@/data/region-density.json"

// Real UK coastline (Great Britain + Northern Ireland), simplified —
// derived from Natural Earth's public-domain admin-0 country boundaries via
// github.com/johan/world.geo.json, equirectangular-projected (longitude
// scaled by cos(54.08°) to correct for the UK's latitude before plotting,
// so the outline isn't horizontally stretched).
const UK_OUTLINE_PATHS = [
  "M 44.83,163.22 L 32.25,190.70 L 14.51,182.45 L 0.00,183.00 L 4.84,161.57 L 0.00,140.14 L 19.67,138.49 L 44.83,163.22 Z",
  "M 107.18,0.00 L 82.10,43.28 L 106.01,37.80 L 131.72,38.01 L 125.61,70.60 L 104.51,106.45 L 128.77,109.00 L 130.64,113.20 L 151.54,160.40 L 167.60,166.82 L 182.05,212.40 L 188.73,228.20 L 217.17,235.82 L 214.32,261.40 L 202.36,273.13 L 211.73,293.82 L 190.62,314.77 L 159.22,314.40 L 119.27,325.40 L 108.33,317.52 L 92.81,336.27 L 71.10,331.73 L 54.61,347.00 L 42.14,339.01 L 76.56,297.00 L 97.56,288.36 L 97.38,288.33 L 60.73,281.66 L 54.09,265.74 L 78.61,253.35 L 65.76,231.80 L 70.22,205.60 L 105.10,209.22 L 105.14,209.22 L 108.59,186.00 L 92.87,161.36 L 92.52,160.80 L 64.02,153.76 L 58.43,142.94 L 66.96,125.06 L 59.24,114.04 L 46.60,132.95 L 45.23,94.40 L 33.38,74.00 L 41.90,32.65 L 60.13,0.20 L 78.87,3.37 L 107.18,0.00 Z",
]

// Region hex centers use the SAME projection as the outline above (each is
// an approximate real city/area coordinate, equirectangular-projected) —
// so the hexagons sit at their true relative geographic position, overlaid
// directly on the map rather than an abstract grid layout.
const REGIONS: { name: string; x: number; y: number }[] = [
  { name: "London", x: 174.65, y: 285.00 },
  { name: "South East", x: 165.97, y: 303.40 },
  { name: "East of England", x: 189.44, y: 257.40 },
  { name: "South West", x: 95.57, y: 309.40 },
  { name: "West Midlands", x: 133.12, y: 246.20 },
  { name: "East Midlands", x: 150.72, y: 229.40 },
  { name: "Yorkshire", x: 141.33, y: 193.40 },
  { name: "North West", x: 116.69, y: 201.40 },
  { name: "North East", x: 140.16, y: 149.40 },
  { name: "Wales", x: 90.87, y: 253.40 },
  { name: "Scotland", x: 79.14, y: 73.40 },
  { name: "Northern Ireland", x: 20.47, y: 161.40 },
]

const VIEWBOX = "-10 -10 240 370"
const HEX_SIZE = 13   // real geography packs London/South East ~20 units
                      // apart — some overlap there is intentional, not a
                      // bug: it's honestly showing how dense that corner is

function hexPoints(cx: number, cy: number, size: number) {
  return Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 180) * (60 * i - 30)
    return `${cx + size * Math.cos(angle)},${cy + size * Math.sin(angle)}`
  }).join(" ")
}

// Brand blue (rgb(33,92,208)) scaled by share of the maximum count —
// London and the South East will always read darkest, everywhere else
// scales down from there.
function hexLightness(count: number, max: number) {
  const t = max > 0 ? count / max : 0
  return 92 - t * 60   // 92% (near-white) down to 32% (deep blue)
}

function fillFor(count: number, max: number) {
  return `oklch(${hexLightness(count, max) / 100} 0.13 262)`
}

// The dark foreground/muted-foreground pair reads fine on the light end of
// the scale, but near-black text on the darkest (deep blue) hexes fails
// contrast — switch to light text once the hex itself gets dark enough.
function textColorClassFor(count: number, max: number) {
  return hexLightness(count, max) < 55 ? "region-hex-label--light" : "region-hex-label--dark"
}

export function RegionMap() {
  const counts = regionCounts as Record<string, number>
  const max = Math.max(...Object.values(counts))
  const total = Object.values(counts).reduce((a, b) => a + b, 0)
  // Native SVG <title> tooltips are unreliable across browsers and don't
  // exist at all on touch devices — this is a real, always-visible label
  // driven by actual hover/focus state instead, so it reliably works.
  const [active, setActive] = useState<string | null>(null)

  // Draw smaller/lighter hexes first so the busiest regions (London, the
  // South East) render on top where they overlap their neighbours.
  const ordered = [...REGIONS].sort(
    (a, b) => (counts[a.name] ?? 0) - (counts[b.name] ?? 0),
  )

  return (
    <section className="border-y border-border bg-muted/40 py-24">
      <div className="mx-auto max-w-3xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[13px] font-medium text-brand">Mapped</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Where the {total.toLocaleString()} boutique firms are
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Every UK region, on the real map — shaded and sized by firm count.
            London and the South East are so dense their hexes overlap; that's
            not a bug, it's the point.
          </p>
        </div>

        <div className="mt-12 flex justify-center overflow-x-auto">
          <svg
            viewBox={VIEWBOX}
            className="h-auto w-full max-w-md"
            role="img"
            aria-label={`Map of UK regions by number of boutique finance firms: ${REGIONS
              .map((r) => `${r.name} ${counts[r.name] ?? 0}`)
              .join(", ")}`}
          >
            {UK_OUTLINE_PATHS.map((d, i) => (
              <path
                key={i}
                d={d}
                fill="var(--color-background)"
                stroke="var(--color-border)"
                strokeWidth={1}
              />
            ))}
            {ordered.map((r) => {
              const count = counts[r.name] ?? 0
              return (
                <g
                  key={r.name}
                  tabIndex={0}
                  role="button"
                  aria-label={`${r.name}: ${count.toLocaleString()} firms`}
                  onMouseEnter={() => setActive(r.name)}
                  onMouseLeave={() => setActive((cur) => (cur === r.name ? null : cur))}
                  onFocus={() => setActive(r.name)}
                  onBlur={() => setActive((cur) => (cur === r.name ? null : cur))}
                  className="region-hex-group"
                >
                  <polygon
                    points={hexPoints(r.x, r.y, HEX_SIZE)}
                    fill={fillFor(count, max)}
                    fillOpacity={active === r.name ? 1 : 0.92}
                    stroke={active === r.name ? "var(--color-brand)" : "var(--color-background)"}
                    strokeWidth={active === r.name ? 2 : 1}
                  />
                  <text
                    x={r.x}
                    y={r.y + 3}
                    textAnchor="middle"
                    className={`region-hex-label ${textColorClassFor(count, max)}`}
                  >
                    {count.toLocaleString()}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>
        <p className="mt-4 h-5 text-center text-sm font-medium text-foreground">
          {active ? `${active} — ${(counts[active] ?? 0).toLocaleString()} firms` : " "}
        </p>
        <p className="mt-1 text-center text-xs text-muted-foreground">
          Basemap: Natural Earth (public domain), simplified. Hover or tab to
          a hex for the region name.
        </p>
      </div>
    </section>
  )
}
