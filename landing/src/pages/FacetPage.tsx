import { Bar } from "@/components/Bar"
import facets from "@/data/facets.json"
import { lastUpdated } from "@/lib/utils"

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

const COHORT_LABELS: Record<string, string> = {
  under_2y: "Under 2 years",
  "2_5y": "2–5 years",
  "5_10y": "5–10 years",
  "10_20y": "10–20 years",
  "20y_plus": "20+ years",
}

export function FacetPage({ sectorKey, regionKey }: { sectorKey: string; regionKey: string }) {
  const facet = facets.find((f) => f.sectorKey === sectorKey && f.regionKey === regionKey)

  if (!facet) {
    return (
      <div className="min-h-screen bg-background font-sans antialiased">
        <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
            <Logo />
            <a href="/explore/" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              ← Back to Explore
            </a>
          </div>
        </header>
        <main className="mx-auto max-w-2xl px-6 py-16">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Segment not found</h1>
          <p className="mt-4 text-sm text-muted-foreground">
            That sector/region combination doesn&rsquo;t currently have enough firms in the
            database for its own page.{" "}
            <a href="/explore/" className="text-brand hover:underline">
              See all available segments
            </a>
            .
          </p>
        </main>
      </div>
    )
  }

  const maxCohort = Math.max(...Object.values(facet.cohorts))

  return (
    <div className="min-h-screen bg-background font-sans antialiased">
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Logo />
          <a href="/explore/" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            ← Back to Explore
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-16">
        <p className="text-[13px] font-medium text-brand">{facet.regionLabel}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
          {facet.sectorLabel} firms in {facet.regionLabel}
        </h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Aggregate figures from the full database, last checked against the registers{" "}
          {lastUpdated()}. Individual firm listings are in the curated database, not shown here.
        </p>

        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-border p-4">
            <p className="text-2xl font-semibold tracking-tight text-foreground">
              {facet.count.toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Firms in this segment</p>
          </div>
          <div className="rounded-lg border border-border p-4">
            <p className="text-2xl font-semibold tracking-tight text-foreground">
              {facet.medianAgeYears}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Median company age (years)</p>
          </div>
          <div className="rounded-lg border border-border p-4">
            <p className="text-2xl font-semibold tracking-tight text-foreground">
              {facet.careersSharePct === null ? "—" : `${facet.careersSharePct}%`}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Have a listed careers page{" "}
              {facet.websiteCount > 0 && `(of ${facet.websiteCount.toLocaleString()} checked)`}
            </p>
          </div>
        </div>

        <h2 className="mt-12 mb-3 text-2xl font-semibold tracking-tight text-foreground">
          Incorporation age
        </h2>
        <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
          When these firms were founded. Newer boutiques are often the highest-value outreach
          targets — a founder who recently left a larger firm and needs cheap, capable early help.
        </p>
        <div className="space-y-2">
          {Object.entries(facet.cohorts).map(([key, count]) => (
            <div key={key} className="flex items-center gap-3">
              <span className="w-28 shrink-0 text-xs text-muted-foreground">
                {COHORT_LABELS[key] ?? key}
              </span>
              <div className="h-2 flex-1 rounded-full bg-muted">
                <Bar pct={maxCohort > 0 ? Math.round((count / maxCohort) * 100) : 0} />
              </div>
              <span className="w-12 shrink-0 text-right text-xs text-muted-foreground">
                {count.toLocaleString()}
              </span>
            </div>
          ))}
        </div>

        <p className="mt-10 text-sm text-muted-foreground">
          Want the actual firm names?{" "}
          <a href="/#pricing" className="text-brand hover:underline">
            Get free database access
          </a>{" "}
          or read the{" "}
          <a href="/methodology/" className="text-brand hover:underline">
            methodology
          </a>{" "}
          behind these numbers.
        </p>
      </main>

      <footer className="border-t border-border px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            Placement Scout is a free directory built from public registers. Not affiliated with
            or endorsed by the FCA or Companies House.
          </p>
          <div className="flex items-center gap-4">
            <a href="/explore/" className="text-xs text-muted-foreground hover:text-foreground">
              Explore
            </a>
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
