# Placement Scout — Concierge MVP Design (Approach 1 of "1 → 2")

**Status:** Draft for Styli's review — nothing here is committed or launched.
**Model decision (Styli, 19 Jul 2026): the product is FREE.** No payments in this phase.
The email list, user base, and reputation are the assets; monetization (premium tier or the
B2B/recruiter data product) is deferred until there's a real audience.
**Goal:** Validate that students actually want and use boutique-firm data.
**Success criterion:** 100 email signups within 4 weeks of launch AND ≥40% open rate on the
weekly digest by week 4. Hit both → build the thin SaaS (Approach 2, still free-first).
Under 25 signups after real distribution effort → re-examine the offer.

## The offer

> **Stop applying where everyone else applies.** Placement Scout is a curated, weekly-refreshed
> database of 1,100+ boutique UK finance firms — M&A advisory, asset & wealth management, PE/VC,
> quant & trading — built from the Companies House and FCA registers. Most never post on job
> boards. Direct websites, careers pages, and corporate contact channels, scored and filtered
> so you can run a placement/internship campaign the 9-to-5 applicants never will.

Honest numbers behind the copy (from scout.db, 18 Jul 2026): 73,080 firms scanned,
15,792 FCA-authorised, 8,144 with verified websites, 1,189 with careers pages, ~1,140 scoring
≥4 on the boutique quality score. Headline claim "1,100+ curated boutique firms" is defensible.

## What the customer gets (concierge — no app build)

1. **The database** — view-only access to a polished Google Sheet (separate, customer-facing
   copy — NOT Styli's working sheet), one row per curated firm (score ≥4 initially):
   name, sector, city, website, careers page, FCA-authorised flag (link to FCA register entry),
   incorporation year, quality score. **Excluded:** scraped `contact_email` values (GDPR/licensing
   caution — see legal note) unless verifiably a corporate address (info@/careers@).
2. **"New firms this week" email** — short weekly email listing firms newly flagged NEW by the
   pipeline. This is the retention hook and near-zero marginal effort (pipeline already flags NEW).
3. **The Boutique Outreach Playbook** (one-off PDF/Notion page) — how to research a boutique,
   who to write to, a proven email structure. One evening to write; massively raises perceived value.

## Pricing: free (Styli's decision)

Full access costs £0: email signup → access link + weekly digest. Why this still builds a company:
- **Distribution advantage:** "free database of 1,100+ hidden finance firms" spreads itself in
  society group chats in a way a paywalled sheet never would.
- **The asset is the audience:** an engaged list of UK finance students is exactly what the later
  premium tier or recruiter-side product (Idea B) needs.
- **Licensing comfort:** giving register-derived data away free is a materially softer posture
  than reselling it while FCA RES terms are confirmed.
- Trade-off accepted: no willingness-to-pay signal this phase; validation is usage instead.
- Monetization options preserved for later (not now): premium tier (alerts, filters, tracking),
  society/university sponsorships, recruiter data product.

## The landing page (the only build)

Single page, Meridian design system (the style Styli approved for Paper Alpha):
hero → problem ("job boards show you 50 firms; there are 1,100+") → live preview table with a
handful of real example rows + blurred rows → what you get → pricing card → FAQ → footer with
privacy note. CTA = Stripe Payment Link (no backend needed) + email-capture fallback
("not ready? get 5 free firms by email").

Draft built at `~/placement-scout-launch/landing` (dev server port 5174). No payment link wired
yet — Stripe account creation is Styli's call.

## Launch checklist (~3 weekends)

**Weekend 1 — product polish:** create the user-facing sheet (curated columns, no raw emails);
write the playbook; finalize landing copy. (No Stripe — product is free.)
**Weekend 2 — go live:** deploy landing (Vercel, new project — NOT paper-alpha); wire the email
capture (Buttondown or Tally — it must auto-deliver the access link); test signup end-to-end.
**Weekend 3+ — distribution (the real work):** 3 LinkedIn posts/wk sharing genuinely useful
excerpts ("5 boutique M&A shops in Manchester hiring interns"); post in university finance-society
group chats; 1 TikTok/short experiment; answer boutique-firm questions on r/FinancialCareers &
UK student forums with the free preview. Track: visitors → email captures → purchases.

## Ops per week after launch (fits 5–10 h budget)

Pipeline refresh (existing, automated) ~0h · weekly email 1h · distribution 3–5h · support <1h.

## Legal & data notes (verify before charging — not legal advice)

- **Companies House:** Open Government Licence — commercial reuse permitted with attribution.
  Add "Contains Companies House data © Crown copyright" to the landing footer. ✅
- **FCA register:** the free API is for individual lookups (rate-limited); bulk redistribution is
  formally licensed via the paid Register Extract Service, which has a "reseller" tier. Mitigation
  for MVP: don't republish FCA register records — show only a derived "FCA-authorised ✓" flag and
  link out to the firm's public register page. Precedent exists for API-based commercial products
  (e.g. TOVO), but before scaling, email the FCA RES team about licensing. Action item, not blocker.
- **GDPR:** publish corporate data only (firm names, websites, generic emails). No scraped
  personal emails in the product. Landing page needs a privacy note (email captures) — reuse the
  Paper Alpha policy pattern.
- Sources: fca.org.uk/firms/financial-services-register/data-extract, register.fca.org.uk/s/legal-information,
  register-extract-handbook.pdf (FCA), tovodata.co.uk/research/where-can-i-access-the-full-fca-register.

## What "scale later" looks like (not built now)

Thin SaaS (Approach 2, after 10 sales): Next.js + Clerk + Stripe, scout.db ETL → Postgres, free
tier (10 firms, no links) for SEO pages per city/sector, £12/mo or £39/season. Then: more verticals
(law, consulting), other geographies, recruiter-side data product (Idea B).

## Open decisions for Styli

1. ~~Name~~ — DECIDED 19 Jul: keep "Placement Scout".
2. ~~Price point~~ — DECIDED 19 Jul: free.
3. ~~Sheet vs. page~~ — DECIDED 19 Jul: Google Sheet (fastest, reuses existing sheet).
4. ~~Sender email~~ — DECIDED 19 Jul: michaelstylianou2@gmail.com (existing outreach address).
5. ~~Sole-trader registration~~ — not needed while free (revisit only if monetization returns).
6. ~~Email tool~~ — DECIDED 19 Jul: Buttondown.

All open decisions resolved 19 Jul 2026. Next: wire up Buttondown signup capture on the landing
page → email capture delivers Sheet access link → Vercel deploy → first LinkedIn post.
