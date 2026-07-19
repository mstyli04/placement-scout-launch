const faqs = [
  {
    q: "Where does the data come from?",
    a: "The UK Companies House register and the FCA's Financial Services Register, cross-referenced and enriched with each firm's own website. We show whether a firm is FCA-authorised and link to its public register entry — we don't invent anything.",
  },
  {
    q: "Couldn't I just Google these firms?",
    a: "Some of them, one at a time, if you knew their names. The point is the other 1,000 you'd never think to search for — plus the scoring, careers links, and weekly flagging of brand-new firms, done for you.",
  },
  {
    q: "Is this only for M&A?",
    a: "No — the database covers M&A / corporate advisory, asset & wealth management, private equity & venture capital, and quant & prop trading, across London and every major UK city.",
  },
  {
    q: "Do you include people's personal contact details?",
    a: "No. We list firms' public corporate channels — websites, careers pages, and general contact routes. The playbook teaches you to find the right person properly, using public professional sources.",
  },
  {
    q: "Why is it free?",
    a: "I built this to run my own placement campaign, and it costs little to share. If it helps you land something, tell the next year group — that's the payment.",
  },
]

export function Faq() {
  return (
    <section id="faq" className="py-24">
      <div className="mx-auto max-w-3xl px-6">
        <div className="text-center">
          <p className="text-[13px] font-medium text-brand">FAQ</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Fair questions
          </h2>
        </div>
        <div className="mt-12 space-y-8">
          {faqs.map((faq) => (
            <div key={faq.q}>
              <h3 className="text-[15px] font-medium text-foreground">{faq.q}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
