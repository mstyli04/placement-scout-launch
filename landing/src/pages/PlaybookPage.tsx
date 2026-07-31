import type { ReactNode } from "react"

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

export function PlaybookPage() {
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
        <p className="text-[13px] font-medium text-brand">Free with database access</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
          The Boutique Outreach Playbook
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          How to pick your 30 firms, find the right person to write to, and structure a short
          email that actually gets replies — for boutique M&amp;A shops, wealth managers, PE/VC,
          and prop firms that don&apos;t run a graduate scheme.
        </p>

        <H2>1. Why boutiques</H2>
        <P>
          Every graduate/placement portal at a bulge-bracket bank or Big Four firm gets thousands
          of applications for a handful of roles — some grad schemes report{" "}
          <strong className="font-medium text-foreground">3,000+ applicants per place</strong>.
          You are, statistically, mostly wasting your time there. Not because you&apos;re not good
          enough — because the odds are built to reject almost everyone regardless of quality.
        </P>
        <P>
          A boutique M&amp;A shop, a 15-person wealth manager, a 6-person prop desk — these firms
          don&apos;t run graduate schemes. They don&apos;t have a careers portal. When they need
          someone, they hire when they notice they need someone, and they hire whoever is in front
          of them at that moment with a sensible, specific email. Most of them get{" "}
          <strong className="font-medium text-foreground">
            zero to five unsolicited applications a year
          </strong>
          , not three thousand.
        </P>
        <P>
          The trade-off: boutique roles are less structured, sometimes unpaid or low-paid for the
          first placement, and you won&apos;t get a slick induction programme. What you get
          instead: real deal exposure from week one, direct access to the people making decisions,
          and a CV line that shows initiative rather than &ldquo;I filled in a form like everyone
          else.&rdquo;
        </P>
        <P>
          This playbook is about the mechanics of finding these firms and getting a reply — not
          about whether boutique experience is &ldquo;worth it.&rdquo; If you&apos;re reading
          this, you&apos;ve already decided it is.
        </P>

        <H2>2. How to read a database row</H2>
        <P>Every firm in Placement Scout carries the same columns:</P>
        <ul className="mb-3 list-disc space-y-2.5 pl-5">
          <LI>
            <strong className="font-medium text-foreground">Sector</strong> — M&amp;A / advisory,
            asset &amp; wealth management, PE/VC, or quant &amp; trading. Match to what you
            actually want to do — don&apos;t spray identical emails across sectors.
          </LI>
          <LI>
            <strong className="font-medium text-foreground">City</strong> — registered office
            location. Boutiques cluster in London, but regional ones (Manchester, Leeds,
            Edinburgh) have far less competition for the same reply.
          </LI>
          <LI>
            <strong className="font-medium text-foreground">Website / careers page</strong> —
            direct links, no job board in between. If a &ldquo;careers page&rdquo; is just a
            contact form or doesn&apos;t exist, that&apos;s a signal: this firm hires informally,
            which is exactly the kind of firm that responds well to a direct email.
          </LI>
          <LI>
            <strong className="font-medium text-foreground">FCA authorised</strong> — whether the
            firm is regulated, plus a link to verify on the public register. Authorisation signals
            an active, real business — but plenty of legitimate advisory/PE firms are unregulated,
            so don&apos;t filter these out.
          </LI>
          <LI>
            <strong className="font-medium text-foreground">Incorporated</strong> — year the
            company was founded. See &ldquo;picking your 30&rdquo; below — recency is a strong
            reply-rate signal.
          </LI>
          <LI>
            <strong className="font-medium text-foreground">Contact</strong> — a verified role
            inbox (info@, careers@, etc.) where we found one. A fallback, never your first choice
            — see section 4.
          </LI>
        </ul>
        <P>
          The database is a starting point, not a finished target list. The next section is about
          cutting a long list of firms down to a shortlist you can actually work.
        </P>

        <H2>3. Picking your 30</H2>
        <P>
          Don&apos;t email every firm in the database. Don&apos;t even email 100. Response quality
          collapses the moment your emails stop being specific to each firm, and generic
          mail-merged outreach is easy for anyone reading it to spot and bin.
        </P>
        <p className="mb-3 text-sm font-medium text-foreground">The 10/10/10 rule:</p>
        <ul className="mb-3 list-disc space-y-2.5 pl-5">
          <LI>
            <strong className="font-medium text-foreground">10 reach firms</strong> —
            well-known-in-their-niche, established boutiques you&apos;d be thrilled to hear back
            from. Low reply odds, high upside.
          </LI>
          <LI>
            <strong className="font-medium text-foreground">10 realistic firms</strong> — small,
            active, sector-matched, no obvious red flags. This is where most of your replies will
            come from.
          </LI>
          <LI>
            <strong className="font-medium text-foreground">
              10 recently-authorised or recently-incorporated firms
            </strong>{" "}
            — the highest-odds segment, don&apos;t skip it in favour of only chasing recognisable
            names.
          </LI>
        </ul>
        <p className="mb-3 text-sm font-medium text-foreground">Filter first by:</p>
        <ol className="mb-3 list-decimal space-y-2.5 pl-5">
          <LI>
            <strong className="font-medium text-foreground">City + sector fit.</strong> If you
            can&apos;t credibly explain why <em>this</em> firm in <em>this</em> city, don&apos;t
            email it yet.
          </LI>
          <LI>
            <strong className="font-medium text-foreground">Recency.</strong> A firm authorised or
            incorporated in the last 12–18 months has no graduate-scheme machinery, no backlog of
            applications, and is actively growing headcount by definition — the highest-reply-rate
            segment in the whole database. The weekly &ldquo;new firms&rdquo; digest exists
            specifically to surface these before anyone else finds them.
          </LI>
          <LI>
            <strong className="font-medium text-foreground">Signs of an actual careers page.</strong>{" "}
            Counterintuitively, a firm with <em>no</em> careers page is often a better target than
            one with a generic one — it usually means &ldquo;we hire when we need to,
            informally,&rdquo; which is precisely the situation your email should walk into.
          </LI>
        </ol>
        <P>
          Thirty well-chosen firms, researched properly, beats a thousand generic ones. This
          isn&apos;t a numbers game — it&apos;s a research game.
        </P>

        <H2>4. Finding the right person</H2>
        <P>
          <strong className="font-medium text-foreground">Never lead with a generic inbox.</strong>{" "}
          <code className="text-foreground">info@</code> and{" "}
          <code className="text-foreground">careers@</code> addresses are triaged by whoever&apos;s
          free, if they&apos;re read at all. At a firm with 5–20 people, there is almost always a
          named partner, director, or founder you can find and email directly — and a direct,
          personal email from a student who clearly did their homework gets read completely
          differently to one landing in a shared inbox.
        </P>
        <p className="mb-3 text-sm font-medium text-foreground">Where to find the name:</p>
        <ol className="mb-3 list-decimal space-y-2.5 pl-5">
          <LI>
            <strong className="font-medium text-foreground">The firm&apos;s own website</strong> —
            &ldquo;Team&rdquo; or &ldquo;About&rdquo; pages at boutiques are usually a full list of
            partners/directors with bios, sometimes even direct emails.
          </LI>
          <LI>
            <strong className="font-medium text-foreground">The FCA register&apos;s individuals search</strong>{" "}
            — for FCA-authorised firms, the register lists approved persons attached to the firm.
            This tells you who&apos;s formally responsible — often the person worth writing to.
          </LI>
          <LI>
            <strong className="font-medium text-foreground">LinkedIn triangulation</strong> —
            search the firm name, filter to people, look for Founder/Partner/Director/MD titles.
            Cross-check against the website team page to confirm you&apos;ve got the right person.
          </LI>
        </ol>
        <P>
          If, after all that, you genuinely can&apos;t find a named person — that&apos;s when the
          role inbox in the database becomes your fallback, not your default.
        </P>

        <H2>5. The email</H2>
        <p className="mb-3 text-sm font-medium text-foreground">The four-line structure:</p>
        <ol className="mb-3 list-decimal space-y-2.5 pl-5">
          <LI>
            <strong className="font-medium text-foreground">A specific hook about their firm.</strong>{" "}
            Not &ldquo;I&apos;m interested in finance&rdquo; — something that proves you actually
            looked at this firm specifically. A recent deal, a sector niche, something from their
            website or a news mention.
          </LI>
          <LI>
            <strong className="font-medium text-foreground">Why them, in one line.</strong> Connect
            your hook to why you, specifically, want to work at a firm like this rather than a
            bulge-bracket bank — smaller teams, more responsibility, the specific sector.
          </LI>
          <LI>
            <strong className="font-medium text-foreground">What you bring, in one line.</strong>{" "}
            Not a CV dump — one credible, relevant thing (a course, a project, a prior internship,
            a specific skill) that&apos;s actually applicable to what they do.
          </LI>
          <LI>
            <strong className="font-medium text-foreground">A small, easy ask.</strong> Not
            &ldquo;do you have any openings?&rdquo; — ask for 15 minutes on a call, or to send your
            CV for whenever something comes up. Low-commitment asks get said yes to far more often
            than &ldquo;give me a job.&rdquo;
          </LI>
        </ol>
        <P>
          Keep the whole thing under 150 words. Boutique partners read email on their phone
          between meetings — length is a filter against you, not a sign of effort.
        </P>

        <H2>6. The follow-up cadence</H2>
        <P>Most replies come from the follow-up, not the first email — people are busy, not uninterested.</P>
        <ul className="mb-3 list-disc space-y-2.5 pl-5">
          <LI>
            <strong className="font-medium text-foreground">Day 4:</strong> a short, one-line bump.
            Don&apos;t re-explain yourself — just resurface the email (&ldquo;following up in case
            this got buried — happy to send more info or jump on a quick call&rdquo;).
          </LI>
          <LI>
            <strong className="font-medium text-foreground">Day 10:</strong> one new angle. A
            relevant news item, a slightly different ask, or a small piece of extra context that
            wasn&apos;t in the first email — it needs to give them a new reason to reply.
          </LI>
          <LI>
            <strong className="font-medium text-foreground">After day 10:</strong> stop. Move on. A
            third follow-up reads as pressure, not persistence, and burns the relationship for
            future attempts (e.g. next year).
          </LI>
        </ul>
        <P>
          <strong className="font-medium text-foreground">Tracking:</strong> use a simple sheet as
          you go — Sent → Replied → Call booked → outcome, with the contact name and date in
          notes. With 30 firms in motion at once, a spreadsheet is the only way to remember who
          you followed up with and when.
        </P>

        <H2>7. Converting a call into a placement</H2>
        <P>
          If you get a call or a meeting, the goal isn&apos;t to &ldquo;interview well&rdquo; in
          the traditional sense — most boutiques aren&apos;t running a formal process, so the call
          itself often decides the outcome.
        </P>
        <p className="mb-3 text-sm font-medium text-foreground">Questions worth asking:</p>
        <ul className="mb-3 list-disc space-y-2.5 pl-5">
          <LI>
            What does someone in this role actually spend their time on day to day? (Shows
            you&apos;re thinking about the substance of the job, not just getting a title.)
          </LI>
          <LI>
            What&apos;s a recent piece of work the team&apos;s been proud of? (Gives them a chance
            to talk about something they&apos;re genuinely engaged in.)
          </LI>
          <LI>Is there a specific gap in the team right now you&apos;re trying to fill?</LI>
        </ul>
        <P>
          <strong className="font-medium text-foreground">
            If there&apos;s no formal internship advertised:
          </strong>{" "}
          don&apos;t wait to be offered one — propose it. Once it&apos;s clear there&apos;s mutual
          interest, a direct, low-pressure suggestion (&ldquo;would a short unpaid trial period
          over [dates] be useful for you, so we can both see if this is a good fit?&rdquo;) often
          converts genuine interest into an actual placement, because you&apos;re removing the
          friction of them having to invent a formal process from scratch. Small firms often
          don&apos;t say no to free, capable help — they just never got around to setting up a
          scheme for it.
        </P>

        <div className="mt-12 rounded-xl border border-border bg-muted/40 p-6 text-center">
          <p className="text-sm text-muted-foreground">
            This playbook comes free with Placement Scout database access.
          </p>
          <a
            href="/#access"
            className="mt-3 inline-flex items-center justify-center rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90"
          >
            Get free access
          </a>
        </div>
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
