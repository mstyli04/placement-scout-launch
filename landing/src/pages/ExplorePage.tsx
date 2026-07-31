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
