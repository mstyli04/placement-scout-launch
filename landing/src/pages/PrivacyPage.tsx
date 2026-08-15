const CONTACT_EMAIL = "michaelstylianou2@gmail.com"

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

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-10 mb-3 text-lg font-semibold tracking-tight text-foreground">{children}</h2>
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="mb-3 text-sm leading-relaxed text-muted-foreground">{children}</p>
}

function LI({ children }: { children: React.ReactNode }) {
  return <li className="text-sm leading-relaxed text-muted-foreground">{children}</li>
}

export function PrivacyPage() {
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
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: 15 August 2026</p>

        <P>
          Placement Scout is a free directory of boutique UK finance firms, delivered by email
          signup. This policy explains what data we collect when you sign up, why, and the rights
          you have over it under the EU/UK General Data Protection Regulation (GDPR).
        </P>

        <H2>Who is responsible</H2>
        <P>
          Placement Scout is operated by Michael Stylianou (the &ldquo;data controller&rdquo;). For
          any privacy question or request, contact{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-brand hover:underline">
            {CONTACT_EMAIL}
          </a>
          .
        </P>

        <H2>What we collect</H2>
        <P>
          Just your email address, submitted through the signup form to get access to the
          database. We don&rsquo;t ask for your name, university, or anything else. We run no
          advertising trackers and nothing that follows you to other websites; the one
          measurement tool in use is described under <span className="text-foreground">Analytics</span> below.
        </P>

        <H2>Why we process it</H2>
        <P>
          Solely on the basis of your consent (Art. 6(1)(a) GDPR) when you submit the form — to
          send the database access link and the weekly &ldquo;new firms this week&rdquo; digest.
          We don&rsquo;t use your email for anything else, and we don&rsquo;t sell or share it with
          anyone outside the processors listed below.
        </P>

        <H2>Analytics</H2>
        <P>
          We use Vercel Web Analytics to count page views and approximate visitor numbers — how
          many people read a page, and which site they arrived from. It is cookieless and does not
          use device fingerprinting, browser storage, or any identifier that would let us
          recognise you on a return visit or follow you to another website. What we see is
          aggregate counts, never an individual&rsquo;s browsing history, and it is never combined
          with the email address you may have given us.
        </P>
        <P>
          Our lawful basis is legitimate interests (Art. 6(1)(f) GDPR) — understanding whether the
          database is actually useful to people. Because no cookie or similar technology is stored
          on your device, this does not require consent under PECR. If you would rather not be
          counted at all, any browser &ldquo;do not track&rdquo; setting or content blocker will
          prevent it, and nothing on the site stops working.
        </P>

        <H2>Cookies</H2>
        <P>
          This site sets no cookies of its own — not for analytics, advertising, or anything else.
          The signup and confirmation pages are hosted by Buttondown (see below) and may set
          cookies under their own policy once you leave this site.
        </P>

        <H2>Who processes data on our behalf</H2>
        <ul className="mb-3 list-disc space-y-1.5 pl-5">
          <LI>
            <span className="font-medium text-foreground">Buttondown</span> — email delivery and
            list management. Buttondown is based in the United States; the transfer relies on
            their standard contractual clauses.
          </LI>
          <LI>
            <span className="font-medium text-foreground">Vercel</span> — hosting for this website,
            and the cookieless page-view analytics described above.
          </LI>
        </ul>
        <P>
          The firm database itself is hosted as a Google Sheet and contains no personal data about
          you — it&rsquo;s corporate information (firm names, sectors, websites, and public
          corporate contact channels) derived from the Companies House register (Open Government
          Licence) and the FCA&rsquo;s public Financial Services Register. See the site footer for
          the full attribution.
        </P>

        <H2>Legal basis for the firm database</H2>
        <P>
          The firm database contains no data about identifiable individuals. It&rsquo;s built from
          public register information — company names, sectors, registered addresses, and
          incorporation dates from Companies House, and authorisation status from the FCA&rsquo;s
          public Financial Services Register — enriched with each firm&rsquo;s own publicly
          published contact channels: its website, careers page, and a role-based inbox such as
          careers@ or info@, never a named individual&rsquo;s address.
        </P>
        <P>
          We hold and republish this on the basis of our legitimate interest (Art. 6(1)(f) GDPR)
          in operating a public directory of independently-verifiable business information that
          is already public via the Companies House and FCA registers. We&rsquo;ve weighed this
          against the interests of the firms concerned by minimising what we hold — no data about
          named individuals, only a shared role-based inbox — and any firm can ask to be removed
          permanently at any time, with no reason required, using the{" "}
          <a href="/removal/" className="text-brand hover:underline">
            firm removal form
          </a>{" "}
          or by emailing{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-brand hover:underline">
            {CONTACT_EMAIL}
          </a>
          .
        </P>

        <H2>How long we keep it</H2>
        <P>
          We keep your email address until you unsubscribe — every email includes an unsubscribe
          link — or ask us to remove it directly.
        </P>

        <H2>Your rights</H2>
        <ul className="mb-3 list-disc space-y-1.5 pl-5">
          <LI>
            <span className="font-medium text-foreground">Access &amp; erasure</span> — email us at
            the address above and we&rsquo;ll confirm what we hold or remove it, typically within a
            few days.
          </LI>
          <LI>
            <span className="font-medium text-foreground">Withdraw consent</span> — unsubscribe at
            any time using the link in any email; this stops all future emails immediately.
          </LI>
          <LI>
            <span className="font-medium text-foreground">Complaint</span> — contact us first, or
            lodge a complaint with your supervisory authority (in the UK, the ICO).
          </LI>
        </ul>

        <H2>Changes</H2>
        <P>If this policy changes materially, we&rsquo;ll update the date at the top of this page.</P>
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
