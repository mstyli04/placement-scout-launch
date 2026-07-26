import { lastUpdated } from "@/lib/utils"

export function Footer() {
  return (
    <footer className="border-t border-border py-10">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-8 flex items-center justify-center gap-2 rounded-full border border-border bg-muted/40 px-4 py-2 text-center">
          <span className="relative flex size-1.5 shrink-0">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-foreground/40" />
            <span className="relative inline-flex size-1.5 rounded-full bg-foreground/60" />
          </span>
          <p className="text-xs text-muted-foreground">
            More firms coming soon — data last checked {lastUpdated()}.
          </p>
        </div>
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="flex size-5 items-center justify-center rounded-md bg-foreground">
              <svg viewBox="0 0 16 16" className="size-3 fill-background">
                <path d="M7 2a5 5 0 1 0 3.1 8.9l3 3 1.4-1.4-3-3A5 5 0 0 0 7 2Zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z" />
              </svg>
            </span>
            <span className="text-sm font-semibold tracking-tight text-foreground">
              Placement Scout
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a href="/playbook/" className="text-xs text-muted-foreground hover:text-foreground">
              Outreach Playbook
            </a>
            <a href="/privacy/" className="text-xs text-muted-foreground hover:text-foreground">
              Privacy Policy
            </a>
            <p className="text-xs text-muted-foreground">© 2026 Placement Scout</p>
          </div>
        </div>
        <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground sm:text-left">
          Contains Companies House data © Crown copyright, used under the Open Government
          Licence. FCA authorisation statuses are derived from the public Financial Services
          Register; Placement Scout is not affiliated with or endorsed by the FCA or Companies
          House. We list corporate information only — no personal data. Emails you give us are
          used solely to deliver what you asked for, per our{" "}
          <a href="/privacy/" className="underline hover:text-foreground">
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </footer>
  )
}
