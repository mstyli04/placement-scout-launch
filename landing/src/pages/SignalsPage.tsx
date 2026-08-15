import { ArrowRight } from "lucide-react"

import { Bar } from "@/components/Bar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import signals from "@/data/signals.json"
import { formatDate, lastUpdated } from "@/lib/utils"

// The public face of the careers_page_changed signal. Everything shown here
// comes from signals.json, built by scripts/build_signals.py, which enforces
// the suppression list and the free-tier score cap in SQL — this component
// renders what it is given and makes no eligibility decision of its own.

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

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-lg border border-border p-4">
      <p className="text-2xl font-semibold tracking-tight text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

export function SignalsPage() {
  const { changes, regionMix } = signals
  const regions = Object.entries(regionMix)
  const maxRegion = Math.max(1, ...regions.map(([, n]) => n))

  // Grouped by the day the change was seen, newest first, so the page reads
  // as a feed rather than a table. Object key order is insertion order for
  // string keys, and `changes` arrives sorted by date descending.
  const byDate = changes.reduce<Record<string, typeof changes>>((acc, change) => {
    ;(acc[change.observedAt] ??= []).push(change)
    return acc
  }, {})

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
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Hiring signals</h1>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Boutique finance firms almost never post on job boards. What they do instead is quietly
          change the careers page on their own website — and that change is public, dated, and
          nobody watches it. Placement Scout does:{" "}
          <span className="font-medium text-foreground">
            {signals.watchedCount.toLocaleString()} careers pages
          </span>{" "}
          are fingerprinted and re-checked on a nightly run, and every change is recorded. Below is
          what has moved in the last {signals.windowDays} days. Last checked {lastUpdated()}.
        </p>

        <section className="mt-10">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Stat
              value={signals.watchedCount.toLocaleString()}
              label="Careers pages watched nightly"
            />
            <Stat
              value={signals.changedCount.toLocaleString()}
              label={`Changed in the last ${signals.windowDays} days`}
            />
            <Stat
              value={changes.length.toLocaleString()}
              label="Shown below, with a link to the page"
            />
          </div>
        </section>

        <section className="mt-8 rounded-lg border border-border bg-muted/30 p-5">
          <h2 className="text-sm font-semibold text-foreground">Why this is worth watching</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            A firm that edits its careers page has usually decided to hire. At a large employer that
            decision becomes a job board listing within days. At a twelve-person advisory boutique it
            often becomes nothing at all — the role is filled through someone who happened to ask at
            the right moment. A dated list of firms that just changed their careers page is the
            closest thing to knowing when that moment is.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            It is a signal, not an advert. A change can also mean a design tweak or a removed
            vacancy. Read it as a reason to look, and check the page yourself before writing.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="mb-3 text-lg font-semibold tracking-tight text-foreground">
            Recent changes
          </h2>
          {changes.length === 0 ? (
            <p className="rounded-lg border border-border p-5 text-sm leading-relaxed text-muted-foreground">
              Nothing has changed in the last {signals.windowDays} days. The watch list is still
              being checked nightly — this fills in as pages move.
            </p>
          ) : (
            Object.entries(byDate).map(([observedAt, group]) => (
              <div key={observedAt} className="mt-6">
                <h3 className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  {formatDate(observedAt)} · {group.length}{" "}
                  {group.length === 1 ? "change" : "changes"}
                </h3>
                <ul className="divide-y divide-border rounded-lg border border-border">
                  {group.map((change) => (
                    <li
                      key={`${change.name}-${change.careersUrl}`}
                      className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <a
                          href={change.careersUrl}
                          rel="nofollow noopener noreferrer"
                          target="_blank"
                          className="text-sm font-medium text-foreground hover:text-brand hover:underline"
                        >
                          {change.name}
                        </a>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {[change.sectors.join(", "), change.city, change.region]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        careers page updated
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}

          {signals.withheldCount > 0 ? (
            <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
              {signals.withheldCount} further {signals.withheldCount === 1 ? "firm" : "firms"}{" "}
              changed a careers page in this window but {signals.withheldCount === 1 ? "is" : "are"}{" "}
              not listed: this page publishes firms scoring {signals.maxScore} and below. Saying how
              many were held back seemed more honest than quietly showing a shorter list.
            </p>
          ) : null}
        </section>

        {regions.length > 0 ? (
          <section className="mt-12">
            <h2 className="mb-3 text-lg font-semibold tracking-tight text-foreground">
              Where the movement is
            </h2>
            <div className="space-y-2">
              {regions.map(([region, count]) => (
                <div key={region} className="flex items-center gap-3">
                  <span className="w-32 shrink-0 text-xs text-muted-foreground">{region}</span>
                  <div className="h-2 flex-1 rounded-full bg-muted">
                    <Bar pct={Math.round((count / maxRegion) * 100)} />
                  </div>
                  <span className="w-8 shrink-0 text-right text-xs text-muted-foreground">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-12 rounded-lg border border-border p-5">
          <h2 className="text-sm font-semibold text-foreground">How the detection works</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Each firm&rsquo;s careers page is fetched and reduced to a fingerprint. On the next run
            the page is fetched again and the fingerprints compared; a difference is recorded as a
            dated signal against that firm. No page is stored, only the fingerprint and the date.
            The <a href="/methodology/" className="text-brand hover:underline">methodology</a> covers
            how firms get into the database in the first place, and any firm can{" "}
            <a href="/removal/" className="text-brand hover:underline">ask to be removed</a>.
          </p>
        </section>

        {/* The only route from this page into the mailing list. Reuses the home
            page's Buttondown embed rather than a second list — same action URL,
            same confirmation popup, so a subscriber from here is
            indistinguishable from one who signed up on the home page.
            `form-action` in vercel.json's CSP already allows buttondown.com. */}
        <section className="mt-12 rounded-lg border border-border bg-muted/40 p-5">
          <h2 className="text-sm font-semibold text-foreground">Want the firms behind the signals?</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            This page shows which firms moved. The free sheet is the full directory — 100 curated
            boutiques with contact routes, FCA status and the careers-page column, refreshed
            nightly. No charge, no card.
          </p>
          <form
            action="https://buttondown.com/api/emails/embed-subscribe/michaelstylianou"
            method="post"
            target="popupwindow"
            onSubmit={() =>
              window.open("https://buttondown.com/confirmation?tag=michaelstylianou", "popupwindow")
            }
            className="mt-4 flex flex-col gap-2 sm:flex-row"
          >
            <Input
              type="email"
              name="email"
              placeholder="email"
              required
              className="flex-1 bg-background"
            />
            <input type="hidden" name="embed" value="1" />
            <Button type="submit">
              Get the free sheet
              <ArrowRight className="size-4" data-icon="inline-end" />
            </Button>
          </form>
          <p className="mt-3 text-xs text-muted-foreground">
            Your email is used for the access link and the weekly digest — nothing else, ever. See
            the <a href="/privacy/" className="text-brand hover:underline">privacy policy</a>.
          </p>
        </section>
      </main>

      <footer className="border-t border-border px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            Placement Scout is a free directory built from public registers. Not affiliated with or
            endorsed by the FCA or Companies House.
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
