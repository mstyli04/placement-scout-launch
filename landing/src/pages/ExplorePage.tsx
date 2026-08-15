import { Bar } from "@/components/Bar"
import facets from "@/data/facets.json"
import overview from "@/data/overview.json"
import { lastUpdated } from "@/lib/utils"

const COHORT_LABELS: Record<string, string> = {
  under_2y: "Under 2 years",
  "2_5y": "2–5 years",
  "5_10y": "5–10 years",
  "10_20y": "10–20 years",
  "20y_plus": "20+ years",
}

function Logo() {
  return (
    <a href="/" className="flex items-center gap-2">
      <span className="flex size-6 items-center justify-center rounded-md bg-foreground">
        <svg viewBox="0 0 16 16" className="size-3.5 fill-background">
          <path d="M7 2a5 5 0 1 0 3.1 8.9l3 3 1.4-1.4-3-3A5 5 0 0 0 7 2Zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z" />
        </svg>
      </span>
      <span className="text-[15px] font-semibold tracking-tight text-foreground">
        Placement Scout
      </span>
    </a>
  )
}

export function ExplorePage() {
  const sectors = [...new Set(facets.map((f) => f.sectorLabel))]

  return (
    <div className="min-h-screen bg-background font-sans antialiased">
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Logo />
          <a href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            ← Back to home
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Explore the database
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Aggregate firm counts, company age, and careers-page coverage by sector and UK region —
          {facets.length} segments, each with at least 5 firms behind it. Data last checked against
          the registers {lastUpdated()}.
        </p>

        <section className="mt-10">
          <h2 className="mb-3 text-lg font-semibold tracking-tight text-foreground">
            Whole database
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-border p-4">
              <p className="text-2xl font-semibold tracking-tight text-foreground">
                {overview.totalFirms.toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Firms tracked</p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <p className="text-2xl font-semibold tracking-tight text-foreground">
                {overview.medianAgeYears}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Median company age (years)</p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <p className="text-2xl font-semibold tracking-tight text-foreground">
                {overview.careersSharePct === null ? "—" : `${overview.careersSharePct}%`}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Have a listed careers page (of {overview.websiteCount.toLocaleString()} checked)
              </p>
            </div>
          </div>

          <h3 className="mt-8 mb-3 text-sm font-semibold text-foreground">Sector mix</h3>
          <div className="space-y-2">
            {overview.sectorMix.map((s) => (
              <div key={s.sectorLabel} className="flex items-center gap-3">
                <span className="w-40 shrink-0 text-xs text-muted-foreground">
                  {s.sectorLabel}
                </span>
                <div className="h-2 flex-1 rounded-full bg-muted">
                  <Bar pct={Math.round((s.count / overview.sectorMix[0].count) * 100)} />
                </div>
                <span className="w-16 shrink-0 text-right text-xs text-muted-foreground">
                  {s.count.toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          <h3 className="mt-8 mb-3 text-sm font-semibold text-foreground">Incorporation age</h3>
          <div className="space-y-2">
            {Object.entries(overview.cohorts).map(([key, count]) => {
              const max = Math.max(...Object.values(overview.cohorts))
              return (
                <div key={key} className="flex items-center gap-3">
                  <span className="w-28 shrink-0 text-xs text-muted-foreground">
                    {COHORT_LABELS[key] ?? key}
                  </span>
                  <div className="h-2 flex-1 rounded-full bg-muted">
                    <Bar pct={max > 0 ? Math.round((count / max) * 100) : 0} />
                  </div>
                  <span className="w-16 shrink-0 text-right text-xs text-muted-foreground">
                    {count.toLocaleString()}
                  </span>
                </div>
              )
            })}
          </div>

          <p className="mt-6 text-xs text-muted-foreground">
            Careers pages that have genuinely changed are now tracked and published as they move —
            see{" "}
            <a href="/signals/" className="text-brand hover:underline">
              hiring signals
            </a>
            . There is not yet enough history behind it to plot a time series honestly, so it is a
            dated feed rather than a chart.
          </p>
        </section>

        <h2 className="mt-12 mb-1 text-lg font-semibold tracking-tight text-foreground">
          By segment
        </h2>
        <p className="mb-3 text-sm text-muted-foreground">
          The same breakdown, sliced by sector and region — click through for the full detail.
        </p>

        {sectors.map((sector) => {
          const rows = facets
            .filter((f) => f.sectorLabel === sector)
            .sort((a, b) => b.count - a.count)
          return (
            <section key={sector} className="mt-10">
              <h2 className="mb-3 text-lg font-semibold tracking-tight text-foreground">
                {sector}
              </h2>
              <ul className="divide-y divide-border rounded-lg border border-border">
                {rows.map((f) => (
                  <li key={`${f.sectorKey}-${f.regionKey}`}>
                    <a
                      href={`/explore/${f.sectorKey}/${f.regionKey}/`}
                      className="flex items-center justify-between px-4 py-3 text-sm hover:bg-muted/40"
                    >
                      <span className="text-foreground">{f.regionLabel}</span>
                      <span className="text-muted-foreground">
                        {f.count.toLocaleString()} firms
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )
        })}
      </main>

      <footer className="border-t border-border px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            Placement Scout is a free directory built from public registers. Not affiliated with
            or endorsed by the FCA or Companies House.
          </p>
          <div className="flex items-center gap-4">
            <a href="/methodology/" className="text-xs text-muted-foreground hover:text-foreground">
              Methodology
            </a>
            <a href="/privacy/" className="text-xs text-muted-foreground hover:text-foreground">
              Privacy Policy
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
