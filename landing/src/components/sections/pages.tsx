import { ArrowUpRight } from "lucide-react"

import facets from "@/data/facets.json"
import signals from "@/data/signals.json"
import { lastUpdated } from "@/lib/utils"

const nf = new Intl.NumberFormat("en-GB")

/**
 * Everything on this site that is not the home page used to be reachable
 * only from a footer link, which meant the four pages carrying most of the
 * actual work — the signals feed, the aggregate explorer, the playbook and
 * the methodology — were the least likely to be read. This gives each one a
 * real destination card in the scroll, with a live number attached so it
 * reads as somewhere to go rather than boilerplate navigation.
 */
const DESTINATIONS = [
  {
    href: "/signals/",
    label: "Hiring signals",
    stat: `${signals.publishableCount} firms`,
    body: "Which careers pages changed in the last 90 days, dated, with a link to each one. The nearest thing here to a list of who is hiring right now.",
    cta: "See what moved",
    accent: true,
  },
  {
    href: "/explore/",
    label: "Explore the database",
    stat: `${facets.length} breakdowns`,
    body: "Firm counts, company age and careers-page coverage for every sector and region combination, each with its own page.",
    cta: "Browse the breakdowns",
  },
  {
    href: "/playbook/",
    label: "The Outreach Playbook",
    stat: "Free guide",
    body: "How to pick thirty target firms, find the right person, and write something short that gets answered. Written for a placement search, not a sales funnel.",
    cta: "Read the playbook",
  },
  {
    href: "/methodology/",
    label: "Methodology",
    stat: "How it works",
    body: "Where the data comes from, how a firm is classified as a boutique, what raises its ranking, and the limitations that are known and unfixed.",
    cta: "Read the method",
  },
]

export function Pages() {
  return (
    <section id="pages" className="border-t border-border bg-muted/25 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
              The rest of the site
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              Four pages doing the real work
            </h2>
          </div>
          <p className="max-w-xs text-sm text-muted-foreground">
            All free, no signup. Data last checked {lastUpdated()}.
          </p>
        </div>

        <div className="mt-12 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2">
          {DESTINATIONS.map((d) => (
            <a
              key={d.href}
              href={d.href}
              className="group relative flex flex-col justify-between gap-8 bg-background p-7 transition-colors duration-200 hover:bg-muted/50 focus-visible:bg-muted/50 sm:p-9"
            >
              <div>
                <div className="flex items-center justify-between gap-4">
                  <span
                    className={`font-mono text-[11px] tracking-[0.14em] uppercase ${
                      d.accent ? "text-brand" : "text-muted-foreground"
                    }`}
                  >
                    {d.stat}
                  </span>
                  <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
                </div>
                <h3 className="mt-4 text-xl font-semibold tracking-tight text-foreground">
                  {d.label}
                </h3>
                <p className="mt-3 max-w-[46ch] text-sm leading-relaxed text-muted-foreground">
                  {d.body}
                </p>
              </div>
              <span className="text-sm font-medium text-foreground underline-offset-4 group-hover:underline">
                {d.cta}
              </span>
            </a>
          ))}
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          {nf.format(signals.watchedCount)} careers pages are re-checked every
          night. Any firm can{" "}
          <a href="/removal/" className="text-brand underline underline-offset-4">
            ask to be removed
          </a>
          .
        </p>
      </div>
    </section>
  )
}
