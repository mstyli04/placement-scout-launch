import profiles from "@/data/profiles.json"
import { formatDate } from "@/lib/utils"

// One page per firm, where every fact states where it came from and when it
// was really observed. Everything rendered here comes from profiles.json,
// built by scripts/build_profiles.py, which enforces the suppression list and
// the free-tier selection in SQL — this component renders what it is given and
// makes no eligibility decision of its own.
//
// The page deliberately carries no contact email. The free sheet has one; a
// prerendered, indexable page is a scrape target and a harvested inbox cannot
// be un-harvested. See build_profiles.py's header comment.

type Profile = (typeof profiles.profiles)[number]

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

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background font-sans antialiased">
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Logo />
          <a
            href="/explore/"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            ← Back to Explore
          </a>
        </div>
      </header>
      {children}
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
            <a href="/removal/" className="text-xs text-muted-foreground hover:text-foreground">
              Removal
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

// "careers_page_changed" -> "Careers page changed". Derived rather than
// mapped, so a signal type added to the pipeline renders legibly here on the
// day it appears instead of leaking a column name onto a public page.
function signalLabel(type: string) {
  const words = type.replace(/_/g, " ")
  return words.charAt(0).toUpperCase() + words.slice(1)
}

function Provenance({ field }: { field: Profile["fields"][number] }) {
  if (field.observedAt && field.sourceUrl) {
    return (
      <>
        <td className="py-3 pr-4 align-top">
          <a
            href={field.sourceUrl}
            rel="nofollow noopener noreferrer"
            target="_blank"
            className="text-brand hover:underline"
          >
            {field.source}
          </a>
        </td>
        <td className="py-3 align-top whitespace-nowrap text-muted-foreground">
          {formatDate(field.observedAt)}
        </td>
      </>
    )
  }
  // No observation row. The page says when the value was recorded and admits
  // it has not been re-read since, rather than showing the build date or a
  // silent blank. This is currently the common case, not the edge case.
  return (
    <td className="py-3 align-top text-muted-foreground italic" colSpan={2}>
      {field.note}
    </td>
  )
}

export function FirmPage({ slug }: { slug: string }) {
  const profile = profiles.profiles.find((p) => p.slug === slug)

  if (!profile) {
    return (
      <Shell>
        <main className="mx-auto max-w-2xl px-6 py-16">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Firm not found</h1>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            No firm with that reference is currently published. A firm leaves these pages when it{" "}
            <a href="/removal/" className="text-brand hover:underline">
              asks to be removed
            </a>
            , or when it drops out of the free selection.{" "}
            <a href="/explore/" className="text-brand hover:underline">
              Explore the database
            </a>{" "}
            instead.
          </p>
        </main>
      </Shell>
    )
  }

  const where = [profile.city, profile.region]
    .filter(Boolean)
    .filter((v, i, a) => a.findIndex((x) => x.toLowerCase() === v.toLowerCase()) === i)
  const observedCount = profile.fields.filter((f) => f.observedAt).length

  return (
    <Shell>
      <main className="mx-auto max-w-2xl px-6 py-16">
        <p className="text-[13px] font-medium text-brand">
          {where.length ? where.join(" · ") : "United Kingdom"}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
          {profile.name}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {[profile.sectors.join(", "), `Company number ${profile.companyNumber}`]
            .filter(Boolean)
            .join(" · ")}
        </p>

        <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
          Everything below is drawn from public registers, and every line says which register it
          came from and when that register was actually read.{" "}
          {observedCount > 0 ? (
            <>
              {observedCount} of {profile.fields.length} facts on this page carry a verified
              observation date; the rest say when they were recorded and that they have not been
              re-checked since.
            </>
          ) : (
            <>
              None of the facts on this page have been re-verified since they were first recorded,
              and each one says so rather than borrowing today&rsquo;s date. Dates you see here are
              the dates the register was read, never the date this page was built.
            </>
          )}
        </p>

        <section className="mt-10">
          <h2 className="mb-3 text-lg font-semibold tracking-tight text-foreground">
            What we hold, and where it came from
          </h2>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[34rem] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  <th scope="col" className="px-4 py-2.5">
                    Claim
                  </th>
                  <th scope="col" className="py-2.5 pr-4">
                    Value
                  </th>
                  <th scope="col" className="py-2.5 pr-4">
                    Source
                  </th>
                  <th scope="col" className="py-2.5 pr-4">
                    Observed
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {profile.fields.map((field) => (
                  <tr key={field.field} className="align-top">
                    <th
                      scope="row"
                      className="px-4 py-3 text-left font-normal text-muted-foreground"
                    >
                      {field.label}
                    </th>
                    <td className="py-3 pr-4 font-medium text-foreground">
                      {field.value === null ? (
                        <span className="font-normal text-muted-foreground">No record</span>
                      ) : field.href ? (
                        /* `href` comes from build_profiles.py's web_url(), not
                           from the value: most website rows are bare hostnames,
                           which as an href would be a relative link to nowhere.
                           A value with no usable href renders as plain text. */
                        <a
                          href={field.href}
                          rel="nofollow noopener noreferrer"
                          target="_blank"
                          className="text-brand hover:underline"
                        >
                          {field.value.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                        </a>
                      ) : field.field === "incorporated" ? (
                        formatDate(field.value)
                      ) : (
                        field.value
                      )}
                    </td>
                    <Provenance field={field} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            &ldquo;Observed&rdquo; is the day the register itself was read, not the day this page
            was generated. A row with no observation date has never been re-read since it was first
            recorded, and says so in place of a date it cannot honestly give.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="mb-3 text-lg font-semibold tracking-tight text-foreground">
            Hiring signals
          </h2>
          {profile.signals.length === 0 ? (
            <p className="rounded-lg border border-border p-5 text-sm leading-relaxed text-muted-foreground">
              Nothing recorded for this firm. A signal is only created when a watched careers page
              actually changes — an empty history means no change has been seen, not that the firm
              is not hiring. The{" "}
              <a href="/signals/" className="text-brand hover:underline">
                signals feed
              </a>{" "}
              shows what has moved recently across the whole database.
            </p>
          ) : (
            <ol className="divide-y divide-border rounded-lg border border-border">
              {profile.signals.map((signal) => (
                <li key={`${signal.type}-${signal.observedAt}`} className="px-4 py-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <span className="text-sm font-medium text-foreground">
                      {signalLabel(signal.type)}
                    </span>
                    <time
                      dateTime={signal.observedAt}
                      className="text-xs whitespace-nowrap text-muted-foreground"
                    >
                      {formatDate(signal.observedAt)}
                    </time>
                  </div>
                  {signal.snippet ? (
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {signal.snippet}
                    </p>
                  ) : null}
                  {signal.evidenceUrl ? (
                    <a
                      href={signal.evidenceUrl}
                      rel="nofollow noopener noreferrer"
                      target="_blank"
                      className="mt-1 inline-block text-xs text-brand hover:underline"
                    >
                      Evidence: the page that changed →
                    </a>
                  ) : null}
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="mt-12">
          <h2 className="mb-3 text-lg font-semibold tracking-tight text-foreground">
            Check it yourself
          </h2>
          <ul className="divide-y divide-border rounded-lg border border-border text-sm">
            <li className="px-4 py-3">
              <a
                href={profile.companiesHouseUrl}
                rel="nofollow noopener noreferrer"
                target="_blank"
                className="font-medium text-brand hover:underline"
              >
                Companies House register entry →
              </a>
              <p className="mt-0.5 text-xs text-muted-foreground">
                The source for the incorporation date, registered office and classification above.
              </p>
            </li>
            {profile.fcaUrl ? (
              <li className="px-4 py-3">
                <a
                  href={profile.fcaUrl}
                  rel="nofollow noopener noreferrer"
                  target="_blank"
                  className="font-medium text-brand hover:underline"
                >
                  FCA Financial Services Register entry →
                </a>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  The source for the firm reference number and authorisation status above.
                </p>
              </li>
            ) : null}
            {profile.careersUrl ? (
              <li className="px-4 py-3">
                <a
                  href={profile.careersUrl}
                  rel="nofollow noopener noreferrer"
                  target="_blank"
                  className="font-medium text-brand hover:underline"
                >
                  The firm&rsquo;s own careers page →
                </a>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  The page whose fingerprint is re-checked to produce the signals above.
                </p>
              </li>
            ) : null}
          </ul>
        </section>

        {profile.facet ? (
          <p className="mt-10 text-sm leading-relaxed text-muted-foreground">
            See this firm in context:{" "}
            <a
              href={`/explore/${profile.facet.sectorKey}/${profile.facet.regionKey}/`}
              className="text-brand hover:underline"
            >
              {profile.facet.count.toLocaleString()} {profile.facet.sectorLabel} firms in{" "}
              {profile.facet.regionLabel}
            </a>
            , with median company age and careers-page coverage for the whole segment.
          </p>
        ) : null}

        <section className="mt-8 rounded-lg border border-border bg-muted/30 p-5">
          <h2 className="text-sm font-semibold text-foreground">
            Is this your firm, and do you want it gone?
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            This page exists because the firm appears on the UK public registers, and it repeats
            only what those registers say. If you would rather it did not,{" "}
            <a href="/removal/" className="text-brand hover:underline">
              ask to be removed
            </a>{" "}
            — the request takes the firm out of the database, this page, the free sheet and the
            signals feed, including entries already published. The{" "}
            <a href="/methodology/" className="text-brand hover:underline">
              methodology
            </a>{" "}
            covers how firms get in here in the first place.
          </p>
        </section>
      </main>
    </Shell>
  )
}
