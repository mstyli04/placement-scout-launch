import type { ReactNode } from "react"

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

function H2({ children }: { children: ReactNode }) {
  return (
    <h2 className="mt-12 mb-3 text-2xl font-semibold tracking-tight text-foreground">
      {children}
    </h2>
  )
}

function P({ children }: { children: ReactNode }) {
  return <p className="mb-3 text-sm leading-relaxed text-muted-foreground">{children}</p>
}

function LI({ children }: { children: ReactNode }) {
  return <li className="text-sm leading-relaxed text-muted-foreground">{children}</li>
}

export function MethodologyPage() {
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
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Methodology</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Company and regulatory data last checked against the registers {lastUpdated()}.
        </p>

        <P>
          This page explains exactly how a firm ends up in the Placement Scout database, how it's
          classified, what its data means, and what we already know is imperfect about it. The
          goal is that you could reconstruct the logic below without ever seeing the code.
        </P>

        <H2>Where the data comes from</H2>
        <P>
          Every firm starts as a hit in a Companies House advanced search, scoped to a fixed list
          of UK SIC 2007 codes (below). Its regulatory status and website are then looked up
          against the FCA&rsquo;s Financial Services Register by matching the company name. Its own
          website is then checked for a careers page, hiring-related language, and a public contact
          address. Nothing here is invented — every fact traces back to one of these three public
          sources.
        </P>

        <H2>How a firm qualifies as &ldquo;boutique&rdquo;</H2>
        <P>
          There is no official legal definition of &ldquo;boutique&rdquo; — we infer it from what
          size of statutory accounts a company files with Companies House, which is a genuine but
          imperfect proxy:
        </P>
        <ul className="mb-3 list-disc space-y-1.5 pl-5">
          <LI>
            Public limited companies are excluded outright — they&rsquo;re categorically not
            independent boutiques.
          </LI>
          <LI>
            A firm filing <em>full</em>, <em>group</em>, <em>dormant</em>, or{" "}
            <em>audit-exemption-subsidiary</em> accounts is excluded — full/group accounts usually
            mean a larger or non-independent operation, dormant means not currently trading, and an
            audit-exemption subsidiary is, by definition, part of a group rather than independent.
          </LI>
          <LI>
            A firm filing micro-entity, small, medium, abridged, or total-exemption accounts
            qualifies — this is the accounts profile of a genuinely small, independent company.
          </LI>
          <LI>
            A firm with no accounts on file yet (common for very recently incorporated companies)
            is kept by default rather than excluded, since there&rsquo;s nothing yet to disqualify
            it on.
          </LI>
        </ul>
        <P>
          This is a heuristic, not a certainty. A large firm that happens to file simplified
          accounts, or a genuinely tiny boutique with an unusual filing history, can occasionally
          fall on the wrong side of this test.
        </P>

        <H2>Sector classification</H2>
        <P>
          Sectors are assigned from the SIC codes a company has registered with Companies House. A
          firm can appear in more than one sector if its registered codes span more than one
          category below.
        </P>
        <ul className="mb-3 list-disc space-y-1.5 pl-5">
          <LI><span className="font-medium text-foreground">M&amp;A / advisory</span> — SIC 70221, 66190, 64999</LI>
          <LI><span className="font-medium text-foreground">Asset &amp; wealth management</span> — SIC 66300, 64301, 64302, 64304</LI>
          <LI><span className="font-medium text-foreground">PE / VC</span> — SIC 64303</LI>
          <LI><span className="font-medium text-foreground">Quant / trading / fintech</span> — SIC 64991, 66120, 66110</LI>
        </ul>

        <H2>London and regional classification</H2>
        <P>
          A firm counts as London-based if Companies House lists its registered office locality as
          &ldquo;London&rdquo;, or its postcode falls in a core London postcode area (E, EC, N, NW,
          SE, SW, W, WC). A registered office isn&rsquo;t always the same place a firm actually
          hires from — a firm registered elsewhere can genuinely operate and hire in London, or the
          reverse.
        </P>

        <H2>What raises a firm&rsquo;s priority</H2>
        <P>
          Firms are ranked, not just filtered — a handful of signals push a firm higher: being
          based in London, having hiring-relevant language on its own careers page (placement,
          internship, or graduate-scheme wording), having a genuine discoverable contact channel,
          and being a newer company more likely to be actively building a team. We don&rsquo;t
          publish the exact weighting — the point is what kind of firm rises to the top, not a
          formula to reverse-engineer.
        </P>

        <H2>Known limitations</H2>
        <ul className="mb-3 list-disc space-y-1.5 pl-5">
          <LI>
            <span className="font-medium text-foreground">Search coverage</span> — Companies
            House&rsquo;s search API caps a single query at 5,000 results. In principle, a very
            dense incorporation-date window within the same SIC codes could exceed that cap and
            miss firms; this is a known open edge case, not yet fully resolved.
          </LI>
          <LI>
            <span className="font-medium text-foreground">FCA matching</span> — firms are matched
            to the FCA register by company name (normalised for legal suffixes and formatting), not
            a shared unique identifier. An unusual trading name or a recent rename can occasionally
            cause a missed or mismatched regulatory record.
          </LI>
          <LI>
            <span className="font-medium text-foreground">&ldquo;Boutique&rdquo; is a heuristic</span>{" "}
            — see above. It is not a legal or official designation.
          </LI>
          <LI>
            <span className="font-medium text-foreground">Regulatory status can change</span>{" "}
            after we last checked it. Always confirm anything that matters against the linked FCA
            or Companies House record directly, not just what&rsquo;s shown here.
          </LI>
          <LI>
            <span className="font-medium text-foreground">Not every field updates at the same
            pace</span> — Companies House and FCA facts (registered address, incorporation date,
            regulatory status) are checked on the main refresh cycle above. A firm&rsquo;s careers
            page and contact details are refreshed on their own slower cycle, only once that
            firm&rsquo;s prior check is over 30 days old.
          </LI>
        </ul>

        <H2>What&rsquo;s deliberately excluded</H2>
        <ul className="mb-3 list-disc space-y-1.5 pl-5">
          <LI>
            Any individual&rsquo;s named contact email. Only shared, role-based inboxes
            (careers@, info@, and similar) are ever shown — see the{" "}
            <a href="/playbook/" className="text-brand hover:underline">Outreach Playbook</a>{" "}
            for how to find the right person yourself.
          </LI>
          <LI>
            Firms that have asked to be removed, or that we&rsquo;ve identified as misclassified
            (for example, a company-formation agent rather than a real trading boutique) — excluded
            permanently, regardless of what a later refresh would otherwise find.
          </LI>
          <LI>
            Public limited companies and other non-independent company types — see the boutique
            test above.
          </LI>
          <LI>
            Group subsidiaries, dormant companies, and companies filing full-scale statutory
            accounts — these generally indicate a larger or non-independent operation.
          </LI>
        </ul>
      </main>

      <footer className="border-t border-border px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            Placement Scout is a free directory built from public registers. Not affiliated with
            or endorsed by the FCA or Companies House.
          </p>
          <div className="flex items-center gap-4">
            <a href="/playbook/" className="text-xs text-muted-foreground hover:text-foreground">
              Outreach Playbook
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
