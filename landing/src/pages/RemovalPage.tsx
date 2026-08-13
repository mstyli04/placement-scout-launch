import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const CONTACT_EMAIL = 'michaelstylianou2@gmail.com'

// The form composes a complete request and hands it to the visitor's own mail
// client. It deliberately does NOT post anywhere: this site is static, and the
// alternatives were a third-party form host (another processor holding firm
// data, which is the opposite of what someone on this page wants) or a
// serverless endpoint plus a mail provider — more infrastructure to sit
// silently broken between removal requests, which are rare.
//
// The trade-off is stated on the page rather than hidden: the button says what
// it does, and the composed text is shown so it can be copied if the mail
// client does not open.

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

function Field({
  label,
  value,
  onChange,
  placeholder,
  hint,
  required,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  hint?: string
  required?: boolean
  type?: string
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-foreground">
        {label}
        {required ? <span className="text-brand"> *</span> : null}
      </span>
      {hint ? <span className="mt-0.5 block text-xs text-muted-foreground">{hint}</span> : null}
      <Input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2"
      />
    </label>
  )
}

export function RemovalPage() {
  const [firm, setFirm] = useState('')
  const [companyNumber, setCompanyNumber] = useState('')
  const [listingUrl, setListingUrl] = useState('')
  const [role, setRole] = useState('')
  const [replyTo, setReplyTo] = useState('')
  const [notes, setNotes] = useState('')
  const [copied, setCopied] = useState(false)

  const subject = useMemo(
    () => `Removal request — ${firm.trim() || '[firm name]'}`,
    [firm],
  )

  const body = useMemo(() => {
    const lines = [
      'I am asking for this firm to be removed from Placement Scout.',
      '',
      `Firm name: ${firm.trim() || '[required]'}`,
      `Companies House number: ${companyNumber.trim() || '(not supplied)'}`,
      `Where it appears: ${listingUrl.trim() || '(not supplied)'}`,
      `My role at the firm: ${role.trim() || '(not supplied)'}`,
      `Reply to: ${replyTo.trim() || '(not supplied)'}`,
      '',
      `Anything else: ${notes.trim() || '(none)'}`,
    ]
    return lines.join('\n')
  }, [firm, companyNumber, listingUrl, role, replyTo, notes])

  const mailto = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
    subject,
  )}&body=${encodeURIComponent(body)}`

  const ready = firm.trim().length > 0

  async function copyRequest() {
    try {
      await navigator.clipboard.writeText(`To: ${CONTACT_EMAIL}\nSubject: ${subject}\n\n${body}`)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 4000)
    } catch {
      // Clipboard access can be refused (permissions, insecure context, an
      // older browser). The request text is on the page either way, so the
      // fallback is simply to select it — say so rather than fail silently.
      setCopied(false)
    }
  }

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
          Remove a firm from Placement Scout
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Any firm can ask to be removed, for any reason, and we do not ask for one. You do not
          need an account and there is nothing to prove — if you work at the firm and want it out
          of the directory, that is enough.
        </p>

        <div className="mt-8 rounded-lg border border-border bg-muted/30 p-5">
          <h2 className="text-sm font-semibold text-foreground">What happens after you send it</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5">
            <li className="text-sm leading-relaxed text-muted-foreground">
              The firm goes on a permanent suppression list, keyed to its Companies House number.
            </li>
            <li className="text-sm leading-relaxed text-muted-foreground">
              It disappears from the public directory and from the internal working list at the
              next rebuild, and it can never be contacted for outreach again.
            </li>
            <li className="text-sm leading-relaxed text-muted-foreground">
              The suppression survives future data refreshes — the firm is not re-added the next
              time it appears in the Companies House register.
            </li>
            <li className="text-sm leading-relaxed text-muted-foreground">
              You get a confirmation by email, normally within a few days.
            </li>
          </ol>
        </div>

        <div className="mt-10 space-y-5">
          <Field
            label="Firm name"
            value={firm}
            onChange={setFirm}
            placeholder="Example Capital Partners Ltd"
            required
          />
          <Field
            label="Companies House number"
            value={companyNumber}
            onChange={setCompanyNumber}
            placeholder="12345678"
            hint="Optional, but it makes the removal exact — two firms can share a name."
          />
          <Field
            label="Where it appears"
            value={listingUrl}
            onChange={setListingUrl}
            placeholder="https://placementscout.vercel.app/explore/…"
            hint="Optional. A link to the page or sheet you saw it on."
          />
          <Field
            label="Your role at the firm"
            value={role}
            onChange={setRole}
            placeholder="Operations Manager"
            hint="Optional. Helps confirm the request comes from the firm."
          />
          <Field
            label="Your email"
            type="email"
            value={replyTo}
            onChange={setReplyTo}
            placeholder="you@firm.com"
            hint="Optional. Only used to confirm the removal, then discarded."
          />
          <label className="block">
            <span className="text-sm font-medium text-foreground">Anything else</span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              Optional. You do not have to give a reason.
            </span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="mt-2 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            />
          </label>
        </div>

        <div className="mt-8 rounded-lg border border-border p-5">
          <h2 className="text-sm font-semibold text-foreground">Send the request</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            This page does not submit anything itself — it opens your own email app with the
            request filled in, so nothing is stored anywhere in between. If your email app does
            not open, copy the text below and send it to{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-brand hover:underline">
              {CONTACT_EMAIL}
            </a>
            .
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            {/* A real <button> until there is something to send, an anchor
                after. `disabled` does nothing on an <a>` — it is not a valid
                attribute there and the `disabled:` styles are :disabled
                pseudo-class selectors — so a disabled-looking link would
                still be clickable and still look active. */}
            {ready ? (
              <Button asChild>
                <a href={mailto}>Open in your email app</a>
              </Button>
            ) : (
              <Button disabled>Open in your email app</Button>
            )}
            <Button variant="outline" onClick={copyRequest} disabled={!ready}>
              {copied ? 'Copied' : 'Copy the request'}
            </Button>
            {!ready ? (
              <span className="text-xs text-muted-foreground">Enter the firm name first.</span>
            ) : null}
          </div>

          <pre className="mt-4 overflow-x-auto rounded-md bg-muted/50 p-4 text-xs leading-relaxed whitespace-pre-wrap text-muted-foreground">
            {`To: ${CONTACT_EMAIL}\nSubject: ${subject}\n\n${body}`}
          </pre>
        </div>

        <p className="mt-10 text-sm leading-relaxed text-muted-foreground">
          Placement Scout lists firms, not people. It holds a company name, a Companies House
          number, an address, a website and a role-based inbox such as{' '}
          <span className="font-medium text-foreground">careers@</span> — all from the public
          register or the firm&rsquo;s own website, and never a named individual. The full detail
          is in the{' '}
          <a href="/privacy/" className="text-brand hover:underline">
            privacy policy
          </a>
          .
        </p>
      </main>
    </div>
  )
}
